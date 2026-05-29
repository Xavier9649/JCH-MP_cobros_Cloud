const db = require('./database');

db.serialize(() => {
    console.log("Dropping all tables...");
    db.run("DROP TABLE IF EXISTS pagos");
    db.run("DROP TABLE IF EXISTS profesores");
    db.run("DROP TABLE IF EXISTS meses_config");
    db.run("DROP TABLE IF EXISTS admins");
    db.run("DROP TABLE IF EXISTS descuentos_mes");
    console.log("All tables dropped. Restart your backend to seed again.");
});
db.close();
