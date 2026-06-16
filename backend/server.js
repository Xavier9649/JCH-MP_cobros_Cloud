require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const db = require('./database');

const app = express();

// Configuración de Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Middleware
app.use(cors());
app.use(express.json());

// Configuración de Multer con Cloudinary (imágenes en la nube)
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'conservatorio-comprobantes',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
    },
});
const upload = multer({ storage: storage });

// Función auxiliar para hashing
function getHash(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

// Middleware de Autenticación de Administrador
const adminAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader === 'admin-secret-token') {
        next();
    } else {
        res.status(401).json({ error: 'Acceso no autorizado' });
    }
};

// --- RUTAS DE AUTENTICACIÓN ---

// Login de Administrador
app.post('/api/auth/admin/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Faltan credenciales' });
    }
    const hash = getHash(password);
    db.get('SELECT * FROM admins WHERE username = ? AND password_hash = ?', [username, hash], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (row) {
            res.json({ success: true, token: 'admin-secret-token' });
        } else {
            res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
        }
    });
});

// Login de Profesor por Cédula
app.post('/api/auth/profesor/login', (req, res) => {
    const { cedula } = req.body;
    if (!cedula) {
        return res.status(400).json({ error: 'Se requiere el número de cédula' });
    }
    db.get('SELECT id, nombre, cedula, activo FROM profesores WHERE cedula = ? AND activo = 1', [cedula], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (row) {
            res.json({ success: true, profesor: row });
        } else {
            res.status(404).json({ error: 'Profesor no registrado o inactivo' });
        }
    });
});

// --- RUTAS PARA PROFESORES ---

// 1. Obtener lista de profesores activos
app.get('/api/profesores', (req, res) => {
    db.all("SELECT id, nombre, cedula FROM profesores WHERE activo = 1 ORDER BY nombre ASC", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// 2. Obtener datos del mes activo y precio final
app.get('/api/mes-actual', (req, res) => {
    db.get("SELECT * FROM meses_config WHERE activo = 1", (err, row) => {
        if (row) {
            const precioFinal = row.precio_base;
            res.json({ ...row, precioFinal });
        } else {
            res.status(404).json({ error: "No hay un periodo de cobro activo" });
        }
    });
});

// 3. Obtener historial de pagos y estado para un profesor específico
app.get('/api/profesores/:id/historial', (req, res) => {
    const profesorId = req.params.id;
    
    // Obtener historial de pagos del profesor
    const queryPagos = `
        SELECT p.id as pago_id, p.monto_pagado, p.comprobante_path, p.estado, p.fecha_registro, m.mes_nombre
        FROM pagos p
        JOIN meses_config m ON p.mes_id = m.id
        WHERE p.profesor_id = ?
        ORDER BY p.fecha_registro DESC`;
        
    db.all(queryPagos, [profesorId], (err, pagos) => {
        if (err) return res.status(500).json({ error: err.message });
        
        // Obtener el mes activo para verificar si ya pagó este mes
        db.get("SELECT * FROM meses_config WHERE activo = 1", (err, mesActivo) => {
            if (err) return res.status(500).json({ error: err.message });
            
            if (mesActivo) {
                // 1. Calcular deuda pasada
                const queryDeuda = `
                    SELECT m.id, m.precio_base, COALESCE(d.descuento, 0) as dcto, COALESCE(d.recargo, 0) as rcgo
                    FROM meses_config m
                    JOIN profesores p ON p.id = ?
                    LEFT JOIN descuentos_mes d ON d.mes_id = m.id AND d.profesor_id = p.id
                    WHERE m.activo = 0 
                    AND m.id >= COALESCE(p.mes_ingreso_id, 1)
                    AND m.id NOT IN (
                        SELECT mes_id FROM pagos WHERE profesor_id = p.id AND estado = 'aprobado'
                    )
                `;
                db.all(queryDeuda, [profesorId], (err, deudas) => {
                    if (err) return res.status(500).json({ error: err.message });
                    
                    let totalDeuda = 0;
                    deudas.forEach(d => {
                        totalDeuda += Math.max(0, d.precio_base - d.dcto + d.rcgo);
                    });

                    // 2. Calcular precio del mes actual
                    db.get("SELECT descuento, recargo, motivo_descuento, motivo_recargo FROM descuentos_mes WHERE mes_id = ? AND profesor_id = ?", [mesActivo.id, profesorId], (err, descRow) => {
                        if (err) return res.status(500).json({ error: err.message });
                        
                        const descuentoAplicable = descRow ? descRow.descuento : 0;
                        const recargoAplicable = descRow ? (descRow.recargo || 0) : 0;
                        const motivoDesc = descRow ? (descRow.motivo_descuento || '') : '';
                        const motivoRec = descRow ? (descRow.motivo_recargo || '') : '';
                        const precioMesActual = Math.max(0, mesActivo.precio_base - descuentoAplicable + recargoAplicable);
                        const precioFinal = precioMesActual + totalDeuda;
                        
                        // 3. Estado del pago actual
                        const queryPagoActual = `SELECT * FROM pagos WHERE profesor_id = ? AND mes_id = ? ORDER BY fecha_registro DESC LIMIT 1`;
                        db.get(queryPagoActual, [profesorId, mesActivo.id], (err, pagoActual) => {
                            if (err) return res.status(500).json({ error: err.message });
                            res.json({
                                pagos,
                                mesActivo: {
                                    ...mesActivo,
                                    precioFinal, // Cuota actual + deuda
                                    precioMesActual, // Solo cuota actual
                                    deudaPasada: totalDeuda,
                                    descuentoAplicado: descuentoAplicable,
                                    recargoAplicado: recargoAplicable,
                                    motivoDescuento: motivoDesc,
                                    motivoRecargo: motivoRec
                                },
                                pagoActual
                            });
                        });
                    });
                });
            } else {
                res.json({ pagos, mesActivo: null, pagoActual: null });
            }
        });
    });
});

// 4. Registrar el pago (con validación de periodo abierto)
app.post('/api/pagos', upload.single('comprobante'), (req, res) => {
    const { profesor_id, mes_id, monto } = req.body;
    // Con Cloudinary, req.file.path contiene la URL pública de la imagen
    const comprobante_path = req.file ? req.file.path : null;

    if (!profesor_id || !comprobante_path || !mes_id) {
        return res.status(400).json({ error: "Faltan datos o la imagen del pago" });
    }

    // Verificar si el mes actual está abierto para pagos
    db.get("SELECT abierto FROM meses_config WHERE id = ?", [mes_id], (err, mes) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!mes) return res.status(404).json({ error: "Periodo de cobro no encontrado" });
        if (mes.abierto === 0) {
            return res.status(400).json({ error: "El periodo de recepción de comprobantes está cerrado." });
        }

        // Verificar si ya existe un pago pendiente o aprobado para este periodo
        db.get("SELECT id FROM pagos WHERE profesor_id = ? AND mes_id = ? AND estado != 'rechazado'", [profesor_id, mes_id], (err, pagoExistente) => {
            if (err) return res.status(500).json({ error: err.message });
            if (pagoExistente) {
                return res.status(400).json({ error: "Ya existe un pago registrado (pendiente o aprobado) para este periodo." });
            }

            // Insertar pago — comprobante_path ahora es la URL de Cloudinary
            const query = `INSERT INTO pagos (profesor_id, mes_id, monto_pagado, comprobante_path, estado) VALUES (?, ?, ?, ?, 'pendiente')`;
            db.run(query, [profesor_id, mes_id, monto, comprobante_path], function (err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ success: true, id: this.lastID });
            });
        });
    });
});

// --- RUTAS DE ADMINISTRACIÓN (Protegidas con adminAuth) ---

// 5. Configurar el mes (Activar nuevo periodo)
app.post('/api/admin/config-mes', adminAuth, (req, res) => {
    const { mes_nombre, precio_base, descuento } = req.body;

    db.serialize(() => {
        // Desactivamos meses anteriores
        db.run("UPDATE meses_config SET activo = 0");
        // Insertamos el nuevo mes configurado como activo y abierto
        db.run(
            "INSERT INTO meses_config (mes_nombre, precio_base, descuento, activo, abierto) VALUES (?, ?, ?, 1, 1)",
            [mes_nombre, precio_base, descuento],
            (err) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ success: true, mensaje: `Mes ${mes_nombre} activado.` });
            }
        );
    });
});

// 5b. Actualizar datos del periodo activo actual
app.put('/api/admin/config-mes', adminAuth, (req, res) => {
    const { mes_nombre, precio_base, descuento } = req.body;

    db.run(
        "UPDATE meses_config SET mes_nombre = ?, precio_base = ?, descuento = ? WHERE activo = 1",
        [mes_nombre, precio_base, descuento || 0],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) {
                return res.status(404).json({ error: "No hay ningún periodo activo que actualizar" });
            }
            res.json({ success: true, mensaje: "Periodo activo actualizado con éxito." });
        }
    );
});

// 6b. Gestionar descuentos específicos del mes activo
app.get('/api/admin/descuentos', adminAuth, (req, res) => {
    const query = `
        SELECT d.id, d.descuento, d.recargo, d.motivo_descuento, d.motivo_recargo, p.nombre, p.cedula, p.id as profesor_id
        FROM descuentos_mes d
        JOIN profesores p ON d.profesor_id = p.id
        WHERE d.mes_id = (SELECT id FROM meses_config WHERE activo = 1)
        ORDER BY p.nombre ASC`;
    db.all(query, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/admin/descuentos', adminAuth, (req, res) => {
    const { profesor_id, descuento, recargo, motivo_descuento, motivo_recargo } = req.body;
    const valDescuento = descuento !== undefined ? parseFloat(descuento) : 0;
    const valRecargo = recargo !== undefined ? parseFloat(recargo) : 0;
    const valMotivoDesc = motivo_descuento !== undefined ? motivo_descuento.toString() : '';
    const valMotivoRec = motivo_recargo !== undefined ? motivo_recargo.toString() : '';
    
    db.get("SELECT id FROM meses_config WHERE activo = 1", (err, row) => {
        if (err || !row) return res.status(500).json({ error: err ? err.message : "No hay mes activo" });
        
        const query = `
            INSERT INTO descuentos_mes (mes_id, profesor_id, descuento, recargo, motivo_descuento, motivo_recargo) 
            VALUES (?, ?, ?, ?, ?, ?) 
            ON CONFLICT(mes_id, profesor_id) 
            DO UPDATE SET 
                descuento = excluded.descuento, 
                recargo = excluded.recargo, 
                motivo_descuento = excluded.motivo_descuento, 
                motivo_recargo = excluded.motivo_recargo`;
            
        db.run(query, [row.id, profesor_id, valDescuento, valRecargo, valMotivoDesc, valMotivoRec], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
    });
});

app.delete('/api/admin/descuentos/:id', adminAuth, (req, res) => {
    db.run("DELETE FROM descuentos_mes WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// 6. Toggle abrir/cerrar recepción de pagos del mes activo
app.post('/api/admin/toggle-abierto', adminAuth, (req, res) => {
    db.get("SELECT id, abierto FROM meses_config WHERE activo = 1", (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: "No hay un periodo de cobro activo" });
        
        const nuevoEstado = row.abierto === 1 ? 0 : 1;
        db.run("UPDATE meses_config SET abierto = ? WHERE id = ?", [nuevoEstado, row.id], (err2) => {
            if (err2) return res.status(500).json({ error: err2.message });
            res.json({ success: true, abierto: nuevoEstado });
        });
    });
});

// 7. Dashboard: ¿Quién falta de pagar este mes?
app.get('/api/admin/pendientes', adminAuth, (req, res) => {
    const query = `
        SELECT p.id, p.nombre, p.cedula 
        FROM profesores p
        WHERE p.activo = 1 
        AND p.id NOT IN (
            SELECT profesor_id FROM pagos 
            WHERE mes_id = (SELECT id FROM meses_config WHERE activo = 1) 
            AND estado != 'rechazado'
        )`;

    db.all(query, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// 8. Estadísticas de puntualidad (cuenta pagos con estado 'aprobado')
app.get('/api/admin/stats', adminAuth, (req, res) => {
    const query = `
        SELECT p.nombre, COUNT(pag.id) as total_pagos
        FROM profesores p
        LEFT JOIN pagos pag ON p.id = pag.profesor_id AND pag.estado = 'aprobado'
        GROUP BY p.id
        ORDER BY total_pagos DESC`;

    db.all(query, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// 8b. Ingresos del mes actual e histórico
app.get('/api/admin/ingresos', adminAuth, (req, res) => {
    const query = `
        SELECT 
            SUM(CASE WHEN mes_id = (SELECT id FROM meses_config WHERE activo = 1) THEN monto_pagado ELSE 0 END) as total_mes,
            SUM(monto_pagado) as total_historico
        FROM pagos 
        WHERE estado = 'aprobado'`;

    db.get(query, (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ 
            total: row.total_mes || 0,
            total_historico: row.total_historico || 0
        });
    });
});

// 9. Obtener todos los pagos del mes actual para revisar comprobantes
app.get('/api/admin/pagos-recibidos', adminAuth, (req, res) => {
    const query = `
        SELECT p.*, prof.nombre, prof.cedula, prof.celular
        FROM pagos p
        JOIN profesores prof ON p.profesor_id = prof.id
        WHERE p.mes_id = (SELECT id FROM meses_config WHERE activo = 1)
        ORDER BY p.fecha_registro DESC
    `;
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// 9b. Obtener historial general (TODOS los pagos)
app.get('/api/admin/historial-general', adminAuth, (req, res) => {
    const query = `
        SELECT 
            pag.id,
            prof.nombre,
            prof.cedula,
            m.mes_nombre,
            m.precio_base,
            COALESCE(d.descuento, 0) as descuento_aplicado,
            COALESCE(d.recargo, 0) as recargo_aplicado,
            COALESCE(d.motivo_descuento, '') as motivo_descuento,
            COALESCE(d.motivo_recargo, '') as motivo_recargo,
            pag.monto_pagado as precio_final_pagado,
            pag.estado,
            pag.fecha_registro,
            pag.comprobante_path
        FROM pagos pag
        JOIN profesores prof ON pag.profesor_id = prof.id
        JOIN meses_config m ON pag.mes_id = m.id
        LEFT JOIN descuentos_mes d ON d.mes_id = m.id AND d.profesor_id = prof.id
        ORDER BY pag.fecha_registro DESC
    `;
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// 10. Validar comprobante (Aprobar o Rechazar Pago)
app.post('/api/admin/validar-pago', adminAuth, (req, res) => {
    const { pago_id, estado } = req.body;
    if (!pago_id || !estado) {
        return res.status(400).json({ error: 'Faltan datos de validación' });
    }
    if (estado !== 'aprobado' && estado !== 'rechazado') {
        return res.status(400).json({ error: 'Estado de validación inválido' });
    }
    
    db.run("UPDATE pagos SET estado = ? WHERE id = ?", [estado, pago_id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, mensaje: `Pago ${estado} con éxito.` });
    });
});

// 11. CRUD Profesores: Listar todos (activos e inactivos)
app.get('/api/admin/profesores', adminAuth, (req, res) => {
    db.all("SELECT id, nombre, cedula, celular, activo FROM profesores ORDER BY nombre ASC", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// 12. CRUD Profesores: Crear nuevo
app.post('/api/admin/profesores', adminAuth, (req, res) => {
    const { nombre, cedula, celular } = req.body;
    if (!nombre || !cedula) {
        return res.status(400).json({ error: 'Faltan datos obligatorios' });
    }
    db.get("SELECT id FROM meses_config WHERE activo = 1", (err, row) => {
        const mes_ingreso = row ? row.id : 1;
        db.run("INSERT INTO profesores (nombre, cedula, celular, activo, mes_ingreso_id) VALUES (?, ?, ?, 1, ?)", 
        [nombre, cedula, celular || '', mes_ingreso], function (err) {
            if (err) {
                if (err.message.includes('UNIQUE')) {
                    return res.status(400).json({ error: 'La cédula ya está registrada para otro profesor' });
                }
                return res.status(500).json({ error: err.message });
            }
            res.json({ success: true, id: this.lastID });
        });
    });
});

// 13. CRUD Profesores: Editar
app.put('/api/admin/profesores/:id', adminAuth, (req, res) => {
    const { id } = req.params;
    const { nombre, cedula, celular, activo } = req.body;
    if (!nombre || !cedula) {
        return res.status(400).json({ error: 'Faltan datos obligatorios' });
    }
    db.run("UPDATE profesores SET nombre = ?, cedula = ?, celular = ?, activo = ? WHERE id = ?", [nombre, cedula, celular || '', activo, id], function (err) {
        if (err) {
            if (err.message.includes('UNIQUE')) {
                return res.status(400).json({ error: 'La cédula ya está registrada para otro profesor' });
            }
            return res.status(500).json({ error: err.message });
        }
        res.json({ success: true });
    });
});

// 14. CRUD Profesores: Eliminar
app.delete('/api/admin/profesores/:id', adminAuth, (req, res) => {
    const { id } = req.params;
    db.run("DELETE FROM profesores WHERE id = ?", [id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// 15. Reset de Datos (Limpiar toda la DB menos admins)
app.post('/api/admin/reset-datos', adminAuth, (req, res) => {
    db.serialize(() => {
        db.run("DELETE FROM pagos");
        db.run("DELETE FROM descuentos_mes");
        db.run("DELETE FROM meses_config");
        db.run("DELETE FROM profesores");
        
        db.run("DELETE FROM sqlite_sequence WHERE name IN ('pagos', 'descuentos_mes', 'meses_config', 'profesores')", (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, mensaje: 'Datos reseteados. Reinicia el servidor backend para aplicar la siembra inicial si es necesario.' });
        });
    });
});

app.use((err, req, res, next) => {
    console.error("DEBUG ERROR HANDLER:", err);
    res.status(500).json({ error: err.message || err.toString(), stack: err.stack, details: err });
});

// Servir el frontend en producción (Railway)
const frontendPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendPath));
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});
// Trigger nodemon restart 2