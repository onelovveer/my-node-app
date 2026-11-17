const EventEmitter = require('events');

const studentGroup = "477";

class DatabaseConnection extends EventEmitter {
    constructor() {
        super();
        this.connected = false;
    }

    connect() {
        console.log('[EVENT] Подключение к БД...');
        setTimeout(() => {
            this.connected = true;
            this.emit('connect');
        }, 500);
    }

    query(sql) {
        if (!this.connected) {
            this.emit('error', new Error('Не подключено к БД'));
            return;
        }
        console.log(`[EVENT] Выполнение запроса: ${sql}`);
        
        const result = sql.startsWith('SELECT') ? '50 записей' : '1 запись добавлена';
        setTimeout(() => {
            this.emit('query', { sql, result });
        }, 300);
    }

    close() {
        console.log('[EVENT] Закрытие соединения');
        this.connected = false;
        this.emit('close');
    }
}

console.log(`=== DatabaseConnection (группа ${studentGroup}) ===`);

const db = new DatabaseConnection();

db.on('connect', () => console.log('[EVENT] Соединение установлено'));
db.on('query', (data) => console.log(`[EVENT] Результат: ${data.result}`));
db.on('close', () => console.log('[EVENT] Соединение закрыто'));
db.on('error', (err) => console.log(`[EVENT] Ошибка: ${err.message}`));

db.connect();

setTimeout(() => {
    db.query('SELECT * FROM students');
}, 600);

setTimeout(() => {
    db.query('INSERT INTO students VALUES (...)');
}, 1000);

setTimeout(() => {
    db.close();
}, 1400);

setTimeout(() => {
    console.log('\n=== Демонстрация ошибки ===');
    const db2 = new DatabaseConnection();
    
    try {
        db2.emit('error', new Error('Connection timeout'));
    } catch (err) {
        console.log('(без слушателя error — процесс упал бы с исключением)');
        console.log(`Перехвачено: ${err.message}`);
    }
}, 2000);