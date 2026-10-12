import React from 'react';
import { formatearDinero } from '../../utils/formatters.js';

/**
 * Componente Presentacional: Renderiza las barras de distribución de gastos por categoría
 */
export default function DistribucionGastos({ categoriasOrdenadas = [] }) {
  return (
    <div className="card-glass mt-6">
      <div className="card-header">
        <h2 className="title-md">Distribución de Gastos</h2>
        <span className="badge-neutral">Por Categoría</span>
      </div>

      {categoriasOrdenadas.length === 0 ? (
        <p className="empty-text">No hay gastos registrados en la pestaña "Gastos".</p>
      ) : (
        <div className="category-bars">
          {categoriasOrdenadas.map((cat, idx) => (
            <div key={idx} className="bar-item">
              <div className="bar-labels">
                <span className="bar-name">{cat.categoria}</span>
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
    </div>
  );
}
