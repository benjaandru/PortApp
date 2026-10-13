import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchPrecios } from '../services/api';

const REFRESH_MS = 15 * 60 * 1000; // igual que el caché del script

export function usePrecios(tickers) {
    // Clave estable: evita refetch por cambiar la identidad del array
    const key = [...new Set(
        (tickers || []).map((t) => String(t || '').trim().toUpperCase()).filter(Boolean)
    )].sort().join(',');

    const [precios, setPrecios] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [ultimaActualizacion, setUltimaActualizacion] = useState(null);
    const reqId = useRef(0);

    const cargar = useCallback(async () => {
        if (!key) return;
        const id = ++reqId.current;
        setLoading(true);
        try {
            const data = await fetchPrecios(key.split(','));
            if (id !== reqId.current) return; // llegó una respuesta vieja
            setPrecios(data);
            setError(null);
            setUltimaActualizacion(new Date());
        } catch (err) {
            if (id !== reqId.current) return;
            setError(err.message); // conservamos los últimos precios buenos
        } finally {
            if (id === reqId.current) setLoading(false);
        }
    }, [key]);

    useEffect(() => {
        if (!key) return;
        cargar();
        const timer = setInterval(cargar, REFRESH_MS);
        return () => {
            clearInterval(timer);
            reqId.current++; // invalida pedidos en vuelo al desmontar o cambiar tickers
        };
    }, [cargar, key]);

    return { precios, loading, error, ultimaActualizacion, refetch: cargar };
}