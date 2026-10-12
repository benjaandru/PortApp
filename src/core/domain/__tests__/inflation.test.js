import { describe, it, expect } from 'vitest';
import {
  calcularInflacionCompuesta,
  ajustarCapitalPorInflacion,
  calcularCostoInflacionario,
} from '../inflation.js';

describe('Dominio: Cálculo de Inflación Compuesta Acumulada', () => {
  describe('calcularInflacionCompuesta', () => {
    it('debe retornar factor 1 y 0% de inflación acumulada cuando el array está vacío o no es array', () => {
      expect(calcularInflacionCompuesta([])).toEqual({
        factorCompuesto: 1,
        inflacionAcumuladaPct: 0,
      });

      expect(calcularInflacionCompuesta(null)).toEqual({
        factorCompuesto: 1,
        inflacionAcumuladaPct: 0,
      });
    });

    it('debe calcular correctamente la inflación para un único período', () => {
      const resultado = calcularInflacionCompuesta([10]);

      expect(resultado.factorCompuesto).toBeCloseTo(1.10, 4);
      expect(resultado.inflacionAcumuladaPct).toBeCloseTo(10, 4);
    });

    it('debe calcular la inflación compuesta multiplicativa para múltiples períodos', () => {
      // 1.10 * 1.20 = 1.32 (32% acumulado)
      const resultado = calcularInflacionCompuesta([10, 20]);

      expect(resultado.factorCompuesto).toBeCloseTo(1.32, 4);
      expect(resultado.inflacionAcumuladaPct).toBeCloseTo(32, 4);
    });

    it('debe manejar variaciones con decimales reales de inflación mensual', () => {
      // 1.206 * 1.132 = 1.365192 -> 36.5192%
      const resultado = calcularInflacionCompuesta([20.6, 13.2]);

      expect(resultado.factorCompuesto).toBeCloseTo(1.3652, 4);
      expect(resultado.inflacionAcumuladaPct).toBeCloseTo(36.5192, 4);
    });

    it('debe tolerar entradas en formato string numérico provenientes de la capa de datos', () => {
      const resultado = calcularInflacionCompuesta(['5.5', '10']);

      expect(resultado.factorCompuesto).toBeCloseTo(1.1605, 4);
      expect(resultado.inflacionAcumuladaPct).toBeCloseTo(16.05, 4);
    });

    it('debe calcular adecuadamente períodos con deflación (tasas negativas)', () => {
      // 0.95 * 1.10 = 1.045 -> 4.5%
      const resultado = calcularInflacionCompuesta([-5, 10]);

      expect(resultado.factorCompuesto).toBeCloseTo(1.045, 4);
      expect(resultado.inflacionAcumuladaPct).toBeCloseTo(4.5, 4);
    });

    it('debe ignorar valores no numéricos o NaN de forma defensiva sin romper el cálculo', () => {
      const resultado = calcularInflacionCompuesta([10, 'invalido', null, 20]);

      expect(resultado.factorCompuesto).toBeCloseTo(1.32, 4);
      expect(resultado.inflacionAcumuladaPct).toBeCloseTo(32, 4);
    });
  });

  describe('ajustarCapitalPorInflacion', () => {
    it('debe ajustar el capital nominal multiplicándolo por el factor compuesto', () => {
      const capitalOriginal = 1000;
      const factorCompuesto = 1.32; // 32% acumulado

      const capitalAjustado = ajustarCapitalPorInflacion(capitalOriginal, factorCompuesto);

      expect(capitalAjustado).toBeCloseTo(1320, 2);
    });
  });

  describe('calcularCostoInflacionario', () => {
    it('debe calcular la diferencia entre el capital ajustado y el capital original', () => {
      const capitalOriginal = 1000;
      const factorCompuesto = 1.32;

      const costo = calcularCostoInflacionario(capitalOriginal, factorCompuesto);

      expect(costo).toBeCloseTo(320, 2);
    });
  });
});
