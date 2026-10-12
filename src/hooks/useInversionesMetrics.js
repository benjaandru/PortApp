import { useMemo } from 'react';
import {
  calcularInflacionCompuesta,
  ajustarCapitalPorInflacion,
  calcularCostoInflacionario,
} from '../core/domain/inflation.js';

export function useInversionesMetrics(inversiones = [], inflacion = []) {
  // 1. Inflación compuesta acumulada
  const metricasInflacion = useMemo(() => {
    const listaInflacion = Array.isArray(inflacion) ? inflacion : [];
    const tasas = listaInflacion.map((inf) => inf?.Porcentaje);
    const { factorCompuesto, inflacionAcumuladaPct } = calcularInflacionCompuesta(tasas);

    return {
      tasaCompuesta: factorCompuesto,
      inflacionAcumuladaPct,
      registros: listaInflacion,
    };
  }, [inflacion]);

  // 2. Métricas, agrupación por categoría y ajuste real
  const metricasPortfolio = useMemo(() => {
    const listaInversiones = Array.isArray(inversiones) ? inversiones : [];
    let totalInvertido = 0;

    // Objeto para ir sumando montos por categoría
    const porCategoria = {};

    const portfolio = listaInversiones.map((inv) => {
      const monto = parseFloat(inv?.Monto_Invertido) || 0;
      const cant = parseFloat(inv?.Cantidad) || 1;
      const categoria = inv?.Categoria || 'Varios';

      totalInvertido += monto;

      // Agregamos el monto a la categoría correspondiente
      porCategoria[categoria] = (porCategoria[categoria] || 0) + monto;

      // Cálculo de inflación individual
      const capitalAjustadoInflacion = ajustarCapitalPorInflacion(monto, metricasInflacion.tasaCompuesta);
      const costoInflacionario = calcularCostoInflacionario(monto, metricasInflacion.tasaCompuesta);

      return {
        ticker: inv?.Ticker || 'N/A',
        fecha: inv?.Fecha || '-',
        cantidad: cant,
        categoria: categoria,
        montoInvertido: monto,
        precioPromedio: cant > 0 ? monto / cant : 0,
        capitalAjustadoInflacion,
        costoInflacionario,
      };
    });

    const totalAjustado = ajustarCapitalPorInflacion(
      totalInvertido,
      metricasInflacion.tasaCompuesta
    );

    // Transformamos el objeto de categorías en un array ordenado (igual que en gastos)
    const categoriasOrdenadasInversiones = Object.entries(porCategoria)
      .map(([cat, total]) => ({
        categoria: cat,
        total,
        porcentaje: totalInvertido > 0 ? (total / totalInvertido) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);

    return {
      totalInvertido,
      totalAjustado,
      perdidaOportunidadTotal: totalAjustado - totalInvertido,
      portfolio,
      categoriasOrdenadasInversiones,
    };
  }, [inversiones, metricasInflacion]);

  return {
    ...metricasPortfolio, //Aca solamente estoy devolviendo los valores que obtuve en metricasPortfolio
    metricasInflacion,
  };
}