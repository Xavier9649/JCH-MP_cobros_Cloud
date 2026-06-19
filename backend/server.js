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
        const parsedPagos = pagos.map(p => ({
            ...p,
            monto_pagado: parseFloat(p.monto_pagado) || 0
        }));
        
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
                        totalDeuda += Math.max(0, Number(d.precio_base) - Number(d.dcto) + Number(d.recargo || d.rcgo || 0));
                    });

                    // 2. Calcular precio del mes actual
                    db.get("SELECT descuento, recargo, motivo_descuento, motivo_recargo FROM descuentos_mes WHERE mes_id = ? AND profesor_id = ?", [mesActivo.id, profesorId], (err, descRow) => {
                        if (err) return res.status(500).json({ error: err.message });
                        
                        const descuentoAplicable = descRow ? descRow.descuento : 0;
                        const recargoAplicable = descRow ? (descRow.recargo || 0) : 0;
                        const motivoDesc = descRow ? (descRow.motivo_descuento || '') : '';
                        const motivoRec = descRow ? (descRow.motivo_recargo || '') : '';
                        const precioMesActual = Number(mesActivo.precio_base);
                        const subtotalMes = precioMesActual + Number(recargoAplicable);
                        const totalSinDescuento = subtotalMes + totalDeuda;
                        const precioFinal = Math.max(0, totalSinDescuento - Number(descuentoAplicable));
                        
                        // 3. Estado del pago actual
                        const queryPagoActual = `SELECT * FROM pagos WHERE profesor_id = ? AND mes_id = ? ORDER BY fecha_registro DESC LIMIT 1`;
                        db.get(queryPagoActual, [profesorId, mesActivo.id], (err, pagoActual) => {
                            if (err) return res.status(500).json({ error: err.message });
                            res.json({
                                pagos: parsedPagos,
                                mesActivo: {
                                    ...mesActivo,
                                    precio_base: parseFloat(mesActivo.precio_base) || 0,
                                    descuento: parseFloat(mesActivo.descuento) || 0,
                                    precioFinal: parseFloat(precioFinal) || 0, // Cuota actual + deuda
                                    precioMesActual: parseFloat(precioMesActual) || 0, // Solo cuota actual
                                    deudaPasada: parseFloat(totalDeuda) || 0,
                                    descuentoAplicado: parseFloat(descuentoAplicable) || 0,
                                    recargoAplicado: parseFloat(recargoAplicable) || 0,
                                    motivoDescuento: motivoDesc,
                                    motivoRecargo: motivoRec
                                },
                                pagoActual: pagoActual ? {
                                    ...pagoActual,
                                    monto_pagado: parseFloat(pagoActual.monto_pagado) || 0
                                } : null
                            });
                        });
                    });
                });
            } else {
                res.json({ pagos: parsedPagos, mesActivo: null, pagoActual: null });
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

            const montoNumerico = parseFloat(monto) || 0;
            // Insertar pago — comprobante_path ahora es la URL de Cloudinary
            const query = `INSERT INTO pagos (profesor_id, mes_id, monto_pagado, comprobante_path, estado) VALUES (?, ?, ?, ?, 'pendiente')`;
            db.run(query, [profesor_id, mes_id, montoNumerico, comprobante_path], function (err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ success: true, id: this.lastID });
            });
        });
    });
});

// --- RUTAS DE ADMINISTRACIÓN (Protegidas con adminAuth) ---

// 5. Configurar el mes (Activar nuevo periodo)
app.post('/api/admin/config-mes', adminAuth, (req, res) => {
    const { mes_nombre, precio_base, descuento, link_deuna, link_loja } = req.body;
    const valPrecioBase = parseFloat(precio_base) || 0;
    const valDescuento = parseFloat(descuento) || 0;

    db.serialize(() => {
        // Desactivamos meses anteriores
        db.run("UPDATE meses_config SET activo = 0");
        // Insertamos el nuevo mes configurado como activo y abierto
        db.run(
            "INSERT INTO meses_config (mes_nombre, precio_base, descuento, activo, abierto, link_deuna, link_loja) VALUES (?, ?, ?, 1, 1, ?, ?)",
            [mes_nombre, valPrecioBase, valDescuento, link_deuna || '', link_loja || ''],
            (err) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ success: true, mensaje: `Mes ${mes_nombre} activado.` });
            }
        );
    });
});

// 5b. Actualizar datos del periodo activo actual
app.put('/api/admin/config-mes', adminAuth, (req, res) => {
    const { mes_nombre, precio_base, descuento, link_deuna, link_loja } = req.body;
    const valPrecioBase = parseFloat(precio_base) || 0;
    const valDescuento = parseFloat(descuento) || 0;

    db.run(
        "UPDATE meses_config SET mes_nombre = ?, precio_base = ?, descuento = ?, link_deuna = ?, link_loja = ? WHERE activo = 1",
        [mes_nombre, valPrecioBase, valDescuento, link_deuna || '', link_loja || ''],
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
        const parsedRows = rows.map(r => ({
            ...r,
            descuento: parseFloat(r.descuento) || 0,
            recargo: parseFloat(r.recargo) || 0
        }));
        res.json(parsedRows);
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
            total: parseFloat(row?.total_mes) || 0,
            total_historico: parseFloat(row?.total_historico) || 0
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
        const parsed = rows.map(r => ({
            ...r,
            monto_pagado: parseFloat(r.monto_pagado) || 0
        }));
        res.json(parsed);
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
        const parsed = rows.map(r => ({
            ...r,
            precio_base: parseFloat(r.precio_base) || 0,
            descuento_aplicado: parseFloat(r.descuento_aplicado) || 0,
            recargo_aplicado: parseFloat(r.recargo_aplicado) || 0,
            precio_final_pagado: parseFloat(r.precio_final_pagado) || 0
        }));
        res.json(parsed);
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
    
    if (estado === 'aprobado') {
        // Obtener detalles del pago a aprobar
        db.get("SELECT profesor_id, mes_id, monto_pagado, comprobante_path, estado FROM pagos WHERE id = ?", [pago_id], (err, pago) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!pago) return res.status(404).json({ error: 'Pago no encontrado' });

            // Si ya está aprobado, no hacer nada más
            if (pago.estado === 'aprobado') {
                return res.json({ success: true, mensaje: 'El pago ya estaba aprobado.' });
            }

            // Buscar deudas en meses anteriores al mes de este pago
            const queryDeudas = `
                SELECT m.id as mes_id, m.precio_base, COALESCE(d.descuento, 0) as dcto, COALESCE(d.recargo, 0) as rcgo
                FROM meses_config m
                JOIN profesores p ON p.id = ?
                LEFT JOIN descuentos_mes d ON d.mes_id = m.id AND d.profesor_id = p.id
                WHERE m.activo = 0 
                AND m.id < ?
                AND m.id >= COALESCE(p.mes_ingreso_id, 1)
                AND m.id NOT IN (
                    SELECT mes_id FROM pagos WHERE profesor_id = p.id AND estado = 'aprobado'
                )
            `;

            db.all(queryDeudas, [pago.profesor_id, pago.mes_id], (err, deudas) => {
                if (err) return res.status(500).json({ error: err.message });

                db.serialize(() => {
                    let montoRestante = Number(pago.monto_pagado);
                    let errorOcurrido = false;

                    deudas.forEach(d => {
                        const costoMes = Math.max(0, Number(d.precio_base) - Number(d.dcto) + Number(d.rcgo));
                        
                        // Distribuimos el dinero pagado. Si el descuento global perdonó la deuda,
                        // no habrá dinero suficiente para cubrir todo, pero igual se aprueba.
                        const montoAsignado = Math.min(costoMes, montoRestante);
                        montoRestante -= montoAsignado;

                        // Insertar pago aprobado para el mes anterior
                        db.run(
                            "INSERT INTO pagos (profesor_id, mes_id, monto_pagado, comprobante_path, estado) VALUES (?, ?, ?, ?, 'aprobado')",
                            [pago.profesor_id, d.mes_id, montoAsignado, pago.comprobante_path],
                            (errIns) => {
                                if (errIns) {
                                    console.error("Error al registrar pago de deuda pasada:", errIns.message);
                                    errorOcurrido = true;
                                }
                            }
                        );
                    });

                    // Si sobra algo del dinero pagado, se asigna al mes actual
                    const nuevoMontoActual = montoRestante;

                    // Actualizar el pago actual a aprobado con el saldo restante
                    db.run(
                        "UPDATE pagos SET estado = 'aprobado', monto_pagado = ? WHERE id = ?",
                        [nuevoMontoActual, pago_id],
                        (errUpd) => {
                            if (errUpd || errorOcurrido) {
                                return res.status(500).json({ error: errUpd ? errUpd.message : 'Error al actualizar pagos' });
                            }
                            res.json({ success: true, mensaje: `Pago aprobado con éxito. Se cubrieron ${deudas.length} meses de deuda anteriores.` });
                        }
                    );
                });
            });
        });
    } else {
        db.run("UPDATE pagos SET estado = ? WHERE id = ?", [estado, pago_id], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, mensaje: `Pago rechazado con éxito.` });
        });
    }
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

// 15. Perdonar Deudas Globales
app.post('/api/admin/perdonar-deudas', adminAuth, (req, res) => {
    db.run("UPDATE profesores SET mes_ingreso_id = (SELECT id FROM meses_config WHERE activo = 1)", (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, mensaje: '¡Todas las deudas anteriores han sido perdonadas! Los docentes ahora están al día con sus pagos pasados.' });
    });
});

// 16. Reset de Datos (Limpiar toda la DB menos admins)
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