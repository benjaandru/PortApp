import React from 'react';
import { formatearDinero } from '../../utils/formatters.js';

const pct = (n) => (n == null ? '–' : `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`);
const signo = (n) => (n > 0 ? 'text-pos' : n < 0 ? 'text-neg' : '');

/**
 * Componente Presentacional: Valuación de cartera a precio de mercado.
 * Una barra por activo = peso de esa posición sobre el valor total.
 */
export default function Valuaciones({
    posiciones = [],
    totales,
    loading = false,
    error = null,
    ultimaActualizacion = null,
    hayPosicionesSinPrecio = false,
    onRefresh,
}) {
    const hora = ultimaActualizacion?.toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
    });

    return (
        <div className="card-glass mt-6">
            <div className="card-header">
                <h2 className="title-md">Valuación de Cartera</h2>
                <div className="valuacion-acciones">
                    <span className="badge-neutral">
                        {loading ? 'Actualizando…' : hora ? `Actualizado ${hora}` : 'Precios de mercado'}
                    </span>
                    <button
                        type="button"
                        className="btn-secondary"
                        onClick={onRefresh}
                        disabled={loading}
                        title="Actualizar precios"
                    >
                        ↻
                    </button>
                </div>
            </div>

            {posiciones.length === 0 ? (
                <p className="empty-text">No hay inversiones registradas en la pestaña "Inversiones".</p>
            ) : (
                <>
                    {/* Resumen */}
                    <div className="valuacion-resumen">
                        <div>
                            <span className="valuacion-label">Valor actual</span>
                            <strong className="font-mono valuacion-valor">
                                {formatearDinero(totales.valorActual)}
                            </strong>
                        </div>
                        <div>
                            <span className="valuacion-label">Resultado</span>
                            <strong className={`font-mono valuacion-valor ${signo(totales.resultado)}`}>
                                {formatearDinero(totales.resultado)}
                                <small> ({pct(totales.resultadoPct)})</small>
                            </strong>
                        </div>
                        <div>
                            <span className="valuacion-label">Invertido</span>
                            <strong className="font-mono valuacion-valor">
                                {formatearDinero(totales.invertido)}
                            </strong>
                        </div>
                    </div>

                    {/* Una barra por posición */}
                    <div className="category-bars">
                        {posiciones.map((p) => {
                            const peso =
                                !p.sinPrecio && totales.valorActual > 0
                                    ? (p.valorActual / totales.valorActual) * 100
                                    : 0;

                            return (
                                <div key={p.ticker} className="bar-item" title={`${peso.toFixed(1)}% de la cartera`}>
                                    <div className="bar-labels">
                                        <span className="bar-name">
                                            {p.ticker}
                                            <small className="valuacion-unidades">
                                                {(p.cantidad ?? 0).toLocaleString('es-AR', { maximumFractionDigits: 6 })} u.
                                            </small>
                                        </span>
                                        <span className="bar-amount font-mono">
                                            {p.sinPrecio ? (
                                                'Sin precio'
                                            ) : (
                                                <>
                                                    {formatearDinero(p.valorActual)}{' '}
                                                    <span className={signo(p.resultado)}>({pct(p.resultadoPct)})</span>
                                                </>
                                            )}
                                        </span>
                                    </div>
                                    <div className="bar-track">
                                        <div className="bar-fill" style={{ width: `${Math.min(peso, 100)}%` }}></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            {hayPosicionesSinPrecio && (
                <p className="valuacion-aviso">Los activos sin precio no entran en los totales.</p>
            )}
            {error && (
                <p className="valuacion-aviso text-neg">
                    No se pudieron actualizar los precios: {String(error)}
                </p>
            )}
        </div>
    );
}