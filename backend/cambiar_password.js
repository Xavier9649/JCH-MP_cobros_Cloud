const db = require('./database');
const crypto = require('crypto');

const args = process.argv.slice(2);

if (args.length < 1) {
    console.log("❌ Error: Debes especificar la nueva contraseña.");
    console.log("Uso correcto: node cambiar_password.js <nueva_contraseña>");
    process.exit(1);
}

const nuevaPassword = args[0];

// Función para obtener hash SHA-256 (Misma lógica que database.js)
function getHash(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

const nuevoHash = getHash(nuevaPassword);

db.run("UPDATE admins SET password_hash = ? WHERE username = 'admin'", [nuevoHash], function(err) {
    if (err) {
        console.error("Error al actualizar la contraseña:", err.message);
    } else {
        if (this.changes > 0) {
            console.log("✅ ¡Éxito! La contraseña del usuario 'admin' ha sido actualizada.");
            console.log(`Nueva contraseña: ${nuevaPassword}`);
        } else {
            console.log("⚠️ No se encontró al usuario 'admin' en la base de datos.");
        }
    }
});

db.close();
