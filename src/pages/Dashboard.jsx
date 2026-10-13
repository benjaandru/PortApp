import React, { useMemo } from 'react'
import { useGastosMetrics } from '../hooks/useGastosMetrics.js';
import { useInversionesMetrics } from '../hooks/useInversionesMetrics.js';
import { usePrecios } from '../hooks/usePrecios.js';
import { useValuaciones } from '../hooks/useValuaciones.js';
import KpiGrid from '../components/dashboard/KpiGrid.jsx';
import TablaInversiones from '../components/inversiones/TablaInversiones.jsx';
import DistribucionGastos from '../components/gastos/DistribucionGastos.jsx';
import DistribucionInversiones from '../components/inversiones/DistribucionInversiones.jsx'
import HistorialGastos from '../components/gastos/HistorialGastos.jsx';
import Valuaciones from '../components/inversiones/Valuaciones.jsx';

/**
 * Componente Contenedor (Container Component / Smart Component)
 * 
 * Responsabilidades:
 * - Orquestar datos recibidos por props.
 * - Invocar los Custom Hooks de la capa de aplicación.
 * - Gestionar el estado de sincronización / errores en el encabezado.
 * - Distribuir los datos procesados a los componentes presentacionales puros.
 */
export default function Dashboard({ data, loading, error, onRefresh }) {
  const { gastos = [], inversiones = [], inflacion = [] } = data || {};

  // Custom Hooks (Capa de Aplicación)
  const { totalHistorico, totalMesActual, categoriasOrdenadasGastos } = useGastosMetrics(gastos);
  const {
    totalInvertido,
    totalAjustado,
    perdidaOportunidadTotal,
    portfolio,
    metricasInflacion,
    categoriasOrdenadasInversiones,
    metricasPortfolio,
  } = useInversionesMetrics(inversiones, inflacion);

  // Valuación a precio de mercado
  const tickers = useMemo(() => inversiones.map((i) => i.Ticker), [inversiones]);
  const {
    precios,
    loading: cargandoPrecios,
    error: errorPrecios,
    ultimaActualizacion,
    refetch: refrescarPrecios,
  } = usePrecios(tickers);
  const { posiciones, totales, hayPosicionesSinPrecio, categoriasOrdenadasActual } = useValuaciones(inversiones, precios);

  return (
    <div className="dashboard-container">
      {/* Encabezado y Acciones de Sincronización */}
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

      {/* 1. Tarjetas Superiores de Métricas Clave */}
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

      {/* 2. Portfolio de Inversiones con Ajuste Inflacionario Real */}
      <TablaInversiones portfolio={portfolio} />

      {/* 3. Distribución de Gastos por Categoría */}
      <DistribucionGastos categoriasOrdenadasGastos={categoriasOrdenadasGastos} />

      <DistribucionInversiones
        categoriasOrdenadasInversiones={categoriasOrdenadasInversiones}
        categoriasOrdenadasActual={categoriasOrdenadasActual}
        cargandoPrecios={cargandoPrecios}
      />

      {/* 4. Historial Reciente de Gastos */}
      <HistorialGastos gastos={gastos} />

      <Valuaciones
        posiciones={posiciones}
        totales={totales}
        loading={cargandoPrecios}
        error={errorPrecios}
        ultimaActualizacion={ultimaActualizacion}
        hayPosicionesSinPrecio={hayPosicionesSinPrecio}
        onRefresh={refrescarPrecios}
      />
    </div>
  );
}
