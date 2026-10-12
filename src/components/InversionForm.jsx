import React, { useState } from 'react';

// Se agregaron los iconos para que renderice correctamente el diseño de los "pills"
const CATEGORIAS_PREDEFINIDAS = [
    { id: 'SYP', icon: '📈', label: 'S&P 500' },
    { id: 'Criptomonedas', icon: '₿', label: 'Criptomonedas' },
    { id: 'Renta_fija', icon: '🏦', label: 'Renta Fija' },
    { id: 'Fondo_de_emergencia', icon: '🛡️', label: 'Emergencia' }
];

export default function InversionForm({ onInversionCreada, submitting }) {
    const getTodayString = () => new Date().toISOString().split('T')[0];

    // Adaptación del estado a los campos de la tabla Inversiones
    const [formData, setFormData] = useState({
        fecha: getTodayString(),
        nombre: '',
        ticker: '',
        categoria: 'SYP',
        cantidad: '',
        monto_invertido: '',
    });

    const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleCategoriaSelect = (cat) => {
        setFormData((prev) => ({
            ...prev,
            categoria: cat,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMensaje({ tipo: '', texto: '' });

        // Validaciones básicas
        if (!formData.monto_invertido || parseFloat(formData.monto_invertido) <= 0) {
            setMensaje({ tipo: 'error', texto: 'Por favor ingresa un monto válido mayor a 0.' });
            return;
        }
        if (!formData.nombre.trim()) {
            setMensaje({ tipo: 'error', texto: 'El nombre de la inversión es obligatorio.' });
            return;
        }

        try {
            // Envío de la data con el formato exacto que requerirá tu backend
            await onInversionCreada({
                fecha: formData.fecha,
                nombre: formData.nombre.trim(),
                ticker: formData.ticker.trim() || 'N/A', // Si lo deja vacío, envía N/A
                categoria: formData.categoria,
                cantidad: formData.cantidad ? parseFloat(formData.cantidad) : 1, // Por defecto 1 unidad
                monto_invertido: parseFloat(formData.monto_invertido),
            });

            setMensaje({ tipo: 'success', texto: '¡Inversión registrada en Google Sheets con éxito!' });

            // Reiniciar formulario manteniendo la fecha actual
            setFormData({
                fecha: getTodayString(),
                nombre: '',
                ticker: '',
                categoria: 'SYP',
                cantidad: '',
                monto_invertido: '',
            });

            // Limpiar mensaje después de 3.5 segundos
            setTimeout(() => {
                setMensaje({ tipo: '', texto: '' });
            }, 3500);
        } catch (err) {
            setMensaje({
                tipo: 'error',
                texto: err.message || 'Error al conectar con Google Sheets.',
            });
        }
    };

    return (
        <div className="card-glass">
            <div className="card-header">
                <h2 className="title-md">Registrar Inversión</h2>
                <span className="badge-pulse">Google Sheets Sync</span>
            </div>

            {mensaje.texto && (
                <div className={`alert-banner ${mensaje.tipo === 'success' ? 'alert-success' : 'alert-error'}`}>
                    {mensaje.tipo === 'success' ? '✓ ' : '⚠ '}
                    {mensaje.texto}
                </div>
            )}

            <form onSubmit={handleSubmit} className="form-stack">

                {/* Fila 1: Nombre y Ticker */}
                <div className="grid-2-col">
                    <div className="form-group">
                        <label htmlFor="nombre" className="form-label">
                            Nombre de la Inversión
                        </label>
                        <input
                            id="nombre"
                            name="nombre"
                            type="text"
                            placeholder="Ej: Apple, S&P 500..."
                            required
                            value={formData.nombre}
                            onChange={handleChange}
                            className="input-field"
                            autoFocus
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="ticker" className="form-label">
                            Ticker (Opcional)
                        </label>
                        <input
                            id="ticker"
                            name="ticker"
                            type="text"
                            placeholder="Ej: AAPL, SPY..."
                            value={formData.ticker}
                            onChange={handleChange}
                            className="input-field"
                        />
                    </div>
                </div>

                {/* Fila 2: Monto Invertido y Cantidad */}
                <div className="grid-2-col">
                    <div className="form-group">
                        <label htmlFor="monto_invertido" className="form-label">
                            Monto Invertido ($)
                        </label>
                        <div className="input-currency-wrapper">
                            <span className="currency-symbol">$</span>
                            <input
                                id="monto_invertido"
                                name="monto_invertido"
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                required
                                value={formData.monto_invertido}
                                onChange={handleChange}
                                className="input-currency"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="cantidad" className="form-label">
                            Cantidad (Nominales)
                        </label>
                        <input
                            id="cantidad"
                            name="cantidad"
                            type="number"
                            step="0.0001"
                            placeholder="Ej: 10, 0.5..."
                            value={formData.cantidad}
                            onChange={handleChange}
                            className="input-field"
                        />
                    </div>
                </div>

                {/* Selector de Categorías (Pills móviles táctiles) */}
                <div className="form-group">
                    <label className="form-label">Categoría</label>
                    <div className="category-grid">
                        {CATEGORIAS_PREDEFINIDAS.map((cat) => {
                            const isSelected = formData.categoria === cat.id;
                            return (
                                <button
                                    type="button"
                                    key={cat.id}
                                    onClick={() => handleCategoriaSelect(cat.id)}
                                    className={`category-pill ${isSelected ? 'active' : ''}`}
                                >
                                    <span className="pill-icon">{cat.icon}</span>
                                    <span className="pill-label">{cat.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Fila 3: Fecha */}
                <div className="form-group">
                    <label htmlFor="fecha" className="form-label">
                        Fecha de Operación
                    </label>
                    <input
                        id="fecha"
                        name="fecha"
                        type="date"
                        required
                        value={formData.fecha}
                        onChange={handleChange}
                        className="input-field"
                    />
                </div>

                {/* Botón de Enviar */}
                <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary"
                >
                    {submitting ? (
                        <span className="loader-inline">
                            <span className="spinner"></span> Guardando en Sheets...
                        </span>
                    ) : (
                        'Guardar Inversión'
                    )}
                </button>
            </form>
        </div>
    );
}