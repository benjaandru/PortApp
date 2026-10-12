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

  it('debe devolver un portfolio con categorias validas', () => {
    const mockInversiones = [
      { Ticker: 'AAPL', Fecha: '2024-01-10', Monto_Invertido: 1000, Cantidad: 10, Categoria: 'CEDEARs' },
    ];
    const mockInflacion = [{ Mes: '2024-01', Porcentaje: 20 }];
    const { result } = renderHook(() => useInversionesMetrics(mockInversiones, mockInflacion));

    expect(result.current.totalInvertido).toBe(1000);
    expect(result.current.categoriasOrdenadasInversiones).toEqual([
      { categoria: 'CEDEARs', total: 1000, porcentaje: 100 }
    ]);
  });

  it('debe calcular correctamente la distribución porcentual de inversiones', () => {
    const mockInversiones = [
      { Ticker: 'AAPL', Monto_Invertido: 1000, Cantidad: 10, Categoria: 'CEDEARs' },
      { Ticker: 'GOOG', Monto_Invertido: 500, Cantidad: 5, Categoria: 'Acciones' },
      { Ticker: 'TSLA', Monto_Invertido: 500, Cantidad: 5, Categoria: 'Acciones' },
    ];
    const mockInflacion = [];

    const { result } = renderHook(() => useInversionesMetrics(mockInversiones, mockInflacion));

    expect(result.current.totalInvertido).toBe(2000);

    const categorias = result.current.categoriasOrdenadasInversiones;

    // Buscamos la categoría Acciones
    const accionesCat = categorias.find(c => c.categoria === 'Acciones');
    // Buscamos la categoría CEDEARs
    const cedearsCat = categorias.find(c => c.categoria === 'CEDEARs');

    // Verificación de porcentajes
    expect(accionesCat.porcentaje).toBeCloseTo(50, 2);
    expect(cedearsCat.porcentaje).toBeCloseTo(50, 2);

    // Verificación de totales
    expect(accionesCat.total).toBe(1000);
    expect(cedearsCat.total).toBe(1000);
  });

});
