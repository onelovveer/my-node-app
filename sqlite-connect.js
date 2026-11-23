const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const studentGroup = "477";
const studentName = "Мисовский Андрей";
const dbPath = path.join(__dirname, 'lab22.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('✖ Ошибка подключения:', err.message);
    else console.log('✔ Подключение к SQLite установлено\n');
});

db.get("SELECT sqlite_version() AS version", (err, row) => {
    if (err) console.error(err.message);
    else {
        console.log(`Версия SQLite: ${row.version}`);
        console.log(`Файл БД: ${dbPath}`);
        console.log(`Группа: ${studentGroup}`);
        console.log(`Студент: ${studentName}`);
    }
    db.close();
});