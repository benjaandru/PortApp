/**
 * Utilidades de formato numérico y monetario
 */

/**
 * Formatea un valor numérico a moneda argentina (ARS / $)
 * @param {number|string} val - Monto a formatear
 * @returns {string} Texto formateado (ej: "$ 1.234,56")
 */
export const formatearDinero = (val) => {
  const numero = typeof val === 'number' ? val : parseFloat(val);
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 2,
  }).format(Number.isFinite(numero) ? numero : 0);
};

/**
 * Formatea un valor decimal/porcentual a string con símbolo %
 * @param {number|string} val - Porcentaje a formatear
 * @returns {string} Texto formateado (ej: "12.34%")
 */
export const formatearPct = (val) => {
  const numero = typeof val === 'number' ? val : parseFloat(val);
  return `${(Number.isFinite(numero) ? numero : 0).toFixed(2)}%`;
};