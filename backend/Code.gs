/**
 * =========================================================================
 * GOOGLE APPS SCRIPT - BACKEND PARA PWA DE FINANZAS PERSONALES
 * =========================================================================
 * 
 * Configuración de Google Sheets:
 * - Pestaña 1: "Gastos"     -> Columnas: Fecha | Monto | Categoria | Descripcion
 * - Pestaña 2: "Inversiones" -> Columnas: Fecha | Ticker | Monto_Invertido | Cantidad
 * - Pestaña 3: "Inflacion"   -> Columnas: Mes | Porcentaje
 * 
 * NOTA CRÍTICA SOBRE CORS EN APPS SCRIPT:
 * 1. Apps Script no soporta peticiones OPTIONS (CORS Preflight).
 * 2. Desde el frontend React, se debe enviar el POST como 'text/plain;charset=utf-8'
 *    con el JSON stringify. Aquí se recibe en `e.postData.contents`.
 * 3. Se responde con `ContentService.createTextOutput` y mimeType JSON.
 * 4. Al desplegar la Web App:
 *    - Ejecutar como: "Yo" (tu cuenta)
 *    - Quién tiene acceso: "Cualquiera" (Anyone / Anónimo)
 */

// Nombres de las hojas
var SHEETS = {
  GASTOS: "Gastos",
  INVERSIONES: "Inversiones",
  INFLACION: "Inflacion"
};

/**
 * Manejador de peticiones GET
 * Retorna todos los datos de las 3 pestañas en formato JSON.
 */
function doGet(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000); // Esperar hasta 10 segundos
    
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    initSheetsIfNeeded(ss);

    var gastosData = getSheetDataAsObjects(ss.getSheetByName(SHEETS.GASTOS));
    var inversionesData = getSheetDataAsObjects(ss.getSheetByName(SHEETS.INVERSIONES));
    var inflacionData = getSheetDataAsObjects(ss.getSheetByName(SHEETS.INFLACION));

    var payload = {
      status: "success",
      data: {
        gastos: gastosData,
        inversiones: inversionesData,
        inflacion: inflacionData
      },
      timestamp: new Date().toISOString()
    };

    return createJsonResponse(payload);
  } catch (error) {
    return createJsonResponse({
      status: "error",
      message: error.toString()
    });
  } finally {
    lock.releaseLock();
  }
}

/**
 * Manejador de peticiones POST
 * Inserta filas en "Gastos" o "Inversiones".
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    // Evitar condiciones de carrera concurrentes
    lock.waitLock(15000);

    if (!e || !e.postData || !e.postData.contents) {
      throw new Error("No se recibieron datos en el cuerpo del request.");
    }

    var requestBody;
    try {
      requestBody = JSON.parse(e.postData.contents);
    } catch (parseErr) {
      throw new Error("El cuerpo no es un JSON válido: " + parseErr.message);
    }

    var action = requestBody.action;
    var data = requestBody.data;

    if (!action || !data) {
      throw new Error("Faltan parámetros requeridos: 'action' o 'data'.");
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    initSheetsIfNeeded(ss);

    var resultMessage = "";

    switch (action) {
      case "insertar_gasto":
        resultMessage = handleInsertarGasto(ss, data);
        break;

      case "insertar_inversion":
        resultMessage = handleInsertarInversion(ss, data);
        break;

      default:
        throw new Error("Acción desconocida: '" + action + "'. Acciones válidas: 'insertar_gasto', 'insertar_inversion'");
    }

    return createJsonResponse({
      status: "success",
      action: action,
      message: resultMessage,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return createJsonResponse({
      status: "error",
      message: error.toString()
    });
  } finally {
    lock.releaseLock();
  }
}

/**
 * Inserta un gasto en la pestaña 'Gastos'
 * Columnas: Fecha, Monto, Categoria, Descripcion
 */
function handleInsertarGasto(ss, data) {
  var sheet = ss.getSheetByName(SHEETS.GASTOS);
  var fecha = data.fecha || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
  var monto = parseFloat(data.monto);
  var categoria = (data.categoria || "Varios").trim();
  var descripcion = (data.descripcion || "").trim();

  if (isNaN(monto) || monto <= 0) {
    throw new Error("El monto del gasto debe ser un número válido mayor a 0.");
  }

  sheet.appendRow([fecha, monto, categoria, descripcion]);
  return "Gasto registrado exitosamente.";
}

/**
 * Inserta una inversión en la pestaña 'Inversiones'
 * Columnas: Fecha, Ticker, Monto_Invertido, Cantidad
 */
function handleInsertarInversion(ss, data) {
  var sheet = ss.getSheetByName(SHEETS.INVERSIONES);
  var fecha = data.fecha || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
  var ticker = (data.ticker || "").trim().toUpperCase();
  var montoInvertido = parseFloat(data.monto_invertido);
  var cantidad = parseFloat(data.cantidad);

  if (!ticker) {
    throw new Error("El ticker del activo es requerido (ej: AAPL, BTC, SPY).");
  }
  if (isNaN(montoInvertido) || montoInvertido <= 0) {
    throw new Error("El monto invertido debe ser un número válido mayor a 0.");
  }
  if (isNaN(cantidad) || cantidad <= 0) {
    throw new Error("La cantidad de títulos debe ser un número mayor a 0.");
  }

  sheet.appendRow([fecha, ticker, montoInvertido, cantidad]);
  return "Inversión registrada exitosamente.";
}

/**
 * Lee una hoja y transforma las filas en una lista de objetos JSON usando la fila 1 como encabezados.
 */
function getSheetDataAsObjects(sheet) {
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();

  if (lastRow <= 1 || lastCol === 0) {
    return []; // Solo encabezados o vacía
  }

  var range = sheet.getRange(1, 1, lastRow, lastCol);
  var values = range.getValues();
  var headers = values[0].map(function(h) {
    return String(h).trim();
  });

  var rows = [];
  for (var i = 1; i < values.length; i++) {
    var rowObj = { _id: i };
    var hasContent = false;

    for (var j = 0; j < headers.length; j++) {
      var headerKey = headers[j];
      var cellVal = values[i][j];

      // Formatear fechas como YYYY-MM-DD para compatibilidad estándar con el cliente
      if (cellVal instanceof Date) {
        cellVal = Utilities.formatDate(cellVal, Session.getScriptTimeZone(), "yyyy-MM-dd");
      }

      if (cellVal !== "" && cellVal !== null && cellVal !== undefined) {
        hasContent = true;
      }
      rowObj[headerKey] = cellVal;
    }

    if (hasContent) {
      rows.push(rowObj);
    }
  }

  return rows;
}

/**
 * Inicializa las 3 pestañas y sus cabeceras si no existen
 */
function initSheetsIfNeeded(ss) {
  var config = [
    { name: SHEETS.GASTOS, headers: ["Fecha", "Monto", "Categoria", "Descripcion"] },
    { name: SHEETS.INVERSIONES, headers: ["Fecha", "Ticker", "Monto_Invertido", "Cantidad"] },
    { name: SHEETS.INFLACION, headers: ["Mes", "Porcentaje"] }
  ];

  config.forEach(function(item) {
    var sheet = ss.getSheetByName(item.name);
    if (!sheet) {
      sheet = ss.insertSheet(item.name);
    }
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(item.headers);
      sheet.getRange(1, 1, 1, item.headers.length).setFontWeight("bold");
    }
  });
}

/**
 * Genera la respuesta JSON estándar compatible con Apps Script ContentService
 */
function createJsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
