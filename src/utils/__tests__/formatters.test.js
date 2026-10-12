import { describe, it, expect } from 'vitest';
import { formatearDinero, formatearPct } from '../formatters.js';

describe('Utilidades: Formateadores', () => {
  describe('formatearDinero', () => {
    it('debe formatear números válidos a moneda ARS', () => {
      const resultado = formatearDinero(1250.5);
      expect(resultado).toContain('1.250,5');
    });

    it('debe manejar 0 y valores nulos/inválidos devolviendo 0', () => {
      expect(formatearDinero(0)).toContain('0');
      expect(formatearDinero(null)).toContain('0');
      expect(formatearDinero('invalido')).toContain('0');
    });

    it('debe convertir strings numéricos adecuadamente', () => {
      const resultado = formatearDinero('3500');
      expect(resultado).toContain('3.500');
    });
  });

  describe('formatearPct', () => {
    it('debe formatear porcentajes con 2 decimales y el símbolo %', () => {
      expect(formatearPct(12.3456)).toBe('12.35%');
      expect(formatearPct(5)).toBe('5.00%');
    });

    it('debe manejar valores nulos o inválidos devolviendo 0.00%', () => {
      expect(formatearPct(null)).toBe('0.00%');
      expect(formatearPct('abc')).toBe('0.00%');
    });
  });
});
