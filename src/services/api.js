const CONEXION_KEY = 'finanzas_conexion';

// Solo aceptamos URLs de despliegue de Apps Script (ver nota de seguridad abajo)
const URL_REGEX = /^https:\/\/script\.google\.com\/(a\/macros\/[\w.-]+|macros)\/s\/[\w-]+\/exec$/;
export const urlValida = (u) => URL_REGEX.test(u);

export const getConexion = () => {
  try {
    return JSON.parse(localStorage.getItem(CONEXION_KEY)) || null;
  } catch {
    return null;
  }
};
export const setConexion = ({ url, token }) =>
  localStorage.setItem(CONEXION_KEY, JSON.stringify({ url, token }));
export const clearConexion = () => localStorage.removeItem(CONEXION_KEY);

export class UnauthorizedError extends Error {
  constructor(message = 'Token inválido') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

function handleJson(json, fallbackMsg) {
  if (json.code === 'UNAUTHORIZED') {
    clearConexion();
    window.dispatchEvent(new Event('auth:unauthorized'));
    throw new UnauthorizedError(json.message);
  }
  if (json.status !== 'success') throw new Error(json.message || fallbackMsg);
  return json;
}

function requireConexion(override) {
  const conexion = override ?? getConexion();
  if (!conexion?.url || !conexion?.token) throw new UnauthorizedError('Sin conexión configurada');
  if (!urlValida(conexion.url)) throw new Error('La URL no es un despliegue válido de Apps Script.');
  return conexion;
}

export async function fetchSheetsData(conexionOverride) {
  const { url, token } = requireConexion(conexionOverride);

  const response = await fetch(`${url}?token=${encodeURIComponent(token)}`, {
    method: 'GET',
    redirect: 'follow',
  });
  if (!response.ok) throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);

  return handleJson(await response.json(), 'Error al obtener datos de Google Sheets').data;
}

/** true/false según si URL + token funcionan. Otros errores (red, etc.) se propagan. */
export async function validarConexion(conexion) {
  try {
    await fetchSheetsData(conexion);
    return true;
  } catch (err) {
    if (err instanceof UnauthorizedError) return false;
    throw err;
  }
}

export const insertarGastoApi = (gasto) => postAppsScript('insertar_gasto', gasto);
export const insertarInversionApi = (inv) => postAppsScript('insertar_inversion', inv);

async function postAppsScript(action, data) {
  const { url, token } = requireConexion();

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action, token, data }),
    redirect: 'follow',
  });
  if (!response.ok) throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);

  return handleJson(await response.json(), `Error en la acción ${action}`);
}

//API para obtener precios de acciones

const PRECIOS_URL = import.meta.env.VITE_PRECIOS_API_URL;

export async function fetchPrecios(tickers) {
  if (!tickers?.length) return {};
  if (!PRECIOS_URL) throw new Error('VITE_PRECIOS_API_URL no está configurado.');
  const url = `${PRECIOS_URL}?tickers=${encodeURIComponent(tickers.join(','))}`;
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);

  const json = await res.json();
  if (json.status !== 'success') throw new Error(json.message);
  return json.data;
}

//Api para obtener precios de criptomonedas

export async function obtenerPreciosCripto() {
  const [resCripto, resDolar] = await Promise.all([
    fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd'),
    fetch('https://dolarapi.com/v1/dolares/cripto'),
  ]);

  if (!resCripto.ok) throw new Error(`CoinGecko: HTTP ${resCripto.status}`);
  if (!resDolar.ok) throw new Error(`DolarApi: HTTP ${resDolar.status}`);

  const cripto = await resCripto.json();
  const dolar = await resDolar.json();

  const tc = Number(dolar.compra); // o dolar.venta, ver nota abajo
  if (!Number.isFinite(tc) || tc <= 0) {
    throw new Error('No se pudo obtener el dólar cripto.');
  }

  const aArs = (usd) => {
    const n = Number(usd) * tc;
    return Number.isFinite(n) ? n : null;
  };

  return {
    BTC: aArs(cripto.bitcoin?.usd),
    ETH: aArs(cripto.ethereum?.usd),
    SOL: aArs(cripto.solana?.usd),
  };
}