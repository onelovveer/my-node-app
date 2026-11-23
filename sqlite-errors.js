const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const studentGroup = "477";
const dbPath = path.join(__dirname, 'lab22_errors.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS test_table (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL UNIQUE
    )`);

    console.log("=== Ошибка UNIQUE ===");
    db.run("INSERT INTO test_table (id, name) VALUES (1, 'Тест')", (err) => {
        if (err) console.error(err.message);
        else console.log("✔ Первая вставка успешна");
    });
    
    db.run("INSERT INTO test_table (id, name) VALUES (2, 'Тест')", (err) => {
        if (err) console.log(`✖ Ошибка UNIQUE: ${err.message}\n`);
    });

    console.log("=== Ошибка NOT NULL ===");
    db.run("INSERT INTO test_table (id, name) VALUES (3, NULL)", (err) => {
        if (err) console.log(`✖ Ошибка NOT NULL: ${err.message}\n`);
    });

    console.log("=== Транзакция (ROLLBACK) ===");
    db.run("BEGIN TRANSACTION");
    db.run("INSERT INTO test_table (id, name) VALUES (4, 'Транзакция1')");
    db.run("INSERT INTO test_table (id, name) VALUES (5, 'Транзакция2')");
    db.run("ROLLBACK", () => {
        console.log("✔ Транзакция отменена (ROLLBACK)\n");
        
        db.all("SELECT * FROM test_table", (err, rows) => {
            console.log(`Записей в таблице после отката: ${rows.length} (должна остаться только 1 исходная)`);
            db.close();
        });
    });
});