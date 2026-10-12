import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useGastosMetrics } from '../useGastosMetrics.js';

describe('Hook: useGastosMetrics', () => {
  it('debe devolver métricas vacías si el array de gastos está vacío', () => {
    const { result } = renderHook(() => useGastosMetrics([]));

    expect(result.current.totalHistorico).toBe(0);
    expect(result.current.totalMesActual).toBe(0);
    expect(result.current.categoriasOrdenadasGastos).toEqual([]);
  });

  it('debe calcular totales históricos y por categoría correctamente', () => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const mockGastos = [
      { Fecha: `${currentMonth}-05`, Monto: 1000, Categoria: 'Comida' },
      { Fecha: `${currentMonth}-10`, Monto: 500, Categoria: 'Comida' },
      { Fecha: '2023-01-01', Monto: 2000, Categoria: 'Servicios' },
    ];

    const { result } = renderHook(() => useGastosMetrics(mockGastos));

    expect(result.current.totalHistorico).toBe(3500);
    expect(result.current.totalMesActual).toBe(1500);
    expect(result.current.categoriasOrdenadasGastos).toHaveLength(2);

    // Servicios tuvo 2000, Comida tuvo 1500 -> Servicios primero
    expect(result.current.categoriasOrdenadasGastos[0].categoria).toBe('Servicios');
    expect(result.current.categoriasOrdenadasGastos[0].total).toBe(2000);
    expect(result.current.categoriasOrdenadasGastos[1].categoria).toBe('Comida');
    expect(result.current.categoriasOrdenadasGastos[1].total).toBe(1500);
  });
});
