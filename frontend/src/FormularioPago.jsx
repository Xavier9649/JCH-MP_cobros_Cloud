import React, { useState, useEffect } from 'react';
import API_URL from './config';

export default function FormularioPago() {
  // Estados del Profesor e Inicio de Sesión
  const [profesor, setProfesor] = useState(() => {
    const saved = localStorage.getItem('profesorSesion');
    const lastActive = localStorage.getItem('profesorLastActive');
    const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutos
    if (saved && lastActive && Date.now() - parseInt(lastActive) > INACTIVITY_TIMEOUT) {
      localStorage.removeItem('profesorSesion');
      localStorage.removeItem('profesorLastActive');
      return null;
    }
    return saved ? JSON.parse(saved) : null;
  });
  const [cedulaInput, setCedulaInput] = useState("");
  const [loginError, setLoginError] = useState("");

  // Estados del Dashboard del Profesor
  const [mesActivo, setMesActivo] = useState(null);
  const [pagoActual, setPagoActual] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [cargando, setCargando] = useState(false);

  // Estados de carga de comprobante
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [mensajeEnvio, setMensajeEnvio] = useState("");
  const [subiendo, setSubiendo] = useState(false);
  const [reintentando, setReintentando] = useState(false);
  const [notificacion, setNotificacion] = useState(null);

  const mostrarNotificacion = React.useCallback((text, type = 'success') => {
    setNotificacion({ text, type });
  }, []);

  useEffect(() => {
    if (!notificacion) return;
    const timer = setTimeout(() => {
      setNotificacion(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [notificacion]);

  useEffect(() => {
    setReintentando(false);
  }, [pagoActual]);

  const cargarDatosProfesor = React.useCallback(() => {
    if (!profesor) return;
    // Evitar set-state sincrónico en useEffect
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
        console.error("Error al cargar historial:", err);
        setCargando(false);
      });
  }, [profesor]);

  // Cargar datos cuando el profesor inicia sesión
  useEffect(() => {
    if (profesor) {
      cargarDatosProfesor();
    }
  }, [profesor, cargarDatosProfesor]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    if (!cedulaInput.trim()) return setLoginError("Por favor ingrese su número de cédula");

    try {
      const res = await fetch(`${API_URL}/api/auth/profesor/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cedula: cedulaInput.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('profesorSesion', JSON.stringify(data.profesor));
        localStorage.setItem('profesorLastActive', Date.now().toString());
        setProfesor(data.profesor);
      } else {
        setLoginError(data.error || "Error al verificar la cédula");
      }
    } catch (err) {
      console.error(err);
      setLoginError("Error de conexión con el servidor");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('profesorSesion');
    localStorage.removeItem('profesorLastActive');
    setProfesor(null);
    setCedulaInput("");
    setHistorial([]);
    setMesActivo(null);
    setPagoActual(null);
    setImage(null);
    setPreview(null);
    setMensajeEnvio("");
  };

  // Lógica de inactividad (Timeout de sesión)
  useEffect(() => {
    if (!profesor) return;

    const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutos

    const resetTimer = () => {
      localStorage.setItem('profesorLastActive', Date.now().toString());
    };

    // Eventos que reinician el contador
    const events = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart'];
    const handleActivity = () => {
      resetTimer();
    };

    events.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    // Iniciar con la marca de tiempo actual
    resetTimer();

    // Intervalo de revisión cada 5 segundos
    const checkInterval = setInterval(() => {
      const lastActive = localStorage.getItem('profesorLastActive');
      if (lastActive && Date.now() - parseInt(lastActive) > INACTIVITY_TIMEOUT) {
        clearInterval(checkInterval);
        handleLogout();
        alert("Tu sesión ha expirado debido a inactividad.");
      }
    }, 5000);

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      clearInterval(checkInterval);
    };
  }, [profesor]);

  // Procesamiento de Imagen (Pegado y Carga)
  const procesarImagen = (blob) => {
    if (blob) {
      setPreview(URL.createObjectURL(blob));
      setImage(blob);
      setMensajeEnvio("");
    }
  };

  const handlePaste = (e) => {
    const item = e.clipboardData.items[0];
    if (item?.type.includes('image')) {
      procesarImagen(item.getAsFile());
    }
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
      mostrarNotificacion("No se encontró una imagen en tu portapapeles. ¡Copia una captura de pantalla primero!", "warning");
    } catch (err) {
      mostrarNotificacion("El navegador necesita permisos de portapapeles o usa Ctrl+V en la página.", "warning");
      console.error(err);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      procesarImagen(file);
    }
  };

  const enviarPago = async () => {
    if (!image || !mesActivo || subiendo) return;

    setSubiendo(true);
    setMensajeEnvio("");

    const formData = new FormData();
    formData.append('comprobante', image);
    formData.append('profesor_id', profesor.id);
    formData.append('mes_id', mesActivo.id);
    formData.append('monto', mesActivo.precioFinal);

    try {
      const res = await fetch(`${API_URL}/api/pagos`, {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        setMensajeEnvio("¡Pago registrado con éxito! Pendiente de aprobación.");
        setPreview(null);
        setImage(null);
        // Recargar datos para ver el pago recién subido en el historial y estado
        cargarDatosProfesor();
      } else {
        const err = await res.json();
        setMensajeEnvio(`Error: ${err.error}`);
      }
    } catch (err) {
      console.error(err);
      setMensajeEnvio("Error de conexión al subir el comprobante");
    } finally {
      setSubiendo(false);
    }
  };

  // --- VISTA DE LOGIN ---
  if (!profesor) {
    return (
      <div className="flex items-center justify-center min-h-[80vh] px-4">
        <div className="w-full max-w-md bg-white border border-gray-100 shadow-2xl rounded-3xl p-8 transition-all hover:shadow-indigo-50/50">
          <div className="text-center mb-8">
            <span className="text-4xl">🎼</span>
            <h2 className="text-3xl font-black text-gray-800 mt-4 tracking-tight">Internet Conservatorio</h2>
            <p className="text-gray-400 text-sm mt-2">Portal de Acceso para Profesores</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">
                Número de Cédula
              </label>
              <input
                type="text"
                placeholder="Ej: 1712345678"
                value={cedulaInput}
                onChange={(e) => setCedulaInput(e.target.value)}
                className="w-full p-4 border-2 border-gray-100 rounded-2xl bg-gray-50 focus:border-indigo-500 focus:bg-white outline-none transition-all text-lg font-medium"
                required
              />
            </div>
            {loginError && (
              <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm font-semibold border border-red-100 text-center">
                ⚠️ {loginError}
              </div>
            )}
            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/25 transition-all duration-300 ease-out hover:-translate-y-0.5 active:scale-95 text-lg"
            >
              Ingresar al Portal
            </button>
          </form>
          <div className="mt-8 text-center text-xs text-gray-400">
            Si tienes inconvenientes para ingresar, por favor comunícate con el Administrador.
          </div>
        </div>
      </div>
    );
  }

  // --- VISTA PANEL DEL PROFESOR (LOGUEADO) ---
  return (
    <div onPaste={handlePaste} className="max-w-4xl mx-auto px-4 py-8">
      {/* Cabecera */}
      <header className="flex justify-between items-center mb-8 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider">Bienvenido(a)</span>
          <h2 className="text-2xl font-black text-gray-800">{profesor.nombre}</h2>
          <p className="text-xs text-gray-400 font-mono mt-0.5">C.I. {profesor.cedula}</p>
        </div>
        <button
          onClick={handleLogout}
          className="bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-500 px-4 py-2 rounded-xl text-xs font-bold border border-slate-100 hover:border-rose-100 transition-all duration-300 ease-out hover:-translate-y-0.5 active:scale-95"
        >
          Cerrar Sesión 🚪
        </button>
      </header>

      {cargando ? (
        <div className="text-center py-20">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent text-indigo-600 rounded-full" role="status"></div>
          <p className="text-gray-400 text-sm mt-3">Cargando información...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">

          {/* Columna Izquierda: Estado de Pago del Periodo Activo */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Periodo de Cobro Activo</h3>

              {mesActivo ? (
                <div>
                  <div className="bg-indigo-50/50 p-4 rounded-2xl mb-6">
                    <span className="block text-xs font-semibold text-indigo-500 uppercase tracking-wider">Mes actual</span>
                    <span className="text-2xl font-black text-indigo-900">{mesActivo.mes_nombre}</span>
                    <div className="flex flex-col mt-3 pt-3 border-t border-indigo-100/50 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-wide">CUOTA DEL MES ACTUAL:</span>
                        <span className="text-sm font-bold text-indigo-600">${mesActivo.precioMesActual?.toFixed(2)}</span>
                      </div>

                      {mesActivo.descuentoAplicado > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wide">
                            Descuento aplicado al mes actual{mesActivo.motivoDescuento ? ` (${mesActivo.motivoDescuento})` : ''}:
                          </span>
                          <span className="text-xs text-emerald-600 font-black">-${mesActivo.descuentoAplicado.toFixed(2)}</span>
                        </div>
                      )}

                      {mesActivo.recargoAplicado > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wide">
                            Monto adicional / Recargo{mesActivo.motivoRecargo ? ` (${mesActivo.motivoRecargo})` : ''}:
                          </span>
                          <span className="text-xs text-amber-600 font-black">+${mesActivo.recargoAplicado.toFixed(2)}</span>
                        </div>
                      )}

                      {mesActivo.deudaPasada > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-rose-600 font-bold uppercase tracking-wide">Deuda meses anteriores:</span>
                          <span className="text-sm text-rose-600 font-black">+${mesActivo.deudaPasada.toFixed(2)}</span>
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-2 mt-2 border-t-2 border-indigo-200 border-dashed">
                        <span className="text-xs text-indigo-900 font-black uppercase tracking-wider">Total a Pagar:</span>
                        <span className="text-3xl font-black text-indigo-600">${mesActivo.precioFinal?.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Estado del pago del mes actual */}
                  <div className="space-y-4">
                    <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Estado del pago</span>
                    {pagoActual ? (
                      <div>
                        {pagoActual.estado === 'pendiente' && (
                          <div className="p-5 bg-amber-50/60 backdrop-blur-sm border border-amber-100/60 rounded-2xl text-amber-900 text-center font-bold flex flex-col items-center shadow-sm animate-fade-in-up">
                            <span className="text-3xl mb-2 animate-pulse">⏳</span>
                            <span className="text-base font-black">Comprobante Registrado</span>
                            <span className="text-xs font-semibold text-amber-700/80 mt-1.5 max-w-xs">
                              Tu pago está en revisión administrativa. Te notificaremos cuando sea aprobado.
                            </span>
                          </div>
                        )}
                        {pagoActual.estado === 'aprobado' && (
                          <div className="p-5 bg-emerald-50/60 backdrop-blur-sm border border-emerald-100/60 rounded-2xl text-emerald-900 text-center font-bold flex flex-col items-center shadow-sm animate-fade-in-up">
                            <span className="text-3xl mb-2 animate-bounce">✅</span>
                            <span className="text-base font-black">Pago Aprobado con Éxito</span>
                            <span className="text-xs font-semibold text-emerald-700/80 mt-1.5 max-w-xs">
                              ¡Gracias! Estás al día con el servicio de Internet.
                            </span>
                          </div>
                        )}
                        {pagoActual.estado === 'rechazado' && (
                          <div className="p-5 bg-rose-50/60 backdrop-blur-sm border border-rose-100/60 rounded-2xl text-rose-900 text-center font-bold flex flex-col items-center shadow-sm animate-fade-in-up">
                            <span className="text-3xl mb-2">❌</span>
                            <span className="text-base font-black">Comprobante Rechazado</span>
                            <span className="text-xs font-semibold text-rose-700/80 mt-1.5 max-w-xs mb-3">
                              El comprobante subido no pudo ser validado por la administración.
                            </span>
                            {mesActivo.abierto === 1 && !reintentando && (
                              <button
                                onClick={() => setReintentando(true)}
                                className="mt-2 w-full bg-rose-600 hover:bg-rose-700 text-white font-black py-3 px-4 rounded-xl text-xs shadow-md shadow-rose-500/10 hover:shadow-rose-500/20 transition-all duration-300 ease-out hover:-translate-y-0.5 active:scale-95"
                              >
                                Volver a intentar 🔄
                              </button>
                            )}
                            {mesActivo.abierto === 1 && reintentando && (
                              <p className="mt-3 text-xs text-rose-800 italic bg-white/80 border border-rose-200/60 px-3 py-2 rounded-xl">
                                Por favor, sube tu nuevo comprobante en la sección de la derecha.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        {mesActivo.abierto === 1 ? (
                          <div className="p-5 bg-slate-50/60 backdrop-blur-sm border border-slate-100/60 rounded-2xl text-slate-700 text-center font-semibold shadow-sm animate-fade-in-up">
                            <span className="text-3xl mb-2 block">🔔</span>
                            <span className="text-slate-800 font-black block text-base">Pendiente de Registro</span>
                            <span className="block text-xs text-slate-500 mt-1.5 max-w-xs mx-auto">
                              Realiza tu transferencia usando los accesos rápidos de arriba y luego sube tu comprobante para registrar tu pago.
                            </span>
                          </div>
                        ) : (
                          <div className="p-5 bg-red-50/60 backdrop-blur-sm border border-red-100/60 rounded-2xl text-red-900 text-center font-bold flex flex-col items-center shadow-sm animate-fade-in-up">
                            <span className="text-3xl mb-2">🔒</span>
                            <span className="text-base font-black">Periodo Cerrado</span>
                            <span className="text-xs font-semibold text-red-700/80 mt-1.5 max-w-xs">
                              La recepción de comprobantes está deshabilitada temporalmente en este momento.
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-red-50 rounded-2xl text-sm text-red-700 border border-red-100 flex items-center">
                  <span className="mr-2">⚠️</span> No hay periodo de cobro configurado.
                </div>
              )}
            </div>
          </div>

          {/* Columna Derecha: Zona de Carga (o Historial) */}
          <div className="md:col-span-3 space-y-6">

            {/* Zona de Carga de Comprobante (Habilitado solo si el mes está abierto y no se ha pagado o está rechazado) */}
            {mesActivo && mesActivo.abierto === 1 && (!pagoActual || (pagoActual.estado === 'rechazado' && reintentando)) && (
              <>
                {(mesActivo.link_deuna || mesActivo.link_loja) && (
                  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Métodos de Pago Rápidos
                    </h3>
                    <p className="text-xs text-gray-500">
                      Realiza tu transferencia o pago usando los siguientes accesos directos y luego sube tu comprobante aquí abajo:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {mesActivo.link_deuna && (
                        <a
                          href={mesActivo.link_deuna}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-center bg-[#652c8f] hover:bg-[#532475] text-white font-bold py-4 px-6 rounded-2xl shadow-md shadow-[#652c8f]/20 hover:shadow-lg hover:shadow-[#652c8f]/30 transition-all duration-300 ease-out hover:-translate-y-0.5 active:scale-95 text-center text-2xl"
                          style={{ fontFamily: '"D Sari UltraBlack Italic", "D Sari UltraBlack", "D Sari", sans-serif', fontStyle: 'italic', fontWeight: 900 }}
                        >
                          deuna!
                        </a>
                      )}
                      {mesActivo.link_loja && (
                        <a
                          href={mesActivo.link_loja}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-center bg-[#8bbd44] hover:bg-[#77a33a] text-white font-bold py-4 px-6 rounded-2xl shadow-md shadow-[#8bbd44]/20 hover:shadow-lg hover:shadow-[#8bbd44]/30 transition-all duration-300 ease-out hover:-translate-y-0.5 active:scale-95 text-center text-2xl"
                          style={{ fontFamily: '"D Sari UltraBlack Italic", "D Sari UltraBlack", "D Sari", sans-serif', fontStyle: 'italic', fontWeight: 900 }}
                        >
                          Ahorita
                        </a>
                      )}
                    </div>
                  </div>
                )}

                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                    {pagoActual?.estado === 'rechazado' ? "Volver a Registrar Comprobante" : "Registrar Comprobante"}
                  </h3>
                  <div className="space-y-4">
                    <div className={`p-8 border-2 border-dashed rounded-2xl text-center transition-all duration-300 ${preview ? 'border-emerald-400 bg-emerald-50/20' : 'border-indigo-200 bg-indigo-50/10 hover:bg-indigo-50/30'}`}>
                      {!preview ? (
                        <div className="flex flex-col items-center justify-center space-y-3">
                          <span className="text-3xl animate-bounce">📋</span>
                          <p className="text-sm font-semibold text-indigo-950 mb-1 text-center max-w-sm mx-auto">
                            Pega la captura de pantalla de tu transferencia aquí
                            <span className="block mt-1">
                              <kbd className="bg-white border shadow-sm px-1.5 py-0.5 rounded text-xs font-mono text-indigo-600">Ctrl + V</kbd>
                            </span>
                          </p>
                          <span className="text-xs text-slate-400 text-center">o selecciona una opción:</span>

                          <div className="flex space-x-2">
                            <button
                              onClick={leerPortapapeles}
                              type="button"
                              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-indigo-500/10 hover:shadow-indigo-500/20 transition-all duration-300 ease-out hover:-translate-y-0.5 active:scale-95"
                            >
                              Pegar desde Portapapeles
                            </button>

                            <label className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm hover:shadow-md transition-all duration-300 ease-out hover:-translate-y-0.5 active:scale-95 cursor-pointer">
                              Seleccionar Archivo
                              <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                            </label>
                          </div>
                        </div>
                      ) : (
                        <div className="relative inline-block max-w-full">
                          <img src={preview} alt="Vista previa del comprobante" className="mx-auto max-h-56 rounded-xl shadow-lg border-2 border-white" />
                          <button
                            onClick={() => { setPreview(null); setImage(null); }}
                            className="absolute -top-3 -right-3 bg-rose-600 text-white w-8 h-8 rounded-full shadow-lg font-black hover:bg-rose-700 transition-all duration-300 ease-out hover:scale-105 active:scale-90 flex items-center justify-center text-sm"
                          >
                            ×
                          </button>
                        </div>
                      )}
                    </div>

                    {image && (
                      <button
                        onClick={enviarPago}
                        disabled={subiendo}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-500/15 transition-all duration-300 ease-out hover:-translate-y-0.5 active:scale-95 text-center block"
                      >
                        {subiendo ? "REGISTRANDO PAGO..." : "REGISTRAR PAGO AHORA"}
                      </button>
                    )}

                    {mensajeEnvio && (
                      <div className={`p-4 rounded-xl text-center text-sm font-semibold ${mensajeEnvio.includes('éxito') ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                        {mensajeEnvio}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Historial de Pagos */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Historial de Pagos</h3>

              <div className="overflow-x-auto max-h-80 overflow-y-auto pr-1 custom-scrollbar">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-150 text-gray-400 font-bold text-xs uppercase">
                      <th className="pb-3">Mes Cobrado</th>
                      <th className="pb-3">Monto</th>
                      <th className="pb-3">Fecha de Envío</th>
                      <th className="pb-3 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historial.map((item) => (
                      <tr key={item.pago_id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition">
                        <td className="py-3 font-semibold text-gray-800">{item.mes_nombre}</td>
                        <td className="py-3 font-mono font-bold text-gray-700">${item.monto_pagado?.toFixed(2)}</td>
                        <td className="py-3 text-gray-500 text-xs">{new Date(item.fecha_registro).toLocaleString()}</td>
                        <td className="py-3 text-center">
                          {item.estado === 'pendiente' && (
                            <span className="inline-block px-2.5 py-1 text-xs font-bold rounded-full bg-amber-50 text-amber-700 border border-amber-100">
                              Revisión
                            </span>
                          )}
                          {item.estado === 'aprobado' && (
                            <span className="inline-block px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                              Aprobado
                            </span>
                          )}
                          {item.estado === 'rechazado' && (
                            <span className="inline-block px-2.5 py-1 text-xs font-bold rounded-full bg-rose-50 text-rose-700 border border-rose-100">
                              Rechazado
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {historial.length === 0 && (
                  <p className="text-center py-6 text-gray-400 text-xs italic">No tienes ningún pago registrado anteriormente.</p>
                )}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* Toast Notification */}
      {notificacion && (
        <div className="fixed bottom-5 right-5 z-50 animate-fade-in-up">
          <div className={`flex items-center gap-3 p-4 rounded-2xl shadow-2xl border backdrop-blur-md transition-all duration-300 max-w-sm ${notificacion.type === 'error'
            ? 'bg-rose-50/95 text-rose-800 border-rose-100/60 shadow-rose-100/50'
            : notificacion.type === 'warning'
              ? 'bg-amber-50/95 text-amber-800 border-amber-100/60 shadow-amber-100/50'
              : 'bg-emerald-50/95 text-emerald-800 border-emerald-100/60 shadow-emerald-100/50'
            }`}>
            <span className="text-xl">
              {notificacion.type === 'error' ? '❌' : notificacion.type === 'warning' ? '⚠️' : '✅'}
            </span>
            <span className="text-sm font-bold">{notificacion.text}</span>
            <button onClick={() => setNotificacion(null)} className="text-gray-400 hover:text-gray-650 font-bold ml-2 text-lg">×</button>
          </div>
        </div>
      )}
    </div>
  );
}
