import React, { useState, useEffect } from 'react';

export default function AdminDashboard() {
  // Estado de sesión
  const [adminToken, setAdminToken] = useState(() => localStorage.getItem('adminSesion'));
  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginError, setLoginError] = useState("");

  // Datos del Dashboard
  const [stats, setStats] = useState([]);
  const [pendientes, setPendientes] = useState([]);
  const [pagosRecibidos, setPagosRecibidos] = useState([]);
  const [profesores, setProfesores] = useState([]);
  const [mesActual, setMesActual] = useState(null);
  const [descuentos, setDescuentos] = useState([]);
  const [ingresos, setIngresos] = useState({ total: 0, historico: 0 });

  // Formularios de control
  const [config, setConfig] = useState({ mes_nombre: '', precio_base: 10, descuento: 0 });
  const [nuevoProfe, setNuevoProfe] = useState({ nombre: '', cedula: '', celular: '' });
  const [profeEditando, setProfeEditando] = useState(null); // { id, nombre, cedula, celular, activo }
  
  // Tablas e Historial
  const [historialGeneral, setHistorialGeneral] = useState([]);
  const [searchProfesores, setSearchProfesores] = useState('');
  const [searchHistorial, setSearchHistorial] = useState('');
  
  // Búsqueda de docentes para descuento
  const [busquedaDocente, setBusquedaDocente] = useState("");
  const [docenteSeleccionado, setDocenteSeleccionado] = useState(null);
  const [montoDescuento, setMontoDescuento] = useState("");
  
  // Modales
  const [fotoModal, setFotoModal] = useState(null);
  const [errorDashboard, setErrorDashboard] = useState("");

  // Helper para headers con token
  const getHeaders = React.useCallback(() => ({
    'Content-Type': 'application/json',
    'Authorization': adminToken || ''
  }), [adminToken]);

  // Endpoints administrativos
  const fetchStats = React.useCallback(() => {
    fetch('http://localhost:3001/api/admin/stats', { headers: getHeaders() })
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => setStats(data))
      .catch(() => setErrorDashboard("Error al cargar estadísticas"));
  }, [getHeaders]);

  const fetchPendientes = React.useCallback(() => {
    fetch('http://localhost:3001/api/admin/pendientes', { headers: getHeaders() })
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => setPendientes(data))
      .catch(() => setErrorDashboard("Error al cargar pendientes"));
  }, [getHeaders]);

  const fetchPagosRecibidos = React.useCallback(() => {
    fetch('http://localhost:3001/api/admin/pagos-recibidos', { headers: getHeaders() })
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => setPagosRecibidos(data))
      .catch(() => setErrorDashboard("Error al cargar comprobantes"));
  }, [getHeaders]);

  const fetchProfesores = React.useCallback(() => {
    fetch('http://localhost:3001/api/admin/profesores', { headers: getHeaders() })
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => setProfesores(data))
      .catch(() => setErrorDashboard("Error al cargar lista de profesores"));
  }, [getHeaders]);

  const fetchDescuentos = React.useCallback(() => {
    fetch('http://localhost:3001/api/admin/descuentos', { headers: getHeaders() })
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => setDescuentos(data))
      .catch(() => setErrorDashboard("Error al cargar lista de descuentos"));
  }, [getHeaders]);

  const fetchIngresos = React.useCallback(() => {
    fetch('http://localhost:3001/api/admin/ingresos', { headers: getHeaders() })
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => setIngresos({ total: data.total || 0, historico: data.total_historico || 0 }))
      .catch(() => setErrorDashboard("Error al cargar ingresos"));
  }, [getHeaders]);

  const fetchHistorialGeneral = React.useCallback(() => {
    fetch('http://localhost:3001/api/admin/historial-general', { headers: getHeaders() })
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => setHistorialGeneral(data))
      .catch(() => setErrorDashboard("Error al cargar historial general"));
  }, [getHeaders]);

  const fetchMesActual = React.useCallback(() => {
    fetch('http://localhost:3001/api/mes-actual')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) {
          setMesActual(data);
          setConfig({
            mes_nombre: data.mes_nombre,
            precio_base: data.precio_base,
            descuento: data.descuento
          });
        }
      });
  }, []);

  const cargarTodo = React.useCallback(() => {
    fetchStats();
    fetchPendientes();
    fetchPagosRecibidos();
    fetchProfesores();
    fetchDescuentos();
    fetchMesActual();
    fetchIngresos();
    fetchHistorialGeneral();
  }, [fetchStats, fetchPendientes, fetchPagosRecibidos, fetchProfesores, fetchDescuentos, fetchMesActual, fetchIngresos, fetchHistorialGeneral]);

  // Cargar datos al estar autenticado
  useEffect(() => {
    if (adminToken) {
      cargarTodo();
    }
  }, [adminToken, cargarTodo]);

  // Login del Administrador
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    try {
      const res = await fetch('http://localhost:3001/api/auth/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUser, password: loginPass })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('adminSesion', data.token);
        setAdminToken(data.token);
      } else {
        setLoginError(data.error || "Credenciales incorrectas");
      }
    } catch (err) {
      console.error(err);
      setLoginError("Error de conexión con el servidor");
    }
  };

  // Logout del Administrador
  const handleLogout = () => {
    localStorage.removeItem('adminSesion');
    setAdminToken(null);
    setLoginUser("");
    setLoginPass("");
    // Limpiar hash de la URL para regresar a la página principal
    window.location.hash = "";
  };

  // Configurar nuevo mes
  const guardarConfig = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:3001/api/admin/config-mes', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(config)
      });
      if (res.ok) {
        alert("Mes configurado y activado exitosamente.");
        cargarTodo();
      } else {
        alert("Error al guardar configuración.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Aplicar descuento a un profesor
  const aplicarDescuento = async (e) => {
    e.preventDefault();
    if (!docenteSeleccionado || !montoDescuento) return;
    try {
      const res = await fetch('http://localhost:3001/api/admin/descuentos', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ profesor_id: docenteSeleccionado.id, descuento: parseFloat(montoDescuento) })
      });
      if (res.ok) {
        setDocenteSeleccionado(null);
        setMontoDescuento("");
        setBusquedaDocente("");
        cargarTodo();
      } else {
        alert("Error al aplicar descuento.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Eliminar descuento
  const eliminarDescuento = async (id) => {
    try {
      const res = await fetch(`http://localhost:3001/api/admin/descuentos/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) cargarTodo();
    } catch (err) {
      console.error(err);
    }
  };

  // Abrir / Cerrar recepción de pagos
  const toggleProcesoPago = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/admin/toggle-abierto', {
        method: 'POST',
        headers: getHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setMesActual(prev => prev ? { ...prev, abierto: data.abierto } : null);
        alert(`La recepción de pagos ha sido ${data.abierto === 1 ? 'ABIERTA' : 'CERRADA'} con éxito.`);
      } else {
        alert("Error al cambiar estado de recepción de pagos.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Validar comprobantes (Aprobar o Rechazar)
  const validarPago = async (pago_id, nuevoEstado) => {
    try {
      const res = await fetch('http://localhost:3001/api/admin/validar-pago', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ pago_id, estado: nuevoEstado })
      });
      if (res.ok) {
        cargarTodo();
      } else {
        alert("Error al validar el pago");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // CRUD Profesores: Crear
  const crearProfesor = async (e) => {
    e.preventDefault();
    if (!nuevoProfe.nombre || !nuevoProfe.cedula) return;
    try {
      const res = await fetch('http://localhost:3001/api/admin/profesores', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(nuevoProfe)
      });
      const data = await res.json();
      if (res.ok) {
        setNuevoProfe({ nombre: '', cedula: '', celular: '' });
        cargarTodo();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // CRUD Profesores: Guardar Edición
  const guardarEdicionProfesor = async (e) => {
    e.preventDefault();
    if (!profeEditando) return;
    try {
      const res = await fetch(`http://localhost:3001/api/admin/profesores/${profeEditando.id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(profeEditando)
      });
      const data = await res.json();
      if (res.ok) {
        setProfeEditando(null);
        cargarTodo();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // CRUD Profesores: Eliminar
  const eliminarProfesor = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar a este profesor?")) return;
    try {
      const res = await fetch(`http://localhost:3001/api/admin/profesores/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) {
        cargarTodo();
      } else {
        alert("Error al eliminar profesor");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // --- VISTA DE LOGIN ADMIN ---
  if (!adminToken) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900 px-4">
        <div className="w-full max-w-md bg-slate-800/80 border border-slate-700/50 backdrop-blur-md shadow-2xl rounded-3xl p-8 text-white">
          <div className="text-center mb-8">
            <span className="text-4xl">🔐</span>
            <h2 className="text-3xl font-black mt-4 tracking-tight text-indigo-400">Consola de Control</h2>
            <p className="text-slate-400 text-sm mt-2">Acceso Exclusivo de Administrador</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">
                Usuario
              </label>
              <input
                type="text"
                placeholder="Ingresa tu usuario"
                value={loginUser}
                onChange={(e) => setLoginUser(e.target.value)}
                className="w-full p-4 border border-slate-700 rounded-2xl bg-slate-900/50 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">
                Contraseña
              </label>
              <input
                type="password"
                placeholder="Ingresa tu contraseña"
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                className="w-full p-4 border border-slate-700 rounded-2xl bg-slate-900/50 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                required
              />
            </div>
            {loginError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-sm font-semibold text-center">
                ⚠️ {loginError}
              </div>
            )}
            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-500/20 transition-all hover:-translate-y-0.5 active:scale-95 text-lg"
            >
              Iniciar Sesión
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- VISTA PRINCIPAL DEL DASHBOARD ---
  return (
    <div className="bg-gray-50 min-h-screen text-gray-900">
      
      {/* Navbar Superior */}
      <nav className="bg-slate-900 p-4 text-white flex justify-between items-center shadow-lg sticky top-0 z-40">
        <div className="flex items-center space-x-3">
          <span className="text-xl">🎛️</span>
          <h1 className="font-extrabold text-lg tracking-tight">Administración - Internet Conservatorio</h1>
        </div>
        <button
          onClick={handleLogout}
          className="bg-slate-800 hover:bg-rose-600 text-slate-200 hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95"
        >
          Cerrar Sesión 🚪
        </button>
      </nav>

      {/* Contenido Principal */}
      <main className="p-6 max-w-7xl mx-auto space-y-8">
        
        {errorDashboard && (
          <div className="p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl text-sm font-bold flex justify-between">
            <span>⚠️ {errorDashboard}</span>
            <button onClick={() => setErrorDashboard("")} className="text-xs font-bold underline">Cerrar</button>
          </div>
        )}

        {/* Métricas Principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Métrica de Apertura/Cierre Global */}
          <div className="flex flex-col justify-between p-6 bg-white border border-gray-100 shadow-sm rounded-3xl gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Mecanismo de Recaudación</span>
                {mesActual ? (
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${mesActual.abierto === 1 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                    {mesActual.abierto === 1 ? 'Abierto' : 'Cerrado'}
                  </span>
                ) : null}
              </div>
              <h2 className="text-2xl font-black text-slate-850 mt-1">
                {mesActual ? `Periodo activo: ${mesActual.mes_nombre}` : 'Sin periodo activo configurado'}
              </h2>
              <p className="text-xs text-gray-400 mt-1 mb-4">
                {mesActual?.abierto === 1 
                  ? "Los profesores pueden registrar y enviar comprobantes en este momento." 
                  : "La carga de comprobantes está deshabilitada para los profesores."}
              </p>
            </div>
            {mesActual && (
              <button
                onClick={toggleProcesoPago}
                className={`w-full sm:w-auto px-6 py-3.5 rounded-2xl font-bold transition-all active:scale-95 shadow-md ${
                  mesActual.abierto === 1 
                    ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200' 
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-100'
                }`}
              >
                {mesActual.abierto === 1 ? '🔒 Cerrar Proceso de Pago' : '🔓 Abrir Proceso de Pago'}
              </button>
            )}
          </div>

          {/* Ingresos Totales */}
          <div className="p-6 bg-gradient-to-br from-indigo-500 to-indigo-700 shadow-lg shadow-indigo-500/20 rounded-3xl text-white flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-bold text-indigo-200 uppercase tracking-wider">Ingresos Aprobados del Mes</span>
                <h2 className="text-5xl font-black mt-2">${ingresos.total.toFixed(2)}</h2>
              </div>
              <span className="text-5xl opacity-90 drop-shadow-md">💰</span>
            </div>
            <div className="mt-4 pt-4 border-t border-indigo-400/30 flex justify-between items-center">
              <span className="text-sm font-medium text-indigo-100">Acumulado Histórico:</span>
              <span className="text-xl font-black text-white">${ingresos.historico.toFixed(2)}</span>
            </div>
          </div>
          
        </div>

        {/* Fila superior: Configuración y Gestión de Profesores */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Columna Izquierda: Configurar Mes y Descuentos */}
          <div className="space-y-8">
            <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-black text-gray-800 mb-6 flex items-center">
                <span className="mr-2">⚙️</span> Configurar Periodo de Cobro
              </h3>
              <form onSubmit={guardarConfig} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Nombre del Periodo</label>
                    <input
                      type="text"
                      placeholder="Ej: Mayo 2026"
                      className="w-full p-3 border border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition text-sm font-bold"
                      value={config.mes_nombre}
                      onChange={e => setConfig({ ...config, mes_nombre: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Precio Base ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full p-3 border border-gray-200 rounded-xl text-sm font-bold text-indigo-700"
                      value={config.precio_base}
                      onChange={e => setConfig({ ...config, precio_base: parseFloat(e.target.value) || 0 })}
                      required
                    />
                  </div>
                </div>
                <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-xl font-bold transition shadow-lg shadow-indigo-150 text-sm">
                  Activar / Actualizar Periodo
                </button>
              </form>
            </section>

            {/* Nueva Sección de Descuentos Especiales / Ajustes */}
            <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-black text-rose-600 mb-4 flex items-center">
                <span className="mr-2">🎁</span> Ajuste de Cuota a Favor
              </h3>
              <p className="text-xs text-gray-500 mb-4">Aplica un descuento especial o perdón de deudas pasadas a un docente en este mes activo.</p>
              
              <div className="space-y-4 bg-rose-50/30 p-4 rounded-2xl border border-rose-100">
                 {/* Buscador */}
                 <div>
                    <label className="block text-xs font-bold text-gray-600 mb-2">Buscar Docente:</label>
                    <input 
                      type="text" 
                      placeholder="Escribe un nombre..." 
                      value={busquedaDocente} 
                      onChange={e => setBusquedaDocente(e.target.value)} 
                      className="w-full p-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-rose-300" 
                    />
                 </div>
                 
                 {/* Resultados Buscador */}
                 {busquedaDocente && (
                    <div className="max-h-32 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-lg relative z-10">
                       {profesores.filter(p => p.nombre.toLowerCase().includes(busquedaDocente.toLowerCase())).map(p => (
                          <div 
                            key={p.id} 
                            onClick={() => {setDocenteSeleccionado(p); setBusquedaDocente('');}} 
                            className="p-2.5 text-sm hover:bg-rose-50 cursor-pointer border-b last:border-0 border-gray-100 transition"
                          >
                             <span className="font-bold text-gray-700">{p.nombre}</span> <span className="text-xs text-gray-400 font-mono ml-2">C.I. {p.cedula}</span>
                          </div>
                       ))}
                       {profesores.filter(p => p.nombre.toLowerCase().includes(busquedaDocente.toLowerCase())).length === 0 && (
                          <div className="p-3 text-sm text-gray-400 italic">No se encontraron docentes.</div>
                       )}
                    </div>
                 )}

                 {/* Formulario de Docente Seleccionado */}
                 {docenteSeleccionado && (
                    <form onSubmit={aplicarDescuento} className="flex flex-col gap-3 p-4 bg-white border border-rose-200 rounded-xl shadow-sm">
                       <div className="flex justify-between items-center">
                          <span className="text-sm font-bold text-rose-900">{docenteSeleccionado.nombre}</span>
                          <button type="button" onClick={() => setDocenteSeleccionado(null)} className="text-xs font-bold text-gray-400 hover:text-rose-500">✕ Cancelar</button>
                       </div>
                       <div className="flex gap-2">
                          <div className="relative flex-1">
                            <span className="absolute left-3 top-2.5 text-gray-500 font-bold">$</span>
                            <input 
                              type="number" 
                              step="0.01" 
                              placeholder="Descuento" 
                              required 
                              value={montoDescuento} 
                              onChange={e => setMontoDescuento(e.target.value)} 
                              className="w-full pl-7 p-2.5 border border-gray-200 rounded-lg text-sm font-bold text-rose-600 outline-none focus:border-rose-300" 
                            />
                          </div>
                          <button type="submit" className="bg-rose-500 hover:bg-rose-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-md shadow-rose-200 transition">
                            Aplicar
                          </button>
                       </div>
                    </form>
                 )}
              </div>

              {/* Lista de Descuentos Activos */}
              <div className="mt-6">
                 <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Docentes con descuento</h4>
                 {descuentos.length === 0 ? (
                    <p className="text-xs text-gray-400 italic bg-gray-50 p-3 rounded-lg border border-gray-100 text-center">Nadie tiene descuentos en este periodo.</p>
                 ) : (
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                       {descuentos.map(d => (
                          <div key={d.id} className="flex justify-between items-center p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm hover:bg-white hover:border-rose-100 transition shadow-sm">
                             <div>
                                <span className="font-bold text-gray-700">{d.nombre}</span>
                                <span className="text-xs text-gray-400 font-mono ml-2 hidden sm:inline-block">C.I. {d.cedula}</span>
                             </div>
                             <div className="flex items-center space-x-3">
                                <span className="text-rose-600 font-black bg-rose-100 px-2 py-0.5 rounded-md">-${d.descuento.toFixed(2)}</span>
                                <button onClick={() => eliminarDescuento(d.id)} className="text-rose-500 hover:text-white hover:bg-rose-500 p-1 rounded-md transition" title="Quitar descuento">
                                  🗑️
                                </button>
                             </div>
                          </div>
                       ))}
                    </div>
                 )}
              </div>
            </section>
          </div>

          {/* CRUD Gestión de Profesores */}
          <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col">
            <h3 className="text-lg font-black text-gray-800 mb-6 flex items-center">
              <span className="mr-2">👥</span> Gestión de Profesores (Clientes)
            </h3>
            
            {/* Formulario Crear / Editar */}
            <form onSubmit={profeEditando ? guardarEdicionProfesor : crearProfesor} className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 mb-6 space-y-4">
              <span className="block text-xs font-bold text-indigo-600 uppercase tracking-wider">
                {profeEditando ? "✍️ Editar Profesor" : "➕ Agregar Nuevo Profesor"}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Nombre completo"
                  className="p-3 bg-white border border-gray-200 rounded-xl text-sm"
                  value={profeEditando ? profeEditando.nombre : nuevoProfe.nombre}
                  onChange={e => profeEditando 
                    ? setProfeEditando({ ...profeEditando, nombre: e.target.value })
                    : setNuevoProfe({ ...nuevoProfe, nombre: e.target.value })
                  }
                  required
                />
                <input
                  type="text"
                  placeholder="Cédula (C.I.)"
                  className="p-3 bg-white border border-gray-200 rounded-xl text-sm"
                  value={profeEditando ? profeEditando.cedula : nuevoProfe.cedula}
                  onChange={e => profeEditando
                    ? setProfeEditando({ ...profeEditando, cedula: e.target.value })
                    : setNuevoProfe({ ...nuevoProfe, cedula: e.target.value })
                  }
                  required
                />
                <input
                  type="text"
                  placeholder="Celular (Ej: 0991234567)"
                  className="p-3 bg-white border border-gray-200 rounded-xl text-sm"
                  value={profeEditando ? (profeEditando.celular || '') : nuevoProfe.celular}
                  onChange={e => profeEditando
                    ? setProfeEditando({ ...profeEditando, celular: e.target.value })
                    : setNuevoProfe({ ...nuevoProfe, celular: e.target.value })
                  }
                />
              </div>

              {profeEditando && (
                <div className="flex items-center space-x-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">Estado:</label>
                  <select
                    className="p-1.5 border border-gray-200 rounded-lg text-xs"
                    value={profeEditando.activo}
                    onChange={e => setProfeEditando({ ...profeEditando, activo: parseInt(e.target.value) })}
                  >
                    <option value={1}>Activo</option>
                    <option value={0}>Inactivo</option>
                  </select>
                </div>
              )}

              <div className="flex space-x-2">
                <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-xl text-xs font-bold shadow-md transition">
                  {profeEditando ? "Guardar Cambios" : "Guardar Registro"}
                </button>
                {profeEditando && (
                  <button type="button" onClick={() => setProfeEditando(null)} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-xl text-xs font-bold transition">
                    Cancelar
                  </button>
                )}
              </div>
            </form>

            {/* Buscador de Profesores */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="🔍 Buscar profesor por nombre o cédula..."
                value={searchProfesores}
                onChange={e => setSearchProfesores(e.target.value)}
                className="w-full p-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-indigo-300 bg-gray-50/50"
              />
            </div>

            {/* Listado de Profesores */}
            <div className="overflow-y-auto max-h-56 flex-1 pr-1">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-gray-400 text-xs uppercase border-b pb-2">
                    <th className="pb-2">Nombre</th>
                    <th className="pb-2">Cédula</th>
                    <th className="pb-2">Celular</th>
                    <th className="pb-2 text-center">Estado</th>
                    <th className="pb-2 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {profesores
                    .filter(p => p.nombre.toLowerCase().includes(searchProfesores.toLowerCase()) || p.cedula.includes(searchProfesores))
                    .map((profe) => (
                    <tr key={profe.id} className="border-b last:border-0 hover:bg-gray-50/50 transition">
                      <td className="py-2.5 font-semibold text-gray-800">{profe.nombre}</td>
                      <td className="py-2.5 text-xs font-mono text-gray-500">{profe.cedula}</td>
                      <td className="py-2.5 text-xs font-mono text-gray-500">{profe.celular || '-'}</td>
                      <td className="py-2.5 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${profe.activo === 1 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                          {profe.activo === 1 ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="py-2.5 text-right space-x-1.5">
                        <button
                          onClick={() => setProfeEditando(profe)}
                          className="text-xs text-indigo-600 hover:text-indigo-800 font-bold"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => eliminarProfesor(profe.id)}
                          className="text-xs text-rose-600 hover:text-rose-800 font-bold"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                  {profesores.filter(p => p.nombre.toLowerCase().includes(searchProfesores.toLowerCase()) || p.cedula.includes(searchProfesores)).length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-6 text-gray-400 italic text-xs">No se encontraron docentes.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

        </div>

        {/* Sección: Validación de Comprobantes Recibidos */}
        <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-black text-gray-800 mb-6 flex items-center">
            <span className="mr-2">📸</span> Validación de Comprobantes Recibidos
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase font-bold">
                  <th className="p-4 rounded-l-2xl">Profesor</th>
                  <th className="p-4">Monto Reportado</th>
                  <th className="p-4">Fecha de Envío</th>
                  <th className="p-4 text-center">Estado del Pago</th>
                  <th className="p-4 text-right rounded-r-2xl">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pagosRecibidos.map((pago) => (
                  <tr key={pago.id} className="border-b last:border-0 hover:bg-gray-50/50 transition">
                    <td className="p-4 font-bold text-gray-800">{pago.nombre}</td>
                    <td className="p-4 font-mono font-bold text-gray-700">${pago.monto_pagado?.toFixed(2)}</td>
                    <td className="p-4 text-xs text-gray-400">
                      {new Date(pago.fecha_registro).toLocaleString()}
                    </td>
                    <td className="p-4 text-center">
                      {pago.estado === 'pendiente' && (
                        <span className="inline-block px-2.5 py-1 text-xs font-bold rounded-full bg-amber-50 text-amber-700 border border-amber-100">
                          Pendiente de Revisión
                        </span>
                      )}
                      {pago.estado === 'aprobado' && (
                        <span className="inline-block px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                          Aprobado
                        </span>
                      )}
                      {pago.estado === 'rechazado' && (
                        <span className="inline-block px-2.5 py-1 text-xs font-bold rounded-full bg-rose-50 text-rose-700 border border-rose-100">
                          Rechazado
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => setFotoModal(`http://localhost:3001/comprobantes/${pago.comprobante_path}`)}
                        className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm transition"
                      >
                        Ver Captura
                      </button>
                      
                      {pago.estado === 'pendiente' && (
                        <>
                          <button
                            onClick={() => validarPago(pago.id, 'aprobado')}
                            className="bg-emerald-600 hover:bg-emerald-750 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm shadow-emerald-100 transition active:scale-95"
                          >
                            Aprobar
                          </button>
                          <button
                            onClick={() => validarPago(pago.id, 'rechazado')}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-750 px-3.5 py-2 rounded-xl text-xs font-bold border border-rose-200 transition active:scale-95"
                          >
                            Rechazar
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {pagosRecibidos.length === 0 && (
              <p className="text-center py-12 text-gray-400 italic text-sm">Aún no hay ningún comprobante subido para el periodo activo.</p>
            )}
          </div>
        </section>

        {/* Sección de Alertas y Rankings */}
        
        {/* Pendientes */}
        <section className="bg-white p-6 rounded-3xl shadow-sm border border-rose-100">
          <h3 className="text-lg font-black text-rose-600 mb-6 flex justify-between items-center">
            <span>⚠️ Profesores Pendientes de Pago</span>
            <span className="bg-rose-500 text-white px-3 py-1 rounded-full text-xs font-bold">
              {pendientes.length} sin pagar
            </span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {pendientes.map((p) => (
              <div key={p.id} className="p-4 border border-rose-100/50 rounded-2xl bg-rose-50/20 text-center flex flex-col items-center justify-between">
                <div>
                  <span className="block text-sm font-bold text-gray-800">{p.nombre}</span>
                  <span className="text-[10px] text-gray-400 font-mono">C.I. {p.cedula}</span>
                </div>
                <a
                  href={p.celular ? `https://wa.me/${p.celular}?text=Hola%20${encodeURIComponent(p.nombre)},%20te%20recordamos%20que%20se%20encuentra%20habilitado%20el%20pago%20de%20internet%20de%20este%20mes.` : `https://wa.me/?text=Hola%20${encodeURIComponent(p.nombre)},%20te%20recordamos%20que%20se%20encuentra%20habilitado%20el%20pago%20de%20internet%20de%20este%20mes.`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 text-xs bg-white text-indigo-600 hover:bg-indigo-50 border border-indigo-200 px-3.5 py-1.5 rounded-full font-bold transition inline-block"
                >
                  💬 Recordar por WhatsApp
                </a>
              </div>
            ))}
            {pendientes.length === 0 && (
              <div className="col-span-full text-center py-6 text-emerald-600 font-bold italic text-sm">
                🎉 ¡Todos los profesores están al día con sus pagos en este periodo!
              </div>
            )}
          </div>
        </section>

        {/* Fila de Rankings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Ranking Más Cumplidos */}
          <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-black text-emerald-600 mb-6 flex items-center">
              <span className="mr-2">🏆</span> Profesores más Cumplidos (Top 5)
            </h3>
            <div className="overflow-y-auto max-h-64 pr-1">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-gray-400 text-xs font-bold uppercase border-b pb-2">
                    <th className="pb-2">Profesor</th>
                    <th className="pb-2 text-center">Meses Aprobados</th>
                  </tr>
                </thead>
                <tbody>
                  {[...stats].slice(0, 5).map((profe, i) => (
                    <tr key={i} className="border-b last:border-0 hover:bg-gray-50/50 transition">
                      <td className="py-3 font-semibold text-gray-700">{profe.nombre}</td>
                      <td className="py-3 text-center font-mono font-black text-emerald-650">{profe.total_pagos}</td>
                    </tr>
                  ))}
                  {stats.length === 0 && (
                    <tr>
                      <td colSpan={2} className="text-center py-6 text-gray-400 italic text-xs">Sin estadísticas de puntualidad aún.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Ranking Menos Cumplidos */}
          <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-black text-amber-600 mb-6 flex items-center">
              <span className="mr-2">🚨</span> Profesores menos Cumplidos (Bottom 5)
            </h3>
            <div className="overflow-y-auto max-h-64 pr-1">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-gray-400 text-xs font-bold uppercase border-b pb-2">
                    <th className="pb-2">Profesor</th>
                    <th className="pb-2 text-center">Meses Aprobados</th>
                  </tr>
                </thead>
                <tbody>
                  {[...stats].sort((a,b) => a.total_pagos - b.total_pagos).slice(0, 5).map((profe, i) => (
                    <tr key={i} className="border-b last:border-0 hover:bg-gray-50/50 transition">
                      <td className="py-3 font-semibold text-gray-700">{profe.nombre}</td>
                      <td className="py-3 text-center font-mono font-black text-amber-600">{profe.total_pagos}</td>
                    </tr>
                  ))}
                  {stats.length === 0 && (
                    <tr>
                      <td colSpan={2} className="text-center py-6 text-gray-400 italic text-xs">Sin estadísticas de puntualidad aún.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Sección: Historial General de Pagos */}
        <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mt-8">
          <h3 className="text-lg font-black text-gray-800 mb-6 flex items-center justify-between">
            <div className="flex items-center">
              <span className="mr-2">📚</span> Historial General de Pagos
            </div>
          </h3>
          
          <div className="mb-4">
            <input
              type="text"
              placeholder="🔍 Buscar por nombre de profesor, mes o estado..."
              value={searchHistorial}
              onChange={e => setSearchHistorial(e.target.value)}
              className="w-full p-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-indigo-300 bg-gray-50/50"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase font-bold">
                  <th className="p-4 rounded-l-2xl">Profesor / Mes</th>
                  <th className="p-4">Costo Base</th>
                  <th className="p-4">Descuento</th>
                  <th className="p-4">Pago Final</th>
                  <th className="p-4 text-center">Estado</th>
                  <th className="p-4 text-right rounded-r-2xl">Recibo</th>
                </tr>
              </thead>
              <tbody>
                {historialGeneral
                  .filter(h => h.nombre.toLowerCase().includes(searchHistorial.toLowerCase()) || h.mes_nombre.toLowerCase().includes(searchHistorial.toLowerCase()) || h.estado.toLowerCase().includes(searchHistorial.toLowerCase()))
                  .map((h) => (
                  <tr key={h.id} className="border-b last:border-0 hover:bg-gray-50/50 transition">
                    <td className="p-4">
                      <div className="font-bold text-gray-800">{h.nombre}</div>
                      <div className="text-xs text-gray-400 mt-1">{h.mes_nombre}</div>
                    </td>
                    <td className="p-4 font-mono font-bold text-gray-500">${h.precio_base?.toFixed(2)}</td>
                    <td className="p-4 font-mono font-bold text-rose-500">-${h.descuento_aplicado?.toFixed(2)}</td>
                    <td className="p-4 font-mono font-bold text-emerald-600">${h.precio_final_pagado?.toFixed(2)}</td>
                    <td className="p-4 text-center">
                      <span className={`inline-block px-2.5 py-1 text-[10px] font-bold rounded-full ${h.estado === 'aprobado' ? 'bg-emerald-50 text-emerald-700' : h.estado === 'rechazado' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'}`}>
                        {h.estado.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {h.comprobante_path && (
                        <button
                          onClick={() => setFotoModal(`http://localhost:3001/comprobantes/${h.comprobante_path}`)}
                          className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg text-xs font-bold transition"
                        >
                          Ver
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {historialGeneral.filter(h => h.nombre.toLowerCase().includes(searchHistorial.toLowerCase()) || h.mes_nombre.toLowerCase().includes(searchHistorial.toLowerCase()) || h.estado.toLowerCase().includes(searchHistorial.toLowerCase())).length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-gray-400 italic text-sm">No se encontraron registros en el historial.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

      </main>

      {/* MODAL VISOR DE FOTOS */}
      {fotoModal && (
        <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="relative max-w-3xl w-full bg-slate-900 border border-slate-700/50 p-3 rounded-2xl shadow-2xl">
            <div className="flex justify-between items-center mb-2 px-2 text-white">
              <span className="text-xs text-slate-400">Inspección de Comprobante</span>
              <button
                onClick={() => setFotoModal(null)}
                className="bg-white text-black px-4 py-1.5 rounded-full text-xs font-bold hover:bg-gray-200 transition"
              >
                Cerrar ×
              </button>
            </div>
            <img src={fotoModal} alt="Comprobante bancario" className="w-full h-auto max-h-[80vh] object-contain rounded-xl" />
          </div>
        </div>
      )}
      
    </div>
  );
}