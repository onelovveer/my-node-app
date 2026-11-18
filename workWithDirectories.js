const fs = require('fs').promises;
const path = require('path');

const variantNumber = 15;
const baseDir = path.join(__dirname, `project_${variantNumber}`);

const directories = [
    'src/modules',
    'src/components',
    'src/utils',
    'data/input',
    'data/output',
    'temp'
];

const descriptions = {
    'src/modules': 'Модули приложения',
    'src/components': 'Компоненты интерфейса',
    'src/utils': 'Утилиты и вспомогательные функции',
    'data/input': 'Входные данные',
    'data/output': 'Выходные данные',
    'temp': 'Временные файлы'
};

async function printTree(dir, prefix = '') {
    try {
        const items = await fs.readdir(dir, { withFileTypes: true });
        for (const item of items) {
            const isLast = items.indexOf(item) === items.length - 1;
            const connector = isLast ? '└── ' : '├── ';
            console.log(prefix + connector + item.name);
            if (item.isDirectory()) {
                const newPrefix = prefix + (isLast ? '    ' : '│   ');
                await printTree(path.join(dir, item.name), newPrefix);
            }
        }
    } catch (error) {
        console.error('Ошибка чтения директории:', error.message);
    }
}

async function removeDir(dirPath) {
    try {
        const items = await fs.readdir(dirPath, { withFileTypes: true });
        for (const item of items) {
            const fullPath = path.join(dirPath, item.name);
            if (item.isDirectory()) {
                await removeDir(fullPath);
            } else {
                await fs.unlink(fullPath);
            }
        }
        await fs.rmdir(dirPath);
    } catch (error) {
        console.error('Ошибка удаления:', error.message);
    }
}

async function workWithDirectories() {
    try {
        console.log('=== РАБОТА С КАТАЛОГАМИ ===\n');

        console.log('1. Создание структуры каталогов...');
        for (const dir of directories) {
            const dirPath = path.join(baseDir, dir);
            await fs.mkdir(dirPath, { recursive: true });
            const infoPath = path.join(dirPath, 'info.txt');
            await fs.writeFile(infoPath, descriptions[dir] || 'Папка проекта', 'utf8');
        }
        console.log('✅ Структура создана\n');

        console.log('2. Дерево структуры:');
        console.log(`project_${variantNumber}/`);
        await printTree(baseDir);
        console.log();

        // Вариант 15 — нечётный: создаём 3 вложенные папки в src/components
        console.log('3. Создание вложенных папок (нечётный вариант)...');
        for (let i = 1; i <= 3; i++) {
            const nestedDir = path.join(baseDir, 'src/components', `${i}`);
            await fs.mkdir(nestedDir, { recursive: true });
        }
        console.log('✅ Вложенные папки созданы\n');

        console.log('4. Перемещение temp в data...');
        const tempPath = path.join(baseDir, 'temp');
        const newTempPath = path.join(baseDir, 'data', 'temp');
        await fs.rename(tempPath, newTempPath);
        console.log('✅ temp перемещён в data\n');

        console.log('5. Переименование data/output в data/results...');
        const outputPath = path.join(baseDir, 'data', 'output');
        const resultsPath = path.join(baseDir, 'data', 'results');
        await fs.rename(outputPath, resultsPath);
        console.log('✅ output переименован в results\n');

        console.log('6. Удаление temp...');
        await removeDir(newTempPath);
        console.log('✅ temp удалён\n');

        console.log('7. Обновлённое дерево структуры:');
        console.log(`project_${variantNumber}/`);
        await printTree(baseDir);
    } catch (error) {
        console.error('❌ Ошибка:', error.message);
    }
}

workWithDirectories();