import React, { useState } from 'react';
import { useGastosMetrics } from '../hooks/useGastosMetrics.js';
import { useInversionesMetrics } from '../hooks/useInversionesMetrics.js';
import KpiGrid from '../components/dashboard/KpiGrid.jsx';
import { formatearDinero } from '../utils/formatters.js';

export default function Dashboard({ data, loading, error, onRefresh, onGuardarSaldoMes, onAumentarSaldo, submitting }) {
  const { gastos = [], inversiones = [], inflacion = [], saldosPorMes = [] } = data || {};
  const ahora = new Date();
  const mesActual = ahora.getMonth() + 1;
  const anioActual = ahora.getFullYear();
  const sueldoMensual = Number(saldosPorMes.find((item) => Number(item.Mes) === mesActual && Number(item.Anio) === anioActual)?.Saldo) || 0;
  const [monto, setMonto] = useState('');
  const [aumento, setAumento] = useState('');
  const [mensaje, setMensaje] = useState('');

  const { totalHistorico, totalMesActual } = useGastosMetrics(gastos);
  const {
    totalInvertido,
    totalAjustado,
    perdidaOportunidadTotal,
    metricasInflacion,
  } = useInversionesMetrics(inversiones, inflacion);

  const guardarSueldo = async (event) => {
    event.preventDefault();
    const valor = Number(monto);
    if (!Number.isFinite(valor) || valor <= 0) {
      setMensaje('Ingresá un sueldo mensual mayor a 0.');
      return;
    }
    try {
      await onGuardarSaldoMes(valor, mesActual, anioActual);
      setMensaje('Saldo del mes guardado.');
      setMonto('');
    } catch (err) {
      setMensaje(err.message || 'No se pudo guardar el sueldo.');
    }
  };

  const aumentarSueldo = async (event) => {
    event.preventDefault();
    const valor = Number(aumento);
    if (!Number.isFinite(valor) || valor <= 0) {
      setMensaje('Ingresá cuanto queres aumentar tu saldo mensual.');
      return;
    }
    try {
      await onAumentarSaldo(valor, mesActual, anioActual);
      setMensaje('Saldo del mes actualizado.');
      setAumento('');
    } catch (err) {
      setMensaje(err.message || 'No se pudo actualizar el sueldo.');
    }
  };

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
        sueldoMensual={sueldoMensual}
        saldoDisponible={sueldoMensual - totalMesActual}
        totalMesActual={totalMesActual}
        totalHistorico={totalHistorico}
        totalInvertido={totalInvertido}
        posicionesCount={inversiones.length}
        inflacionAcumuladaPct={metricasInflacion.inflacionAcumuladaPct}
        periodosCount={inflacion.length}
        totalAjustado={totalAjustado}
        perdidaOportunidadTotal={perdidaOportunidadTotal}
      />
      <section className="card-glass salary-card">
        <div className="card-header">
          <div>
            <h2 className="title-md">Saldo de {String(mesActual).padStart(2, '0')}/{anioActual}</h2>
            <p className="subtitle">Saldo del mes: {formatearDinero(sueldoMensual - totalMesActual)}</p>
          </div>
          {sueldoMensual > 0 && <span className="badge-info">Actual: {formatearDinero(sueldoMensual)}</span>}
        </div>
        <form className="salary-form" onSubmit={guardarSueldo}>
          <label className="form-label" htmlFor="sueldo-mensual">Definí o actualiza el sueldo de este mes</label>
          <div className="salary-input-row">
            <input id="sueldo-mensual" type="number" min="0.01" step="0.01" value={monto} onChange={(event) => setMonto(event.target.value)} placeholder="Monto mensual" className="input-field" required />
            <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? 'Guardando...' : 'Guardar sueldo'}</button>
          </div>
  
        </form>
        <form className="aumento-saldo-form" onSubmit={aumentarSueldo}>
          <label className="form-label" htmlFor="aumento-saldo-mensual">Aumentá tu sueldo de este mes</label>
          <div className="salary-input-row">
            <input id="aumento-saldo-mensual" type="number" min="0.01" step="0.01" value={aumento} onChange={(event) => setAumento(event.target.value)} placeholder="Monto del aumento" className="input-field" required />
            <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? 'Actualizando...' : 'Aumentar sueldo'}</button>
          </div>
        </form>
      </section>
      {mensaje && <p className="salary-message" role="status">{mensaje}</p>}
    </div>
  );
}
