import React, { useState, useEffect } from 'react';
import { useSheets } from './hooks/useSheets';
import Dashboard from './pages/Dashboard';
import Gastos from './pages/Gastos';
import Inversiones from './pages/Inversiones';
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
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'gastos' | 'inversiones'
  const { data, loading, error, submitting, refetch, agregarGasto, agregarInversion } = useSheets();

  return (
    <div className="app-viewport">
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

      <main className="app-main">
        {activeTab === 'dashboard' && (
          <Dashboard data={data} loading={loading} error={error} onRefresh={refetch} />
        )}

        {activeTab === 'gastos' && (
          <Gastos
            data={data}
            error={error}
            submitting={submitting}
            onGastoCreado={agregarGasto}
          />
        )}

        {activeTab === 'inversiones' && (
          <Inversiones
            data={data}
            error={error}
            submitting={submitting}
            onInversionCreada={agregarInversion}
          />
        )}
      </main>

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
          className={`nav-tab ${activeTab === 'gastos' ? 'active' : ''}`}
          onClick={() => setActiveTab('gastos')}
        >
          <span className="nav-icon">💸</span>
          <span className="nav-label">Gastos</span>
        </button>

        <button
          type="button"
          className={`nav-tab ${activeTab === 'inversiones' ? 'active' : ''}`}
          onClick={() => setActiveTab('inversiones')}
        >
          <span className="nav-icon">💹</span>
          <span className="nav-label">Inversiones</span>
        </button>
      </nav>
    </div>
  );
}
