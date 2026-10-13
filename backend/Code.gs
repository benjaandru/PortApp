/**
 * =========================================================================
 * GOOGLE APPS SCRIPT - BACKEND API PARA PWA DE FINANZAS PERSONALES
 * =========================================================================
 */

var SHEETS = {
  GASTOS: "Gastos",
  INVERSIONES: "Inversiones",
  INFLACION: "Inflacion"
};

/**
 * Manejador GET: Retorna los datos de las 3 pestañas en formato JSON
 */
function doGet(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000); // Evitar colisiones de lectura concurrente
    
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
 * Manejador POST: Inserta gastos o inversiones
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000); // Timeout de 15s para escrituras atómicas

    if (!e || !e.postData || !e.postData.contents) {
      throw new Error("Cuerpo del request vacío.");
    }

    var requestBody = JSON.parse(e.postData.contents);
    var action = requestBody.action;
    var data = requestBody.data;

    if (!action || !data) {
      throw new Error("Parámetros 'action' o 'data' no encontrados en el payload.");
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
        throw new Error("Acción desconocida: '" + action + "'");
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

function handleInsertarInversion(ss, data) {
  var sheet = ss.getSheetByName(SHEETS.INVERSIONES);
  var fecha = data.fecha || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
  var ticker = (data.ticker || "").trim().toUpperCase();
  var montoInvertido = parseFloat(data.monto_invertido);
  var cantidad = parseFloat(data.cantidad);
  var categoria = data.categoria

  if (!ticker) throw new Error("El ticker del activo es obligatorio.");
  if (isNaN(montoInvertido) || montoInvertido <= 0) throw new Error("Monto invertido inválido.");
  if (isNaN(cantidad) || cantidad <= 0) throw new Error("Cantidad de títulos inválida.");

  sheet.appendRow([fecha, ticker, montoInvertido, cantidad, categoria]);
  return "Inversión registrada exitosamente.";
}

function getSheetDataAsObjects(sheet) {
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow <= 1 || lastCol === 0) return [];

  var values = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  var headers = values[0].map(function(h) { return String(h).trim(); });
  var rows = [];

  for (var i = 1; i < values.length; i++) {
    var rowObj = { _id: i };
    var hasContent = false;
    for (var j = 0; j < headers.length; j++) {
      var cellVal = values[i][j];
      if (cellVal instanceof Date) {
        cellVal = Utilities.formatDate(cellVal, Session.getScriptTimeZone(), "yyyy-MM-dd");
      }
      if (cellVal !== "" && cellVal !== null && cellVal !== undefined) {
        hasContent = true;
      }
      rowObj[headers[j]] = cellVal;
    }
    if (hasContent) rows.push(rowObj);
  }
  return rows;
}

function initSheetsIfNeeded(ss) {
  var config = [
    { name: SHEETS.GASTOS, headers: ["Fecha", "Monto", "Categoria", "Descripcion"] },
    { name: SHEETS.INVERSIONES, headers: ["Fecha", "Ticker", "Monto_Invertido", "Cantidad"] },
    { name: SHEETS.INFLACION, headers: ["Mes", "Porcentaje"] }
  ];

  config.forEach(function(item) {
    var sheet = ss.getSheetByName(item.name);
    if (!sheet) sheet = ss.insertSheet(item.name);
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(item.headers);
      sheet.getRange(1, 1, 1, item.headers.length).setFontWeight("bold");
    }
  });
}

function createJsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
