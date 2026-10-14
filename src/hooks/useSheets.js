import { useState, useEffect, useCallback } from 'react';
import { fetchSheetsData, insertarGastoApi, insertarInversionApi } from '../services/api';

export function useSheets() {
  const [data, setData] = useState({
    gastos: [],
    inversiones: [],
    inflacion: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchSheetsData();
      setData({
        gastos: result.gastos || [],
        inversiones: result.inversiones || [],
        inflacion: result.inflacion || []
      });
    } catch (err) {
      setError(err.message || 'Error cargando datos de Google Sheets');
    } finally {
      setLoading(false);
    }
  }, []);
  //d
  useEffect(() => {
    loadData();
  }, [loadData]);

  const agregarGasto = async (gasto) => {
    setSubmitting(true);
    try {
      const response = await insertarGastoApi(gasto);
      await loadData(); // Recargar datos frescos
      return response;
    } catch (err) {
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const agregarInversion = async (inversion) => {
    setSubmitting(true);
    try {
      const response = await insertarInversionApi(inversion);
      await loadData();
      return response;
    } catch (err) {
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  return {
    data,
    loading,
    error,
    submitting,
    refetch: loadData,
    agregarGasto,
    agregarInversion
  };
}
