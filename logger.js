const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, 'logs.txt');

function setupLogger(app) {
    app.on('server:started', (port) => {
        const logEntry = '[' + new Date().toISOString() + '] server:started: порт ' + port + '\n';
        fs.appendFile(LOG_FILE, logEntry, 'utf8', (err) => {
            if (err) console.error('Ошибка записи лога:', err);
        });
    });

    app.on('request:received', (req) => {
        const logEntry = '[' + new Date().toISOString() + '] request:received: ' + req.method + ' ' + req.url + '\n';
        fs.appendFile(LOG_FILE, logEntry, 'utf8', (err) => {
            if (err) console.error('Ошибка записи лога:', err);
        });
    });

    app.on('server:stopped', () => {
        const logEntry = '[' + new Date().toISOString() + '] server:stopped: сервер остановлен\n';
        fs.appendFile(LOG_FILE, logEntry, 'utf8', (err) => {
            if (err) console.error('Ошибка записи лога:', err);
        });
    });
}

module.exports = { setupLogger };