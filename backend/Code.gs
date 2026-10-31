/**
 * =========================================================================
 * GOOGLE APPS SCRIPT - BACKEND API PARA PWA DE FINANZAS PERSONALES
 * =========================================================================
 */

var SHEETS = {
  GASTOS: "Gastos",
  INVERSIONES: "Inversiones",
  INFLACION: "Inflacion",
  CONFIGURACION: "Configuracion",
  SALDO_POR_MES: "Saldo_por_mes"
};

/**
 * Manejador Token para seguridad
 * El token real vive en Propiedades del script (clave: API_TOKEN),
 * no en el código.
 */
function validarToken(e) {
  try {
    var real = PropertiesService.getScriptProperties().getProperty('API_TOKEN');
    if (!real) return false; // sin token configurado, nadie entra

    var token;
    if (e.postData && e.postData.contents) {
      token = JSON.parse(e.postData.contents).token;
    } else {
      token = e.parameter && e.parameter.token;
    }
    return token === real;
  } catch (error) {
    return false;
  }
}

function chequeoToken(e) {
  if (!validarToken(e)) {
    return createJsonResponse({
      status: "error",
      code: "UNAUTHORIZED", // lo detecta el front para volver al login
      message: "Acceso denegado. Token inválido."
    });
  }
  return null;
}

/**
 * Manejador GET: Retorna los datos de las 3 pestañas en formato JSON
 */

function doGet(e) {
  if (e.parameter.tickers) {
    return doGetPrecios(e);   // renombrá tu doGet de precios a esto
  }
  return doGetSheets(e);      // renombrá tu doGet de Sheets a esto
}

function doGetSheets(e) {

  const errorDeAcceso = chequeoToken(e);
  if (errorDeAcceso) {
    return errorDeAcceso;
  }

  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000); // Evitar colisiones de lectura concurrente
    
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    initSheetsIfNeeded(ss);
    migrarSueldoMensualLegacy(ss);

    var gastosData = getSheetDataAsObjects(ss.getSheetByName(SHEETS.GASTOS));
    var inversionesData = getSheetDataAsObjects(ss.getSheetByName(SHEETS.INVERSIONES));
    var inflacionData = getSheetDataAsObjects(ss.getSheetByName(SHEETS.INFLACION));
    var saldosPorMes = getSheetDataAsObjects(ss.getSheetByName(SHEETS.SALDO_POR_MES));

    var payload = {
      status: "success",
      data: {
        gastos: gastosData,
        inversiones: inversionesData,
        inflacion: inflacionData,
        saldosPorMes: saldosPorMes
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
    const errorDeAcceso = chequeoToken(e);
  if (errorDeAcceso) {
    return errorDeAcceso;
  }

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

      case "guardar_saldo_mes":
        resultMessage = handleGuardarSaldoMes(ss, data);
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

function handleGuardarSaldoMes(ss, data) {
  var sheet = ss.getSheetByName(SHEETS.SALDO_POR_MES);
  var saldo = Number(data.saldo);
  var mes = Number(data.mes);
  var anio = Number(data.anio);
  if (!isFinite(saldo) || saldo <= 0) throw new Error("El sueldo del mes debe ser un número mayor a 0.");
  if (!Number.isInteger(mes) || mes < 1 || mes > 12) throw new Error("El mes debe estar entre 1 y 12.");
  if (!Number.isInteger(anio) || anio < 2000 || anio > 9999) throw new Error("El año no es válido.");
  var values = sheet.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (Number(values[i][1]) === mes && Number(values[i][2]) === anio) {
      sheet.getRange(i + 1, 1).setValue(saldo);
      return "Saldo del mes actualizado.";
    }
  }
  sheet.appendRow([saldo, mes, anio]);
  return "Saldo del mes guardado.";
}

function migrarSueldoMensualLegacy(ss) {
  var configuracion = ss.getSheetByName(SHEETS.CONFIGURACION);
  if (!configuracion) return;
  var legacy = configuracion.getDataRange().getValues();
  var filaLegacy = -1;
  var saldoLegacy = 0;
  for (var i = 1; i < legacy.length; i++) {
    if (String(legacy[i][0]) === "sueldo_mensual") {
      filaLegacy = i + 1;
      saldoLegacy = Number(legacy[i][1]);
      break;
    }
  }
  if (filaLegacy < 0) return;

  if (isFinite(saldoLegacy) && saldoLegacy > 0) {
    var hoy = new Date();
    var mes = Number(Utilities.formatDate(hoy, Session.getScriptTimeZone(), "M"));
    var anio = Number(Utilities.formatDate(hoy, Session.getScriptTimeZone(), "yyyy"));
    var saldos = ss.getSheetByName(SHEETS.SALDO_POR_MES);
    var filas = saldos.getDataRange().getValues();
    var yaExiste = filas.slice(1).some(function(fila) {
      return Number(fila[1]) === mes && Number(fila[2]) === anio;
    });
    if (!yaExiste) saldos.appendRow([saldoLegacy, mes, anio]);
  }
  configuracion.deleteRow(filaLegacy);
}

function handleInsertarGasto(ss, data) {
  var sheet = ss.getSheetByName(SHEETS.GASTOS);
  var fecha = data.fecha || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
  var monto = parseFloat(data.monto);
  var categoria = (data.categoria || "Varios").trim();
  var descripcion = (data.descripcion || "").trim();
  var tipoPago = (data.tipoPago || "").trim();

  if (isNaN(monto) || monto <= 0) {
    throw new Error("El monto del gasto debe ser un número válido mayor a 0.");
  }

  sheet.appendRow([fecha, monto, categoria, descripcion, tipoPago]);
  return "Gasto registrado exitosamente.";
}

function handleInsertarInversion(ss, data) {
  var sheet = ss.getSheetByName(SHEETS.INVERSIONES);
  var fecha = data.fecha || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
  var nombre = data.nombre;
  var ticker = (data.ticker || "").trim().toUpperCase();
  var montoInvertido = parseFloat(data.monto_invertido);
  var cantidad = parseFloat(data.cantidad);
  var categoria = data.categoria;
  var precioCompra = Number(data.precio_compra)
  if (categoria === "Criptomonedas" && !(precioCompra > 0)) {
  throw new Error("Para criptomonedas el precio de compra es obligatorio.");
  }
  if (!ticker) throw new Error("El ticker del activo es obligatorio.");
  if (isNaN(montoInvertido) || montoInvertido <= 0) throw new Error("Monto invertido inválido.");
  if (isNaN(cantidad) || cantidad <= 0) throw new Error("Cantidad de títulos inválida.");

  sheet.appendRow([fecha, nombre, ticker, montoInvertido, cantidad, categoria, precioCompra]);
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
    { name: SHEETS.GASTOS, headers: ["Fecha", "Monto", "Categoria", "Descripcion", "TipoPago"] },
    { name: SHEETS.INVERSIONES, headers: ["Fecha", "Ticker", "Monto_Invertido", "Cantidad", "Categoria", "Precio_Compra"] },
    { name: SHEETS.INFLACION, headers: ["Mes", "Porcentaje"] },
    { name: SHEETS.SALDO_POR_MES, headers: ["Saldo", "Mes", "Anio"] }
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
