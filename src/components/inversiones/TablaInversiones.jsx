import React from 'react';
import { X } from 'lucide-react';
import { formatearDinero } from '../../utils/formatters.js';

/**
 * Componente Presentacional: Renderiza la tabla de posiciones de inversión
 * ajustadas por inflación.
 */
export default function TablaInversiones({ portfolio = [], onEliminar, submitting = false }) {
  return (
    <div className="card-glass mt-6">
      <div className="card-header">
        <h2 className="title-md">Portfolio de Inversiones & Ajuste Inflacionario</h2>
        <span className="badge-info">Cálculo en términos reales</span>
      </div>

      {portfolio.length === 0 ? (
        <p className="empty-text">No hay inversiones registradas en la pestaña "Inversiones".</p>
      ) : (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Ticker</th>
                <th>Fecha</th>
                <th className="text-right">Cantidad</th>
                <th className="text-right">Invertido</th>
                <th className="text-right">Categoría</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {portfolio.map((item, idx) => (
                <tr key={idx}>
                  <td>
                    <span className="ticker-badge">{item.ticker}</span>
                  </td>
                  <td className="text-muted">{item.fecha}</td>
                  <td className="text-right font-mono">{item.cantidad}</td>
                  <td className="text-right font-mono font-bold">
                    {formatearDinero(item.montoInvertido)}
                  </td>
                  <td className="text-right font-mono">
                    <span className="category-tag">{item.categoria}</span>
                  </td>
                  <td className="text-right">
                    <button type="button" className="btn-delete" onClick={() => onEliminar?.(item)} disabled={submitting} title={`Eliminar inversión ${item.ticker}`} aria-label={`Eliminar inversión ${item.ticker}`}>
                      <X size={18} aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
