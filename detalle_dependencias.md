# Detalle de Dependencias — Internet Conservatorio

## Entorno de ejecución

| Herramienta | Versión |
|---|---|
| **Node.js** | v24.13.1 |
| **npm** | v11.6.0 |

---

## Backend

**Lenguaje:** JavaScript (Node.js)  
**Framework:** Express.js v5  
**Base de datos:** SQLite3 (local) / PostgreSQL (producción en Railway)  
**Almacenamiento de imágenes:** Cloudinary  

### Dependencias de producción

| Paquete | Versión | Propósito |
|---|---|---|
| `express` | ^5.2.1 | Framework HTTP — servidor de rutas y API REST |
| `cors` | ^2.8.6 | Middleware para habilitar CORS entre frontend y backend |
| `dotenv` | ^17.4.2 | Carga de variables de entorno desde `.env` |
| `multer` | ^2.1.1 | Middleware para subida de archivos (comprobantes de pago) |
| `multer-storage-cloudinary` | ^4.0.0 | Adaptador de multer para subir directamente a Cloudinary |
| `cloudinary` | ^1.41.3 | SDK de Cloudinary para gestión de imágenes en la nube |
| `sqlite3` | ^6.0.1 | Driver SQLite para base de datos local de desarrollo |
| `pg` | ^8.21.0 | Driver PostgreSQL para base de datos en producción (Railway) |

### Dependencias de desarrollo

| Paquete | Versión | Propósito |
|---|---|---|
| `nodemon` | ^3.1.14 | Reinicio automático del servidor al detectar cambios en archivos |

### Scripts disponibles

```bash
npm run dev    # Inicia con nodemon (desarrollo, recarga automática)
npm run start  # Inicia con node (producción)
```

---

## Frontend

**Lenguaje:** JavaScript (JSX)  
**Framework/Librería UI:** React v19  
**Bundler:** Vite v8  
**Estilos:** Tailwind CSS v4  
**Fuente tipográfica:** Inter (Google Fonts, cargada vía CDN)  

### Dependencias de producción

| Paquete | Versión | Propósito |
|---|---|---|
| `react` | ^19.2.4 | Librería principal de UI — renderizado de componentes |
| `react-dom` | ^19.2.4 | Renderizado de React en el DOM del navegador |
| `@tailwindcss/postcss` | ^4.2.2 | Plugin de PostCSS para procesar Tailwind CSS v4 |

### Dependencias de desarrollo

| Paquete | Versión | Propósito |
|---|---|---|
| `vite` | ^8.0.4 | Bundler y servidor de desarrollo con HMR |
| `@vitejs/plugin-react` | ^6.0.1 | Plugin de Vite para soporte de JSX/React con Babel |
| `tailwindcss` | ^4.2.2 | Framework de utilidades CSS |
| `postcss` | ^8.5.9 | Procesador CSS (requerido por Tailwind v4) |
| `autoprefixer` | ^10.4.27 | Agrega prefijos CSS para compatibilidad de navegadores |
| `eslint` | ^9.39.4 | Linter estático de JavaScript/JSX |
| `@eslint/js` | ^9.39.4 | Configuración base de reglas ESLint para JavaScript |
| `eslint-plugin-react-hooks` | ^7.0.1 | Reglas de ESLint para el uso correcto de Hooks de React |
| `eslint-plugin-react-refresh` | ^0.5.2 | Reglas de ESLint para compatibilidad con React Fast Refresh |
| `globals` | ^17.4.0 | Definiciones de variables globales para ESLint |
| `@types/react` | ^19.2.14 | Tipos TypeScript para React (uso en editores con intellisense) |
| `@types/react-dom` | ^19.2.3 | Tipos TypeScript para ReactDOM |

### Scripts disponibles

```bash
npm run dev      # Servidor de desarrollo en http://localhost:5173
npm run build    # Compila para producción en /dist
npm run preview  # Vista previa del build de producción
npm run lint     # Ejecuta ESLint sobre el código fuente
```

---

## Raíz del proyecto

Scripts disponibles desde la carpeta raíz:

```bash
npm run build           # Instala dependencias del frontend y compila
npm run start           # Inicia el backend (producción)
npm run install:backend # Instala dependencias del backend
```

---

## Servicios externos

| Servicio | Uso |
|---|---|
| **Cloudinary** | Almacenamiento de comprobantes de pago subidos por docentes |
| **Railway** | Plataforma PaaS de despliegue (backend + PostgreSQL en producción) |
| **Google Fonts** | Fuente tipográfica Inter (cargada desde CDN en index.html) |
| **WhatsApp API** | Generación de links wa.me para recordatorios a docentes |
