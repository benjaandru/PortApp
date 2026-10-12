import { useMemo } from 'react';

/**
 * Custom Hook para procesar y calcular métricas derivadas de gastos.
 * 
 * @param {Array<{ Monto: number|string, Fecha: string, Categoria: string, Descripcion?: string }>} gastos
 * @returns {{
 *   totalHistorico: number,
 *   totalMesActual: number,
 *   categoriasOrdenadas: Array<{ categoria: string, total: number, porcentaje: number }>
 * }}
 */
export function useGastosMetrics(gastos = []) {
  return useMemo(() => {
    if (!Array.isArray(gastos)) {
      return {
        totalHistorico: 0,
        totalMesActual: 0,
        categoriasOrdenadas: [],
      };
    }

    const currentMonthPrefix = new Date().toISOString().slice(0, 7); // "YYYY-MM"
    let totalHistorico = 0;
    let totalMesActual = 0;
    const porCategoria = {};

    gastos.forEach((g) => {
      const monto = parseFloat(g.Monto) || 0;
      totalHistorico += monto;

      const fechaStr = String(g.Fecha || '');
      if (fechaStr.startsWith(currentMonthPrefix)) {
        totalMesActual += monto;
      }

      const cat = g.Categoria || 'Varios';
      porCategoria[cat] = (porCategoria[cat] || 0) + monto;
    });

    const categoriasOrdenadas = Object.entries(porCategoria)
      .map(([categoria, total]) => ({
        categoria,
        total,
        porcentaje: totalHistorico > 0 ? (total / totalHistorico) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);

    return {
      totalHistorico,
      totalMesActual,
      categoriasOrdenadas,
    };
  }, [gastos]);
}
