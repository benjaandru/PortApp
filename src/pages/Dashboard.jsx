import React from 'react';
import { useGastosMetrics } from '../hooks/useGastosMetrics.js';
import { useInversionesMetrics } from '../hooks/useInversionesMetrics.js';
import KpiGrid from '../components/dashboard/KpiGrid.jsx';
import AccessDenied from '../components/AccessDenied';

export default function Dashboard({ data, loading, error, onRefresh }) {
  const { gastos = [], inversiones = [], inflacion = [] } = data || {};

  const { totalHistorico, totalMesActual } = useGastosMetrics(gastos);
  const {
    totalInvertido,
    totalAjustado,
    perdidaOportunidadTotal,
    metricasInflacion,
  } = useInversionesMetrics(inversiones, inflacion);

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1 className="title-lg">Dashboard Financiero</h1>
          <p className="subtitle">Métricas en tiempo real desde Google Sheets</p>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="btn-secondary"
          title="Recargar datos"
        >
          {loading ? '⟳ Sincronizando...' : '↻ Actualizar'}
        </button>
      </div>

      {error && (
        <div className="alert-banner alert-error">
          ⚠ Error al sincronizar con Sheets: {error}
        </div>
      )}

      <KpiGrid
        totalMesActual={totalMesActual}
        totalHistorico={totalHistorico}
        totalInvertido={totalInvertido}
        posicionesCount={inversiones.length}
        inflacionAcumuladaPct={metricasInflacion.inflacionAcumuladaPct}
        periodosCount={inflacion.length}
        totalAjustado={totalAjustado}
        perdidaOportunidadTotal={perdidaOportunidadTotal}
      />
    </div>
  );
}