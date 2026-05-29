// Configuración de la URL del API
// En producción (Railway), el frontend y backend comparten el mismo dominio,
// así que no se necesita una URL base. En desarrollo, apuntamos al localhost del backend.
const API_URL = import.meta.env.VITE_API_URL || '';

export default API_URL;
