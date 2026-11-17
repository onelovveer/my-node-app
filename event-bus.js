const EventEmitter = require('events');
const http = require('http');
const os = require('os');

const studentGroup = "477";

class EventBus extends EventEmitter {
    constructor() {
        super();
        this.metrics = {};
        this.totalEvents = 0;
        this.wildcardListeners = [];
        
        this.on('error', (err) => {
            console.error(`[ERROR][${studentGroup}] Ошибка: ${err.message}`);
        });
        
        this.on('newListener', (eventName) => {
            if (eventName !== 'newListener' && eventName !== 'removeListener') {
                this.wildcardListeners.forEach(fn => fn(eventName));
            }
        });
    }
    
    on(event, listener, priority = 0) {
        const wrapped = (...args) => {
            this._trackMetric(event);
            try {
                listener(...args);
            } catch (err) {
                this.emit('error', new Error(`Ошибка в слушателе "${event}": ${err.message}`));
            }
        };
        wrapped.priority = priority;
        super.on(event, wrapped);
        this._sortListeners(event);
        return this;
    }
    
    once(event, listener, priority = 0) {
        const wrapped = (...args) => {
            this._trackMetric(event);
            try {
                listener(...args);
            } catch (err) {
                this.emit('error', new Error(`Ошибка в once-слушателе "${event}": ${err.message}`));
            }
        };
        wrapped.priority = priority;
        super.once(event, wrapped);
        return this;
    }
    
    onAny(listener) {
        this.wildcardListeners.push(listener);
        return this;
    }
    
    off(event, listener) {
        this.removeListener(event, listener);
        return this;
    }
    
    getMetrics() {
        return {
            group: studentGroup,
            events: { ...this.metrics },
            total: this.totalEvents,
            listeners: Object.keys(this.metrics).reduce((acc, event) => {
                acc[event] = this.listenerCount(event);
                return acc;
            }, {})
        };
    }
    
    _trackMetric(event) {
        if (!this.metrics[event]) {
            this.metrics[event] = { count: 0, errors: 0, lastCall: null };
        }
        this.metrics[event].count++;
        this.metrics[event].lastCall = new Date().toISOString();
        this.totalEvents++;
    }
    
    _sortListeners(event) {
        const listeners = this.listeners(event);
        listeners.sort((a, b) => (b.priority || 0) - (a.priority || 0));
        this.removeAllListeners(event);
        listeners.forEach(l => super.on(event, l));
    }
}

console.log(`=== EventBus (группа ${studentGroup}) ===`);

const bus = new EventBus();

console.log('\n--- Приоритеты ---');
bus.on('priority-test', () => console.log('[priority 0]  Низкий приоритет'), 0);
bus.on('priority-test', () => console.log('[priority 5]  Средний приоритет'), 5);
bus.on('priority-test', () => console.log('[priority 10] Высокий приоритет'), 10);
bus.emit('priority-test');

console.log('\n--- Wildcard ---');
bus.onAny((event, ...args) => {
    console.log(`[onAny] Событие "${event}" с аргументами: [${args.map(a => `"${a}"`).join(', ')}]`);
});
bus.emit('greet', 'Андрей');
bus.emit('info', studentGroup);

console.log('\n--- Once-кэш ---');
let onceCalls = 0;
bus.once('tick', () => {
    onceCalls++;
    console.log(`[tick] Вызов ${onceCalls}`);
});
bus.emit('tick');
bus.emit('tick');
bus.emit('tick');
console.log(`once-слушатель вызван: ${onceCalls} раз`);

console.log('\n--- Обработка ошибок ---');
bus.on('test-error', () => { throw new Error('Тестовая ошибка'); });
bus.emit('test-error');

console.log('\n--- Метрики ---');
const metrics = bus.getMetrics();
Object.entries(metrics.events).forEach(([event, data]) => {
    const errStr = data.errors > 0 ? ` (${data.errors} ошибка)` : '';
    console.log(`${event}:  ${data.count} вызова${errStr}`);
});
console.log(`Всего событий: ${metrics.total}`);

const server = http.createServer((req, res) => {
    if (req.url === '/metrics' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(bus.getMetrics(), null, 2));
    } else {
        bus.emit('request', { method: req.method, url: req.url });
        res.writeHead(404);
        res.end('Not Found');
    }
});

server.listen(3000, () => {
    console.log(`\n🌐 HTTP-сервер запущен на http://localhost:3000`);
    console.log(`📊 Метрики доступны по GET /metrics`);
    
    bus.emit('system-info', {
        platform: os.platform(),
        cpus: os.cpus().length,
        memTotal: (os.totalmem() / 1024 / 1024 / 1024).toFixed(2) + ' GB'
    });
});