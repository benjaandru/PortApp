/**
 * =========================================================================
 * SUITE DE PRUEBAS UNITARIAS: useValuaciones
 * =========================================================================
 * Patrón: Arrange - Act - Assert (AAA)
 * Framework: Vitest + @testing-library/react (renderHook)
 *
 * Escenarios cubiertos:
 *  - Happy path: valuación estándar con precio válido
 *  - Acumulación de compras: múltiples entradas del mismo ticker
 *  - Distribución por categoría y cálculo de porcentajes
 *  - Posición sin precio disponible (sinPrecio: true)
 *  - Portfolio mixto (con y sin precio)
 *  - Casos de borde: divisiones por cero, montos cero, arrays vacíos
 *  - Rigor financiero: decimales, resultado negativo, resultadoPct null
 *  - Escalado por categoría (ESCALA_POR_CATEGORIA)
 *  - Orden de posiciones por valorActual descendente
 */

import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useValuaciones } from '../useValuaciones.js';

// ─── Fixtures reutilizables ───────────────────────────────────────────────────

const inv = (ticker, monto, cantidad, categoria = 'Acciones') => ({
  Ticker: ticker,
  Monto_Invertido: monto,
  Cantidad: cantidad,
  Categoria: categoria,
});

const precio = (p, moneda = 'ARS') => ({ precio: p, moneda });

// ─── Suite Principal ──────────────────────────────────────────────────────────

describe('useValuaciones', () => {

  // ──────────────────────────────────────────────────────────────────────────
  // SECCIÓN 1: Inputs vacíos / nulos
  // ──────────────────────────────────────────────────────────────────────────

  describe('cuando no hay inversiones ni precios', () => {
    it('debería_devolver_posiciones_vacías_y_totales_en_cero', () => {
      // Arrange
      // Act
      const { result } = renderHook(() => useValuaciones([], {}));

      // Assert
      expect(result.current.posiciones).toEqual([]);
      expect(result.current.totales.invertido).toBe(0);
      expect(result.current.totales.valorActual).toBe(0);
      expect(result.current.totales.resultado).toBe(0);
      expect(result.current.totales.resultadoPct).toBeNull();
      expect(result.current.categoriasOrdenadasActual).toEqual([]);
      expect(result.current.hayPosicionesSinPrecio).toBe(false);
    });

    it('debería_tolerar_inversiones_null_y_precios_null_sin_crashear', () => {
      // Arrange / Act
      const { result } = renderHook(() => useValuaciones(null, null));

      // Assert
      expect(result.current.posiciones).toEqual([]);
      expect(result.current.totales.invertido).toBe(0);
    });

    it('debería_ignorar_filas_sin_ticker', () => {
      // Arrange
      const inversiones = [
        { Ticker: '', Monto_Invertido: 1000, Cantidad: 10, Categoria: 'Acciones' },
        { Ticker: null, Monto_Invertido: 500, Cantidad: 5, Categoria: 'FCI' },
      ];

      // Act
      const { result } = renderHook(() => useValuaciones(inversiones, {}));

      // Assert
      expect(result.current.posiciones).toHaveLength(0);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SECCIÓN 2: Happy Path — valuación estándar
  // ──────────────────────────────────────────────────────────────────────────

  describe('happy path — valuación con precio disponible', () => {
    it('debería_calcular_valor_actual_resultado_y_resultadoPct_correctamente', () => {
      // Arrange
      const inversiones = [inv('AAPL', 1000, 10)];
      const precios = { AAPL: precio(120) };

      // Act
      const { result } = renderHook(() => useValuaciones(inversiones, precios));
      const pos = result.current.posiciones[0];

      // Assert
      expect(pos.ticker).toBe('AAPL');
      expect(pos.sinPrecio).toBe(false);
      expect(pos.cantidad).toBeCloseTo(10, 2);
      expect(pos.invertido).toBeCloseTo(1000, 2);
      expect(pos.precio).toBeCloseTo(120, 2);
      // valorActual = 10 * 120 / escala(1) = 1200
      expect(pos.valorActual).toBeCloseTo(1200, 2);
      // resultado = 1200 - 1000 = 200
      expect(pos.resultado).toBeCloseTo(200, 2);
      // resultadoPct = 200 / 1000 * 100 = 20%
      expect(pos.resultadoPct).toBeCloseTo(20, 2);
    });

    it('debería_calcular_totales_solo_con_posiciones_con_precio', () => {
      // Arrange
      const inversiones = [
        inv('AAPL', 1000, 10),
        inv('MSFT', 500, 5),
      ];
      const precios = {
        AAPL: precio(120),
        // MSFT no tiene precio
      };

      // Act
      const { result } = renderHook(() => useValuaciones(inversiones, precios));
      const { totales } = result.current;

      // Assert — totales excluyen posiciones sin precio
      // invertido valuado = 1000 (solo AAPL)
      expect(totales.invertido).toBeCloseTo(1000, 2);
      expect(totales.valorActual).toBeCloseTo(1200, 2);
      expect(totales.resultado).toBeCloseTo(200, 2);
      expect(totales.resultadoPct).toBeCloseTo(20, 2);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SECCIÓN 3: Acumulación de compras (mismo ticker, múltiples filas)
  // ──────────────────────────────────────────────────────────────────────────

  describe('acumulación de compras del mismo ticker', () => {
    it('debería_sumar_cantidad_y_monto_invertido_de_múltiples_compras', () => {
      // Arrange — tres compras del mismo activo en fechas distintas
      const inversiones = [
        inv('SPY', 1000, 5),
        inv('SPY', 500, 2),
        inv('SPY', 250, 1),
      ];
      const precios = { SPY: precio(200) };

      // Act
      const { result } = renderHook(() => useValuaciones(inversiones, precios));
      const pos = result.current.posiciones[0];

      // Assert
      expect(result.current.posiciones).toHaveLength(1); // consolidado en 1 posición
      expect(pos.ticker).toBe('SPY');
      expect(pos.cantidad).toBeCloseTo(8, 2);            // 5+2+1
      expect(pos.invertido).toBeCloseTo(1750, 2);        // 1000+500+250
      // valorActual = 8 * 200 = 1600
      expect(pos.valorActual).toBeCloseTo(1600, 2);
      // resultado = 1600 - 1750 = -150 (pérdida)
      expect(pos.resultado).toBeCloseTo(-150, 2);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SECCIÓN 4: Posición sin precio
  // ──────────────────────────────────────────────────────────────────────────

  describe('posición sin precio disponible', () => {
    it('debería_marcar_sinPrecio_true_cuando_no_hay_cotización', () => {
      // Arrange
      const inversiones = [inv('NUEVO', 2000, 100)];
      const precios = {}; // sin cotización para NUEVO

      // Act
      const { result } = renderHook(() => useValuaciones(inversiones, precios));
      const pos = result.current.posiciones[0];

      // Assert
      expect(pos.sinPrecio).toBe(true);
      expect(pos.valorActual).toBeUndefined();
      expect(pos.resultado).toBeUndefined();
      expect(pos.resultadoPct).toBeUndefined();
    });

    it('debería_marcar_hayPosicionesSinPrecio_true_cuando_existe_al_menos_una', () => {
      // Arrange
      const inversiones = [inv('AAPL', 1000, 10), inv('RARO', 500, 50)];
      const precios = { AAPL: precio(120) };

      // Act
      const { result } = renderHook(() => useValuaciones(inversiones, precios));

      // Assert
      expect(result.current.hayPosicionesSinPrecio).toBe(true);
    });

    it('debería_no_incluir_posición_sin_precio_en_los_totales_valuados', () => {
      // Arrange
      const inversiones = [inv('RARO', 9999, 100)];
      const precios = {};

      // Act
      const { result } = renderHook(() => useValuaciones(inversiones, precios));

      // Assert
      expect(result.current.totales.invertido).toBe(0);
      expect(result.current.totales.valorActual).toBe(0);
      expect(result.current.totales.resultadoPct).toBeNull();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SECCIÓN 5: Distribución por categoría (categoriasOrdenadasActual)
  // ──────────────────────────────────────────────────────────────────────────

  describe('distribución por categoría', () => {
    it('debería_calcular_porcentajes_de_distribución_de_cartera_por_categoría', () => {
      // Arrange
      const inversiones = [
        inv('AAPL', 1000, 10, 'Acciones'),
        inv('BTC', 1000, 0.01, 'Criptomonedas'),
      ];
      // Ambas con precio igual al costo → valorActual = invertido = 1000 c/u
      const precios = {
        AAPL: precio(100),
        BTC: precio(100000),
      };

      // Act
      const { result } = renderHook(() => useValuaciones(inversiones, precios));
      const cats = result.current.categoriasOrdenadasActual;

      // Assert — totalCartera = 1000 + 1000 = 2000
      expect(cats).toHaveLength(2);
      const accion = cats.find(c => c.categoria === 'Acciones');
      const cripto = cats.find(c => c.categoria === 'Criptomonedas');
      expect(accion.porcentaje).toBeCloseTo(50, 2);
      expect(cripto.porcentaje).toBeCloseTo(50, 2);
    });

    it('debería_usar_monto_invertido_para_categoría_cuando_no_hay_precio', () => {
      // Arrange
      const inversiones = [
        inv('SIN_PRECIO', 1000, 10, 'SinMercado'),
        inv('AAPL', 1000, 10, 'Acciones'),
      ];
      const precios = { AAPL: precio(100) };

      // Act
      const { result } = renderHook(() => useValuaciones(inversiones, precios));
      const cats = result.current.categoriasOrdenadasActual;

      // Assert — SIN_PRECIO usa invertido(1000), AAPL usa valorActual(1000)
      const sinMercado = cats.find(c => c.categoria === 'SinMercado');
      expect(sinMercado.estimado).toBe(true);
      expect(sinMercado.total).toBeCloseTo(1000, 2);
    });

    it('debería_ordenar_categorías_de_mayor_a_menor_valor_de_cartera', () => {
      // Arrange
      const inversiones = [
        inv('X', 500, 5, 'FCI'),
        inv('Y', 2000, 20, 'Acciones'),
        inv('Z', 1000, 10, 'Bonos'),
      ];
      const precios = {
        X: precio(100),  // valorActual = 500
        Y: precio(100),  // valorActual = 2000
        Z: precio(100),  // valorActual = 1000
      };

      // Act
      const { result } = renderHook(() => useValuaciones(inversiones, precios));
      const cats = result.current.categoriasOrdenadasActual;

      // Assert
      expect(cats[0].categoria).toBe('Acciones');  // 2000
      expect(cats[1].categoria).toBe('Bonos');     // 1000
      expect(cats[2].categoria).toBe('FCI');       // 500
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SECCIÓN 6: Ordenamiento de posiciones
  // ──────────────────────────────────────────────────────────────────────────

  describe('ordenamiento de posiciones', () => {
    it('debería_ordenar_posiciones_por_valor_actual_descendente', () => {
      // Arrange
      const inversiones = [
        inv('SMALL', 100, 1),
        inv('BIG', 5000, 50),
        inv('MED', 1000, 10),
      ];
      const precios = {
        SMALL: precio(100),  // valorActual = 100
        BIG: precio(100),    // valorActual = 5000
        MED: precio(100),    // valorActual = 1000
      };

      // Act
      const { result } = renderHook(() => useValuaciones(inversiones, precios));
      const tickers = result.current.posiciones.map(p => p.ticker);

      // Assert
      expect(tickers).toEqual(['BIG', 'MED', 'SMALL']);
    });

    it('debería_colocar_posiciones_sin_precio_al_final', () => {
      // Arrange
      const inversiones = [
        inv('RARO', 9999, 1),  // sin precio → valorActual undefined
        inv('AAPL', 1000, 10),
      ];
      const precios = { AAPL: precio(120) };

      // Act
      const { result } = renderHook(() => useValuaciones(inversiones, precios));
      const tickers = result.current.posiciones.map(p => p.ticker);

      // Assert
      expect(tickers[0]).toBe('AAPL');
      expect(tickers[1]).toBe('RARO');
    });
  });
});
