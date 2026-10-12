import { useMemo } from 'react';
import {
  calcularInflacionCompuesta,
  ajustarCapitalPorInflacion,
  calcularCostoInflacionario,
} from '../core/domain/inflation.js';

/**
 * Custom Hook para procesar el portfolio de inversiones y su ajuste inflacionario.
 * Delega los cálculos matemáticos en la Capa de Dominio (Hexagonal Core).
 * 
 * @param {Array<{ Ticker: string, Fecha: string, Monto_Invertido: number|string, Cantidad: number|string, Categoria?: string }>} inversiones
 * @param {Array<{ Mes: string, Porcentaje: number|string }>} inflacion
 * @returns {{
 *   totalInvertido: number,
 *   totalAjustado: number,
 *   perdidaOportunidadTotal: number,
 *   portfolio: Array<{
 *     ticker: string,
 *     fecha: string,
 *     cantidad: number,
 *     categoria: string,
 *     montoInvertido: number,
 *     precioPromedio: number,
 *     capitalAjustadoInflacion: number,
 *     costoInflacionario: number
 *   }>,
 *   metricasInflacion: {
 *     tasaCompuesta: number,
 *     inflacionAcumuladaPct: number,
 *     registros: Array
 *   }
 * }}
 */
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

  // 2. Métricas y ajuste real del portfolio
  const metricasPortfolio = useMemo(() => {
    const listaInversiones = Array.isArray(inversiones) ? inversiones : [];
    let totalInvertido = 0;

    const portfolio = listaInversiones.map((inv) => {
      const monto = parseFloat(inv?.Monto_Invertido) || 0;
      const cant = parseFloat(inv?.Cantidad) || 1;
      const categoria = inv?.Categoria || 'Varios';
      totalInvertido += monto;

      // Cálculos puros delegados al Core de Dominio
      const capitalAjustadoInflacion = ajustarCapitalPorInflacion(
        monto,
        metricasInflacion.tasaCompuesta
      );
      const costoInflacionario = calcularCostoInflacionario(
        monto,
        metricasInflacion.tasaCompuesta
      );

      return {
        ticker: inv?.Ticker || 'N/A',
        fecha: inv?.Fecha || '-',
        cantidad: cant,
        categoria,
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

    return {
      totalInvertido,
      totalAjustado,
      perdidaOportunidadTotal: totalAjustado - totalInvertido,
      portfolio,
    };
  }, [inversiones, metricasInflacion]);

  return {
    ...metricasPortfolio,
    metricasInflacion,
  };
}
