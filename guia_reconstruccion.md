# Guía de Construcción desde Cero (Paso a Paso)

Si deseas recrear este proyecto o utilizarlo como práctica con IA (Gemini, NotebookLM, Claude), sigue este orden estricto de construcción.

---

## 1. Preparación del Entorno
Antes de escribir código, se deben crear los cimientos.

**Comandos en Terminal:**
1. Crear el Frontend (React): `npm create vite@latest frontend -- --template react`
2. Instalar utilidades en Frontend: `cd frontend && npm install && npm install tailwindcss postcss autoprefixer && npx tailwindcss init -p`
3. Crear el Backend: `mkdir backend && cd backend && npm init -y`
4. Instalar librerías en Backend: `npm install express cors sqlite3 multer`

---

## 2. Modelado de Base de Datos (`backend/database.js`)
**IMPORTANTE:** El orden de creación de las tablas importa debido a las Claves Foráneas (Foreign Keys). Un pago no puede existir sin un profesor y un mes.

**Orden de creación sugerido:**
1. **`profesores`:** (`id`, `nombre`, `cedula`, `celular`, `activo`, `mes_ingreso_id`)
2. **`meses_config`:** (`id`, `mes_nombre`, `precio_base`, `descuento`, `activo`, `abierto`)
3. **`descuentos_mes`:** Requiere los IDs de Profesores y Meses (`mes_id`, `profesor_id`, `descuento`).
4. **`pagos`:** Requiere los IDs de Profesores y Meses (`profesor_id`, `mes_id`, `monto_pagado`, `estado`, `comprobante_path`).
5. **`admins`:** Independiente (`username`, `password_hash`).

*(Práctica: Pide a la IA que genere el script en Node.js usando `sqlite3` para crear estas 5 tablas en ese orden exacto, asegurándote de usar `db.serialize`).*

---

## 3. Construcción de la API Backend (`backend/server.js`)
Una vez tengas la BD, necesitas exponer los datos. El orden lógico de desarrollo es:

1. **Configuración Inicial:** Configurar Express, habilitar CORS, y configurar `multer` para guardar las imágenes de los comprobantes en una carpeta local (`/comprobantes`).
2. **Endpoint de Autenticación (`POST /api/login`):** Crear un validador básico que compare el hash de la contraseña ingresada con el de la tabla `admins`.
3. **Endpoints de Lectura (GET):**
   - Obtener mes activo.
   - Listar profesores (incluir cálculo de si pagaron o no).
   - Listar historial general (JOIN entre `pagos`, `profesores` y `meses_config`).
4. **Endpoint Estrella - Cálculo de Deuda (`GET /api/profesores/:id/historial`):**
   - *(Reto de programación:)* Pide a la IA que extraiga todos los meses históricos desde el `mes_ingreso_id` del profesor. Si en algún mes no existe un pago con estado `aprobado`, que sume el precio base de ese mes al saldo de la deuda.
5. **Endpoints de Escritura y Operaciones Administrativas (POST/PUT/DELETE):**
   - Subir comprobante (`multer`).
   - Crear profesor, activar nuevo mes, aplicar ajuste/descuento.
   - Reset de datos (`POST /api/admin/reset-datos`): Borrar registros de todas las tablas de datos (pagos, descuentos, configuración de meses, profesores) y reiniciar secuencias (`sqlite_sequence`) conservando los administradores.

---

## 4. Frontend - Portal Público (`frontend/src/FormularioPago.jsx`)
Construir la pantalla que usarán los docentes.

1. **Identificación:** Un input para la Cédula. Al dar 'Enter', hacer un fetch a la API para ver si existe y traer su deuda.
2. **Renderizado Condicional:** Si debe meses anteriores, mostrar una caja roja (⚠️ Deuda meses anteriores). Si solo debe el actual, mostrar la cuota normal.
3. **Manejo de Imágenes:** 
   - Crear un `input type="file"`.
   - Añadir soporte para `onPaste` (portapapeles) en el `div` principal.
4. **Envío (Submit):** Construir un `FormData` y enviarlo mediante un `fetch(POST)` a la ruta de guardado del backend.

---

## 5. Frontend - Panel de Control (`frontend/src/AdminDashboard.jsx`)
La pantalla maestra para la gestión.

1. **Estructura de Estados (`useState`):**
   - Crear variables para `pagosRecibidos`, `pendientes`, `historialGeneral`, `stats`.
2. **El "Orquestador" (`cargarTodo()`):**
   - Crear una función maestra que ejecute todos los `fetch` hacia las tablas del backend simultáneamente mediante `React.useCallback()`.
3. **Construcción de Módulos Visuales:**
   - **Módulo de Validación:** Mapear los comprobantes recibidos. Añadir botones de Aprobar/Rechazar que envíen el ID a la API y llamen a `cargarTodo()` al finalizar.
   - **Módulo de Pendientes:** Filtrar a los profesores que no han pagado. Usar etiquetas `<a>` para los enlaces directos a WhatsApp `wa.me/celular`.
   - **Historial General:** Diseñar una tabla HTML que liste el historial histórico.
4. **Filtros (Buscadores):**
   - Usar un campo de texto y filtrar el array en tiempo real (`.filter(item => item.nombre.includes(busqueda))`) antes de renderizar la tabla con `.map()`.
5. **Zona de Peligro (Resetear Datos):**
   - Crear un botón de acción destructiva con confirmación doble en el frontend. Al ser confirmado, invoca al endpoint de reseteo del backend y desloguea la sesión del administrador para forzar la recarga limpia.
