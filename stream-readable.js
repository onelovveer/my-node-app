const { Readable } = require('stream');

const studentGroup = "477";
const studentName = "Мисовский Андрей";

class CustomReadable extends Readable {
    constructor(options) {
        super(options);
        this.chunks = [
            `Группа: ${studentGroup}`,
            `Студент: ${studentName}`,
            "Лабораторная работа: №21",
            "Тема: Потоки в Node.js"
        ];
        this.index = 0;
    }

    _read(size) {
        if (this.index < this.chunks.length) {
            setTimeout(() => {
                this.push(this.chunks[this.index]);
                this.index++;
            }, 100);
        } else {
            this.push(null);
        }
    }
}

console.log("=== Демонстрация Readable-потока ===\n");

const readable = new CustomReadable();
let chunkCount = 0;
let totalSize = 0;

readable.on('data', (chunk) => {
    chunkCount++;
    totalSize += chunk.length;
    console.log(`[CHUNK ${chunkCount}] ${chunk}`);
});

readable.on('end', () => {
    console.log(`\n[END] Поток завершён`);
    console.log(`Всего получено чанков: ${chunkCount}`);
    console.log(`Общий размер данных: ${totalSize} байт`);
});

readable.on('error', (err) => {
    console.error(`[ERROR] ${err.message}`);
});