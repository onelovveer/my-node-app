const http = require('http');
const { EventEmitter } = require('events');
const logger = require('./logger');

const studentName = "Мисовский Андрей";
const studentGroup = "477";
const journalNumber = 15;

function calculatePi(decimalPlaces) {
    let pi = 3.0;
    let sign = 1;
    for (let i = 1; i <= 100000; i++) {
        let term = 4.0 / ((2 * i) * (2 * i + 1) * (2 * i + 2));
        pi += sign * term;
        sign = -sign;
    }
    return pi.toFixed(decimalPlaces);
}

class AppServer extends EventEmitter {
    constructor() {
        super();
        this.server = null;
    }

    start(port) {
        this.server = http.createServer((req, res) => {
            this.emit('request:received', { url: req.url, method: req.method });

            const orderMatch = req.url.match(/^\/order\/(\d+)$/);
            if (orderMatch && req.method === 'GET') {
                const orderId = orderMatch[1];
                orderHandler.processOrder(orderId);
                res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end('<h1>Заказ #' + orderId + ' принят в обработку</h1>');
                return;
            }

            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end('Hello from Event-Driven Server!');
        });

        this.server.listen(port, () => {
            this.emit('server:started', port);
        });
    }

    stop() {
        if (this.server) {
            this.server.close(() => {
                this.emit('server:stopped');
            });
        }
    }
}

class OrderHandler extends EventEmitter {
    constructor() {
        super();
        this.on('order:complete', (orderId, sum) => {
            const pi = calculatePi(7);
            console.log('Заказ #' + orderId + ' завершён на сумму ' + sum + ' руб. PI= ' + pi);
        });
    }

    processOrder(orderId) {
        this.emit('order:start', orderId);
        console.log('[order:start] Заказ #' + orderId + ' начат');

        setTimeout(() => {
            this.emit('order:processing', orderId);
            console.log('[order:processing] Заказ #' + orderId + ': Идёт обработка...');

            setTimeout(() => {
                const sum = Math.floor(Math.random() * 901) + 100;
                this.emit('order:complete', orderId, sum);
            }, 2000);
        }, 2000);
    }
}

class UserTracker extends EventEmitter {
    trackAction(userId, action, metadata) {
        const eventObj = {
            userId: userId,
            action: action,
            timestamp: new Date().toISOString(),
            metadata: metadata,
            id: Math.random().toString(36).substr(2, 9)
        };
        this.emit('user:action', eventObj);
    }
}

const app = new AppServer();
const orderHandler = new OrderHandler();
const userTracker = new UserTracker();

logger.setupLogger(app);

app.on('server:started', (port) => {
    console.log('Сервер запущен на порту ' + port);
});

app.on('request:received', (req) => {
    console.log('Получен запрос: ' + req.method + ' ' + req.url);
});

app.on('server:stopped', () => {
    console.log('Сервер остановлен');
});

userTracker.on('user:action', (data) => {
    console.log('   Пользователь ' + data.userId + ' совершил действие "' + data.action + '"');
    console.log('   Время: ' + data.timestamp);
    console.log('   ID события: ' + data.id);
    console.log('   Доп. данные: ' + data.metadata);
});

app.start(3000);

userTracker.trackAction(1, 'login', 'Главная страница');
userTracker.trackAction(2, 'purchase', 'Корзина');
userTracker.trackAction(3, 'logout', 'Профиль');

setTimeout(() => {
    app.stop();
}, 10000);