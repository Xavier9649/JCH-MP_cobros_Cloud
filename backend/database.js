require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const crypto = require('crypto');

// Función para obtener hash SHA-256 (necesaria para sembrar el admin)
function getHash(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

let db;

// Detectar si usamos PostgreSQL (Railway) o SQLite (Local)
if (process.env.DATABASE_URL) {
    console.log("Conectando a PostgreSQL (Railway)...");
    const { Pool } = require('pg');
    
    class PostgresAdapter {
        constructor(connectionString) {
            this.pool = new Pool({
                connectionString: connectionString,
                ssl: {
                    rejectUnauthorized: false // Requerido por Railway para conexiones seguras
                }
            });
            this.queue = [];
            this.running = false;
        }

        // Encola las operaciones para emular el comportamiento secuencial de sqlite3 (db.serialize)
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

        // Convierte placeholders de SQLite (?) a PostgreSQL ($1, $2, ...)
        convertSQL(sql) {
            let index = 1;
            return sql.replace(/\?/g, () => `$${index++}`);
        }

        // db.get(sql, params, callback) - Obtiene una sola fila
        get(sql, params, callback) {
            if (typeof params === 'function') {
                callback = params;
                params = [];
            }
            this._enqueue((done) => {
                let pgSQL = this.convertSQL(sql);
                this.pool.query(pgSQL, params, (err, res) => {
                    if (callback) {
                        callback(err, res && res.rows ? res.rows[0] : undefined);
                    }
                    done();
                });
            });
        }

        // db.all(sql, params, callback) - Obtiene todas las filas
        all(sql, params, callback) {
            if (typeof params === 'function') {
                callback = params;
                params = [];
            }
            this._enqueue((done) => {
                let pgSQL = this.convertSQL(sql);
                this.pool.query(pgSQL, params, (err, res) => {
                    if (callback) {
                        callback(err, res ? res.rows : []);
                    }
                    done();
                });
            });
        }

        // db.run(sql, params, callback) - Ejecuta comandos (INSERT, UPDATE, DELETE, CREATE)
        run(sql, params, callback) {
            if (typeof params === 'function') {
                callback = params;
                params = [];
            }
            this._enqueue((done) => {
                let pgSQL = this.convertSQL(sql);

                // 1. Traducir tipos específicos de SQLite a PostgreSQL
                pgSQL = pgSQL.replace(/INTEGER\s+PRIMARY\s+KEY\s+AUTOINCREMENT/gi, 'SERIAL PRIMARY KEY');
                pgSQL = pgSQL.replace(/\bDATETIME\b/gi, 'TIMESTAMP');

                // 2. Traducir el borrado de secuencias sqlite_sequence
                if (pgSQL.includes('sqlite_sequence')) {
                    const tables = ['pagos', 'descuentos_mes', 'meses_config', 'profesores'];
                    // Genera consultas del tipo: ALTER SEQUENCE table_id_seq RESTART WITH 1
                    const queries = tables.map(t => `ALTER SEQUENCE IF EXISTS ${t}_id_seq RESTART WITH 1`).join('; ');
                    this.pool.query(queries, (err) => {
                        if (callback) callback(err);
                        done();
                    });
                    return;
                }

                // 3. Capturar el ID de inserción para emular 'this.lastID' en SQLite
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

                    // Emular el contexto 'this' de SQLite
                    const context = {
                        lastID: res && res.rows && res.rows[0] ? (res.rows[0].id || res.rows[0].pago_id || Object.values(res.rows[0])[0]) : null,
                        changes: res ? res.rowCount : 0
                    };

                    if (callback) {
                        callback.call(context, null);
                    }
                    done();
                });
            });
        }

        serialize(callback) {
            callback(); // La cola interna _enqueue ya garantiza la ejecución secuencial
        }

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

    db = new PostgresAdapter(process.env.DATABASE_URL);

} else {
    console.log("Conectando a SQLite (Local)...");
    const sqlite3 = require('sqlite3').verbose();
    db = new sqlite3.Database('./database.db');
}

// Inicialización de esquema y semilla (se ejecuta solo al levantar el servidor o forzar con variable de entorno)
const isRunningServer = require.main && require.main.filename && (
    require.main.filename.includes('server.js') || 
    require.main.filename.includes('server.cjs')
);

if (isRunningServer || process.env.FORCE_INIT_DB) {
    db.serialize(() => {
        if (process.env.DATABASE_URL) {
            // En PostgreSQL creamos las tablas y aplicamos las columnas condicionalmente de forma más directa
            crearTablasYSembrar();
            db.run("ALTER TABLE profesores ADD COLUMN IF NOT EXISTS mes_ingreso_id INTEGER DEFAULT 1");
            db.run("ALTER TABLE profesores ADD COLUMN IF NOT EXISTS celular TEXT DEFAULT ''");
            db.run("ALTER TABLE descuentos_mes ADD COLUMN IF NOT EXISTS recargo REAL DEFAULT 0");
            db.run("ALTER TABLE descuentos_mes ADD COLUMN IF NOT EXISTS motivo TEXT DEFAULT ''");
            db.run("ALTER TABLE descuentos_mes ADD COLUMN IF NOT EXISTS motivo_descuento TEXT DEFAULT ''");
            db.run("ALTER TABLE descuentos_mes ADD COLUMN IF NOT EXISTS motivo_recargo TEXT DEFAULT ''");
            db.run("ALTER TABLE meses_config ADD COLUMN IF NOT EXISTS link_deuna TEXT DEFAULT ''");
            db.run("ALTER TABLE meses_config ADD COLUMN IF NOT EXISTS link_loja TEXT DEFAULT ''");
        } else {
            // SQLite original
            db.all("PRAGMA table_info(profesores)", (err, columns) => {
                if (err) return;
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
                    // Verificar si existen las columnas recargo y motivos en descuentos_mes
                    db.all("PRAGMA table_info(descuentos_mes)", (err, cols) => {
                        if (err) return;
                        const hasRecargo = cols && cols.some(col => col.name === 'recargo');
                        const hasMotivo = cols && cols.some(col => col.name === 'motivo');
                        const hasMotivoDescuento = cols && cols.some(col => col.name === 'motivo_descuento');
                        const hasMotivoRecargo = cols && cols.some(col => col.name === 'motivo_recargo');
                        if (cols && cols.length > 0 && !hasRecargo) {
                            db.run("ALTER TABLE descuentos_mes ADD COLUMN recargo REAL DEFAULT 0");
                        }
                        if (cols && cols.length > 0 && !hasMotivo) {
                            db.run("ALTER TABLE descuentos_mes ADD COLUMN motivo TEXT DEFAULT ''");
                        }
                        if (cols && cols.length > 0 && !hasMotivoDescuento) {
                            db.run("ALTER TABLE descuentos_mes ADD COLUMN motivo_descuento TEXT DEFAULT ''");
                        }
                        if (cols && cols.length > 0 && !hasMotivoRecargo) {
                            db.run("ALTER TABLE descuentos_mes ADD COLUMN motivo_recargo TEXT DEFAULT ''");
                        }
                    });

                    // Verificar si existen los links en meses_config (SQLite)
                    db.all("PRAGMA table_info(meses_config)", (err, cols) => {
                        if (err) return;
                        const hasLinkDeuna = cols && cols.some(col => col.name === 'link_deuna');
                        const hasLinkLoja = cols && cols.some(col => col.name === 'link_loja');
                        if (cols && cols.length > 0 && !hasLinkDeuna) {
                            db.run("ALTER TABLE meses_config ADD COLUMN link_deuna TEXT DEFAULT ''");
                        }
                        if (cols && cols.length > 0 && !hasLinkLoja) {
                            db.run("ALTER TABLE meses_config ADD COLUMN link_loja TEXT DEFAULT ''");
                        }
                    });
                }
            });
        }
    });
}

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

        // Tabla de Configuración Mensual
        db.run(`CREATE TABLE IF NOT EXISTS meses_config (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
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
            id INTEGER PRIMARY KEY AUTOINCREMENT,
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
                if (err) return;
                // SQLite devuelve { count: N }, pg puede devolverlo diferente pero get emulado entrega la fila
                const count = row ? parseInt(row.count || row.count_all || 0) : 0;
                if (count === 0) {
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
            if (err) return;
            const count = row ? parseInt(row.count || 0) : 0;
            if (count === 0) {
                const profesoresSemilla = [
                    { nombre: "Alejandro Sanz", cedula: "1712345678", celular: "0991234567" },
                    { nombre: "María Gómez", cedula: "0912345678", celular: "0987654321" },
                    { nombre: "Gustavo Cerati", cedula: "1812345678", celular: "0971122334" }
                ];
                
                // Usamos inserts individuales secuenciales en lugar de db.prepare (que no es parte del subset mínimo)
                profesoresSemilla.forEach(p => {
                    db.run("INSERT INTO profesores (nombre, cedula, celular, activo) VALUES (?, ?, ?, 1)", [p.nombre, p.cedula, p.celular], (err) => {
                        if (err) console.error("Error al sembrar profesor:", err.message);
                    });
                });
                console.log("Profesores semilla insertados con éxito.");
            }
        });

        // Sembrar un mes por defecto si está vacío
        db.get("SELECT COUNT(*) as count FROM meses_config", (err, row) => {
            if (err) return;
            const count = row ? parseInt(row.count || 0) : 0;
            if (count === 0) {
                db.run(
                    "INSERT INTO meses_config (mes_nombre, precio_base, descuento, activo, abierto) VALUES (?, ?, ?, 1, 1)",
                    ["Mayo 2026", 10.0, 0.0],
                    (err) => {
                        if (err) console.error("Error al sembrar mes inicial:", err.message);
                        else console.log("Mes de prueba 'Mayo 2026' sembrado ($10.0 base, sin descuento por defecto).");
                    }
                );
            }
        });
    });
}

module.exports = db;