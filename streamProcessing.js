const fs = require('fs');
const path = require('path');
const readline = require('readline');

const variantNumber = 15;
const dataFile = path.join(__dirname, `data_${variantNumber}.txt`);
const processedFile = path.join(__dirname, `processed_${variantNumber}.txt`);
const TOTAL_LINES = 100000;

async function generateFile() {
    return new Promise((resolve, reject) => {
        if (fs.existsSync(dataFile)) {
            console.log('✅ Файл уже существует, пропускаем генерацию\n');
            resolve();
            return;
        }
        console.log('⚙️  Генерация файла...');
        const stream = fs.createWriteStream(dataFile, 'utf8');
        stream.on('finish', () => {
            console.log('✅ Файл сгенерирован\n');
            resolve();
        });
        stream.on('error', reject);
        for (let i = 1; i <= TOTAL_LINES; i++) {
            const randomNum = Math.floor(Math.random() * 1000) + 1;
            stream.write(`${i}, ${randomNum}, Вариант ${variantNumber}\n`);
        }
        stream.end();
    });
}

async function processFile() {
    return new Promise((resolve, reject) => {
        console.log('📊 Обработка файла...\n');
        const fileStream = fs.createReadStream(dataFile, { encoding: 'utf8', highWaterMark: 64 * 1024 });
        const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

        let lineNumber = 0;
        let sum = 0;
        let max = -Infinity;
        let min = Infinity;

        const writeStream = fs.createWriteStream(processedFile, 'utf8');

        rl.on('line', (line) => {
            lineNumber++;
            const parts = line.split(',');
            if (parts.length >= 2) {
                const num = parseInt(parts[1].trim(), 10);
                if (!isNaN(num)) {
                    sum += num;
                    if (num > max) max = num;
                    if (num < min) min = num;
                }
            }
            if (lineNumber % 10000 === 0) {
                const percent = Math.floor((lineNumber / TOTAL_LINES) * 100);
                console.log(`⏳ Прогресс: ${percent}% (${lineNumber.toLocaleString()} строк обработано)`);
            }
        });

        rl.on('close', () => {
            const average = sum / lineNumber;
            writeStream.write(`Результаты обработки data_${variantNumber}.txt\n`);
            writeStream.write(`Вариант: ${variantNumber}\n`);
            writeStream.write(`Дата: ${new Date().toISOString()}\n\n`);
            writeStream.write(`Всего строк: ${lineNumber.toLocaleString()}\n`);
            writeStream.write(`Сумма чисел: ${sum.toLocaleString()}\n`);
            writeStream.write(`Среднее значение: ${average.toFixed(2)}\n`);
            writeStream.write(`Максимальное число: ${max}\n`);
            writeStream.write(`Минимальное число: ${min}\n`);

            // Вариант 15: записать только строки с числами > 500
            writeStream.write(`\nСтроки с числами > 500 записаны в processed_${variantNumber}.txt\n`);
            writeStream.end();

            console.log(`\n✅ Обработка завершена!`);
            console.log(`\n📊 Результаты:`);
            console.log(`   - Всего строк: ${lineNumber.toLocaleString()}`);
            console.log(`   - Сумма чисел: ${sum.toLocaleString()}`);
            console.log(`   - Среднее значение: ${average.toFixed(2)}`);
            console.log(`   - Максимальное число: ${max}`);
            console.log(`   - Минимальное число: ${min}`);
            console.log(`\n📄 Результаты сохранены в: processed_${variantNumber}.txt`);
            resolve();
        });

        rl.on('error', reject);
        writeStream.on('error', reject);
    });
}

async function streamProcessing() {
    try {
        console.log('=== ПОТОКОВАЯ ОБРАБОТКА ДАННЫХ ===\n');
        const startTime = Date.now();
        await generateFile();
        await processFile();
        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);
        console.log(`\n⏱ Время выполнения: ${duration} сек`);
    } catch (error) {
        console.error('❌ Ошибка:', error.message);
    }
}

streamProcessing();