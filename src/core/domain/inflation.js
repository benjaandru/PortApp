/**
 * =========================================================================
 * CAPA DE DOMINIO: MODELOS Y CÁLCULOS DE INFLACIÓN (HEXAGONAL CORE)
 * =========================================================================
 * 
 * Este módulo es 100% puro y agnóstico a la web, React, APIs o bases de datos.
 * Contiene la lógica de negocio fundamental para modelar y calcular:
 * 1. Factor de inflación compuesta acumulada.
 * 2. Tasa de inflación acumulada en porcentaje.
 * 3. Ajuste de capital en términos reales (poder adquisitivo).
 * 4. Costo de oportunidad / pérdida inflacionaria.
 */

/**
 * Normaliza y valida una tasa porcentual individual.
 * @param {number|string} valor - Porcentaje mensual (ej: 20.6 o "20.6")
 * @returns {number} Tasa decimal normalizada (ej: 0.206)
 */
function normalizarTasaDecimal(valor) {
  const numero = typeof valor === 'number' ? valor : parseFloat(valor);
  
  if (Number.isNaN(numero) || !Number.isFinite(numero)) {
    return 0; // Tasa neutra ante valores no numéricos
  }

  return numero / 100;
}

/**
 * Calcula el factor acumulado compuesto y la tasa porcentual total
 * a partir de un listado de variaciones porcentuales mensuales.
 * 
 * Fórmula matemática:
 * Factor = ∏ (1 + r_i / 100)
 * Tasa Acumulada (%) = (Factor - 1) * 100
 * 
 * @param {Array<number|string>} tasasMensuales - Array de tasas en porcentaje (ej: [20.6, 13.2])
 * @returns {{ factorCompuesto: number, inflacionAcumuladaPct: number }}
 */
export function calcularInflacionCompuesta(tasasMensuales = []) {
  if (!Array.isArray(tasasMensuales) || tasasMensuales.length === 0) {
    return {
      factorCompuesto: 1,
      inflacionAcumuladaPct: 0,
    };
  }

  const factorCompuesto = tasasMensuales.reduce((acumulador, tasaActual) => {
    const tasaDecimal = normalizarTasaDecimal(tasaActual);
    return acumulador * (1 + tasaDecimal);
  }, 1);

  const inflacionAcumuladaPct = (factorCompuesto - 1) * 100;

  return {
    factorCompuesto,
    inflacionAcumuladaPct,
  };
}

/**
 * Ajusta un capital nominal original al valor presente requerido
 * para conservar el mismo poder adquisitivo.
 * 
 * Fórmula:
 * Capital Ajustado = Capital Original * Factor Compuesto
 * 
 * @param {number} capitalOriginal - Monto monetario original invertido
 * @param {number} factorCompuesto - Factor acumulado obtenido de calcularInflacionCompuesta
 * @returns {number} Capital actualizado
 */
export function ajustarCapitalPorInflacion(capitalOriginal, factorCompuesto = 1) {
  const capital = Number(capitalOriginal) || 0;
  const factor = Number(factorCompuesto) || 1;
  return capital * factor;
}

/**
 * Calcula la pérdida de poder adquisitivo (benchmark inflacionario).
 * Representa la cantidad adicional requerida para empatar a la inflación.
 * 
 * @param {number} capitalOriginal
 * @param {number} factorCompuesto
 * @returns {number}
 */
export function calcularCostoInflacionario(capitalOriginal, factorCompuesto = 1) {
  const capital = Number(capitalOriginal) || 0;
  return ajustarCapitalPorInflacion(capital, factorCompuesto) - capital;
}
