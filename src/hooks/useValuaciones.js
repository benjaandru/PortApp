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

        // 4) Distribución por categoría a valor actual
        // Si un activo no tiene precio, entra al monto invertido para no subestimar su categoría
        const porCategoria = {};
        posiciones.forEach((p) => {
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
            posiciones,
            totales: {
                invertido,
                valorActual,
                resultado,
                resultadoPct: invertido > 0 ? (resultado / invertido) * 100 : null,
            },
            hayPosicionesSinPrecio: posiciones.some((p) => p.sinPrecio),
            categoriasOrdenadasActual,
        };
    }, [inversiones, precios]);
}