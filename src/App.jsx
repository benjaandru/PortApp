import React, { useState, useEffect } from 'react';
import { useSheets } from './hooks/useSheets';
import Dashboard from './pages/Dashboard';
import GastoForm from './components/GastoForm';
import InversionForm from './components/InversionForm';
import AccessDenied from './components/AccessDenied';
import { getConexion, setConexion, clearConexion, validarConexion, urlValida } from './services/api';


export default function App() {
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(!!getConexion());
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    const saved = getConexion();
    if (!saved) return;
    validarConexion(saved)
      .then(setAuthed)
      .catch(() => setAuthError('No se pudo conectar. Revisá tu conexión.'))
      .finally(() => setChecking(false));
  }, []);

  // Si cualquier llamada devuelve UNAUTHORIZED, volvemos al login
  useEffect(() => {
    const onUnauthorized = () => {
      setAuthed(false);
      setAuthError('Tu sesión expiró o el token ya no es válido.');
    };
    window.addEventListener('auth:unauthorized', onUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', onUnauthorized);
  }, []);

  const handleLogin = async (conexion) => {
    if (!urlValida(conexion.url)) {
      setAuthError('La URL no parece un despliegue de Apps Script (debe terminar en /exec).');
      return;
    }
    setChecking(true);
    setAuthError('');
    try {
      if (await validarConexion(conexion)) {
        setConexion(conexion);
        setAuthed(true);
      } else {
        setAuthError('Contraseña incorrecta.');
      }
    } catch {
      setAuthError('No se pudo conectar. Revisá la URL y tu conexión.');
    } finally {
      setChecking(false);
    }
  };

  const handleLogout = () => {
    clearConexion();
    setAuthed(false);
  };


  if (!authed) {
    return <AccessDenied onSubmit={handleLogin} error={authError} checking={checking} />;
  }

  return <AppContent onLogout={handleLogout} />;
}

function AppContent({ onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'nuevo-gasto' | 'nueva-inversion'
  const { data, loading, error, submitting, refetch, agregarGasto, agregarInversion } = useSheets();

  const handleGastoCreado = async (gasto) => {
    await agregarGasto(gasto);
  };

  const handleInversionCreado = async (inversion) => {
    await agregarInversion(inversion);
  };

  return (
    <div className="app-viewport">
      {/* Barra Superior con Safe Area para Notch / Dynamic Island */}
      <header className="app-header">
        <div className="header-content">
          <div className="brand">
            <span className="brand-icon">📈</span>
            <span className="brand-name">Finanzas PWA</span>
          </div>
          <div className="header-status">
            {loading ? (
              <span className="status-pill status-loading">Sincronizando...</span>
            ) : (
              <span className="status-pill status-online">Sheets Online</span>
            )}
          </div>
        </div>
      </header>

      {/* Contenido Principal con Scroll fluido */}
      <main className="app-main">
        {activeTab === 'dashboard' && (
          <Dashboard
            data={data}
            loading={loading}
            error={error}
            onRefresh={refetch}
          />
        )}

        {activeTab === 'nuevo-gasto' && (
          <div className="form-page-container">
            <GastoForm
              onGastoCreado={handleGastoCreado}
              submitting={submitting}
            />
          </div>
        )}
        {activeTab === 'nueva-inversion' && (
          <div className="form-page-container">
            <InversionForm
              onInversionCreada={handleInversionCreado}
              submitting={submitting}
            />
          </div>
        )}
      </main>

      {/* Barra de Navegación Inferior Estilo Nativo iOS con Safe Area Inset */}
      <nav className="ios-bottom-nav">
        <button
          type="button"
          className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <span className="nav-icon">📊</span>
          <span className="nav-label">Dashboard</span>
        </button>

        <button
          type="button"
          className={`nav-tab ${activeTab === 'nuevo-gasto' ? 'active' : ''}`}
          onClick={() => setActiveTab('nuevo-gasto')}
        >
          <span className="nav-icon">➕</span>
          <span className="nav-label">Nuevo Gasto</span>
        </button>
        <button
          type="button"
          className={`nav-tab ${activeTab === 'nueva-inversion' ? 'active' : ''}`}
          onClick={() => setActiveTab('nueva-inversion')}
        >
          <span className="nav-icon">➕</span>
          <span className="nav-label">Nueva Inversion</span>
        </button>
      </nav>
    </div>
  );
}
