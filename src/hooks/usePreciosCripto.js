import { useState, useEffect, useCallback, useRef } from 'react';
import { obtenerPreciosCripto } from '../services/api';

const REFRESH_MS = 15 * 60 * 1000;

export function usePreciosCripto(enabled = true) {
    const [preciosCripto, setPreciosCripto] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [ultimaActualizacion, setUltimaActualizacion] = useState(null);
    const reqId = useRef(0);

    const cargar = useCallback(async () => {
        const id = ++reqId.current;
        setLoading(true);
        try {
            const data = await obtenerPreciosCripto();
            if (id !== reqId.current) return;
            setPreciosCripto(data);
            setError(null);
            setUltimaActualizacion(new Date());
        } catch (err) {
            if (id !== reqId.current) return;
            setError(err.message);
        } finally {
            if (id === reqId.current) setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!enabled) return;
        cargar();
        const timer = setInterval(cargar, REFRESH_MS);
        return () => {
            clearInterval(timer);
            reqId.current++;
        };
    }, [cargar, enabled]);

    return { preciosCripto, loading, error, ultimaActualizacion, refetch: cargar };
}