# Guía de Funciones y Arquitectura del Sistema

Esta guía documenta la estructura, las herramientas utilizadas y el porqué de cada decisión técnica tomada en el desarrollo de la plataforma de "Internet Conservatorio".

## 🛠 Herramientas Utilizadas

1. **Frontend (Interfaz Gráfica):**
   - **React (Vite):** Elegido por su velocidad de compilación y su capacidad para crear interfaces reactivas mediante componentes.
   - **TailwindCSS:** Framework de estilos que permite diseñar interfaces modernas y responsive rápidamente utilizando clases utilitarias (ej. `bg-emerald-500`, `rounded-xl`).
2. **Backend (Servidor):**
   - **Node.js con Express:** Servidor ligero y rápido, ideal para manejar las peticiones HTTP (APIs) y recibir los comprobantes de pago mediante `multer`.
3. **Base de Datos:**
   - **SQLite (`sqlite3`):** Base de datos relacional en un solo archivo local (`database.db`). Elegida porque no requiere instalaciones complejas de servidores de bases de datos, ideal para proyectos de tamaño mediano/pequeño.

---

## 🏗 Estructura del Sistema

### 1. El Backend (`backend/server.js` y `backend/database.js`)
**¿Por qué está separado?**
Para separar la lógica de negocio (seguridad, cálculo de deudas) de la vista. Si alguna vez decides hacer una app móvil, el backend seguirá funcionando sin cambios.

#### Lógica de Migraciones y Semillas (`database.js`)
El sistema está diseñado para "auto-sanarse". Si la base de datos se borra, el código detecta esto y vuelve a crear las tablas y datos básicos (mes de prueba, administrador y profesores semilla).
```javascript
// Ejemplo de "Semilla" automática para evitar que el sistema quede inoperable
db.get("SELECT COUNT(*) as count FROM meses_config", (err, row) => {
    if (row && row.count === 0) {
        db.run("INSERT INTO meses_config (mes_nombre, precio_base, descuento, activo, abierto) VALUES (?, ?, ?, 1, 1)", ["Mayo 2026", 10.0, 2.0]);
    }
});
```

#### Cálculo Automático de Deuda (`server.js`)
En lugar de forzar al administrador a registrar deudas manualmente, el sistema **calcula la deuda en tiempo real** revisando el historial de cada profesor.
**¿El Por qué?** Evita el error humano de olvidar registrar una deuda. El código revisa cada mes desde que el profesor ingresó, y si no hay un pago "aprobado", lo suma como deuda.
```javascript
// Lógica interna simplificada:
if (!pago || pago.estado !== 'aprobado') {
    deudaAcumulada += (precio_base - descuento_aplicado);
}
```

### 2. Portal de Profesores (`frontend/src/FormularioPago.jsx`)
Es la pantalla pública. Su principal desafío era la subida del comprobante.
**¿Por qué el Portapapeles?**
Subir un archivo desde los documentos es tedioso. Implementamos una función para que el profesor simplemente presione `Ctrl+V` (Pegar) o use un botón para leer su portapapeles. Esto mejora drásticamente la Experiencia de Usuario (UX).
```javascript
// Ejemplo: Leer el portapapeles directamente
const leerPortapapeles = async () => {
    const items = await navigator.clipboard.read();
    for (const item of items) {
        if (item.types.some(type => type.startsWith('image/'))) {
            const blob = await item.getType('image/png');
            procesarImagen(blob); // Muestra la foto en pantalla
        }
    }
};
```

### 3. Panel de Administración (`frontend/src/AdminDashboard.jsx`)
Es el panel privado. Su estructura se basa en **Reactividad Total** (`cargarTodo()`).
**¿Por qué Reactividad Total?**
En sistemas tradicionales, si apruebas un pago, debes recargar la página para ver cómo bajan las deudas y suben los ingresos. Aquí, agrupamos todas las llamadas de actualización en una sola función `cargarTodo()`. Al hacer clic en "Aprobar", la interfaz entera se sincroniza al instante simulando tiempo real.
```javascript
const validarPago = async (pago_id, nuevoEstado) => {
    const res = await fetch('...', { method: 'POST', body: JSON.stringify({ pago_id, estado: nuevoEstado }) });
    if (res.ok) {
        cargarTodo(); // ← ¡La Magia! Recarga ingresos, rankings, historiales y pendientes a la vez.
    }
};
```

### 4. Filtros en el Frontend
En lugar de hacer peticiones lentas a la base de datos cada vez que se escribe en el buscador, hacemos el filtro directamente en la memoria del navegador.
```javascript
// Filtrado inteligente usando .filter() e .includes()
const profesoresFiltrados = profesores.filter(p => 
    p.nombre.toLowerCase().includes(searchProfesores.toLowerCase()) || 
    p.cedula.includes(searchProfesores)
);
```

### 5. Reseteo de Base de Datos (Zona de Peligro)
Para facilitar el inicio de periodos reales de recaudación sin necesidad de manipular o borrar el archivo `database.db` manualmente por consola, se expone un endpoint del servidor que limpia la información transaccional y de usuarios regulares, pero conserva las credenciales de administración.

**¿El Por qué?**
Si el script eliminara a los administradores, el usuario perdería el acceso al sistema inmediatamente y quedaría bloqueado de la consola de control. Al conservar los datos de la tabla `admins`, el administrador puede reingresar y configurar los nuevos datos reales al instante.
```javascript
// Borrado en cascada manual de datos de negocio
db.serialize(() => {
    db.run("DELETE FROM pagos");
    db.run("DELETE FROM descuentos_mes");
    db.run("DELETE FROM meses_config");
    db.run("DELETE FROM profesores");
    db.run("DELETE FROM sqlite_sequence WHERE name IN ('pagos', 'descuentos_mes', 'meses_config', 'profesores')");
});
```
