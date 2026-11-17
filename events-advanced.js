const EventEmitter = require('events');

const studentGroup = "477";

class PluginManager extends EventEmitter {
    constructor() {
        super();
        this.plugins = new Map();

        this.on('newListener', (eventName, listener) => {
            console.log(`[newListener] Добавлен слушатель "${eventName}"`);
        });
        
        this.on('removeListener', (eventName, listener) => {
            console.log(`[removeListener] Удалён слушатель "${eventName}"`);
        });
    }
    
    registerPlugin(name, pluginFn) {
        this.plugins.set(name, pluginFn);
        this.emit('plugin:registered', name);
        console.log(`[PLUGIN] Зарегистрирован: ${name}`);
    }
    
    removePlugin(name) {
        this.plugins.delete(name);
        this.emit('plugin:removed', name);
        console.log(`[PLUGIN] Удалён: ${name}`);
    }
}

console.log('=== Система плагинов ===');

const pm = new PluginManager();

pm.on('plugin:registered', (name) => {});
pm.on('plugin:removed', (name) => {});

pm.registerPlugin('LoggerPlugin', () => console.log('Log'));
pm.on('log', () => {});

pm.registerPlugin('AlertPlugin', () => console.log('Alert'));
pm.on('alert', () => {});

pm.removeListener('log', pm.listeners('log')[0]);
pm.removePlugin('LoggerPlugin');

console.log('\n=== Демонстрация утечки ===');

const leakEmitter = new EventEmitter();
leakEmitter.setMaxListeners(Infinity);

console.log(`Слушателей до: ${leakEmitter.listenerCount('data')}`);

for (let i = 0; i < 1000; i++) {
    leakEmitter.on('data', () => {});
}

console.log(`Слушателей после добавления 1000: ${leakEmitter.listenerCount('data')}`);

leakEmitter.removeAllListeners('data');
console.log(`Слушателей после removeAllListeners: ${leakEmitter.listenerCount('data')}`);

console.log('\n=== Асинхронные слушатели ===');

const asyncEmitter = new EventEmitter();

asyncEmitter.on('async-event', async () => {
    await new Promise(resolve => setTimeout(resolve, 100));
    console.log(`[${studentGroup}] async-слушатель завершён через 100ms`);
});

asyncEmitter.emit('async-event');
console.log(`[${studentGroup}] emit вызван (не ждёт async-слушатель)`);