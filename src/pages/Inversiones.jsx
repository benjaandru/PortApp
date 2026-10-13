import React, { useMemo, useState } from 'react';
import { useInversionesMetrics } from '../hooks/useInversionesMetrics.js';
import { usePrecios } from '../hooks/usePrecios.js';
import { useValuaciones } from '../hooks/useValuaciones.js';
import InversionForm from '../components/InversionForm';
import TablaInversiones from '../components/inversiones/TablaInversiones.jsx';
import DistribucionInversiones from '../components/inversiones/DistribucionInversiones.jsx';
import Valuaciones from '../components/inversiones/Valuaciones.jsx';

export default function Inversiones({ data, error, submitting, onInversionCreada }) {
    const { inversiones = [], inflacion = [] } = data || {};
    const [mostrarForm, setMostrarForm] = useState(false);

    const { portfolio, categoriasOrdenadasInversiones } = useInversionesMetrics(
        inversiones,
        inflacion
    );

    const tickers = useMemo(() => inversiones.map((i) => i.Ticker), [inversiones]);
    const {
        precios,
        loading: cargandoPrecios,
        error: errorPrecios,
        ultimaActualizacion,
        refetch: refrescarPrecios,
    } = usePrecios(tickers);
    const { posiciones, totales, hayPosicionesSinPrecio, categoriasOrdenadasActual } =
        useValuaciones(inversiones, precios);

    const handleCreada = async (inversion) => {
        await onInversionCreada(inversion);
        setMostrarForm(false);
    };

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <div>
                    <h1 className="title-lg">Inversiones</h1>
                    <p className="subtitle">Portfolio, distribución y valuación</p>
                </div>
                <button
                    type="button"
                    onClick={() => setMostrarForm((v) => !v)}
                    className="btn-secondary"
                >
                    {mostrarForm ? '✕ Cerrar' : '➕ Nueva inversión'}
                </button>
            </div>

            {error && (
                <div className="alert-banner alert-error">⚠ {error}</div>
            )}

            {mostrarForm && (
                <div className="form-page-container">
                    <InversionForm onInversionCreada={handleCreada} submitting={submitting} />
                </div>
            )}

            <DistribucionInversiones
                categoriasOrdenadasInversiones={categoriasOrdenadasInversiones}
                categoriasOrdenadasActual={categoriasOrdenadasActual}
                cargandoPrecios={cargandoPrecios}
            />

            <TablaInversiones portfolio={portfolio} />

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