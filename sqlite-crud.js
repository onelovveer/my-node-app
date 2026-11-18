const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const studentGroup = "477";
const dbPath = path.join(__dirname, 'lab22.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        group_name TEXT NOT NULL,
        course INTEGER,
        grade REAL
    )`);

    console.log("=== INSERT ===");
    const stmt = db.prepare("INSERT INTO students (name, group_name, course, grade) VALUES (?, ?, ?, ?)");
    stmt.run("Иван Иванов", studentGroup, 2, 4.5);
    stmt.run("Мария Петрова", studentGroup, 2, 3.8);
    stmt.run("Петр Сидоров", studentGroup, 3, 4.2);
    stmt.finalize();
    console.log("✔ Вставлено 3 студента\n");

    console.log("=== SELECT ===");
    db.all("SELECT * FROM students WHERE group_name = ? ORDER BY grade DESC", [studentGroup], (err, rows) => {
        if (err) console.error(err.message);
        else {
            rows.forEach(row => console.log(`  id=${row.id}, name=${row.name}, grade=${row.grade}`));
            console.log();
        }
    });

    console.log("=== UPDATE ===");
    db.run("UPDATE students SET grade = ? WHERE name = ?", [4.8, "Иван Иванов"], function(err) {
        if (err) console.error(err.message);
        else console.log(`✔ Обновлено строк: ${this.changes}\n`);
    });

    console.log("=== DELETE ===");
    db.run("DELETE FROM students WHERE name = ?", ["Петр Сидоров"], function(err) {
        if (err) console.error(err.message);
        else console.log(`✔ Удалено строк: ${this.changes}`);
        db.close();
    });
});