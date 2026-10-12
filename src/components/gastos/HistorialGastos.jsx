import React from 'react';
import { formatearDinero } from '../../utils/formatters.js';

/**
 * Componente Presentacional: Renderiza la lista con los últimos movimientos de gastos
 */
export default function HistorialGastos({ gastos = [] }) {
  const listaGastos = Array.isArray(gastos) ? gastos : [];

  return (
    <div className="card-glass mt-6">
      <div className="card-header">
        <h2 className="title-md">Últimos Gastos Registrados</h2>
        <span className="text-muted text-sm">{listaGastos.length} registros</span>
      </div>

      {listaGastos.length === 0 ? (
        <p className="empty-text">Sin movimientos recientes.</p>
      ) : (
        <div className="recent-list">
          {listaGastos.slice(-5).reverse().map((g, idx) => (
            <div key={g._id || idx} className="recent-item">
              <div className="recent-icon">💳</div>
              <div className="recent-info">
                <div className="recent-title">{g.Descripcion || g.Categoria || 'Sin detalle'}</div>
                <div className="recent-meta">
                  <span>{g.Fecha}</span> • <span className="category-tag">{g.Categoria}</span>
                </div>
              </div>
              <div className="recent-amount font-mono text-rose">
                -{formatearDinero(parseFloat(g.Monto))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
