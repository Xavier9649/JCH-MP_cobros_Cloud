const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');
const db = new sqlite3.Database('./database.db');

// Función para obtener hash SHA-256
function getHash(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

db.serialize(() => {
    // Comprobar si la columna 'cedula' existe en la tabla 'profesores'.
    // Si no existe, reseteamos la BD para actualizar el esquema de forma limpia.
    db.all("PRAGMA table_info(profesores)", (err, columns) => {
        const hasCedula = columns && columns.some(col => col.name === 'cedula');
        const hasMesIngreso = columns && columns.some(col => col.name === 'mes_ingreso_id');
        const hasCelular = columns && columns.some(col => col.name === 'celular');
        
        if (columns && columns.length > 0 && !hasCedula) {
            console.log("Detectado esquema antiguo sin columna 'cedula'. Reiniciando base de datos...");
            db.run("DROP TABLE IF EXISTS pagos");
            db.run("DROP TABLE IF EXISTS profesores");
            db.run("DROP TABLE IF EXISTS meses_config");
            db.run("DROP TABLE IF EXISTS admins");
            db.run("DROP TABLE IF EXISTS descuentos_mes");
            crearTablasYSembrar();
        } else {
            if (columns && columns.length > 0 && !hasMesIngreso) {
                db.run("ALTER TABLE profesores ADD COLUMN mes_ingreso_id INTEGER DEFAULT 1");
            }
            if (columns && columns.length > 0 && !hasCelular) {
                db.run("ALTER TABLE profesores ADD COLUMN celular TEXT DEFAULT ''");
            }
            crearTablasYSembrar();
        }
    });
});

function crearTablasYSembrar() {
    db.serialize(() => {
        // Tabla de Profesores
    db.run(`CREATE TABLE IF NOT EXISTS profesores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        cedula TEXT UNIQUE NOT NULL,
        celular TEXT DEFAULT '',
        activo INTEGER DEFAULT 1,
        mes_ingreso_id INTEGER DEFAULT 1
    )`);

    // Tabla de Configuración Mensual (Precios, Descuentos y Estado de Apertura)
    db.run(`CREATE TABLE IF NOT EXISTS meses_config (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mes_nombre TEXT,
        precio_base REAL,
        descuento REAL DEFAULT 0,
        activo INTEGER DEFAULT 0,
        abierto INTEGER DEFAULT 1
    )`);

    // Tabla de Descuentos por Mes y Profesor
    db.run(`CREATE TABLE IF NOT EXISTS descuentos_mes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mes_id INTEGER,
        profesor_id INTEGER,
        descuento REAL NOT NULL,
        FOREIGN KEY(mes_id) REFERENCES meses_config(id),
        FOREIGN KEY(profesor_id) REFERENCES profesores(id),
        UNIQUE(mes_id, profesor_id)
    )`);

    // Tabla de Pagos (con Estado de validación)
    db.run(`CREATE TABLE IF NOT EXISTS pagos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        profesor_id INTEGER,
        mes_id INTEGER,
        monto_pagado REAL,
        comprobante_path TEXT,
        estado TEXT DEFAULT 'pendiente',
        fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(profesor_id) REFERENCES profesores(id),
        FOREIGN KEY(mes_id) REFERENCES meses_config(id)
    )`);

    // Tabla de Administradores
    db.run(`CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL
    )`, () => {
        // Sembrar Administrador por defecto si no hay ninguno
        db.get("SELECT COUNT(*) as count FROM admins", (err, row) => {
            if (row && row.count === 0) {
                const adminUser = 'admin';
                const adminPassHash = getHash('admin123');
                db.run("INSERT INTO admins (username, password_hash) VALUES (?, ?)", [adminUser, adminPassHash], (err) => {
                    if (err) console.error("Error al sembrar admin:", err.message);
                    else console.log("Administrador de prueba creado ('admin' / 'admin123')");
                });
            }
        });
    });

    // Sembrar Profesores si la tabla está vacía
    db.get("SELECT COUNT(*) as count FROM profesores", (err, row) => {
        // Si no hay profesores, sembramos algunos por defecto
        if (row && row.count === 0) {
            const profesoresSemilla = [
                { nombre: "Alejandro Sanz", cedula: "1712345678", celular: "0991234567" },
                { nombre: "María Gómez", cedula: "0912345678", celular: "0987654321" },
                { nombre: "Gustavo Cerati", cedula: "1812345678", celular: "0971122334" }
            ];
            
            const stmt = db.prepare("INSERT INTO profesores (nombre, cedula, celular, activo) VALUES (?, ?, ?, 1)");
            profesoresSemilla.forEach(p => {
                stmt.run(p.nombre, p.cedula, p.celular);
            });
            stmt.finalize(() => {
                console.log("Profesores semilla insertados con éxito.");
            });
        }
    });

        // Sembrar un mes por defecto si está vacío
        db.get("SELECT COUNT(*) as count FROM meses_config", (err, row) => {
            if (row && row.count === 0) {
                db.run(
                    "INSERT INTO meses_config (mes_nombre, precio_base, descuento, activo, abierto) VALUES (?, ?, ?, 1, 1)",
                    ["Mayo 2026", 10.0, 2.0],
                    (err) => {
                        if (err) console.error("Error al sembrar mes inicial:", err.message);
                        else console.log("Mes de prueba 'Mayo 2026' sembrado ($10.0 base, $2.0 dcto).");
                    }
                );
            }
        });
    });
}

module.exports = db;