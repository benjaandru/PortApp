/**
 * =========================================================================
 * SERVICIO DE API - GOOGLE APPS SCRIPT
 * =========================================================================
 * 
 * Configuración de la URL:
 * Define VITE_SHEETS_API_URL en tu archivo .env con la URL de despliegue de Apps Script:
 * https://script.google.com/macros/s/AKfycb.../exec
 */

const API_URL = import.meta.env.VITE_SHEETS_API_URL || '';

/**
 * Obtiene todos los datos de las 3 pestañas (Gastos, Inversiones, Inflacion)
 * @returns {Promise<{ gastos: Array, inversiones: Array, inflacion: Array }>}
 */
export async function fetchSheetsData() {
  if (!API_URL) {
    throw new Error('VITE_SHEETS_API_URL no está configurado en las variables de entorno (.env).');
  }

  try {
    const response = await fetch(API_URL, {
      method: 'GET',
      redirect: 'follow', // Apps Script redirige 302 a googleusercontent.com
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
    }

    const json = await response.json();
    if (json.status !== 'success') {
      throw new Error(json.message || 'Error al obtener datos de Google Sheets');
    }

    return json.data;
  } catch (err) {
    console.error('Error en fetchSheetsData:', err);
    throw err;
  }
}

/**
 * Registra un nuevo gasto en Google Sheets
 * 
 * TRUCO SENIOR PARA CORS:
 * Google Apps Script no soporta preflight OPTIONS. Enviamos 'text/plain;charset=utf-8'
 * con el JSON stringify en el body para evitar que el navegador envíe el OPTIONS request.
 * 
 * @param {{ fecha: string, monto: number|string, categoria: string, descripcion: string }} gasto
 */
export async function insertarGastoApi(gasto) {
  return postAppsScript('insertar_gasto', gasto);
}

/**
 * Registra una nueva inversión en Google Sheets
 * @param {{ fecha: string, ticker: string, monto_invertido: number|string, cantidad: number|string }} inversion
 */
export async function insertarInversionApi(inversion) {
  return postAppsScript('insertar_inversion', inversion);
}

/**
 * Función interna para realizar llamadas POST con bypass de CORS
 */
async function postAppsScript(action, data) {
  if (!API_URL) {
    throw new Error('VITE_SHEETS_API_URL no está configurado en las variables de entorno (.env).');
  }

  const payload = {
    action,
    data,
  };

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        // Vital para evitar CORS preflight (OPTIONS)
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
      redirect: 'follow',
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
    }

    const json = await response.json();
    if (json.status !== 'success') {
      throw new Error(json.message || `Error en la acción ${action}`);
    }

    return json;
  } catch (err) {
    console.error(`Error en postAppsScript (${action}):`, err);
    throw err;
  }
}
