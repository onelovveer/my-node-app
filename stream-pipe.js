const fs = require('fs');
const path = require('path');
const { pipeline, Transform } = require('stream');

const studentGroup = "477";

const inputPath = path.join(__dirname, 'input.txt');
const outputPathPipe = path.join(__dirname, 'output-pipe.txt');
const outputPathPipeline = path.join(__dirname, 'output-pipeline.txt');
const outputPathChain = path.join(__dirname, 'output-chain.txt');

if (!fs.existsSync(inputPath)) {
    fs.writeFileSync(inputPath, `Лабораторная работа №21\nГруппа: ${studentGroup}\nТема: Потоки в Node.js\n`.repeat(100), 'utf8');
    console.log(`Создан тестовый файл: input.txt\n`);
}

console.log("=== Демонстрация pipe() ===");

const readStream1 = fs.createReadStream(inputPath);
const writeStream1 = fs.createWriteStream(outputPathPipe);

readStream1.pipe(writeStream1);

writeStream1.on('finish', () => {
    const stats = fs.statSync(outputPathPipe);
    console.log(`Чтение: input.txt`);
    console.log(`Запись: output-pipe.txt`);
    console.log(`✔ Копирование завершено`);
    console.log(`Размер: ${stats.size} байт\n`);

    runErrorDemo();
});

function runErrorDemo() {
    console.log("=== Демонстрация pipe() с ошибкой ===");

    const readStream2 = fs.createReadStream('missing.txt');
    const writeStream2 = fs.createWriteStream('output-error.txt');

    readStream2.pipe(writeStream2);

    readStream2.on('error', (err) => {
        console.log(`Чтение: missing.txt`);
        console.log(`✖ Ошибка: ${err.message}`);
        console.log(`⚠ Внимание: pipe() не закрыл целевой поток!`);
        console.log(`⚠ Возможна утечка памяти.\n`);
    });

    setTimeout(() => {
        console.log("=== Демонстрация pipeline() ===");

        const readStream3 = fs.createReadStream(inputPath);
        const writeStream3 = fs.createWriteStream(outputPathPipeline);

        pipeline(readStream3, writeStream3, (err) => {
            if (err) {
                console.error(`✖ Ошибка: ${err.message}`);
            } else {
                console.log(`Чтение: input.txt`);
                console.log(`Запись: output-pipeline.txt`);
                console.log(`✔ Копирование завершено\n`);
            }

            runPipelineErrorDemo();
        });
    }, 500);
}

function runPipelineErrorDemo() {
    console.log("=== Демонстрация pipeline() с ошибкой ===");

    const readStream4 = fs.createReadStream('missing.txt');
    const writeStream4 = fs.createWriteStream('output-error2.txt');

    pipeline(readStream4, writeStream4, (err) => {
        if (err) {
            console.log(`Чтение: missing.txt`);
            console.log(`✖ Ошибка: ${err.message}`);
            console.log(`✔ Все потоки автоматически закрыты`);
            console.log(`✔ Утечек нет\n`);
        }

        runChainDemo();
    });
}

function runChainDemo() {
    console.log("=== Цепочка потоков ===");

    const upperCase = new Transform({
        transform(chunk, encoding, callback) {
            callback(null, chunk.toString().toUpperCase());
        }
    });

    const reverse = new Transform({
        transform(chunk, encoding, callback) {
            const lines = chunk.toString().split('\n').map(line => line.split('').reverse().join(''));
            callback(null, lines.join('\n'));
        }
    });

    const readStream5 = fs.createReadStream(inputPath);
    const writeStream5 = fs.createWriteStream(outputPathChain);

    readStream5.pipe(upperCase).pipe(reverse).pipe(writeStream5);

    writeStream5.on('finish', () => {
        console.log(`input.txt → uppercase → reverse → output-chain.txt`);
        console.log(`✔ Обработка завершена\n`);
    });
}