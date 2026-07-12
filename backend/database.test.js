const db = require('./database');

describe('Database Integration Tests (Real PostgreSQL)', () => {
    // Cerramos el pool de conexiones al terminar todas las pruebas para no colgar el proceso de Jest
    afterAll((done) => {
        db.close(done);
    });

    test('Debe insertar, consultar y luego eliminar un profesor de prueba en PostgreSQL', (done) => {
        const testCedula = '9999999999';
        const testProfesor = {
            nombre: 'Profesor de Integracion',
            cedula: testCedula,
            celular: '0999999999',
            activo: 1
        };

        // 1. Asegurar que no exista de pruebas previas
        db.run('DELETE FROM profesores WHERE cedula = ?', [testCedula], (err) => {
            if (err) return done(err);

            // 2. Insertar profesor de prueba
            db.run(
                'INSERT INTO profesores (nombre, cedula, celular, activo) VALUES (?, ?, ?, ?)',
                [testProfesor.nombre, testProfesor.cedula, testProfesor.celular, testProfesor.activo],
                function(err) {
                    if (err) return done(err);

                    // 3. Consultar y verificar que los datos coincidan
                    db.get('SELECT * FROM profesores WHERE cedula = ?', [testCedula], (err, row) => {
                        if (err) return done(err);

                        try {
                            expect(row).toBeDefined();
                            expect(row.nombre).toBe(testProfesor.nombre);
                            expect(row.cedula).toBe(testProfesor.cedula);
                            expect(row.celular).toBe(testProfesor.celular);
                        } catch (e) {
                            return done(e);
                        }

                        // 4. Eliminar el profesor insertado para dejar la BD limpia
                        db.run('DELETE FROM profesores WHERE cedula = ?', [testCedula], (err) => {
                            if (err) return done(err);
                            done();
                        });
                    });
                }
            );
        });
    });
});
