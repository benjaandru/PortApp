import React from 'react';
import { X } from 'lucide-react';
import { formatearDinero } from '../../utils/formatters.js';

/**
 * Componente Presentacional: Renderiza la lista con los últimos movimientos de gastos
 */
export default function HistorialGastos({ gastos = [], mesLabel = '', onEliminar, submitting = false }) {
  const listaGastos = Array.isArray(gastos) ? gastos : [];

  return (
    <div className="card-glass mt-6">
      <div className="card-header">
        <h2 className="title-md">Gastos de {mesLabel}</h2>
        <span className="text-muted text-sm">{listaGastos.length} registros</span>
      </div>

      {listaGastos.length === 0 ? (
        <p className="empty-text">Sin movimientos recientes.</p>
      ) : (
        <div className="recent-list">
          {listaGastos.slice(-5).reverse().map((g, idx) => (
            <div key={g._id || idx} className="recent-item">
              <div className="recent-info">
                <div className="recent-title">{g.Descripcion || g.Categoria || 'Sin detalle'}</div>
                <div className="recent-meta">
                  <span>{g.Fecha}</span> • <span className="category-tag">{g.Categoria}</span> • <span className="category-tag">{g.TipoPago}</span>
                </div>
              </div>
              <div className="recent-amount font-mono text-rose">
                -{formatearDinero(parseFloat(g.Monto))}
              </div>
              <button type="button" className="btn-delete" onClick={() => onEliminar?.(g)} disabled={submitting} title="Eliminar gasto" aria-label={`Eliminar gasto ${g.Descripcion || g.Categoria || ''}`}>
                <X size={18} aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
