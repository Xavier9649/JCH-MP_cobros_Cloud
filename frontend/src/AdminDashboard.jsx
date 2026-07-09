import React, { useState, useEffect } from 'react';
import API_URL from './config';

/* ── SVG Icons ───────────────────────────────────────────────── */
const IconShield = ({ className = 'w-7 h-7' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
  </svg>
);
const IconHome = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);
const IconClipboard = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
  </svg>
);
const IconAlertTriangle = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);
const IconUsers = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const IconCalendar = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);
const IconTag = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
    <line x1="7" y1="7" x2="7.01" y2="7" />
  </svg>
);
const IconHistory = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-5" />
  </svg>
);
const IconSettings = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);
const IconLogout = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);
const IconCheck = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const IconX = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const IconAlertCircle = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);
const IconWhatsApp = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
  </svg>
);
const IconDollar = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);
const IconSearch = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
const IconRefresh = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);
const IconEye = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
);
const IconTrash = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);
const IconEdit = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

/* ── Status Badge ──────────────────────────────────────────────── */
const StatusBadge = ({ estado }) => {
  const map = {
    pendiente: 'bg-amber-50 text-amber-700 border-amber-200',
    aprobado:  'bg-emerald-50 text-emerald-700 border-emerald-200',
    rechazado: 'bg-red-50 text-red-700 border-red-200',
  };
  const labels = { pendiente: 'En revisión', aprobado: 'Aprobado', rechazado: 'Rechazado' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${map[estado] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
      {labels[estado] || estado}
    </span>
  );
};

/* ── Sidebar nav item ─────────────────────────────────────────── */
const NavItem = ({ id, label, icon, activeSection, setActiveSection, badge }) => {
  const isActive = activeSection === id;
  return (
    <button
      onClick={() => setActiveSection(id)}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
        isActive
          ? 'bg-blue-50 text-blue-700'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      <span className={isActive ? 'text-blue-600' : 'text-slate-400'}>{icon}</span>
      <span className="flex-1">{label}</span>
      {badge != null && badge > 0 && (
        <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
          {badge}
        </span>
      )}
    </button>
  );
};

/* ── KPI Card ─────────────────────────────────────────────────── */
const KpiCard = ({ label, value, sub, icon, color = 'blue' }) => {
  const colors = {
    blue:    'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber:   'bg-amber-50 text-amber-600',
    slate:   'bg-slate-100 text-slate-500',
  };
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider leading-snug">{label}</p>
        <div className={`p-2 rounded-lg ${colors[color]}`}>{icon}</div>
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════ */
export default function AdminDashboard() {
  // ── Estado de sesión ────────────────────────────────────────────
  const [adminToken, setAdminToken] = useState(() => {
    const token = localStorage.getItem('adminSesion');
    const lastActive = localStorage.getItem('adminLastActive');
    const INACTIVITY_TIMEOUT = 15 * 60 * 1000;
    if (token && lastActive && Date.now() - parseInt(lastActive) > INACTIVITY_TIMEOUT) {
      localStorage.removeItem('adminSesion');
      localStorage.removeItem('adminLastActive');
      return null;
    }
    return token;
  });
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');

  // ── Datos del Dashboard ─────────────────────────────────────────
  const [stats, setStats] = useState([]);
  const [pendientes, setPendientes] = useState([]);
  const [pagosRecibidos, setPagosRecibidos] = useState([]);
  const [profesores, setProfesores] = useState([]);
  const [mesActual, setMesActual] = useState(null);
  const [descuentos, setDescuentos] = useState([]);
  const [ingresos, setIngresos] = useState({ total: 0, historico: 0 });

  // ── Formularios de control ──────────────────────────────────────
  const [config, setConfig] = useState({ mes_nombre: '', precio_base: 10, descuento: 0, link_deuna: '', link_loja: '' });
  const [nuevoProfe, setNuevoProfe] = useState({ nombre: '', cedula: '', celular: '' });
  const [profeEditando, setProfeEditando] = useState(null);

  // ── Tablas e Historial ──────────────────────────────────────────
  const [historialGeneral, setHistorialGeneral] = useState([]);
  const [searchProfesores, setSearchProfesores] = useState('');
  const [searchHistorial, setSearchHistorial] = useState('');
  const [searchPagosRecibidos, setSearchPagosRecibidos] = useState('');
  const [filtroEstadoPagosRecibidos, setFiltroEstadoPagosRecibidos] = useState('todos');

  // ── Descuentos / Recargos ───────────────────────────────────────
  const [busquedaDocente, setBusquedaDocente] = useState('');
  const [docenteSeleccionado, setDocenteSeleccionado] = useState(null);
  const [montoDescuento, setMontoDescuento] = useState('');
  const [montoRecargo, setMontoRecargo] = useState('');
  const [motivoDesc, setMotivoDesc] = useState('');
  const [motivoRec, setMotivoRec] = useState('');

  // ── UI State ────────────────────────────────────────────────────
  const [fotoModal, setFotoModal] = useState(null);
  const [errorDashboard, setErrorDashboard] = useState('');
  const [notificacion, setNotificacion] = useState(null);
  const [activeSection, setActiveSection] = useState('inicio');

  const mostrarNotificacion = React.useCallback((text, type = 'success') => {
    setNotificacion({ text, type });
  }, []);

  useEffect(() => {
    if (!notificacion) return;
    const timer = setTimeout(() => setNotificacion(null), 4000);
    return () => clearTimeout(timer);
  }, [notificacion]);

  const getHeaders = React.useCallback(() => ({
    'Content-Type': 'application/json',
    'Authorization': adminToken || '',
  }), [adminToken]);

  // ── Fetch functions ─────────────────────────────────────────────
  const fetchStats = React.useCallback(() => {
    fetch(`${API_URL}/api/admin/stats`, { headers: getHeaders() })
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => setStats(data))
      .catch(() => setErrorDashboard('Error al cargar estadísticas'));
  }, [getHeaders]);

  const fetchPendientes = React.useCallback(() => {
    fetch(`${API_URL}/api/admin/pendientes`, { headers: getHeaders() })
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => setPendientes(data))
      .catch(() => setErrorDashboard('Error al cargar pendientes'));
  }, [getHeaders]);

  const fetchPagosRecibidos = React.useCallback(() => {
    fetch(`${API_URL}/api/admin/pagos-recibidos`, { headers: getHeaders() })
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => setPagosRecibidos(data))
      .catch(() => setErrorDashboard('Error al cargar comprobantes'));
  }, [getHeaders]);

  const fetchProfesores = React.useCallback(() => {
    fetch(`${API_URL}/api/admin/profesores`, { headers: getHeaders() })
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => setProfesores(data))
      .catch(() => setErrorDashboard('Error al cargar lista de profesores'));
  }, [getHeaders]);

  const fetchDescuentos = React.useCallback(() => {
    fetch(`${API_URL}/api/admin/descuentos`, { headers: getHeaders() })
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => setDescuentos(data))
      .catch(() => setErrorDashboard('Error al cargar lista de descuentos'));
  }, [getHeaders]);

  const fetchIngresos = React.useCallback(() => {
    fetch(`${API_URL}/api/admin/ingresos`, { headers: getHeaders() })
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => setIngresos({ total: data.total || 0, historico: data.total_historico || 0 }))
      .catch(() => setErrorDashboard('Error al cargar ingresos'));
  }, [getHeaders]);

  const fetchHistorialGeneral = React.useCallback(() => {
    fetch(`${API_URL}/api/admin/historial-general`, { headers: getHeaders() })
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => setHistorialGeneral(data))
      .catch(() => setErrorDashboard('Error al cargar historial general'));
  }, [getHeaders]);

  const fetchMesActual = React.useCallback(() => {
    fetch(`${API_URL}/api/mes-actual`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) {
          setMesActual(data);
          setConfig({ mes_nombre: data.mes_nombre, precio_base: data.precio_base, descuento: data.descuento, link_deuna: data.link_deuna || '', link_loja: data.link_loja || '' });
        }
      });
  }, []);

  const cargarTodo = React.useCallback(() => {
    fetchStats(); fetchPendientes(); fetchPagosRecibidos(); fetchProfesores();
    fetchDescuentos(); fetchMesActual(); fetchIngresos(); fetchHistorialGeneral();
  }, [fetchStats, fetchPendientes, fetchPagosRecibidos, fetchProfesores, fetchDescuentos, fetchMesActual, fetchIngresos, fetchHistorialGeneral]);

  useEffect(() => { if (adminToken) cargarTodo(); }, [adminToken, cargarTodo]);

  // ── Login ───────────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch(`${API_URL}/api/auth/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUser, password: loginPass }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('adminSesion', data.token);
        localStorage.setItem('adminLastActive', Date.now().toString());
        setAdminToken(data.token);
      } else {
        setLoginError(data.error || 'Credenciales incorrectas');
      }
    } catch (err) {
      console.error(err);
      setLoginError('Error de conexión con el servidor');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminSesion');
    localStorage.removeItem('adminLastActive');
    setAdminToken(null);
    setLoginUser('');
    setLoginPass('');
    window.location.hash = '';
  };

  // ── Inactividad ─────────────────────────────────────────────────
  useEffect(() => {
    if (!adminToken) return;
    const INACTIVITY_TIMEOUT = 15 * 60 * 1000;
    const resetTimer = () => localStorage.setItem('adminLastActive', Date.now().toString());
    const events = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart'];
    events.forEach(ev => window.addEventListener(ev, resetTimer));
    resetTimer();
    const checkInterval = setInterval(() => {
      const lastActive = localStorage.getItem('adminLastActive');
      if (lastActive && Date.now() - parseInt(lastActive) > INACTIVITY_TIMEOUT) {
        clearInterval(checkInterval);
        handleLogout();
        alert('Tu sesión ha expirado debido a inactividad.');
      }
    }, 5000);
    return () => { events.forEach(ev => window.removeEventListener(ev, resetTimer)); clearInterval(checkInterval); };
  }, [adminToken]);

  // ── Config del Mes ──────────────────────────────────────────────
  const guardarConfig = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!config.mes_nombre || !config.precio_base) {
      mostrarNotificacion('Por favor complete todos los campos obligatorios.', 'warning'); return;
    }
    if (!window.confirm('¿Seguro que deseas ACTIVAR UN NUEVO PERIODO?\n\nEsto desactivará el periodo actual y registrará como deuda las cuotas pendientes de todos los profesores que no hayan pagado aún.')) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/config-mes`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(config) });
      if (res.ok) { mostrarNotificacion('Mes configurado y activado exitosamente.'); cargarTodo(); }
      else mostrarNotificacion('Error al guardar configuración.', 'error');
    } catch { mostrarNotificacion('Error de conexión al guardar configuración.', 'error'); }
  };

  const actualizarConfig = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!config.mes_nombre || !config.precio_base) {
      mostrarNotificacion('Por favor complete todos los campos obligatorios.', 'warning'); return;
    }
    if (!mesActual) { mostrarNotificacion('No hay ningún periodo activo para actualizar.', 'warning'); return; }
    if (!window.confirm(`¿Seguro que deseas ACTUALIZAR los datos del periodo activo actual ("${mesActual.mes_nombre}")?\n\nEsta acción modificará los valores existentes para todos sin alterar deudas o cerrar periodos.`)) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/config-mes`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(config) });
      if (res.ok) { mostrarNotificacion('Periodo activo actualizado exitosamente.'); cargarTodo(); }
      else { const data = await res.json(); mostrarNotificacion(`Error al actualizar: ${data.error || 'error desconocido'}`, 'error'); }
    } catch { mostrarNotificacion('Error de conexión al actualizar.', 'error'); }
  };

  // ── Toggle apertura de pagos ────────────────────────────────────
  const toggleProcesoPago = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/toggle-abierto`, { method: 'POST', headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setMesActual(prev => prev ? { ...prev, abierto: data.abierto } : null);
        mostrarNotificacion(`La recepción de pagos ha sido ${data.abierto === 1 ? 'ABIERTA' : 'CERRADA'} con éxito.`);
      } else mostrarNotificacion('Error al cambiar estado de recepción de pagos.', 'error');
    } catch { mostrarNotificacion('Error de conexión al cambiar estado.', 'error'); }
  };

  // ── Validar pago ────────────────────────────────────────────────
  const validarPago = async (pago_id, nuevoEstado) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/validar-pago`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ pago_id, estado: nuevoEstado }) });
      if (res.ok) { mostrarNotificacion(`Comprobante ${nuevoEstado === 'aprobado' ? 'aprobado' : 'rechazado'} con éxito.`); cargarTodo(); }
      else mostrarNotificacion('Error al validar el pago', 'error');
    } catch { mostrarNotificacion('Error de conexión al validar pago.', 'error'); }
  };

  // ── CRUD Profesores ─────────────────────────────────────────────
  const crearProfesor = async (e) => {
    e.preventDefault();
    if (!nuevoProfe.nombre || !nuevoProfe.cedula) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/profesores`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(nuevoProfe) });
      const data = await res.json();
      if (res.ok) { mostrarNotificacion('Docente registrado exitosamente.'); setNuevoProfe({ nombre: '', cedula: '', celular: '' }); cargarTodo(); }
      else mostrarNotificacion(`Error: ${data.error}`, 'error');
    } catch { mostrarNotificacion('Error de conexión al registrar docente.', 'error'); }
  };

  const guardarEdicionProfesor = async (e) => {
    e.preventDefault();
    if (!profeEditando) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/profesores/${profeEditando.id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(profeEditando) });
      const data = await res.json();
      if (res.ok) { mostrarNotificacion('Datos del docente actualizados.'); setProfeEditando(null); cargarTodo(); }
      else mostrarNotificacion(`Error: ${data.error}`, 'error');
    } catch { mostrarNotificacion('Error de conexión al editar docente.', 'error'); }
  };

  const eliminarProfesor = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar a este profesor?')) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/profesores/${id}`, { method: 'DELETE', headers: getHeaders() });
      if (res.ok) { mostrarNotificacion('Docente eliminado correctamente.'); cargarTodo(); }
      else mostrarNotificacion('Error al eliminar profesor', 'error');
    } catch { mostrarNotificacion('Error de conexión al eliminar docente.', 'error'); }
  };

  // ── Descuentos ──────────────────────────────────────────────────
  const aplicarDescuento = async (e) => {
    e.preventDefault();
    if (!docenteSeleccionado) return;
    if (!montoDescuento && !montoRecargo) { mostrarNotificacion('Por favor ingrese al menos un descuento o un recargo.', 'warning'); return; }
    try {
      const res = await fetch(`${API_URL}/api/admin/descuentos`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ profesor_id: docenteSeleccionado.id, descuento: parseFloat(montoDescuento) || 0, recargo: parseFloat(montoRecargo) || 0, motivo_descuento: motivoDesc, motivo_recargo: motivoRec }) });
      if (res.ok) {
        setDocenteSeleccionado(null); setMontoDescuento(''); setMontoRecargo(''); setMotivoDesc(''); setMotivoRec(''); setBusquedaDocente('');
        mostrarNotificacion('Ajustes de cuota aplicados exitosamente.'); cargarTodo();
      } else mostrarNotificacion('Error al aplicar los ajustes de cuota.', 'error');
    } catch { mostrarNotificacion('Error de conexión al aplicar ajustes.', 'error'); }
  };

  const eliminarDescuento = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/descuentos/${id}`, { method: 'DELETE', headers: getHeaders() });
      if (res.ok) cargarTodo();
    } catch { console.error('Error al eliminar descuento'); }
  };

  // ── Acciones avanzadas ──────────────────────────────────────────
  const perdonarDeudasGlobales = async () => {
    if (!window.confirm('¿Estás seguro de que quieres PERDONAR TODAS LAS DEUDAS ANTERIORES? Esta acción actualizará a todos los docentes para que estén al día, y no se puede deshacer.')) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/perdonar-deudas`, { method: 'POST', headers: getHeaders() });
      const data = await res.json();
      if (res.ok) { mostrarNotificacion(data.mensaje); cargarTodo(); }
      else mostrarNotificacion('Error al perdonar deudas: ' + data.error, 'error');
    } catch { mostrarNotificacion('Error de conexión al intentar perdonar deudas', 'error'); }
  };

  const resetDatos = async () => {
    if (!window.confirm('¡ADVERTENCIA! Estás a punto de BORRAR TODOS LOS DATOS de la base (profesores, pagos, descuentos y configuración). Los administradores se conservarán. ¿Estás absolutamente seguro de continuar?')) return;
    if (!window.confirm('¿Confirmas nuevamente que deseas BORRAR TODOS LOS DATOS? Esta acción no se puede deshacer.')) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/reset-datos`, { method: 'POST', headers: getHeaders() });
      const data = await res.json();
      if (res.ok) { mostrarNotificacion(data.mensaje); setTimeout(() => handleLogout(), 1500); }
      else mostrarNotificacion('Error al resetear la base de datos: ' + data.error, 'error');
    } catch { mostrarNotificacion('Error de conexión al intentar resetear', 'error'); }
  };

  // ── WhatsApp helper ─────────────────────────────────────────────
  const getWhatsAppLink = (p, soloNumero = false) => {
    const periodoStr = mesActual ? ` del periodo *${mesActual.mes_nombre}*` : ' de este mes';
    const urlPago = window.location.origin + window.location.pathname;
    const texto = `Hola *${p.nombre}*, te recordamos que se encuentra habilitado el pago de internet${periodoStr}.\n\nPuedes registrar tu pago y subir el comprobante aquí:\n${urlPago}`;
    if (!p.celular) return soloNumero ? null : `https://wa.me/?text=${encodeURIComponent(texto)}`;
    let cleanNumber = p.celular.replace(/\D/g, '');
    if (cleanNumber.startsWith('0')) cleanNumber = cleanNumber.substring(1);
    if (!cleanNumber.startsWith('593') && cleanNumber.length === 9) cleanNumber = `593${cleanNumber}`;
    return soloNumero ? `https://wa.me/${cleanNumber}` : `https://wa.me/${cleanNumber}?text=${encodeURIComponent(texto)}`;
  };

  /* ══════════════════════════════════════════════════════════════
     VISTA: LOGIN ADMIN
  ══════════════════════════════════════════════════════════════ */
  if (!adminToken) {
    return (
      <div className="min-h-screen flex">
        {/* Panel izquierdo — Marca Admin */}
        <div className="hidden md:flex md:w-5/12 lg:w-2/5 bg-slate-900 flex-col justify-between p-12">
          <div className="flex items-center gap-3 text-slate-300">
            <IconShield className="w-6 h-6 text-blue-400" />
            <span className="font-semibold text-sm tracking-tight">Internet Conservatorio</span>
          </div>
          <div>
            <h1 className="text-4xl font-bold text-white leading-snug mb-4">
              Consola de Administración
            </h1>
            <p className="text-slate-400 text-base leading-relaxed">
              Gestiona periodos de cobro, aprueba comprobantes y administra el padrón de docentes del conservatorio.
            </p>
          </div>
          <p className="text-slate-600 text-sm">
            Acceso exclusivo para administradores
          </p>
        </div>

        {/* Panel derecho — Formulario */}
        <div className="flex-1 flex items-center justify-center bg-white p-8">
          <div className="w-full max-w-sm">
            <div className="md:hidden flex items-center gap-2 mb-8 text-blue-600">
              <IconShield className="w-6 h-6" />
              <span className="font-semibold text-sm">Administración</span>
            </div>

            <h2 className="text-2xl font-bold text-slate-900 mb-1">Iniciar sesión</h2>
            <p className="text-slate-500 text-sm mb-8">Acceso exclusivo de administrador</p>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label htmlFor="admin-user" className="block text-sm font-medium text-slate-700 mb-1.5">Usuario</label>
                <input
                  id="admin-user"
                  type="text"
                  placeholder="Ingresa tu usuario"
                  value={loginUser}
                  onChange={(e) => setLoginUser(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 outline-none transition-all text-slate-900 placeholder-slate-400 text-sm"
                  required
                />
              </div>
              <div>
                <label htmlFor="admin-pass" className="block text-sm font-medium text-slate-700 mb-1.5">Contraseña</label>
                <input
                  id="admin-pass"
                  type="password"
                  placeholder="Ingresa tu contraseña"
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
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
                id="btn-admin-login"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 px-4 rounded-xl transition-colors text-sm focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
              >
                Iniciar sesión
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════════
     VISTA: DASHBOARD ADMIN
  ══════════════════════════════════════════════════════════════ */

  // Counts for badges
  const pendientesCount = pagosRecibidos.filter(p => p.estado === 'pendiente').length;

  // Nav items
  const navItems = [
    { id: 'inicio',        label: 'Inicio',               icon: <IconHome /> },
    { id: 'comprobantes',  label: 'Comprobantes',          icon: <IconClipboard />, badge: pendientesCount },
    { id: 'pendientes',    label: 'Sin pagar',             icon: <IconAlertTriangle />, badge: pendientes.length },
    { id: 'profesores',    label: 'Profesores',            icon: <IconUsers /> },
    { id: 'periodo',       label: 'Periodo activo',        icon: <IconCalendar /> },
    { id: 'ajustes',       label: 'Ajustes de cuota',      icon: <IconTag /> },
    { id: 'historial',     label: 'Historial general',     icon: <IconHistory /> },
    { id: 'avanzado',      label: 'Opciones avanzadas',    icon: <IconSettings /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">

      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside className="w-60 bg-white border-r border-slate-200 fixed h-full flex flex-col z-30 shrink-0">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
              <IconShield className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 leading-none">Conservatorio</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Panel de Administración</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto custom-scrollbar">
          {navItems.map(item => (
            <NavItem key={item.id} {...item} activeSection={activeSection} setActiveSection={setActiveSection} />
          ))}
        </nav>

        {/* Period status chip */}
        {mesActual && (
          <div className="px-4 py-3 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-600 truncate">{mesActual.mes_nombre}</p>
                <p className="text-[10px] text-slate-400">Periodo activo</p>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${mesActual.abierto === 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                {mesActual.abierto === 1 ? 'Abierto' : 'Cerrado'}
              </span>
            </div>
          </div>
        )}

        {/* Logout */}
        <div className="px-3 pb-4 border-t border-slate-100 pt-3">
          <button
            onClick={handleLogout}
            id="btn-admin-logout"
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors"
          >
            <IconLogout />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────── */}
      <div className="ml-60 flex-1 min-w-0">

        {/* Top bar */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-20 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-base font-bold text-slate-900">
                {navItems.find(n => n.id === activeSection)?.label || 'Dashboard'}
              </h1>
              <p className="text-xs text-slate-400">Sistema de gestión de cobros de internet</p>
            </div>
            <button
              onClick={cargarTodo}
              title="Actualizar datos"
              className="flex items-center gap-2 text-slate-400 hover:text-slate-700 text-xs font-medium px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <IconRefresh />
              <span className="hidden sm:inline">Actualizar</span>
            </button>
          </div>
        </header>

        {/* Error banner */}
        {errorDashboard && (
          <div className="mx-8 mt-4 flex items-center gap-3 p-3.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 animate-fade-in">
            <IconAlertCircle className="w-4 h-4 shrink-0" />
            <span className="flex-1">{errorDashboard}</span>
            <button onClick={() => setErrorDashboard('')} className="text-red-400 hover:text-red-600 transition-colors"><IconX /></button>
          </div>
        )}

        {/* Page content */}
        <main className="p-8 space-y-6">

          {/* ══ SECCIÓN: INICIO ══════════════════════════════════ */}
          {activeSection === 'inicio' && (
            <div className="space-y-6 animate-fade-in">
              {/* KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard
                  label="Ingresos del mes"
                  value={`$${ingresos.total.toFixed(2)}`}
                  sub="Pagos aprobados"
                  icon={<IconDollar className="w-5 h-5" />}
                  color="blue"
                />
                <KpiCard
                  label="Histórico acumulado"
                  value={`$${ingresos.historico.toFixed(2)}`}
                  sub="Todos los periodos"
                  icon={<IconHistory className="w-5 h-5" />}
                  color="slate"
                />
                <KpiCard
                  label="Comprobantes pendientes"
                  value={pendientesCount}
                  sub="Esperando revisión"
                  icon={<IconClipboard className="w-5 h-5" />}
                  color="amber"
                />
                <KpiCard
                  label="Sin pagar"
                  value={pendientes.length}
                  sub="Profesores morosos"
                  icon={<IconAlertTriangle className="w-5 h-5" />}
                  color={pendientes.length > 0 ? 'amber' : 'emerald'}
                />
              </div>

              {/* Mecanismo de recaudación */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-slate-700">
                        {mesActual ? `Periodo activo: ${mesActual.mes_nombre}` : 'Sin periodo activo configurado'}
                      </p>
                      {mesActual && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${mesActual.abierto === 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                          {mesActual.abierto === 1 ? 'Abierto' : 'Cerrado'}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">
                      {mesActual?.abierto === 1
                        ? 'Los docentes pueden registrar y enviar comprobantes en este momento.'
                        : 'La carga de comprobantes está deshabilitada para los docentes.'}
                    </p>
                  </div>
                  {mesActual && (
                    <button
                      onClick={toggleProcesoPago}
                      className={`shrink-0 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                        mesActual.abierto === 1
                          ? 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                    >
                      {mesActual.abierto === 1 ? 'Cerrar recepción' : 'Abrir recepción'}
                    </button>
                  )}
                </div>
              </div>

              {/* Rankings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Más cumplidos */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500">
                      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
                      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
                      <path d="M4 22h16"></path>
                      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path>
                      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path>
                      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path>
                    </svg>
                    <p className="text-sm font-semibold text-slate-700">Más cumplidos (Top 5)</p>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {[...stats].slice(0, 5).map((p, i) => (
                      <div key={i} className="px-6 py-3 flex justify-between items-center">
                        <span className="text-sm font-medium text-slate-700">{p.nombre}</span>
                        <span className="text-sm font-bold text-emerald-600 font-mono">{p.total_pagos} meses</span>
                      </div>
                    ))}
                    {stats.length === 0 && <p className="text-center py-6 text-slate-400 text-xs italic">Sin estadísticas aún.</p>}
                  </div>
                </div>
                {/* Menos cumplidos */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500">
                      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
                      <path d="M12 9v4"></path>
                      <path d="M12 17h.01"></path>
                    </svg>
                    <p className="text-sm font-semibold text-slate-700">Menos cumplidos</p>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {[...stats].sort((a, b) => a.total_pagos - b.total_pagos).slice(0, 5).map((p, i) => (
                      <div key={i} className="px-6 py-3 flex justify-between items-center">
                        <span className="text-sm font-medium text-slate-700">{p.nombre}</span>
                        <span className="text-sm font-bold text-amber-600 font-mono">{p.total_pagos} meses</span>
                      </div>
                    ))}
                    {stats.length === 0 && <p className="text-center py-6 text-slate-400 text-xs italic">Sin estadísticas aún.</p>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══ SECCIÓN: COMPROBANTES ════════════════════════════ */}
          {activeSection === 'comprobantes' && (
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden animate-fade-in">
              <div className="px-6 py-5 border-b border-slate-100">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><IconSearch /></span>
                    <input
                      type="text"
                      placeholder="Buscar por nombre o cédula..."
                      value={searchPagosRecibidos}
                      onChange={e => setSearchPagosRecibidos(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 bg-slate-50"
                    />
                  </div>
                  <select
                    value={filtroEstadoPagosRecibidos}
                    onChange={e => setFiltroEstadoPagosRecibidos(e.target.value)}
                    className="px-3 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-400 bg-slate-50 text-slate-700 font-medium"
                  >
                    <option value="todos">Todos los estados</option>
                    <option value="pendiente">En revisión</option>
                    <option value="aprobado">Aprobados</option>
                    <option value="rechazado">Rechazados</option>
                  </select>
                </div>
              </div>
              <div className="overflow-x-auto max-h-[60vh] overflow-y-auto custom-scrollbar">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr className="text-slate-400 text-xs uppercase font-semibold">
                      <th className="px-6 py-3 text-left">Profesor</th>
                      <th className="px-6 py-3 text-left">Monto</th>
                      <th className="px-6 py-3 text-left hidden md:table-cell">Fecha de envío</th>
                      <th className="px-6 py-3 text-center">Estado</th>
                      <th className="px-6 py-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pagosRecibidos
                      .filter(pago => {
                        const matchSearch = pago.nombre.toLowerCase().includes(searchPagosRecibidos.toLowerCase()) || (pago.cedula && pago.cedula.includes(searchPagosRecibidos));
                        const matchStatus = filtroEstadoPagosRecibidos === 'todos' || pago.estado === filtroEstadoPagosRecibidos;
                        return matchSearch && matchStatus;
                      })
                      .map(pago => (
                        <tr key={pago.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-6 py-4 font-medium text-slate-800">{pago.nombre}</td>
                          <td className="px-6 py-4 font-mono text-slate-700">${pago.monto_pagado?.toFixed(2)}</td>
                          <td className="px-6 py-4 text-xs text-slate-400 hidden md:table-cell">{new Date(pago.fecha_registro).toLocaleString()}</td>
                          <td className="px-6 py-4 text-center"><StatusBadge estado={pago.estado} /></td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setFotoModal(pago.comprobante_path)}
                                className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg transition-colors"
                              >
                                <IconEye />
                                <span className="hidden sm:inline">Ver</span>
                              </button>
                              {pago.estado === 'pendiente' && (
                                <>
                                  <button
                                    onClick={() => validarPago(pago.id, 'aprobado')}
                                    className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg transition-colors border border-emerald-200"
                                  >
                                    <IconCheck />
                                    <span className="hidden sm:inline">Aprobar</span>
                                  </button>
                                  <button
                                    onClick={() => validarPago(pago.id, 'rechazado')}
                                    className="flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-lg transition-colors border border-red-200"
                                  >
                                    <IconX />
                                    <span className="hidden sm:inline">Rechazar</span>
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                {pagosRecibidos.filter(pago => {
                  const matchSearch = pago.nombre.toLowerCase().includes(searchPagosRecibidos.toLowerCase()) || (pago.cedula && pago.cedula.includes(searchPagosRecibidos));
                  const matchStatus = filtroEstadoPagosRecibidos === 'todos' || pago.estado === filtroEstadoPagosRecibidos;
                  return matchSearch && matchStatus;
                }).length === 0 && (
                  <p className="text-center py-16 text-slate-400 text-sm italic">
                    {pagosRecibidos.length === 0 ? 'Aún no hay comprobantes subidos para este periodo.' : 'No se encontraron registros con ese filtro.'}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ══ SECCIÓN: PENDIENTES ══════════════════════════════ */}
          {activeSection === 'pendientes' && (
            <div className="animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-slate-500">{pendientes.length === 0 ? '¡Todos los docentes están al día!' : `${pendientes.length} docente${pendientes.length !== 1 ? 's' : ''} sin registrar pago este mes.`}</p>
              </div>
              {pendientes.length === 0 ? (
                <div className="bg-white border border-emerald-200 rounded-xl p-12 text-center shadow-sm">
                  <p className="text-emerald-600 font-semibold text-base">✓ Todos los docentes están al día</p>
                  <p className="text-slate-400 text-sm mt-1">No hay pendientes en este periodo.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {pendientes.map(p => (
                    <div key={p.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-slate-300 transition-colors">
                      <p className="text-sm font-semibold text-slate-800 mb-0.5">{p.nombre}</p>
                      <p className="text-xs font-mono text-slate-400 mb-3">CI {p.cedula}</p>
                      <a
                        href={getWhatsAppLink(p)}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-2 text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 px-3 py-2 rounded-lg transition-colors"
                      >
                        <IconWhatsApp />
                        Enviar recordatorio
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══ SECCIÓN: PROFESORES ══════════════════════════════ */}
          {activeSection === 'profesores' && (
            <div className="space-y-4 animate-fade-in">
              {/* Formulario crear/editar */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-4">
                  {profeEditando ? 'Editar Docente' : 'Registrar Nuevo Docente'}
                </p>
                <form onSubmit={profeEditando ? guardarEdicionProfesor : crearProfesor} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      placeholder="Nombre completo"
                      className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 bg-slate-50"
                      value={profeEditando ? profeEditando.nombre : nuevoProfe.nombre}
                      onChange={e => profeEditando ? setProfeEditando({ ...profeEditando, nombre: e.target.value }) : setNuevoProfe({ ...nuevoProfe, nombre: e.target.value })}
                      required
                    />
                    <input
                      type="text"
                      placeholder="Cédula (C.I.)"
                      className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 bg-slate-50"
                      value={profeEditando ? profeEditando.cedula : nuevoProfe.cedula}
                      onChange={e => profeEditando ? setProfeEditando({ ...profeEditando, cedula: e.target.value }) : setNuevoProfe({ ...nuevoProfe, cedula: e.target.value })}
                      required
                    />
                    <input
                      type="text"
                      placeholder="Celular (Ej: 0991234567)"
                      className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 bg-slate-50"
                      value={profeEditando ? (profeEditando.celular || '') : nuevoProfe.celular}
                      onChange={e => profeEditando ? setProfeEditando({ ...profeEditando, celular: e.target.value }) : setNuevoProfe({ ...nuevoProfe, celular: e.target.value })}
                    />
                  </div>
                  {profeEditando && (
                    <div className="flex items-center gap-3">
                      <label className="text-xs font-semibold text-slate-500 uppercase">Estado:</label>
                      <select
                        className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400 bg-slate-50"
                        value={profeEditando.activo}
                        onChange={e => setProfeEditando({ ...profeEditando, activo: parseInt(e.target.value) })}
                      >
                        <option value={1}>Activo</option>
                        <option value={0}>Inactivo</option>
                      </select>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-sm font-semibold transition-colors">
                      {profeEditando ? 'Guardar cambios' : 'Registrar docente'}
                    </button>
                    {profeEditando && (
                      <button type="button" onClick={() => setProfeEditando(null)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
                        Cancelar
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Tabla de profesores */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><IconSearch /></span>
                    <input
                      type="text"
                      placeholder="Buscar por nombre o cédula..."
                      value={searchProfesores}
                      onChange={e => setSearchProfesores(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 bg-slate-50"
                    />
                  </div>
                </div>
                <div className="overflow-x-auto max-h-[50vh] overflow-y-auto custom-scrollbar">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 sticky top-0">
                      <tr className="text-slate-400 text-xs uppercase font-semibold">
                        <th className="px-6 py-3 text-left">Nombre</th>
                        <th className="px-6 py-3 text-left">Cédula</th>
                        <th className="px-6 py-3 text-left hidden md:table-cell">Celular</th>
                        <th className="px-6 py-3 text-center">Estado</th>
                        <th className="px-6 py-3 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {profesores
                        .filter(p => p.nombre.toLowerCase().includes(searchProfesores.toLowerCase()) || p.cedula.includes(searchProfesores))
                        .map(profe => (
                          <tr key={profe.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="px-6 py-3.5 font-medium text-slate-800">{profe.nombre}</td>
                            <td className="px-6 py-3.5 text-xs font-mono text-slate-500">{profe.cedula}</td>
                            <td className="px-6 py-3.5 text-xs hidden md:table-cell">
                              {profe.celular ? (
                                <a href={getWhatsAppLink(profe, true)} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-green-600 hover:text-green-800 font-medium transition-colors w-fit">
                                  <IconWhatsApp />
                                  {profe.celular}
                                </a>
                              ) : <span className="text-slate-300">—</span>}
                            </td>
                            <td className="px-6 py-3.5 text-center">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${profe.activo === 1 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                {profe.activo === 1 ? 'Activo' : 'Inactivo'}
                              </span>
                            </td>
                            <td className="px-6 py-3.5 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button onClick={() => setProfeEditando(profe)} className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors">
                                  <IconEdit /> Editar
                                </button>
                                <button onClick={() => eliminarProfesor(profe.id)} className="flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-700 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors">
                                  <IconTrash /> Eliminar
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      {profesores.filter(p => p.nombre.toLowerCase().includes(searchProfesores.toLowerCase()) || p.cedula.includes(searchProfesores)).length === 0 && (
                        <tr><td colSpan={5} className="text-center py-10 text-slate-400 italic text-xs">No se encontraron docentes.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ══ SECCIÓN: PERIODO ════════════════════════════════ */}
          {activeSection === 'periodo' && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm animate-fade-in">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-6">Configurar Periodo de Cobro</p>
              <form onSubmit={e => e.preventDefault()} className="space-y-5 max-w-2xl">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Nombre del periodo</label>
                    <input
                      type="text"
                      placeholder="Ej: Julio 2026"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 bg-slate-50"
                      value={config.mes_nombre}
                      onChange={e => setConfig({ ...config, mes_nombre: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Precio base ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 bg-slate-50 font-mono"
                      value={config.precio_base}
                      onChange={e => setConfig({ ...config, precio_base: parseFloat(e.target.value) || 0 })}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Enlace de pago DeUna</label>
                    <input
                      type="url"
                      placeholder="https://deuna.app/..."
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 bg-slate-50"
                      value={config.link_deuna || ''}
                      onChange={e => setConfig({ ...config, link_deuna: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Enlace de pago Banco de Loja</label>
                    <input
                      type="url"
                      placeholder="https://bancodeloja.fin.ec/..."
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 bg-slate-50"
                      value={config.link_loja || ''}
                      onChange={e => setConfig({ ...config, link_loja: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-slate-100">
                  <button type="button" onClick={actualizarConfig} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl text-sm font-semibold transition-colors">
                    Actualizar periodo activo
                  </button>
                  <button type="button" onClick={guardarConfig} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-sm font-semibold transition-colors">
                    Activar nuevo periodo
                  </button>
                </div>
                <p className="text-xs text-slate-400">
                  <strong>Actualizar</strong> modifica los datos del periodo vigente sin generar nuevas deudas. <strong>Activar nuevo</strong> cierra el periodo actual y registra como deudas los pagos no realizados.
                </p>
              </form>
            </div>
          )}

          {/* ══ SECCIÓN: AJUSTES DE CUOTA ════════════════════════ */}
          {activeSection === 'ajustes' && (
            <div className="space-y-4 animate-fade-in">
              {/* Formulario de ajuste */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Aplicar Descuento o Recargo</p>
                <p className="text-sm text-slate-500 mb-5">
                  Ajusta la cuota de un docente para el periodo activo. Los cambios se reflejarán en el próximo cálculo de pago.
                </p>
                <div className="relative mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Buscar docente</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><IconSearch /></span>
                    <input
                      type="text"
                      placeholder="Escribe un nombre..."
                      value={busquedaDocente}
                      onChange={e => setBusquedaDocente(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-400 bg-slate-50"
                    />
                  </div>
                  {busquedaDocente && (
                    <div className="absolute left-0 right-0 top-full mt-1 max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl z-50">
                      {profesores.filter(p => p.nombre.toLowerCase().includes(busquedaDocente.toLowerCase())).map(p => (
                        <div
                          key={p.id}
                          onClick={() => { setDocenteSeleccionado(p); setBusquedaDocente(''); }}
                          className="px-4 py-2.5 text-sm hover:bg-blue-50 cursor-pointer border-b last:border-0 border-slate-100 transition-colors"
                        >
                          <span className="font-semibold text-slate-700">{p.nombre}</span>
                          <span className="text-xs text-slate-400 font-mono ml-2">CI {p.cedula}</span>
                        </div>
                      ))}
                      {profesores.filter(p => p.nombre.toLowerCase().includes(busquedaDocente.toLowerCase())).length === 0 && (
                        <div className="px-4 py-3 text-sm text-slate-400 italic">No se encontraron docentes.</div>
                      )}
                    </div>
                  )}
                </div>
                {docenteSeleccionado && (
                  <form onSubmit={aplicarDescuento} className="border border-slate-200 rounded-xl p-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-semibold text-slate-800">{docenteSeleccionado.nombre}</p>
                      <button type="button" onClick={() => { setDocenteSeleccionado(null); setMontoDescuento(''); setMontoRecargo(''); setMotivoDesc(''); setMotivoRec(''); }} className="text-xs text-slate-400 hover:text-red-500 transition-colors">
                        Cancelar ×
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl space-y-3">
                        <label className="block text-xs font-bold text-emerald-700 uppercase">Descuento (restar)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">$</span>
                          <input type="number" step="0.01" placeholder="0.00" value={montoDescuento} onChange={e => setMontoDescuento(e.target.value)} className="w-full pl-7 pr-3 py-2 border border-slate-200 rounded-lg text-sm font-mono text-emerald-700 outline-none focus:border-emerald-300 bg-white" />
                        </div>
                        <input type="text" placeholder="Motivo (Ej: Beca, Convenio...)" value={motivoDesc} onChange={e => setMotivoDesc(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-emerald-300 bg-white text-slate-700" />
                      </div>
                      <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl space-y-3">
                        <label className="block text-xs font-bold text-amber-700 uppercase">Recargo (sumar)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">$</span>
                          <input type="number" step="0.01" placeholder="0.00" value={montoRecargo} onChange={e => setMontoRecargo(e.target.value)} className="w-full pl-7 pr-3 py-2 border border-slate-200 rounded-lg text-sm font-mono text-amber-700 outline-none focus:border-amber-300 bg-white" />
                        </div>
                        <input type="text" placeholder="Motivo (Ej: Pago atrasado...)" value={motivoRec} onChange={e => setMotivoRec(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-amber-300 bg-white text-slate-700" />
                      </div>
                    </div>
                    <button type="submit" className="w-full bg-slate-800 hover:bg-slate-700 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors">
                      Aplicar ajustes
                    </button>
                  </form>
                )}
              </div>

              {/* Ajustes activos */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Ajustes activos del periodo</p>
                </div>
                {descuentos.length === 0 ? (
                  <p className="text-center py-10 text-slate-400 text-sm italic">Ningún docente tiene ajustes aplicados en este periodo.</p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {descuentos.map(d => (
                      <div key={d.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors">
                        <div>
                          <p className="text-sm font-medium text-slate-800">{d.nombre}</p>
                          <p className="text-xs font-mono text-slate-400">CI {d.cedula}</p>
                          {d.motivo_descuento && <p className="text-xs text-emerald-600 italic mt-0.5">Desc: {d.motivo_descuento}</p>}
                          {d.motivo_recargo && <p className="text-xs text-amber-600 italic">Rec: {d.motivo_recargo}</p>}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col items-end gap-1">
                            {d.descuento > 0 && <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">−${d.descuento.toFixed(2)}</span>}
                            {d.recargo > 0 && <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">+${d.recargo.toFixed(2)}</span>}
                          </div>
                          <button onClick={() => eliminarDescuento(d.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            <IconTrash className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══ SECCIÓN: HISTORIAL ══════════════════════════════ */}
          {activeSection === 'historial' && (
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden animate-fade-in">
              <div className="px-6 py-5 border-b border-slate-100">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><IconSearch /></span>
                  <input
                    type="text"
                    placeholder="Buscar por nombre, mes o estado..."
                    value={searchHistorial}
                    onChange={e => setSearchHistorial(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 bg-slate-50"
                  />
                </div>
              </div>
              <div className="overflow-x-auto max-h-[65vh] overflow-y-auto custom-scrollbar">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr className="text-slate-400 text-xs uppercase font-semibold">
                      <th className="px-6 py-3 text-left">Docente / Mes</th>
                      <th className="px-6 py-3 text-left">Base</th>
                      <th className="px-6 py-3 text-left hidden md:table-cell">Ajustes</th>
                      <th className="px-6 py-3 text-left">Total pagado</th>
                      <th className="px-6 py-3 text-center">Estado</th>
                      <th className="px-6 py-3 text-right">Recibo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {historialGeneral
                      .filter(h => h.nombre.toLowerCase().includes(searchHistorial.toLowerCase()) || h.mes_nombre.toLowerCase().includes(searchHistorial.toLowerCase()) || h.estado.toLowerCase().includes(searchHistorial.toLowerCase()))
                      .map(h => (
                        <tr key={h.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-medium text-slate-800">{h.nombre}</div>
                            <div className="text-xs text-slate-400 mt-0.5">{h.mes_nombre}</div>
                          </td>
                          <td className="px-6 py-4 font-mono text-slate-500">${h.precio_base?.toFixed(2)}</td>
                          <td className="px-6 py-4 text-xs font-mono hidden md:table-cell">
                            {h.descuento_aplicado > 0 && <div className="text-emerald-600">−${h.descuento_aplicado.toFixed(2)}{h.motivo_descuento && <span className="text-[10px] text-slate-400 font-normal italic block">({h.motivo_descuento})</span>}</div>}
                            {h.recargo_aplicado > 0 && <div className="text-amber-600">+${h.recargo_aplicado.toFixed(2)}{h.motivo_recargo && <span className="text-[10px] text-slate-400 font-normal italic block">({h.motivo_recargo})</span>}</div>}
                            {h.descuento_aplicado === 0 && h.recargo_aplicado === 0 && <span className="text-slate-300">—</span>}
                          </td>
                          <td className="px-6 py-4 font-mono font-semibold text-emerald-600">${h.precio_final_pagado?.toFixed(2)}</td>
                          <td className="px-6 py-4 text-center"><StatusBadge estado={h.estado} /></td>
                          <td className="px-6 py-4 text-right">
                            {h.comprobante_path && (
                              <button onClick={() => setFotoModal(h.comprobante_path)} className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg transition-colors ml-auto">
                                <IconEye /> Ver
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    {historialGeneral.filter(h => h.nombre.toLowerCase().includes(searchHistorial.toLowerCase()) || h.mes_nombre.toLowerCase().includes(searchHistorial.toLowerCase()) || h.estado.toLowerCase().includes(searchHistorial.toLowerCase())).length === 0 && (
                      <tr><td colSpan={6} className="text-center py-16 text-slate-400 italic text-sm">No se encontraron registros.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ══ SECCIÓN: AVANZADO ═══════════════════════════════ */}
          {activeSection === 'avanzado' && (
            <div className="animate-fade-in">
              <div className="mb-4 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                <IconAlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                <p>Las acciones de esta sección son <strong>irreversibles</strong>. Úsalas con cuidado.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                  <h4 className="font-semibold text-slate-800 mb-1">Perdonar deudas globales</h4>
                  <p className="text-sm text-slate-500 mb-5">
                    Actualiza el mes de ingreso de todos los docentes al mes activo actual, eliminando cualquier deuda pendiente de meses anteriores.
                  </p>
                  <button onClick={perdonarDeudasGlobales} className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors">
                    Perdonar todas las deudas
                  </button>
                </div>
                <div className="bg-white border border-red-200 rounded-xl p-6 shadow-sm">
                  <h4 className="font-semibold text-red-800 mb-1">Borrado total de datos</h4>
                  <p className="text-sm text-red-700/70 mb-5">
                    Elimina todos los datos de profesores, pagos y configuración (excepto cuentas de administrador). Esta acción no se puede deshacer.
                  </p>
                  <button onClick={resetDatos} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors">
                    Resetear base de datos
                  </button>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ── Modal de foto ─────────────────────────────────────── */}
      {fotoModal && (
        <div className="fixed inset-0 bg-slate-950/75 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-fade-in">
          <div className="relative max-w-3xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center px-5 py-4 border-b border-slate-100">
              <p className="text-sm font-semibold text-slate-700">Comprobante de pago</p>
              <button
                onClick={() => setFotoModal(null)}
                className="text-slate-400 hover:text-slate-700 transition-colors p-1 rounded-lg hover:bg-slate-100"
              >
                <IconX className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <img src={fotoModal} alt="Comprobante bancario" className="w-full h-auto max-h-[75vh] object-contain rounded-xl" />
            </div>
          </div>
        </div>
      )}

      {/* ── Toast Notification ───────────────────────────────── */}
      {notificacion && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-in-right">
          <div className={`flex items-center gap-3 px-4 py-3.5 rounded-xl shadow-lg border max-w-sm text-sm font-medium bg-white ${
            notificacion.type === 'error' ? 'text-red-700 border-red-200' :
            notificacion.type === 'warning' ? 'text-amber-700 border-amber-200' :
            'text-emerald-700 border-emerald-200'
          }`}>
            <span className="shrink-0">
              {notificacion.type === 'error' ? <IconX className="w-4 h-4" /> :
               notificacion.type === 'warning' ? <IconAlertCircle className="w-4 h-4" /> :
               <IconCheck className="w-4 h-4" />}
            </span>
            <span className="flex-1">{notificacion.text}</span>
            <button onClick={() => setNotificacion(null)} className="text-slate-400 hover:text-slate-600 font-bold transition-colors ml-1">×</button>
          </div>
        </div>
      )}
    </div>
  );
}
