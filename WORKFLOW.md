# PortApp — contexto actual y flujo de trabajo

## Resumen

PWA de finanzas personales construida con React 18 y Vite. La interfaz se publica como sitio estático y usa Google Apps Script como API autenticada para leer y escribir en Google Sheets. También presenta inversiones e inflación y consulta cotizaciones externas para valuaciones.

## Estructura vigente

- `src/App.jsx`: autentica la conexión guardada y organiza Dashboard, Gastos e Inversiones en la navegación principal.
- `src/services/api.js`: configura URL/token de Apps Script, obtiene datos y centraliza los POST autenticados.
- `src/hooks/useSheets.js`: carga/refresca datos de Sheets y expone acciones de alta.
- `src/pages/`: pantallas Dashboard, Gastos e Inversiones.
- `src/components/`: formularios y componentes de presentación, incluidos KPIs e historial.
- `src/hooks/`: métricas y cotizaciones; `src/core/domain/`: cálculos de dominio.
- `backend/Code.gs`: backend Apps Script que debe publicarse como Web App.

## Persistencia y API

La planilla activa tiene estas pestañas:

| Pestaña | Columnas / uso |
| --- | --- |
| `Gastos` | `Fecha`, `Monto`, `Categoria`, `Descripcion`, `TipoPago` |
| `Inversiones` | datos de inversiones y cotización de compra |
| `Inflacion` | `Mes`, `Porcentaje` |
| `Saldo_por_mes` | `Saldo`, `Mes`, `Anio`; conserva el importe base de cada período |
| `Configuracion` | hoja heredada; se revisa una vez para migrar `sueldo_mensual` existente a `Saldo_por_mes` |

`initSheetsIfNeeded()` crea pestañas/encabezados si faltan. `Configuracion` ya no se crea; si existe de una versión anterior, se consulta solo para migrar el sueldo guardado y se conserva la pestaña.

Las llamadas al Web App llevan el token configurado en `API_TOKEN` de Script Properties. GET pasa el token como query param. POST usa `Content-Type: text/plain;charset=utf-8` y envía `{ action, token, data }` para evitar preflight CORS. El backend serializa operaciones con `LockService`.

Acciones POST implementadas: `insertar_gasto`, `insertar_inversion`, `guardar_saldo_mes`. El sueldo se inserta o actualiza por par mes/año; hay como máximo una fila por período.

## Flujo de sueldo y saldo mensual

1. GET devuelve `gastos`, `inversiones`, `inflacion` y `saldosPorMes`.
2. Desde Dashboard se puede guardar o actualizar el sueldo del período actual.
3. `guardar_saldo_mes` valida el saldo, el mes y el año y persiste la fila en `Saldo_por_mes`.
4. El hook vuelve a cargar los datos tras una escritura exitosa.
5. Dashboard busca el saldo del mes/año actual, suma los gastos de ese mes y muestra `saldoMensual - gastosDelMes` como disponible. Un resultado negativo se conserva y se muestra como saldo excedido. Los gastos de otros meses no descuentan el período actual.

Mes y año son campos explícitos para identificar y consultar cada período sin depender de fechas con día u hora. El sueldo se registra por período, por lo que se puede actualizar en un mes sin alterar los anteriores. Para usuarios que ya habían guardado `sueldo_mensual`, el primer GET crea el registro correspondiente al mes/año actual y elimina esa fila heredada para evitar repetir la migración.

## Flujo de gasto

1. En la pestaña Gastos se abre el formulario y se ingresan fecha, monto, categoría, descripción y tipo de pago.
2. `insertar_gasto` valida el monto, agrega una fila en `Gastos` y responde JSON.
3. Si la operación tiene éxito, `useSheets` vuelve a consultar los datos; el gasto mensual y el saldo del Dashboard se actualizan.

## Acceso, despliegue y cambios de backend

- La conexión (URL `/exec` y token) se guarda en `localStorage` del navegador. Si el token no es válido, la app solicita autenticación nuevamente.
- `backend/Code.gs` es código desplegado de forma independiente del frontend. Para que una feature nueva del backend esté disponible para usuarios, actualizar el proyecto Apps Script y crear una nueva versión del deployment Web App conservando permisos y propiedades existentes.
- El frontend usa `VITE_SHEETS_API_URL` solo como referencia de entorno; la conexión efectiva de usuario se configura desde la pantalla de acceso.
- Los archivos de entrada son `src/main.jsx` y `index.html`; Vite está configurado en `vite.config.js`. GitHub Actions está en `.github/` y administra la publicación configurada para el repositorio.

## PWA

La configuración de Vite PWA está en `vite.config.js`. GitHub Pages debe servirse por HTTPS para permitir Service Worker e instalación en iOS. Los metadatos e iconos se mantienen en `index.html`; los estilos de safe area están en `src/index.css`.

## Mantenimiento

- Mantener nombres de columnas de Sheets alineados con los objetos consumidos por el frontend.
- Al sumar un dato persistido: actualizar respuesta GET, acción POST, `useSheets` y la UI; conservar autenticación y lock del backend.
- Las métricas de gastos se calculan en `src/hooks/useGastosMetrics.js`; las métricas de inversiones están separadas en sus hooks/domain respectivos.
- No asumir que la documentación histórica o comentarios describen el código actual: verificar archivos antes de cambiar el flujo.
