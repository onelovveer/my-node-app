const fs = require('fs');
const path = require('path');
const util = require('util');

const writeFileAsync = util.promisify(fs.writeFile);
const readFileAsync = util.promisify(fs.readFile);

const BENCH_DIR = './bench-data';
const ITERATIONS = 100;
const FILENAME = 'bench.txt';
const CONTENT = 'Тестовое содержимое для бенчмарка производительности Node.js\n';

if (!fs.existsSync(BENCH_DIR)) {
    fs.mkdirSync(BENCH_DIR, { recursive: true });
}

const filePath = path.join(BENCH_DIR, FILENAME);

function measureTime(label, fn) {
    return new Promise((resolve) => {
        const start = process.hrtime.bigint();
        const result = fn(() => {
            const end = process.hrtime.bigint();
            const ms = Number(end - start) / 1e6;
            console.log(label + ': ' + ms.toFixed(2) + ' мс');
            resolve(ms);
        });
    });
}

async function runBenchmark() {
    console.log('=== БЕНЧМАРК ПРОИЗВОДИТЕЛЬНОСТИ ===');
    console.log('Количество итераций: ' + ITERATIONS + '\n');

    console.log('1. Синхронные операции (fs.writeFileSync / readFileSync):');
    const syncStart = process.hrtime.bigint();
    for (let i = 0; i < ITERATIONS; i++) {
        fs.writeFileSync(filePath, CONTENT, 'utf8');
        fs.readFileSync(filePath, 'utf8');
    }
    const syncEnd = process.hrtime.bigint();
    console.log('   Итого: ' + (Number(syncEnd - syncStart) / 1e6).toFixed(2) + ' мс\n');

    console.log('2. Асинхронные операции (колбэки):');
    const cbStart = process.hrtime.bigint();
    let cbDone = 0;
    for (let i = 0; i < ITERATIONS; i++) {
        fs.writeFile(filePath, CONTENT, 'utf8', () => {
            fs.readFile(filePath, 'utf8', () => {
                cbDone++;
                if (cbDone === ITERATIONS) {
                    const cbEnd = process.hrtime.bigint();
                    console.log('   Итого: ' + (Number(cbEnd - cbStart) / 1e6).toFixed(2) + ' мс\n');
                    runPromisesBenchmark();
                }
            });
        });
    }
}

async function runPromisesBenchmark() {
    console.log('3. Асинхронные операции (промисы / async-await):');
    const promStart = process.hrtime.bigint();
    const promises = [];
    for (let i = 0; i < ITERATIONS; i++) {
        promises.push(
            writeFileAsync(filePath, CONTENT, 'utf8')
                .then(() => readFileAsync(filePath, 'utf8'))
        );
    }
    await Promise.all(promises);
    const promEnd = process.hrtime.bigint();
    console.log('   Итого: ' + (Number(promEnd - promStart) / 1e6).toFixed(2) + ' мс\n');

    fs.unlinkSync(filePath);
    fs.rmdirSync(BENCH_DIR);

    console.log('✅ Бенчмарк завершён!');
    console.log('💡 Вывод: синхронные операции блокируют поток,');
    console.log('   но быстрее на малых объёмах. Промисы и колбэки');
    console.log('   не блокируют поток и масштабируются лучше.');
}

runBenchmark();