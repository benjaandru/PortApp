import React, { useMemo, useState } from 'react';
import { useInversionesMetrics } from '../hooks/useInversionesMetrics.js';
import { usePrecios } from '../hooks/usePrecios.js';
import { useValuaciones } from '../hooks/useValuaciones.js';
import InversionForm from '../components/InversionForm';
import TablaInversiones from '../components/inversiones/TablaInversiones.jsx';
import DistribucionInversiones from '../components/inversiones/DistribucionInversiones.jsx';
import Valuaciones from '../components/inversiones/Valuaciones.jsx';
import { usePreciosCripto } from '../hooks/usePreciosCripto.js';



export default function Inversiones({ data, error, submitting, onInversionCreada, onRefresh, loading }) {
    const { inversiones = [], inflacion = [] } = data || {};
    const [mostrarForm, setMostrarForm] = useState(false);

    const { portfolio, categoriasOrdenadasInversiones } = useInversionesMetrics(
        inversiones,
        inflacion
    );

    const hayCripto = useMemo(
        () => inversiones.some((i) => i.Categoria === 'Criptomonedas'),
        [inversiones]
    );

    const tickers = useMemo(
        () => [...new Set(
            inversiones
                .filter((i) => i.Categoria !== 'Criptomonedas')
                .map((i) => i.Ticker)
                .filter((t) => t && t !== 'N/A')
        )],
        [inversiones]
    );

    const { precios, loading: cargandoPrecios, error: errorPrecios,
        ultimaActualizacion, refetch: refrescarPrecios } = usePrecios(tickers);

    const { preciosCripto, loading: cargandoCripto, error: errorCripto,
        ultimaActualizacion: ultimaCripto, refetch: refrescarCripto } = usePreciosCripto(hayCripto);

    const { posiciones, totales, hayPosicionesSinPrecio, categoriasOrdenadasActual } =
        useValuaciones(inversiones, precios, preciosCripto);

    const refrescarTodo = () => {
        if (tickers.length) refrescarPrecios();
        if (hayCripto) refrescarCripto();
    };
    const ultima = [ultimaActualizacion, ultimaCripto].filter(Boolean).sort((a, b) => b - a)[0] ?? null;

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
                    onClick={onRefresh}
                    disabled={loading}
                    className="btn-secondary"
                    title="Recargar datos"
                >
                    {loading ? '⟳ Sincronizando...' : '↻ Actualizar'}
                </button>
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
                loading={cargandoPrecios || cargandoCripto}
                error={[errorPrecios, errorCripto].filter(Boolean).join(' · ') || null}
                ultimaActualizacion={ultima}
                hayPosicionesSinPrecio={hayPosicionesSinPrecio}
                onRefresh={refrescarTodo}
            />

        </div>
    );
}