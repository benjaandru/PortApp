import { useMemo } from 'react';

// Algunos instrumentos cotizan por cada 100 nominales (bonos, ONs).
// Ajustá según los nombres de Categoria que uses en tu hoja.
const ESCALA_POR_CATEGORIA = {
    // Bonos: 100,
    // ONs: 100,
};

const num = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
};

export function useValuaciones(inversiones, precios) {
    return useMemo(() => {
        // 1) Agrupar compras por ticker
        const porTicker = {};
        (inversiones || []).forEach((inv) => {
            const ticker = String(inv.Ticker || '').trim().toUpperCase();
            if (!ticker) return;
            const p = (porTicker[ticker] ||= {
                ticker,
                categoria: inv.Categoria || '',
                cantidad: 0,
                invertido: 0,
            });
            p.cantidad += num(inv.Cantidad);
            p.invertido += num(inv.Monto_Invertido);
        });

        // 2) Valuar cada posición con su precio actual
        const posiciones = Object.values(porTicker).map((p) => {
            const cot = precios?.[p.ticker];
            const precio = Number(cot?.precio);
            if (!cot || !Number.isFinite(precio)) return { ...p, sinPrecio: true };

            const escala = ESCALA_POR_CATEGORIA[p.categoria] ?? 1;
            const valorActual = (p.cantidad * precio) / escala;
            const resultado = valorActual - p.invertido;
            return {
                ...p,
                sinPrecio: false,
                precio,
                moneda: cot.moneda,
                valorActual,
                resultado,
                resultadoPct: p.invertido > 0 ? (resultado / p.invertido) * 100 : null,
            };
        });

        posiciones.sort((a, b) => (b.valorActual ?? -1) - (a.valorActual ?? -1));

        // 3) Totales (solo posiciones con precio)
        const valuadas = posiciones.filter((p) => !p.sinPrecio);
        const invertido = valuadas.reduce((s, p) => s + p.invertido, 0);
        const valorActual = valuadas.reduce((s, p) => s + p.valorActual, 0);
        const resultado = valorActual - invertido;

        return {
            posiciones,
            totales: {
                invertido,
                valorActual,
                resultado,
                resultadoPct: invertido > 0 ? (resultado / invertido) * 100 : null,
            },
            hayPosicionesSinPrecio: posiciones.some((p) => p.sinPrecio),
        };
    }, [inversiones, precios]);
}