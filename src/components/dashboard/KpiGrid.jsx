import React from 'react';
import { formatearDinero, formatearPct } from '../../utils/formatters.js';

/**
 * Componente Presentacional: Renderiza la cuadrícula de métricas clave (KPIs)
 */
export default function KpiGrid({
  totalMesActual = 0,
  totalHistorico = 0,
  totalInvertido = 0,
  posicionesCount = 0,
  inflacionAcumuladaPct = 0,
  periodosCount = 0,
  totalAjustado = 0,
  perdidaOportunidadTotal = 0,
}) {
  return (
    <div className="kpi-grid">
      <div className="kpi-card">
        <span className="kpi-label">Gastos Este Mes</span>
        <span className="kpi-value text-rose">
          {formatearDinero(totalMesActual)}
        </span>
        <span className="kpi-hint">
          Histórico: {formatearDinero(totalHistorico)}
        </span>
      </div>

      <div className="kpi-card">
        <span className="kpi-label">Capital Total Invertido</span>
        <span className="kpi-value text-emerald">
          {formatearDinero(totalInvertido)}
        </span>
        <span className="kpi-hint">{posicionesCount} posiciones activas</span>
      </div>

      <div className="kpi-card">
        <span className="kpi-label">Inflación Acumulada</span>
        <span className="kpi-value text-amber">
          {formatearPct(inflacionAcumuladaPct)}
        </span>
        <span className="kpi-hint">{periodosCount} períodos registrados</span>
      </div>

      <div className="kpi-card">
        <span className="kpi-label">Capital Necesario s/ Inflación</span>
        <span className="kpi-value text-cyan">
          {formatearDinero(totalAjustado)}
        </span>
        <span className="kpi-hint">
          Ajuste inflacionario: +{formatearDinero(perdidaOportunidadTotal)}
        </span>
      </div>
    </div>
  );
}
