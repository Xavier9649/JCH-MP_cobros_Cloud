# Guía de Despliegue — Internet Conservatorio

Este proyecto usa **SQLite** (base de datos en archivo local) y **Multer** (subida de comprobantes al disco). Esto impone una restricción clave: el backend **necesita un servidor con sistema de archivos persistente**. Plataformas puramente serverless (como Vercel, Netlify Functions) no son compatibles directamente.

---

## Opciones Recomendadas

### ✅ Opción A — Servidor VPS (Recomendada para Producción)
**Costo:** ~$4–6 USD/mes | **Ejemplo:** DigitalOcean Droplet, Contabo, Hetzner, Hostinger VPS.

Esta es la opción más robusta y sin limitaciones.

**Pasos:**
1. Contratar un VPS Linux (Ubuntu 22.04 recomendado).
2. Instalar Node.js:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt install -y nodejs
   ```
3. Clonar el proyecto en el servidor:
   ```bash
   git clone <tu-repositorio> /var/www/conservatorio
   ```
4. Instalar dependencias del backend:
   ```bash
   cd /var/www/conservatorio/backend && npm install
   ```
5. Construir el frontend:
   ```bash
   cd /var/www/conservatorio/frontend && npm install && npm run build
   ```
6. Configurar el backend para servir también el frontend estático:
   ```javascript
   // Agregar en server.js, ANTES del app.listen()
   const path = require('path');
   app.use(express.static(path.join(__dirname, '../frontend/dist')));
   app.get('*', (req, res) => {
     res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
   });
   ```
7. Ejecutar con PM2 (gestor de procesos) para que no se detenga:
   ```bash
   sudo npm install -g pm2
   pm2 start /var/www/conservatorio/backend/server.js --name conservatorio
   pm2 startup   # Arrancar al reinicio del servidor
   pm2 save
   ```
8. Opcional: Configurar Nginx como proxy reverso en el puerto 80/443 y agregar HTTPS con Let's Encrypt.

---

### ✅ Opción B — Railway (Recomendada para Pruebas / Sin tarjeta de crédito)
**Costo:** Gratis (500 horas/mes) | **Web:** [railway.app](https://railway.app)

Railway soporta aplicaciones Node.js con disco persistente y es muy sencillo.

**Pasos:**
1. Crear cuenta en [railway.app](https://railway.app).
2. Crear un nuevo proyecto y conectar tu repositorio de GitHub.
3. Agregar la lógica para servir el frontend desde el backend (igual al paso 6 de Opción A).
4. En Railway, configurar la variable de entorno `PORT` si es necesario (Railway asigna el puerto dinámicamente):
   ```javascript
   // Cambiar en server.js
   const PORT = process.env.PORT || 3001;
   app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
   ```
5. Seleccionar la carpeta `backend` como directorio raíz del servicio.
6. Railway construirá y desplegará automáticamente al hacer `git push`.

> **Nota:** El disco en el plan gratuito se reinicia periódicamente. Los comprobantes subidos pueden perderse. Para producción real, usar el plan pagado o Opción A.

---

### ✅ Opción C — Render (Alternativa gratuita)
**Costo:** Gratis (con limitaciones) | **Web:** [render.com](https://render.com)

Similar a Railway. El servicio gratuito "hiberna" tras 15 minutos de inactividad (tarda ~30s en responder la primera petición).

**Pasos:**
1. Crear cuenta en [render.com](https://render.com).
2. Crear un **Web Service** conectado a tu repositorio.
3. Configurar:
   - **Build Command:** `cd frontend && npm install && npm run build && cd ../backend && npm install`
   - **Start Command:** `node backend/server.js`
4. Agregar el paso 6 de la Opción A para servir el frontend.
5. Crear un **Persistent Disk** en Render y montarlo en `/data`, luego ajustar la ruta de la base de datos:
   ```javascript
   // En database.js — usar ruta persistente en producción
   const dbPath = process.env.NODE_ENV === 'production' ? '/data/database.db' : './database.db';
   const db = new sqlite3.Database(dbPath);
   ```

---

## 🔧 Cambios de Código Necesarios para Producción

### 1. Servir el Frontend desde el Backend (obligatorio en todas las opciones)
Agregar al final de `backend/server.js`, justo antes de `app.listen()`:

```javascript
const path = require('path');
// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, '../frontend/dist')));
// Ruta comodín para SPA (Single Page App)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});
```

### 2. Puerto Dinámico (obligatorio en Railway / Render)
```javascript
// En server.js — Reemplazar la línea app.listen
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Servidor Backend corriendo en http://localhost:${PORT}`);
});
```

### 3. URL del Backend en el Frontend (si frontend y backend están separados)
Si decides alojar frontend y backend en servicios diferentes, reemplaza todas las URLs hardcodeadas en el frontend:
```javascript
// Crear frontend/src/config.js
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Usar en los fetch:
import { API_URL } from './config';
fetch(`${API_URL}/api/profesores/...`);
```
Y en Railway/Render, crear la variable de entorno:
```
VITE_API_URL=https://tu-backend.railway.app
```

---

## 📋 Comparación Rápida

| | VPS (Hostinger) | Railway | Render |
|---|---|---|---|
| **Costo** | ~$4/mes | Gratis / $5 | Gratis / $7 |
| **Persistencia de archivos** | ✅ Completa | ⚠️ Plan pagado | ✅ Con disco |
| **Tiempo activo** | ✅ 24/7 | ✅ 24/7 | ⚠️ Hiberna gratis |
| **Dificultad** | Media | Muy fácil | Fácil |
| **HTTPS** | Con Nginx | ✅ Automático | ✅ Automático |
| **Recomendado para** | Producción real | Demos / pruebas | Demos / pruebas |

---

## 🚀 Flujo Recomendado

Para este proyecto (uso interno de un conservatorio), la recomendación es:

1. **Ahora (pruebas):** Usar **Railway** con los cambios de código indicados. En 10 minutos tienes una URL pública funcional.
2. **Futuro (producción):** Contratar un **VPS de Hostinger** (~$4/mes) y configurar con PM2 + Nginx para máxima estabilidad y persistencia de comprobantes.
