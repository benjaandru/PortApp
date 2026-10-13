import React, { useState } from 'react';
import { useGastosMetrics } from '../hooks/useGastosMetrics.js';
import GastoForm from '../components/GastoForm';
import DistribucionGastos from '../components/gastos/DistribucionGastos.jsx';
import HistorialGastos from '../components/gastos/HistorialGastos.jsx';

export default function Gastos({ data, error, submitting, onGastoCreado }) {
    const { gastos = [] } = data || {};
    const { categoriasOrdenadasGastos } = useGastosMetrics(gastos);
    const [mostrarForm, setMostrarForm] = useState(false);

    const handleCreado = async (gasto) => {
        await onGastoCreado(gasto);
        setMostrarForm(false); // cierra el form solo si se guardó sin errores
    };

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <div>
                    <h1 className="title-lg">Gastos</h1>
                    <p className="subtitle">Distribución e historial</p>
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

            {mostrarForm && (
                <div className="form-page-container">
                    <GastoForm onGastoCreado={handleCreado} submitting={submitting} />
                </div>
            )}

            <DistribucionGastos categoriasOrdenadasGastos={categoriasOrdenadasGastos} />
            <HistorialGastos gastos={gastos} />
        </div>
    );
}