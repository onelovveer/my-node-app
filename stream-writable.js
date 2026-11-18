const { Writable } = require('stream');

const studentGroup = "477";
const studentName = "Мисовский Андрей";

const chunks = [
    `Группа: ${studentGroup}`,
    `Студент: ${studentName}`,
    "Лабораторная работа: №21",
    "Тема: Потоки в Node.js",
    "Дополнительные данные для backpressure",
    "Ещё больше данных",
    "И ещё один чанк",
    "Финальный чанк"
];

const writable = new Writable({
    highWaterMark: 16,
    write(chunk, encoding, callback) {
        setTimeout(() => {
            console.log(`[WRITE] ${chunk.toString()}`);
            callback();
        }, 100);
    }
});

console.log("=== Демонстрация Writable-потока ===\n");

let chunkCount = 0;
let drainCount = 0;

writable.on('drain', () => {
    drainCount++;
    console.log(`[DRAIN] Буфер освобождён, продолжаем запись`);
});

writable.on('finish', () => {
    console.log(`\n[FINISH] Все данные записаны`);
    console.log(`Всего записано: ${chunkCount} чанков`);
    console.log(`Событий drain: ${drainCount}`);
});

writable.on('error', (err) => {
    console.error(`[ERROR] ${err.message}`);
});

for (let i = 0; i < chunks.length; i++) {
    const canContinue = writable.write(chunks[i]);
    chunkCount++;

    if (canContinue) {
        console.log(`write() вернул: true`);
    } else {
        console.log(`write() вернул: false  ← буфер переполнен!`);
    }
}

writable.end();