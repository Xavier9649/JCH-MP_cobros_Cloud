import React, { useState, useEffect } from 'react';
import API_URL from './config';

/* ── Inline SVG Icons ─────────────────────────────────────────── */
const IconMusic = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
    <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
  </svg>
);

const IconUpload = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const IconLogout = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const IconCheck = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconClock = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const IconAlertCircle = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const IconXCircle = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
);

const IconLock = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const IconBell = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

/* ── Status Badge ─────────────────────────────────────────────── */
const StatusBadge = ({ estado }) => {
  const variants = {
    pendiente: 'bg-amber-50 text-amber-700 border-amber-200',
    aprobado:  'bg-emerald-50 text-emerald-700 border-emerald-200',
    rechazado: 'bg-red-50 text-red-700 border-red-200',
  };
  const labels = { pendiente: 'En revisión', aprobado: 'Aprobado', rechazado: 'Rechazado' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${variants[estado] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
      {labels[estado] || estado}
    </span>
  );
};

/* ── Main Component ───────────────────────────────────────────── */
export default function FormularioPago() {
  // ── Estado del Profesor e Inicio de Sesión ─────────────────────
  const [profesor, setProfesor] = useState(() => {
    const saved = localStorage.getItem('profesorSesion');
    const lastActive = localStorage.getItem('profesorLastActive');
    const INACTIVITY_TIMEOUT = 15 * 60 * 1000;
    if (saved && lastActive && Date.now() - parseInt(lastActive) > INACTIVITY_TIMEOUT) {
      localStorage.removeItem('profesorSesion');
      localStorage.removeItem('profesorLastActive');
      return null;
    }
    return saved ? JSON.parse(saved) : null;
  });
  const [cedulaInput, setCedulaInput] = useState('');
  const [loginError, setLoginError] = useState('');

  // ── Estado del Dashboard del Profesor ─────────────────────────
  const [mesActivo, setMesActivo] = useState(null);
  const [pagoActual, setPagoActual] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [cargando, setCargando] = useState(false);

  // ── Estado de Carga de Comprobante ────────────────────────────
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [mensajeEnvio, setMensajeEnvio] = useState('');
  const [subiendo, setSubiendo] = useState(false);
  const [reintentando, setReintentando] = useState(false);
  const [notificacion, setNotificacion] = useState(null);

  const mostrarNotificacion = React.useCallback((text, type = 'success') => {
    setNotificacion({ text, type });
  }, []);

  useEffect(() => {
    if (!notificacion) return;
    const timer = setTimeout(() => setNotificacion(null), 4000);
    return () => clearTimeout(timer);
  }, [notificacion]);

  useEffect(() => { setReintentando(false); }, [pagoActual]);

  const cargarDatosProfesor = React.useCallback(() => {
    if (!profesor) return;
    setTimeout(() => setCargando(true), 0);
    fetch(`${API_URL}/api/profesores/${profesor.id}/historial`)
      .then(res => res.json())
      .then(data => {
        setHistorial(data.pagos || []);
        setMesActivo(data.mesActivo);
        setPagoActual(data.pagoActual);
        setCargando(false);
      })
      .catch(err => {
        console.error('Error al cargar historial:', err);
        setCargando(false);
      });
  }, [profesor]);

  useEffect(() => {
    if (profesor) cargarDatosProfesor();
  }, [profesor, cargarDatosProfesor]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    if (!cedulaInput.trim()) return setLoginError('Por favor ingrese su número de cédula');
    try {
      const res = await fetch(`${API_URL}/api/auth/profesor/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cedula: cedulaInput.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('profesorSesion', JSON.stringify(data.profesor));
        localStorage.setItem('profesorLastActive', Date.now().toString());
        setProfesor(data.profesor);
      } else {
        setLoginError(data.error || 'Error al verificar la cédula');
      }
    } catch (err) {
      console.error(err);
      setLoginError('Error de conexión con el servidor');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('profesorSesion');
    localStorage.removeItem('profesorLastActive');
    setProfesor(null);
    setCedulaInput('');
    setHistorial([]);
    setMesActivo(null);
    setPagoActual(null);
    setImage(null);
    setPreview(null);
    setMensajeEnvio('');
  };

  // ── Lógica de Inactividad ─────────────────────────────────────
  useEffect(() => {
    if (!profesor) return;
    const INACTIVITY_TIMEOUT = 15 * 60 * 1000;
    const resetTimer = () => localStorage.setItem('profesorLastActive', Date.now().toString());
    const events = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart'];
    events.forEach(ev => window.addEventListener(ev, resetTimer));
    resetTimer();
    const checkInterval = setInterval(() => {
      const lastActive = localStorage.getItem('profesorLastActive');
      if (lastActive && Date.now() - parseInt(lastActive) > INACTIVITY_TIMEOUT) {
        clearInterval(checkInterval);
        handleLogout();
        alert('Tu sesión ha expirado debido a inactividad.');
      }
    }, 5000);
    return () => {
      events.forEach(ev => window.removeEventListener(ev, resetTimer));
      clearInterval(checkInterval);
    };
  }, [profesor]);

  // ── Procesamiento de Imagen ───────────────────────────────────
  const procesarImagen = (blob) => {
    if (blob) {
      setPreview(URL.createObjectURL(blob));
      setImage(blob);
      setMensajeEnvio('');
    }
  };

  const handlePaste = (e) => {
    const item = e.clipboardData.items[0];
    if (item?.type.includes('image')) procesarImagen(item.getAsFile());
  };

  const leerPortapapeles = async () => {
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const imageTypes = item.types.filter(type => type.startsWith('image/'));
        if (imageTypes.length > 0) {
          const blob = await item.getType(imageTypes[0]);
          procesarImagen(blob);
          return;
        }
      }
      mostrarNotificacion('No se encontró imagen en el portapapeles. Copia una captura primero.', 'warning');
    } catch (err) {
      mostrarNotificacion('El navegador requiere permiso de portapapeles, o usa Ctrl+V directamente.', 'warning');
      console.error(err);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) procesarImagen(file);
  };

  const enviarPago = async () => {
    if (!image || !mesActivo || subiendo) return;
    setSubiendo(true);
    setMensajeEnvio('');
    const formData = new FormData();
    formData.append('comprobante', image);
    formData.append('profesor_id', profesor.id);
    formData.append('mes_id', mesActivo.id);
    formData.append('monto', mesActivo.precioFinal);
    try {
      const res = await fetch(`${API_URL}/api/pagos`, { method: 'POST', body: formData });
      if (res.ok) {
        setMensajeEnvio('¡Pago registrado con éxito! Pendiente de aprobación.');
        setPreview(null);
        setImage(null);
        cargarDatosProfesor();
      } else {
        const err = await res.json();
        setMensajeEnvio(`Error: ${err.error}`);
      }
    } catch (err) {
      console.error(err);
      setMensajeEnvio('Error de conexión al subir el comprobante');
    } finally {
      setSubiendo(false);
    }
  };

  /* ════════════════════════════════════════════════════════════════
     VISTA: LOGIN
  ════════════════════════════════════════════════════════════════ */
  if (!profesor) {
    return (
      <div className="min-h-screen flex">
        {/* Panel izquierdo — Marca */}
        <div className="hidden md:flex md:w-5/12 lg:w-2/5 bg-red-600 flex-col justify-between p-12">
          <div className="flex items-center gap-3 text-white">
            <IconMusic />
            <span className="font-semibold text-base tracking-tight">Internet Conservatorio</span>
          </div>
          <div>
            <h1 className="text-4xl font-bold text-white leading-snug mb-4">
              Portal de Pagos para Docentes
            </h1>
            <p className="text-red-100 text-base leading-relaxed">
              Registra y gestiona tus comprobantes de pago del servicio de internet de forma sencilla y segura.
            </p>
          </div>
          <p className="text-red-200 text-sm">
            Sistema de Cobros — Conservatorio JCH
          </p>
        </div>

        {/* Panel derecho — Formulario */}
        <div className="flex-1 flex items-center justify-center bg-white p-8">
          <div className="w-full max-w-sm">
            {/* Logo móvil */}
            <div className="md:hidden flex items-center gap-2 mb-8 text-blue-600">
              <IconMusic />
              <span className="font-semibold text-sm">Internet Conservatorio</span>
            </div>

            <h2 className="text-2xl font-bold text-slate-900 mb-1">Hola, Bienvenido</h2>
            <p className="text-slate-500 text-sm mb-8">
              Ingresa tu número de cédula para acceder al portal
            </p>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label htmlFor="cedula-input" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Número de Cédula
                </label>
                <input
                  id="cedula-input"
                  type="text"
                  placeholder="Ej: 1712345678"
                  value={cedulaInput}
                  onChange={(e) => setCedulaInput(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 outline-none transition-all text-slate-900 placeholder-slate-400 text-sm"
                  required
                />
              </div>

              {loginError && (
                <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 animate-fade-in">
                  <IconAlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <button
                type="submit"
                id="btn-login-profesor"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors duration-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm"
              >
                Ingresar al Portal
              </button>
            </form>

            <p className="mt-8 text-center text-xs text-slate-400">
              ¿Problemas para acceder? Contacta al Administrador.
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════════════
     VISTA: DASHBOARD DEL PROFESOR
  ════════════════════════════════════════════════════════════════ */
  const mostrarZonaCarga =
    mesActivo &&
    mesActivo.abierto === 1 &&
    (!pagoActual || (pagoActual.estado === 'rechazado' && reintentando));

  return (
    <div className="min-h-screen bg-slate-50" onPaste={handlePaste}>

      {/* ── Header ────────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 text-blue-600">
            <IconMusic />
            <span className="font-semibold text-sm text-slate-800">Internet Conservatorio</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-800 leading-none">{profesor.nombre}</p>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">CI {profesor.cedula}</p>
            </div>
            <button
              onClick={handleLogout}
              id="btn-logout-profesor"
              className="flex items-center gap-2 text-slate-500 hover:text-red-600 text-xs font-medium px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
            >
              <IconLogout />
              <span className="hidden sm:inline">Cerrar sesión</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Main ─────────────────────────────────────────────── */}
      <main className="max-w-5xl mx-auto px-6 py-8">

        {cargando ? (
          <div className="flex flex-col items-center justify-center py-32 gap-3">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400 text-sm">Cargando tu información...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">

            {/* ── Columna izquierda: Estado del periodo ─────── */}
            <div className="md:col-span-2 space-y-4">

              {/* Tarjeta del periodo activo */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
                  Periodo de Cobro Activo
                </p>

                {mesActivo ? (
                  <div>
                    {/* Nombre del mes */}
                    <div className="mb-5 pb-5 border-b border-slate-100">
                      <p className="text-xs font-medium text-blue-600 mb-0.5">Mes actual</p>
                      <h2 className="text-xl font-bold text-slate-900">{mesActivo.mes_nombre}</h2>
                    </div>

                    {/* Desglose del monto */}
                    <div className="space-y-2.5">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-500">Cuota del mes</span>
                        <span className="text-sm font-semibold text-slate-700">
                          ${mesActivo.precioMesActual?.toFixed(2)}
                        </span>
                      </div>

                      {mesActivo.descuentoAplicado > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-emerald-600">
                            Descuento
                            {mesActivo.motivoDescuento ? ` (${mesActivo.motivoDescuento})` : ''}
                          </span>
                          <span className="text-sm font-semibold text-emerald-600">
                            −${mesActivo.descuentoAplicado.toFixed(2)}
                          </span>
                        </div>
                      )}

                      {mesActivo.recargoAplicado > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-amber-600">
                            Recargo
                            {mesActivo.motivoRecargo ? ` (${mesActivo.motivoRecargo})` : ''}
                          </span>
                          <span className="text-sm font-semibold text-amber-600">
                            +${mesActivo.recargoAplicado.toFixed(2)}
                          </span>
                        </div>
                      )}

                      {mesActivo.deudaPasada > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-red-500">Deuda anterior</span>
                          <span className="text-sm font-semibold text-red-500">
                            +${mesActivo.deudaPasada.toFixed(2)}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-3 mt-1 border-t border-dashed border-slate-200">
                        <span className="text-sm font-semibold text-slate-700">Total a pagar</span>
                        <span className="text-2xl font-bold text-blue-600">
                          ${mesActivo.precioFinal?.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Estado del pago */}
                    <div className="mt-6 pt-5 border-t border-slate-100">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                        Estado del pago
                      </p>

                      {pagoActual ? (
                        <>
                          {pagoActual.estado === 'pendiente' && (
                            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl animate-fade-in">
                              <div className="p-1.5 bg-amber-100 rounded-lg shrink-0">
                                <IconClock className="w-4 h-4 text-amber-600" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-amber-800">En revisión</p>
                                <p className="text-xs text-amber-600 mt-0.5">
                                  Tu comprobante fue recibido y está siendo revisado por la administración.
                                </p>
                              </div>
                            </div>
                          )}

                          {pagoActual.estado === 'aprobado' && (
                            <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl animate-fade-in">
                              <div className="p-1.5 bg-emerald-100 rounded-lg shrink-0">
                                <IconCheck className="w-4 h-4 text-emerald-600" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-emerald-800">Pago aprobado</p>
                                <p className="text-xs text-emerald-600 mt-0.5">
                                  Estás al día con el servicio de internet.
                                </p>
                              </div>
                            </div>
                          )}

                          {pagoActual.estado === 'rechazado' && (
                            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl animate-fade-in">
                              <div className="p-1.5 bg-red-100 rounded-lg shrink-0">
                                <IconXCircle className="w-4 h-4 text-red-600" />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-red-800">Comprobante rechazado</p>
                                <p className="text-xs text-red-600 mt-0.5">
                                  El comprobante no pudo ser validado por la administración.
                                </p>
                                {mesActivo.abierto === 1 && !reintentando && (
                                  <button
                                    onClick={() => setReintentando(true)}
                                    className="mt-3 text-xs font-semibold text-red-700 hover:text-red-800 underline underline-offset-2 transition-colors"
                                  >
                                    Volver a intentar →
                                  </button>
                                )}
                                {mesActivo.abierto === 1 && reintentando && (
                                  <p className="mt-2 text-xs text-red-600 italic">
                                    Sube tu nuevo comprobante en la sección de la derecha.
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          {mesActivo.abierto === 1 ? (
                            <div className="flex items-start gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl animate-fade-in">
                              <div className="p-1.5 bg-slate-100 rounded-lg shrink-0">
                                <IconBell className="w-4 h-4 text-slate-500" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-slate-700">Pendiente de registro</p>
                                <p className="text-xs text-slate-500 mt-0.5">
                                  Realiza tu pago y sube el comprobante para registrarlo.
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl animate-fade-in">
                              <div className="p-1.5 bg-slate-100 rounded-lg shrink-0">
                                <IconLock className="w-4 h-4 text-slate-400" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-slate-600">Periodo cerrado</p>
                                <p className="text-xs text-slate-400 mt-0.5">
                                  La recepción de comprobantes está deshabilitada temporalmente.
                                </p>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2.5 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                    <IconAlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>No hay periodo de cobro configurado actualmente.</span>
                  </div>
                )}
              </div>
            </div>

            {/* ── Columna derecha: Carga e Historial ─────────── */}
            <div className="md:col-span-3 space-y-4">

              {/* Métodos de pago rápido */}
              {mostrarZonaCarga && (mesActivo.link_deuna || mesActivo.link_loja) && (
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Métodos de Pago Disponibles
                  </p>
                  <p className="text-sm text-slate-500 mb-4">
                    Realiza tu transferencia usando uno de estos accesos directos, luego sube el comprobante.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {mesActivo.link_deuna && (
                      <a
                        href={mesActivo.link_deuna}
                        target="_blank"
                        rel="noreferrer"
                        id="btn-pago-deuna"
                        className="flex items-center justify-center bg-[#652c8f] hover:bg-[#532475] py-3 px-6 rounded-xl shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
                      >
                        <img src="/deuna.png" alt="Pagar con DeUna" className="h-10 object-contain" />
                      </a>
                    )}
                    {mesActivo.link_loja && (
                      <a
                        href={mesActivo.link_loja}
                        target="_blank"
                        rel="noreferrer"
                        id="btn-pago-loja"
                        className="flex items-center justify-center bg-[#8bbd44] hover:bg-[#77a33a] py-3 px-6 rounded-xl shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
                      >
                        <img src="/ahorita.png" alt="Pagar con Ahorita" className="h-10 object-contain" />
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Zona de carga de comprobante */}
              {mostrarZonaCarga && (
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
                    {pagoActual?.estado === 'rechazado' ? 'Volver a Subir Comprobante' : 'Subir Comprobante de Pago'}
                  </p>

                  {/* Drop zone */}
                  <div
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
                      preview
                        ? 'border-emerald-300 bg-emerald-50/50'
                        : 'border-slate-200 bg-slate-50/50 hover:border-blue-300 hover:bg-blue-50/30'
                    }`}
                  >
                    {!preview ? (
                      <div className="flex flex-col items-center gap-3">
                        <div className="text-slate-300">
                          <IconUpload />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-700 mb-1">
                            Pega la captura de tu transferencia
                          </p>
                          <p className="text-xs text-slate-400">
                            Usa{' '}
                            <kbd className="bg-white border border-slate-200 shadow-sm px-1.5 py-0.5 rounded text-xs font-mono text-slate-600">
                              Ctrl+V
                            </kbd>{' '}
                            o selecciona una opción:
                          </p>
                        </div>
                        <div className="flex gap-2 mt-1">
                          <button
                            onClick={leerPortapapeles}
                            type="button"
                            id="btn-pegar-portapapeles"
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-colors"
                          >
                            Pegar desde portapapeles
                          </button>
                          <label
                            id="btn-seleccionar-archivo"
                            className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                          >
                            Seleccionar archivo
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleFileChange}
                            />
                          </label>
                        </div>
                      </div>
                    ) : (
                      <div className="relative inline-block">
                        <img
                          src={preview}
                          alt="Vista previa del comprobante"
                          className="mx-auto max-h-52 rounded-lg shadow-sm border border-white"
                        />
                        <button
                          onClick={() => { setPreview(null); setImage(null); }}
                          className="absolute -top-2 -right-2 bg-white border border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-200 w-7 h-7 rounded-full shadow-sm font-bold flex items-center justify-center text-sm transition-colors"
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Botón de envío */}
                  {image && (
                    <button
                      onClick={enviarPago}
                      disabled={subiendo}
                      id="btn-registrar-pago"
                      className="w-full mt-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors text-sm"
                    >
                      {subiendo ? 'Registrando pago...' : 'Registrar pago'}
                    </button>
                  )}

                  {mensajeEnvio && (
                    <div
                      className={`mt-3 p-3.5 rounded-xl text-sm font-medium text-center animate-fade-in ${
                        mensajeEnvio.includes('éxito')
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}
                    >
                      {mensajeEnvio}
                    </div>
                  )}
                </div>
              )}

              {/* Historial de pagos */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Historial de Pagos
                  </p>
                </div>
                <div className="overflow-x-auto max-h-72 overflow-y-auto custom-scrollbar">
                  {historial.length === 0 ? (
                    <p className="text-center py-10 text-slate-400 text-sm italic">
                      No tienes pagos registrados aún.
                    </p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-slate-400 text-xs uppercase font-semibold bg-slate-50">
                          <th className="px-6 py-3 text-left">Mes</th>
                          <th className="px-6 py-3 text-left">Monto</th>
                          <th className="px-6 py-3 text-left hidden sm:table-cell">Fecha de envío</th>
                          <th className="px-6 py-3 text-center">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {historial.map((item) => (
                          <tr key={item.pago_id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="px-6 py-3.5 font-medium text-slate-800">{item.mes_nombre}</td>
                            <td className="px-6 py-3.5 font-mono text-slate-700">
                              ${item.monto_pagado?.toFixed(2)}
                            </td>
                            <td className="px-6 py-3.5 text-slate-400 text-xs hidden sm:table-cell">
                              {new Date(item.fecha_registro).toLocaleString()}
                            </td>
                            <td className="px-6 py-3.5 text-center">
                              <StatusBadge estado={item.estado} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}
      </main>

      {/* ── Toast Notification ───────────────────────────────── */}
      {notificacion && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-in-right">
          <div
            className={`flex items-center gap-3 px-4 py-3.5 rounded-xl shadow-lg border max-w-sm text-sm font-medium ${
              notificacion.type === 'error'
                ? 'bg-white text-red-700 border-red-200'
                : notificacion.type === 'warning'
                  ? 'bg-white text-amber-700 border-amber-200'
                  : 'bg-white text-emerald-700 border-emerald-200'
            }`}
          >
            <span className="shrink-0">
              {notificacion.type === 'error'
                ? <IconXCircle className="w-4 h-4" />
                : notificacion.type === 'warning'
                  ? <IconAlertCircle className="w-4 h-4" />
                  : <IconCheck className="w-4 h-4" />}
            </span>
            <span>{notificacion.text}</span>
            <button
              onClick={() => setNotificacion(null)}
              className="text-slate-400 hover:text-slate-600 font-bold ml-1 transition-colors"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
