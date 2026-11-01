import React, { useState } from 'react';
import { useGastosMetrics } from '../hooks/useGastosMetrics.js';
import GastoForm from '../components/GastoForm';
import DistribucionGastos from '../components/gastos/DistribucionGastos.jsx';
import HistorialGastos from '../components/gastos/HistorialGastos.jsx';

export default function Gastos({ data, error, submitting, onGastoCreado, onEliminarRegistro }) {
    const { gastos = [] } = data || {};
    const [mostrarForm, setMostrarForm] = useState(false);
    const [mesSeleccionado, setMesSeleccionado] = useState(0);
    const [errorEliminacion, setErrorEliminacion] = useState('');
    const ahora = new Date();
    const fechaPeriodo = new Date(ahora.getFullYear(), ahora.getMonth() + mesSeleccionado, 1);
    const mesLabel = new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric' }).format(fechaPeriodo);
    const mesPrefix = `${fechaPeriodo.getFullYear()}-${String(fechaPeriodo.getMonth() + 1).padStart(2, '0')}`;
    const gastosDelMes = (Array.isArray(gastos) ? gastos : []).filter((gasto) => String(gasto.Fecha || '').startsWith(mesPrefix));
    const { categoriasOrdenadasGastos } = useGastosMetrics(gastos, fechaPeriodo);

    const handleCreado = async (gasto) => {
        await onGastoCreado(gasto);
        setMostrarForm(false); // cierra el form solo si se guardó sin errores
    };

    const handleEliminarGasto = async (gasto) => {
        if (!window.confirm(`¿Eliminar el gasto de ${gasto.Descripcion || gasto.Categoria || 'este registro'} por $${gasto.Monto}?`)) return;
        setErrorEliminacion('');
        try {
            await onEliminarRegistro('gasto', gasto._id);
        } catch (err) {
            setErrorEliminacion(err.message || 'No se pudo eliminar el gasto.');
        }
    };

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <div>
                    <h1 className="title-lg">Gastos</h1>
                    <p className="subtitle">Distribución e historial por mes</p>
                </div>
                <button
                    type="button"
                    onClick={() => setMostrarForm((v) => !v)}
                    className="btn-secondary"
                >
                    {mostrarForm ? '✕ Cerrar' : '➕ Nuevo gasto'}
                </button>
            </div>

            {error && (
                <div className="alert-banner alert-error">⚠ {error}</div>
            )}
            {errorEliminacion && <div className="alert-banner alert-error">⚠ {errorEliminacion}</div>}

            <div className="month-selector" role="group" aria-label="Seleccionar mes de gastos">
                <button type="button" className={`btn-secondary ${mesSeleccionado === 0 ? 'active' : ''}`} aria-pressed={mesSeleccionado === 0} onClick={() => setMesSeleccionado(0)}>Mes actual</button>
                <button type="button" className={`btn-secondary ${mesSeleccionado === -1 ? 'active' : ''}`} aria-pressed={mesSeleccionado === -1} onClick={() => setMesSeleccionado(-1)}>Mes pasado</button>
            </div>

            {mostrarForm && (
                <div className="form-page-container">
                    <GastoForm onGastoCreado={handleCreado} submitting={submitting} />
                </div>
            )}

            <DistribucionGastos categoriasOrdenadasGastos={categoriasOrdenadasGastos} mesLabel={mesLabel} />
            <HistorialGastos gastos={gastosDelMes} mesLabel={mesLabel} onEliminar={handleEliminarGasto} submitting={submitting} />
        </div>
    );
}
