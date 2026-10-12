import React, { useState } from 'react';

const CATEGORIAS_PREDEFINIDAS = [
  { id: 'Alimentación', icon: '🍔', label: 'Comida' },
  { id: 'Transporte', icon: '🚗', label: 'Transporte' },
  { id: 'Servicios', icon: '💡', label: 'Servicios' },
  { id: 'Vivienda', icon: '🏠', label: 'Vivienda' },
  { id: 'Ocio', icon: '🍿', label: 'Ocio' },
  { id: 'Salud', icon: '💊', label: 'Salud' },
  { id: 'Educación', icon: '📚', label: 'Educación' },
  { id: 'Otros', icon: '📦', label: 'Otros' },
];

export default function GastoForm({ onGastoCreado, submitting }) {
  const getTodayString = () => new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    fecha: getTodayString(),
    monto: '',
    categoria: 'Alimentación',
    descripcion: '',
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
    if (!formData.monto || parseFloat(formData.monto) <= 0) {
      setMensaje({ tipo: 'error', texto: 'Por favor ingresa un monto válido mayor a 0.' });
      return;
    }

    try {
      await onGastoCreado({
        fecha: formData.fecha,
        monto: parseFloat(formData.monto),
        categoria: formData.categoria,
        descripcion: formData.descripcion.trim(),
      });

      setMensaje({ tipo: 'success', texto: '¡Gasto registrado en Google Sheets con éxito!' });

      // Reiniciar formulario manteniendo la fecha actual
      setFormData({
        fecha: getTodayString(),
        monto: '',
        categoria: 'Alimentación',
        descripcion: '',
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
        <h2 className="title-md">Registrar Gasto</h2>
        <span className="badge-pulse">Google Sheets Sync</span>
      </div>

      {mensaje.texto && (
        <div className={`alert-banner ${mensaje.tipo === 'success' ? 'alert-success' : 'alert-error'}`}>
          {mensaje.tipo === 'success' ? '✓ ' : '⚠ '}
          {mensaje.texto}
        </div>
      )}

      <form onSubmit={handleSubmit} className="form-stack">
        {/* Campo Monto */}
        <div className="form-group">
          <label htmlFor="monto" className="form-label">
            Monto ($)
          </label>
          <div className="input-currency-wrapper">
            <span className="currency-symbol">$</span>
            <input
              id="monto"
              name="monto"
              type="number"
              step="0.01"
              placeholder="0.00"
              required
              value={formData.monto}
              onChange={handleChange}
              className="input-currency"
              autoFocus
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

        {/* Fila: Fecha y Descripción */}
        <div className="grid-2-col">
          <div className="form-group">
            <label htmlFor="fecha" className="form-label">
              Fecha
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

          <div className="form-group">
            <label htmlFor="descripcion" className="form-label">
              Nota / Descripción
            </label>
            <input
              id="descripcion"
              name="descripcion"
              type="text"
              placeholder="Ej: Supermercado, Alquiler..."
              value={formData.descripcion}
              onChange={handleChange}
              className="input-field"
            />
          </div>
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
            'Guardar Gasto'
          )}
        </button>
      </form>
    </div>
  );
}
