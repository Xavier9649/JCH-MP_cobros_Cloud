const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.db');

db.serialize(() => {
    console.log("Iniciando reseteo de la base de datos (conservando administradores)...");
    
    // Eliminar datos
    db.run("DELETE FROM pagos");
    db.run("DELETE FROM descuentos_mes");
    db.run("DELETE FROM meses_config");
    db.run("DELETE FROM profesores");
    
    // Reiniciar contadores de ID (Autoincrement)
    db.run("DELETE FROM sqlite_sequence WHERE name IN ('pagos', 'descuentos_mes', 'meses_config', 'profesores')", (err) => {
        if (err) {
            console.error("Error al reiniciar secuencias:", err.message);
        } else {
            console.log("¡Base de datos reseteada con éxito!");
            console.log("Nota: Al reiniciar tu servidor Backend (npm run dev), el sistema volverá a sembrar el mes inicial y los profesores de prueba automáticamente.");
        }
    });
});

db.close();
