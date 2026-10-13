import React, { useState } from 'react';

export default function AccessDenied({ onSubmit, error, checking }) {
    const [url, setUrl] = useState('');
    const [token, setToken] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (url.trim() && token.trim()) onSubmit({ url: url.trim(), token: token.trim() });
    };

    return (
        <div className="app-viewport access-denied">
            <form className="access-card" onSubmit={handleSubmit}>
                <div className="access-icon">🔒</div>
                <h1>Conectar con tu Sheet</h1>
                <p>Ingresá la URL de tu script y tu contraseña.</p>

                <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    autoCapitalize="none"
                    autoCorrect="off"
                />
                <input
                    type="password"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Contraseña"
                    autoComplete="current-password"
                />

                {error && <p className="access-error">{error}</p>}

                <button type="submit" disabled={checking || !url.trim() || !token.trim()}>
                    {checking ? 'Verificando...' : 'Entrar'}
                </button>
            </form>
        </div>
    );
}