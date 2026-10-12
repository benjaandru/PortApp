import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useInversionesMetrics } from '../useInversionesMetrics.js';

describe('Hook: useInversionesMetrics', () => {
  it('debe devolver métricas vacías si no hay inversiones ni inflación', () => {
    const { result } = renderHook(() => useInversionesMetrics([], []));

    expect(result.current.totalInvertido).toBe(0);
    expect(result.current.totalAjustado).toBe(0);
    expect(result.current.portfolio).toEqual([]);
    expect(result.current.metricasInflacion.inflacionAcumuladaPct).toBe(0);
  });

  it('debe ajustar el portfolio de inversión según la inflación acumulada', () => {
    const mockInversiones = [
      { Ticker: 'AAPL', Fecha: '2024-01-10', Monto_Invertido: 1000, Cantidad: 10, Categoria: 'CEDEARs' },
    ];
    // Inflación: 20%
    const mockInflacion = [{ Mes: '2024-01', Porcentaje: 20 }];

    const { result } = renderHook(() => useInversionesMetrics(mockInversiones, mockInflacion));

    expect(result.current.totalInvertido).toBe(1000);
    expect(result.current.metricasInflacion.tasaCompuesta).toBeCloseTo(1.20, 2);
    expect(result.current.totalAjustado).toBeCloseTo(1200, 2);
    expect(result.current.perdidaOportunidadTotal).toBeCloseTo(200, 2);

    expect(result.current.portfolio[0]).toMatchObject({
      ticker: 'AAPL',
      cantidad: 10,
      categoria: 'CEDEARs',
      montoInvertido: 1000,
      precioPromedio: 100,
      capitalAjustadoInflacion: 1200,
      costoInflacionario: 200,
    });
  });
});
