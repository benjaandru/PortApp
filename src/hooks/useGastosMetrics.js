import { useMemo } from 'react';

/**
 * Custom Hook para procesar y calcular métricas derivadas de gastos.
 * 
 * @param {Array<{ Monto: number|string, Fecha: string, Categoria: string, Descripcion?: string, TipoPago?: string }>} gastos
 * @returns {{
 *   totalHistorico: number,
 *   totalMesActual: number,
 *   totalMesSeleccionado: number,
 *   totalTarjetaMesSeleccionado: number,
 *   totalOtrosMesSeleccionado: number,
 *   categoriasOrdenadasGastos: Array<{ categoria: string, mes: string, total: number, totalTarjeta: number, totalOtros: number, porcentaje: number, porcentajeTarjeta: number, porcentajeOtros: number }>
 * }}
 */
export function useGastosMetrics(gastos = [], fechaPeriodo = new Date()) {
  return useMemo(() => {
    if (!Array.isArray(gastos)) {
      return {
        totalHistorico: 0,
        totalMesActual: 0,
        totalMesSeleccionado: 0,
        totalTarjetaMesSeleccionado: 0,
        totalOtrosMesSeleccionado: 0,
        categoriasOrdenadasGastos: [],
      };
    }

    const now = new Date();
    const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const selectedMonthPrefix = `${fechaPeriodo.getFullYear()}-${String(fechaPeriodo.getMonth() + 1).padStart(2, '0')}`;
    let totalHistorico = 0;
    let totalMesActual = 0;
    let totalMesSeleccionado = 0;
    let totalTarjetaMesSeleccionado = 0;
    let totalOtrosMesSeleccionado = 0;
    const porCategoria = {};

    gastos.forEach((g) => {
      const monto = parseFloat(g.Monto) || 0;
      totalHistorico += monto;

      const fechaStr = String(g.Fecha || '');
      if (fechaStr.startsWith(currentMonthPrefix)) {
        totalMesActual += monto;
      }

      if (!fechaStr.startsWith(selectedMonthPrefix)) return;
      totalMesSeleccionado += monto;
      const cat = g.Categoria || 'Varios';
      if (!porCategoria[cat]) {
        porCategoria[cat] = { total: 0, tarjeta: 0, otros: 0 };
      }
      const categoria = porCategoria[cat];
      categoria.total += monto;
      if (String(g.TipoPago || '').trim().toLowerCase() === 'tarjeta') {
        categoria.tarjeta += monto;
        totalTarjetaMesSeleccionado += monto;
      } else {
        categoria.otros += monto;
        totalOtrosMesSeleccionado += monto;
      }
    });

    const categoriasOrdenadasGastos = Object.entries(porCategoria)
      .map(([categoria, montos]) => ({
        categoria,
        mes: selectedMonthPrefix,
        total: montos.total,
        totalTarjeta: montos.tarjeta,
        totalOtros: montos.otros,
        porcentaje: totalMesSeleccionado > 0 ? (montos.total / totalMesSeleccionado) * 100 : 0,
        porcentajeTarjeta: montos.total > 0 ? (montos.tarjeta / montos.total) * 100 : 0,
        porcentajeOtros: montos.total > 0 ? (montos.otros / montos.total) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);

    return {
      totalHistorico,
      totalMesActual,
      totalMesSeleccionado,
      totalTarjetaMesSeleccionado,
      totalOtrosMesSeleccionado,
      categoriasOrdenadasGastos,
    };
  }, [gastos, fechaPeriodo]);
}
