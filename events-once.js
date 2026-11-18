const EventEmitter = require('events');

const studentGroup = "477";

console.log('=== Сравнение on и once ===');

const emitter = new EventEmitter();

let onCount = 0;
let onceCount = 0;

emitter.on('tick', () => {
    onCount++;
    console.log(`[tick#${onCount + onceCount}] on-слушатель`);
});

emitter.once('tick', () => {
    onceCount++;
    console.log(`[tick#${onCount + onceCount}] once-слушатель`);
});

for (let i = 1; i <= 3; i++) {
    emitter.emit('tick');
}

console.log(`on-слушатель вызван: ${onCount} раза`);
console.log(`once-слушатель вызван: ${onceCount} раз`);

console.log('\n=== Управление подписками ===');

function listenerA() { console.log('Слушатель A'); }
function listenerB() { console.log('Слушатель B'); }
function listenerC() { console.log('Слушатель C'); }

emitter.on('test', listenerA);
emitter.on('test', listenerB);
emitter.on('test', listenerC);

console.log(`Слушателей до удаления: ${emitter.listenerCount('test')}`);

emitter.removeListener('test', listenerB);
console.log(`Слушателей после удаления одного: ${emitter.listenerCount('test')}`);

emitter.removeAllListeners('test');
console.log(`Слушателей после removeAllListeners: ${emitter.listenerCount('test')}`);

console.log('\n=== Порядок вызова ===');

emitter.on('order', () => console.log(`1. Первый слушатель (группа ${studentGroup})`));
emitter.on('order', () => console.log('2. Второй слушатель'));
emitter.on('order', () => console.log('3. Третий слушатель'));

emitter.emit('order');