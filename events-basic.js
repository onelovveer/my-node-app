const EventEmitter = require('events');

const studentGroup = "477";

console.log('=== Демонстрация EventEmitter ===');

const emitter = new EventEmitter();

emitter.on('greet', (name) => {
    console.log(`[greet] Привет, ${name}!`);
});

emitter.on('info', () => {
    console.log(`[info] Группа: ${studentGroup}`);
});

emitter.on('bye', () => {
    console.log('[bye] До свидания!');
});

emitter.emit('greet', 'Андрей');
emitter.emit('info');
emitter.emit('bye');

const hasUnknownListeners = emitter.emit('unknown');
console.log(`Событие "unknown" без слушателей: ${hasUnknownListeners}`);

const hasGreetListeners = emitter.emit('greet', 'Мария');
console.log(`Событие "greet" со слушателями: ${hasGreetListeners}`);