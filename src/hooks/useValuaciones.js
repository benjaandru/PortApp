import { useMemo } from 'react';

// Escala para instrumentos que cotizan por lote (bonos, ONs)
const ESCALA_POR_CATEGORIA = {
    // Bonos: 100,
    // ONs: 100,
};

const num = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
};

/**
 * Hook unificado de valuación.
 * Maneja acciones tradicionales (por cantidad) y Criptomonedas (por índice de crecimiento).
 * 
 * @param {Array} inversiones - Tu lista cruda desde Google Sheets
 * @param {Object} precios - Objeto con cotizaciones de InvertirOnline (cedears, acciones, etc)
 * @param {Object} preciosCripto - Objeto con cotizaciones de CoinGecko (BTC, ETH, SOL en pesos)
 */
export function useValuaciones(inversiones, precios, preciosCripto = {}) {
    return useMemo(() => {
        // 1) Agrupar compras por ticker
        // A diferencia de antes, para las Cripto NO podemos simplemente sumar la "cantidad" 
        // porque la cantidad ahora representa el precio de compra, y cada compra pudo ser a un precio distinto.
        // Así que mantenemos las compras de cripto separadas como "lotes" hasta valuar cada una.
        const porTickerTradicional = {};
        const lotesCripto = [];

        (inversiones || []).forEach((inv) => {
            const ticker = String(inv.Ticker || '').trim().toUpperCase();
            if (!ticker) return;

            const categoria = inv.Categoria || '';
            const cantidadOPrecioInicial = num(inv.Cantidad);
            const invertido = num(inv.Monto_Invertido);

            if (categoria === 'Criptomonedas') {
                // Guardamos cada compra de cripto como un lote independiente para calcular su propio crecimiento
                lotesCripto.push({
                    ticker,
                    categoria,
                    precioCompraInicial: num(inv.Precio_Compra),
                    invertido,
                });
            } else {
                // Lógica original para Bonos, Cedears, Acciones (Se agrupan)
                const p = (porTickerTradicional[ticker] ||= {
                    ticker,
                    categoria,
                    cantidad: 0,
                    invertido: 0,
                });
                p.cantidad += cantidadOPrecioInicial;
                p.invertido += invertido;
            }
        });

        // 2) Valuar cada posición
        let posicionesValuadas = [];

        // A. Valuar Activos Tradicionales
        Object.values(porTickerTradicional).forEach((p) => {
            const cot = precios?.[p.ticker];
            const precio = Number(cot?.precio);

            if (!cot || !Number.isFinite(precio)) {
                posicionesValuadas.push({ ...p, sinPrecio: true });
                return;
            }

            const escala = ESCALA_POR_CATEGORIA[p.categoria] ?? 1;
            const valorActual = (p.cantidad * precio) / escala;
            const resultado = valorActual - p.invertido;

            posicionesValuadas.push({
                ...p,
                sinPrecio: false,
                precio,
                moneda: cot.moneda,
                valorActual,
                resultado,
                resultadoPct: p.invertido > 0 ? (resultado / p.invertido) * 100 : null,
            });
        });

        const precioCriptoDe = (ticker) => {
            const v = preciosCripto?.[ticker];
            const n = Number(v?.precio ?? v);
            return Number.isFinite(n) && n > 0 ? n : null;
        };

        const criptoAgrupado = {};

        lotesCripto.forEach((lote) => {
            const hoy = precioCriptoDe(lote.ticker);

            const p = (criptoAgrupado[lote.ticker] ||= {
                ticker: lote.ticker,
                categoria: lote.categoria,
                moneda: 'ARS',
                precio: hoy,
                cantidad: 0,
                invertido: 0,
                valorActual: 0,
                sinPrecio: false,
            });

            p.invertido += lote.invertido;
            if (lote.precioCompraInicial > 0) {
                p.cantidad += lote.invertido / lote.precioCompraInicial;
            }

            if (!hoy || lote.precioCompraInicial <= 0) {
                p.valorActual += lote.invertido; // a costo
                p.sinPrecio = true;
            } else {
                p.valorActual += lote.invertido * (hoy / lote.precioCompraInicial);
            }
        });

        Object.values(criptoAgrupado).forEach((p) => {
            if (p.sinPrecio) {
                const { valorActual, ...resto } = p; // igual que las acciones sin precio
                posicionesValuadas.push(resto);
                return;
            }
            const resultado = p.valorActual - p.invertido;
            posicionesValuadas.push({
                ...p,
                resultado,
                resultadoPct: p.invertido > 0 ? (resultado / p.invertido) * 100 : null,
            });
        });


        // 3) Ordenar de mayor a menor valor
        posicionesValuadas.sort((a, b) => (b.valorActual ?? -1) - (a.valorActual ?? -1));

        // 4) Totales Globales
        const valuadas = posicionesValuadas.filter((p) => !p.sinPrecio);
        const invertido = valuadas.reduce((s, p) => s + p.invertido, 0);
        const valorActual = valuadas.reduce((s, p) => s + p.valorActual, 0);
        const resultado = valorActual - invertido;

        // 5) Distribución por categoría a valor actual
        const porCategoria = {};
        posicionesValuadas.forEach((p) => {
            const nombre = p.categoria || 'Sin categoría';
            const monto = p.sinPrecio ? p.invertido : p.valorActual;
            const c = (porCategoria[nombre] ||= { categoria: nombre, total: 0, estimado: false });
            c.total += monto;
            if (p.sinPrecio) c.estimado = true;
        });

        const totalCartera = Object.values(porCategoria).reduce((s, c) => s + c.total, 0);
        const categoriasOrdenadasActual = Object.values(porCategoria)
            .map((c) => ({
                ...c,
                porcentaje: totalCartera > 0 ? (c.total / totalCartera) * 100 : 0,
            }))
            .sort((a, b) => b.total - a.total);

        return {
            posiciones: posicionesValuadas, // <--- Esta lista ahora tiene TODO unificado
            totales: {
                invertido,
                valorActual,
                resultado,
                resultadoPct: invertido > 0 ? (resultado / invertido) * 100 : null,
            },
            hayPosicionesSinPrecio: posicionesValuadas.some((p) => p.sinPrecio),
            categoriasOrdenadasActual,
        };
    }, [inversiones, precios, preciosCripto]);
}

// Podés borrar la función useValuacionesCripto original