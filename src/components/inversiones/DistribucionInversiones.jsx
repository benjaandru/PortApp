import React, { useState } from 'react';
import { formatearDinero } from '../../utils/formatters.js';

/**
 * Componente Presentacional: barras de distribución de Inversiones por categoría.
 * Permite ver el monto a valor actual de mercado o el monto invertido original.
 */
export default function DistribucionInversiones({
    categoriasOrdenadasInversiones = [], // por monto invertido (costo)
    categoriasOrdenadasActual = [],      // por valor actual de mercado
    cargandoPrecios = false,
}) {
    const [vista, setVista] = useState('actual');

    const esActual = vista === 'actual';
    const categorias = esActual ? categoriasOrdenadasActual : categoriasOrdenadasInversiones;
    const hayEstimados = esActual && categoriasOrdenadasActual.some((c) => c.estimado);

    return (
        <div className="card-glass mt-6">
            <div className="card-header">
                <h2 className="title-md">Distribución de Inversiones</h2>
                <div className="toggle-vista">
                    <button
                        type="button"
                        className={esActual ? 'activo' : ''}
                        onClick={() => setVista('actual')}
                    >
                        {cargandoPrecios && esActual ? 'Actualizando…' : 'Actual'}
                    </button>
                    <button
                        type="button"
                        className={!esActual ? 'activo' : ''}
                        onClick={() => setVista('invertido')}
                    >
                        Invertido
                    </button>
                </div>
            </div>

            {categorias.length === 0 ? (
                <p className="empty-text">No hay inversiones registradas en la pestaña "Inversiones".</p>
            ) : (
                <div className="category-bars">
                    {categorias.map((cat, idx) => (
                        <div key={idx} className="bar-item">
                            <div className="bar-labels">
                                <span className="bar-name">
                                    {cat.categoria}{cat.estimado ? ' *' : ''}
                                </span>
                                <span className="bar-amount font-mono">
                                    {formatearDinero(cat.total)} ({cat.porcentaje.toFixed(1)}%)
                                </span>
                            </div>
                            <div className="bar-track">
                                <div
                                    className="bar-fill"
                                    style={{ width: `${Math.min(cat.porcentaje, 100)}%` }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {hayEstimados && (
                <p className="valuacion-aviso">* Incluye activos sin precio, valuados al monto invertido.</p>
            )}
        </div>
    );
}