require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const crypto = require('crypto');
const { Pool } = require('pg');

// Función para obtener hash SHA-256 (usada para sembrar el admin por defecto)
function getHash(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

// ── Validación temprana ────────────────────────────────────────
if (!process.env.DATABASE_URL) {
    console.error('ERROR FATAL: La variable de entorno DATABASE_URL no está definida.');
    console.error('Crea el archivo backend/.env con tu cadena de conexión PostgreSQL.');
    console.error('Consulta el archivo template.env en la raíz del proyecto como referencia.');
    process.exit(1);
}

// ══════════════════════════════════════════════════════════════
//  PostgresAdapter
//  Emula la API de sqlite3 (db.get / db.all / db.run / db.serialize)
//  para que server.js no necesite ningún cambio.
// ══════════════════════════════════════════════════════════════
class PostgresAdapter {
    constructor(connectionString) {
        this.pool = new Pool({
            connectionString,
            ssl: { rejectUnauthorized: false }, // Requerido por Railway/Render/Neon
        });
        this.queue = [];
        this.running = false;

        this.pool.on('error', (err) => {
            console.error('Error inesperado en el pool de PostgreSQL:', err.message);
        });
    }

    // ── Cola interna para emular ejecución secuencial ──────────
    _enqueue(fn) {
        this.queue.push(fn);
        this._processQueue();
    }

    _processQueue() {
        if (this.running || this.queue.length === 0) return;
        this.running = true;
        const next = this.queue.shift();
        next(() => {
            this.running = false;
            this._processQueue();
        });
    }

    // ── Convierte placeholders SQLite (?) a PostgreSQL ($1, $2, …) ─
    _convertSQL(sql) {
        let index = 1;
        return sql.replace(/\?/g, () => `$${index++}`);
    }

    // ── db.get() — Retorna la primera fila ─────────────────────
    get(sql, params, callback) {
        if (typeof params === 'function') { callback = params; params = []; }
        this._enqueue((done) => {
            const pgSQL = this._convertSQL(sql);
            this.pool.query(pgSQL, params, (err, res) => {
                if (callback) callback(err, res?.rows?.[0]);
                done();
            });
        });
    }

    // ── db.all() — Retorna todas las filas ──────────────────────
    all(sql, params, callback) {
        if (typeof params === 'function') { callback = params; params = []; }
        this._enqueue((done) => {
            const pgSQL = this._convertSQL(sql);
            this.pool.query(pgSQL, params, (err, res) => {
                if (callback) callback(err, res ? res.rows : []);
                done();
            });
        });
    }

    // ── db.run() — Ejecuta INSERT/UPDATE/DELETE/CREATE ──────────
    run(sql, params, callback) {
        if (typeof params === 'function') { callback = params; params = []; }
        this._enqueue((done) => {
            let pgSQL = this._convertSQL(sql);

            // Traducir DDL de SQLite a PostgreSQL
            pgSQL = pgSQL.replace(/INTEGER\s+PRIMARY\s+KEY\s+AUTOINCREMENT/gi, 'SERIAL PRIMARY KEY');
            pgSQL = pgSQL.replace(/\bDATETIME\b/gi, 'TIMESTAMP');

            // Agregar RETURNING * a los INSERT para obtener lastID
            const isInsert = /^\s*insert\s+/i.test(pgSQL);
            if (isInsert && !/returning/i.test(pgSQL)) {
                pgSQL += ' RETURNING *';
            }

            this.pool.query(pgSQL, params, (err, res) => {
                if (err) {
                    // Mapear error de UNIQUE para que coincida con lo que espera server.js
                    if (err.code === '23505') {
                        err.message = 'UNIQUE constraint failed: ' + err.detail;
                    }
                    if (callback) callback(err);
                    done();
                    return;
                }

                // Emular el contexto 'this' de sqlite3 (this.lastID, this.changes)
                const context = {
                    lastID: res?.rows?.[0]
                        ? (res.rows[0].id ?? res.rows[0].pago_id ?? Object.values(res.rows[0])[0])
                        : null,
                    changes: res?.rowCount ?? 0,
                };
                if (callback) callback.call(context, null);
                done();
            });
        });
    }

    // ── db.serialize() — No-op: la cola interna ya es secuencial ─
    serialize(callback) {
        if (callback) callback();
    }

    // ── db.close() — Espera a que la cola vacíe y cierra el pool ─
    close(callback) {
        const check = () => {
            if (this.queue.length === 0 && !this.running) {
                this.pool.end(callback);
            } else {
                setTimeout(check, 50);
            }
        };
        check();
    }
}

// ── Instancia global ───────────────────────────────────────────
console.log('Conectando a PostgreSQL...');
const db = new PostgresAdapter(process.env.DATABASE_URL);

// ══════════════════════════════════════════════════════════════
//  Inicialización del esquema y datos semilla
// ══════════════════════════════════════════════════════════════
db.serialize(() => {
    // Migraciones idempotentes (ADD COLUMN IF NOT EXISTS soportado en PostgreSQL 9.6+)
    db.run("ALTER TABLE profesores ADD COLUMN IF NOT EXISTS mes_ingreso_id INTEGER DEFAULT 1");
    db.run("ALTER TABLE profesores ADD COLUMN IF NOT EXISTS celular TEXT DEFAULT ''");
    db.run("ALTER TABLE descuentos_mes ADD COLUMN IF NOT EXISTS recargo REAL DEFAULT 0");
    db.run("ALTER TABLE descuentos_mes ADD COLUMN IF NOT EXISTS motivo TEXT DEFAULT ''");
    db.run("ALTER TABLE descuentos_mes ADD COLUMN IF NOT EXISTS motivo_descuento TEXT DEFAULT ''");
    db.run("ALTER TABLE descuentos_mes ADD COLUMN IF NOT EXISTS motivo_recargo TEXT DEFAULT ''");
    db.run("ALTER TABLE meses_config ADD COLUMN IF NOT EXISTS link_deuna TEXT DEFAULT ''");
    db.run("ALTER TABLE meses_config ADD COLUMN IF NOT EXISTS link_loja TEXT DEFAULT ''");

    crearTablasYSembrar();
});

// ── Creación de tablas y datos semilla ─────────────────────────
function crearTablasYSembrar() {
    db.serialize(() => {
        // Tabla de Profesores
        db.run(`CREATE TABLE IF NOT EXISTS profesores (
            id SERIAL PRIMARY KEY,
            nombre TEXT NOT NULL,
            cedula TEXT UNIQUE NOT NULL,
            celular TEXT DEFAULT '',
            activo INTEGER DEFAULT 1,
            mes_ingreso_id INTEGER DEFAULT 1
        )`);

        // Tabla de Configuración Mensual
        db.run(`CREATE TABLE IF NOT EXISTS meses_config (
            id SERIAL PRIMARY KEY,
            mes_nombre TEXT,
            precio_base REAL,
            descuento REAL DEFAULT 0,
            activo INTEGER DEFAULT 0,
            abierto INTEGER DEFAULT 1,
            link_deuna TEXT DEFAULT '',
            link_loja TEXT DEFAULT ''
        )`);

        // Tabla de Descuentos por Mes y Profesor
        db.run(`CREATE TABLE IF NOT EXISTS descuentos_mes (
            id SERIAL PRIMARY KEY,
            mes_id INTEGER,
            profesor_id INTEGER,
            descuento REAL NOT NULL,
            recargo REAL DEFAULT 0,
            motivo TEXT DEFAULT '',
            motivo_descuento TEXT DEFAULT '',
            motivo_recargo TEXT DEFAULT '',
            FOREIGN KEY(mes_id) REFERENCES meses_config(id),
            FOREIGN KEY(profesor_id) REFERENCES profesores(id),
            UNIQUE(mes_id, profesor_id)
        )`);

        // Tabla de Pagos
        db.run(`CREATE TABLE IF NOT EXISTS pagos (
            id SERIAL PRIMARY KEY,
            profesor_id INTEGER,
            mes_id INTEGER,
            monto_pagado REAL,
            comprobante_path TEXT,
            estado TEXT DEFAULT 'pendiente',
            fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(profesor_id) REFERENCES profesores(id),
            FOREIGN KEY(mes_id) REFERENCES meses_config(id)
        )`);

        // Tabla de Administradores
        db.run(`CREATE TABLE IF NOT EXISTS admins (
            id SERIAL PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL
        )`, () => {
            // Sembrar admin por defecto si no existe ninguno
            db.get("SELECT COUNT(*) as count FROM admins", (err, row) => {
                if (err) return;
                const count = row ? parseInt(row.count ?? 0) : 0;
                if (count === 0) {
                    db.run(
                        "INSERT INTO admins (username, password_hash) VALUES (?, ?)",
                        ['admin', getHash('admin123')],
                        (err) => {
                            if (err) console.error("Error al sembrar admin:", err.message);
                            else console.log("Admin por defecto creado ('admin' / 'admin123')");
                        }
                    );
                }
            });
        });

        // Índices para acelerar las consultas más frecuentes
        db.run(`CREATE INDEX IF NOT EXISTS idx_profesores_cedula ON profesores(cedula)`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_profesores_activo ON profesores(activo)`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_pagos_profesor_mes ON pagos(profesor_id, mes_id)`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_pagos_mes_estado ON pagos(mes_id, estado)`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_descuentos_mes_profesor ON descuentos_mes(mes_id, profesor_id)`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_meses_config_activo ON meses_config(activo)`);

        // Sembrar profesores de prueba si la tabla está vacía
        db.get("SELECT COUNT(*) as count FROM profesores", (err, row) => {
            if (err) return;
            const count = row ? parseInt(row.count ?? 0) : 0;
            if (count === 0) {
                const semilla = [
                    { nombre: "Alejandro Sanz",  cedula: "1712345678", celular: "0991234567" },
                    { nombre: "María Gómez",     cedula: "0912345678", celular: "0987654321" },
                    { nombre: "Gustavo Cerati",  cedula: "1812345678", celular: "0971122334" },
                ];
                semilla.forEach(p => {
                    db.run(
                        "INSERT INTO profesores (nombre, cedula, celular, activo) VALUES (?, ?, ?, 1)",
                        [p.nombre, p.cedula, p.celular],
                        (err) => { if (err) console.error("Error al sembrar profesor:", err.message); }
                    );
                });
                console.log("Profesores semilla insertados.");
            }
        });

        // Sembrar mes por defecto si la tabla está vacía
        db.get("SELECT COUNT(*) as count FROM meses_config", (err, row) => {
            if (err) return;
            const count = row ? parseInt(row.count ?? 0) : 0;
            if (count === 0) {
                db.run(
                    "INSERT INTO meses_config (mes_nombre, precio_base, descuento, activo, abierto) VALUES (?, ?, ?, 1, 1)",
                    ["Mayo 2026", 10.0, 0.0],
                    (err) => {
                        if (err) console.error("Error al sembrar mes inicial:", err.message);
                        else console.log("Mes de prueba 'Mayo 2026' sembrado.");
                    }
                );
            }
        });
    });
}

module.exports = db;