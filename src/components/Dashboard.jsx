import React, { useMemo } from 'react';
import {
  calcularInflacionCompuesta,
  ajustarCapitalPorInflacion,
  calcularCostoInflacionario,
} from '../core/domain/inflation';

export default function Dashboard({ data, loading, error, onRefresh }) {
  const { gastos = [], inversiones = [], inflacion = [] } = data;

  // 1. Cálculos de Gastos
  const metricasGastos = useMemo(() => {
    const currentMonthPrefix = new Date().toISOString().slice(0, 7); // "YYYY-MM"
    
    let totalHistorico = 0;
    let totalMesActual = 0;
    const porCategoria = {};

    gastos.forEach((g) => {
      const monto = parseFloat(g.Monto) || 0;
      totalHistorico += monto;

      const fechaStr = String(g.Fecha || '');
      if (fechaStr.startsWith(currentMonthPrefix)) {
        totalMesActual += monto;
      }

      const cat = g.Categoria || 'Varios';
      porCategoria[cat] = (porCategoria[cat] || 0) + monto;
    });

    const categoriasOrdenadas = Object.entries(porCategoria)
      .map(([categoria, total]) => ({
        categoria,
        total,
        porcentaje: totalHistorico > 0 ? (total / totalHistorico) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);

    return {
      totalHistorico,
      totalMesActual,
      categoriasOrdenadas,
    };
  }, [gastos]);

  // 2. Cálculos de Inflación Acumulada delegados a la Capa de Dominio (Hexagonal Core)
  const metricasInflacion = useMemo(() => {
    const tasas = inflacion.map((inf) => inf.Porcentaje);
    const { factorCompuesto, inflacionAcumuladaPct } = calcularInflacionCompuesta(tasas);

    return {
      tasaCompuesta: factorCompuesto,
      inflacionAcumuladaPct,
      registros: inflacion,
    };
  }, [inflacion]);

  // 3. Cálculos de Portfolio de Inversiones ajustadas por Inflación (Dominio)
  const metricasInversiones = useMemo(() => {
    let totalInvertido = 0;

    const portfolio = inversiones.map((inv) => {
      const monto = parseFloat(inv.Monto_Invertido) || 0;
      const cant = parseFloat(inv.Cantidad) || 1;
      totalInvertido += monto;

      // Delegado a funciones puras del dominio
      const capitalAjustadoInflacion = ajustarCapitalPorInflacion(monto, metricasInflacion.tasaCompuesta);
      const perdidaPoderAdquisitivo = calcularCostoInflacionario(monto, metricasInflacion.tasaCompuesta);

      return {
        ticker: inv.Ticker || 'N/A',
        fecha: inv.Fecha || '-',
        cantidad: cant,
        montoInvertido: monto,
        precioPromedio: cant > 0 ? monto / cant : 0,
        capitalAjustadoInflacion,
        costoInflacionario: perdidaPoderAdquisitivo,
      };
    });

    const totalAjustado = ajustarCapitalPorInflacion(totalInvertido, metricasInflacion.tasaCompuesta);

    return {
      totalInvertido,
      totalAjustado,
      perdidaOportunidadTotal: totalAjustado - totalInvertido,
      portfolio,
    };
  }, [inversiones, metricasInflacion]);

  const formatearDinero = (val) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
    }).format(val || 0);
  };

  const formatearPct = (val) => {
    return `${(val || 0).toFixed(2)}%`;
  };

  return (
    <div className="dashboard-container">
      {/* Barra de Acciones y Estado */}
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

      {/* Grid de KPIs principales */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <span className="kpi-label">Gastos Este Mes</span>
          <span className="kpi-value text-rose">
            {formatearDinero(metricasGastos.totalMesActual)}
          </span>
          <span className="kpi-hint">
            Histórico: {formatearDinero(metricasGastos.totalHistorico)}
          </span>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">Capital Total Invertido</span>
          <span className="kpi-value text-emerald">
            {formatearDinero(metricasInversiones.totalInvertido)}
          </span>
          <span className="kpi-hint">{inversiones.length} posiciones activas</span>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">Inflación Acumulada</span>
          <span className="kpi-value text-amber">
            {formatearPct(metricasInflacion.inflacionAcumuladaPct)}
          </span>
          <span className="kpi-hint">{inflacion.length} períodos registrados</span>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">Capital Necesario s/ Inflación</span>
          <span className="kpi-value text-cyan">
            {formatearDinero(metricasInversiones.totalAjustado)}
          </span>
          <span className="kpi-hint">
            Ajuste inflacionario: +{formatearDinero(metricasInversiones.perdidaOportunidadTotal)}
          </span>
        </div>
      </div>

      {/* Sección 1: Portfolio de Inversiones con Ajuste por Inflación */}
      <div className="card-glass mt-6">
        <div className="card-header">
          <h2 className="title-md">Portfolio de Inversiones & Ajuste Inflacionario</h2>
          <span className="badge-info">Cálculo en términos reales</span>
        </div>

        {metricasInversiones.portfolio.length === 0 ? (
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
                  <th className="text-right">Precio Prom.</th>
                  <th className="text-right">Ajustado s/ Inflación</th>
                  <th className="text-right">Benchmark Inflación</th>
                </tr>
              </thead>
              <tbody>
                {metricasInversiones.portfolio.map((item, idx) => (
                  <tr key={idx}>
                    <td>
                      <span className="ticker-badge">{item.ticker}</span>
                    </td>
                    <td className="text-muted">{item.fecha}</td>
                    <td className="text-right font-mono">{item.cantidad}</td>
                    <td className="text-right font-mono font-bold">
                      {formatearDinero(item.montoInvertido)}
                    </td>
                    <td className="text-right font-mono text-muted">
                      {formatearDinero(item.precioPromedio)}
                    </td>
                    <td className="text-right font-mono text-cyan font-bold">
                      {formatearDinero(item.capitalAjustadoInflacion)}
                    </td>
                    <td className="text-right font-mono text-amber">
                      +{formatearDinero(item.costoInflacionario)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sección 2: Desglose de Gastos por Categoría */}
      <div className="card-glass mt-6">
        <div className="card-header">
          <h2 className="title-md">Distribución de Gastos</h2>
          <span className="badge-neutral">Por Categoría</span>
        </div>

        {metricasGastos.categoriasOrdenadas.length === 0 ? (
          <p className="empty-text">No hay gastos registrados en la pestaña "Gastos".</p>
        ) : (
          <div className="category-bars">
            {metricasGastos.categoriasOrdenadas.map((cat, idx) => (
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

      {/* Sección 3: Historial Reciente de Gastos */}
      <div className="card-glass mt-6">
        <div className="card-header">
          <h2 className="title-md">Últimos Gastos Registrados</h2>
          <span className="text-muted text-sm">{gastos.length} registros</span>
        </div>

        {gastos.length === 0 ? (
          <p className="empty-text">Sin movimientos recientes.</p>
        ) : (
          <div className="recent-list">
            {gastos.slice(-5).reverse().map((g, idx) => (
              <div key={idx} className="recent-item">
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
    </div>
  );
}
