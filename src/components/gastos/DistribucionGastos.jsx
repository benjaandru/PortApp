import React from 'react';
import { formatearDinero } from '../../utils/formatters.js';

/**
 * Componente Presentacional: Renderiza las barras de distribución de gastos por categoría
 */
export default function DistribucionGastos({ categoriasOrdenadasGastos = [], mesLabel = '' }) {
  return (
    <div className="card-glass mt-6">
      <div className="card-header">
        <h2 className="title-md">Distribución de gastos</h2>
        <span className="badge-neutral">{mesLabel} · Por categoría</span>
      </div>

      {categoriasOrdenadasGastos.length === 0 ? (
        <p className="empty-text">No hay gastos registrados en {mesLabel.toLowerCase()}.</p>
      ) : (
        <div className="category-bars">
          {categoriasOrdenadasGastos.map((cat, idx) => (
            <div key={idx} className="bar-item">
              <div className="bar-labels">
                <span className="bar-name">{cat.categoria}</span>
                <span className="bar-amount font-mono">
                  {formatearDinero(cat.total)}
                </span>
              </div>
              <div className="bar-track payment-bar" role="img" aria-label={`${cat.categoria}: ${cat.porcentajeTarjeta.toFixed(1)}% tarjeta y ${cat.porcentajeOtros.toFixed(1)}% otros medios de pago`}>
                <div
                  className="payment-bar-card"
                  style={{ width: `${cat.porcentajeTarjeta}%` }}
                ></div>
                <div className="payment-bar-other" style={{ width: `${cat.porcentajeOtros}%` }}></div>
              </div>
              <div className="payment-bar-labels">
                <span className="payment-card-label">Tarjeta {cat.porcentajeTarjeta.toFixed(1)}%</span>
                <span>Otros {cat.porcentajeOtros.toFixed(1)}%</span>
              </div>
            </div>
          ))}
        </div>
      )}
      {categoriasOrdenadasGastos.length > 0 && (
        <div className="payment-legend" aria-hidden="true">
          <span><i className="payment-dot payment-card-dot"></i>Tarjeta</span>
          <span><i className="payment-dot payment-other-dot"></i>Otros medios de pago</span>
        </div>
      )}
    </div>
  );
}
