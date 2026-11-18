const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

const variantNumber = 15;
const sourceDir = path.join(__dirname, `source_${variantNumber}`);
const backupDir = path.join(__dirname, `backup_${variantNumber}`);

async function createTestStructure() {
    console.log('📂 Создание тестовой структуры...\n');
    await fs.mkdir(sourceDir, { recursive: true });
    await fs.mkdir(path.join(sourceDir, 'subdir1'), { recursive: true });
    await fs.mkdir(path.join(sourceDir, 'subdir2'), { recursive: true });
    await fs.mkdir(path.join(sourceDir, 'subdir3'), { recursive: true });

    const extensions = ['.txt', '.js', '.json', '.md', '.log'];
    const manifest = { files: [], created: new Date().toISOString() };

    for (let i = 1; i <= 20; i++) {
        const ext = extensions[i % extensions.length];
        const filename = `file_${i}${ext}`;
        const filePath = path.join(sourceDir, filename);
        const content = `Содержимое файла ${i}\n`.repeat(100);
        await fs.writeFile(filePath, content, 'utf8');
        manifest.files.push({ name: filename, size: Buffer.byteLength(content), created: new Date().toISOString() });
    }

    for (let i = 1; i <= 3; i++) {
        const subdir = path.join(sourceDir, `subdir${i}`);
        for (let j = 1; j <= 5; j++) {
            const filename = `sub_file_${i}_${j}.txt`;
            const filePath = path.join(subdir, filename);
            const content = `Файл ${j} в папке ${i}\n`.repeat(50);
            await fs.writeFile(filePath, content, 'utf8');
            manifest.files.push({ name: `subdir${i}/${filename}`, size: Buffer.byteLength(content), created: new Date().toISOString() });
        }
    }

    const manifestPath = path.join(sourceDir, 'manifest.json');
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
    console.log(`✅ Создано ${manifest.files.length} файлов\n`);
}

async function copyDirectory(src, dest) {
    await fs.mkdir(dest, { recursive: true });
    const entries = await fs.readdir(src, { withFileTypes: true });
    let streamCount = 0;
    let normalCount = 0;

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            await copyDirectory(srcPath, destPath);
        } else {
            const ext = path.extname(entry.name);
            const stats = await fs.stat(srcPath);
            if (stats.size > 1024 * 1024) {
                await copyLargeFile(srcPath, destPath);
                normalCount++;
            } else if (['.txt', '.js', '.json'].includes(ext)) {
                await fs.copyFile(srcPath, destPath);
                streamCount++;
            } else {
                await fs.copyFile(srcPath, destPath);
                normalCount++;
            }
        }
    }
    return { streamCount, normalCount };
}

function copyLargeFile(src, dest) {
    return new Promise((resolve, reject) => {
        const CHUNK_SIZE = 512 * 1024;
        const readStream = fsSync.createReadStream(src, { highWaterMark: CHUNK_SIZE });
        const writeStream = fsSync.createWriteStream(dest);
        readStream.pipe(writeStream);
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
        readStream.on('error', reject);
    });
}

async function getAllFiles(dir) {
    const files = [];
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            const subFiles = await getAllFiles(fullPath);
            files.push(...subFiles);
        } else {
            files.push(fullPath);
        }
    }
    return files;
}

async function compareDirectories(src, dest) {
    const report = { identical: [], modified: [], added: [], deleted: [] };
    const srcFiles = await getAllFiles(src);
    const destFiles = await getAllFiles(dest);

    for (const srcFile of srcFiles) {
        const relativePath = path.relative(src, srcFile);
        const destFile = path.join(dest, relativePath);
        if (!destFiles.includes(destFile)) {
            report.deleted.push(relativePath);
        } else {
            const srcStats = await fs.stat(srcFile);
            const destStats = await fs.stat(destFile);
            if (srcStats.size !== destStats.size || srcStats.mtime.getTime() !== destStats.mtime.getTime()) {
                report.modified.push(relativePath);
            } else {
                report.identical.push(relativePath);
            }
        }
    }

    for (const destFile of destFiles) {
        const relativePath = path.relative(dest, destFile);
        const srcFile = path.join(src, relativePath);
        if (!srcFiles.includes(srcFile)) {
            report.added.push(relativePath);
        }
    }
    return report;
}

async function copyAndSync() {
    try {
        console.log('=== КОПИРОВАНИЕ И СИНХРОНИЗАЦИЯ ===\n');
        const startTime = Date.now();
        await createTestStructure();

        console.log('📋 Копирование файлов...');
        const { streamCount, normalCount } = await copyDirectory(sourceDir, backupDir);
        console.log(`✅ Копирование завершено`);
        console.log(`   - Потоковое копирование: ${streamCount} файлов`);
        console.log(`   - Обычное копирование: ${normalCount} файлов\n`);

        console.log('🔄 Сравнение директорий...');
        const report = await compareDirectories(sourceDir, backupDir);
        console.log(`\n📊 Статистика:`);
        console.log(`   - Совпадают: ${report.identical.length} файлов`);
        console.log(`   - Изменены: ${report.modified.length} файлов`);
        console.log(`   - Добавлены: ${report.added.length} файлов`);
        console.log(`   - Удалены: ${report.deleted.length} файлов\n`);

        const reportPath = path.join(__dirname, `sync_report_${variantNumber}.txt`);
        let reportContent = `Отчёт синхронизации\nДата: ${new Date().toISOString()}\nВариант: ${variantNumber}\n\n`;
        reportContent += `Совпадающие файлы (${report.identical.length}):\n`;
        report.identical.forEach(f => reportContent += `  ✓ ${f}\n`);
        reportContent += `\nИзменённые файлы (${report.modified.length}):\n`;
        report.modified.forEach(f => reportContent += `  ✗ ${f}\n`);
        reportContent += `\nДобавленные файлы (${report.added.length}):\n`;
        report.added.forEach(f => reportContent += `  + ${f}\n`);
        reportContent += `\nУдалённые файлы (${report.deleted.length}):\n`;
        report.deleted.forEach(f => reportContent += `  - ${f}\n`);

        await fs.writeFile(reportPath, reportContent, 'utf8');
        console.log(`📄 Отчет сохранен: sync_report_${variantNumber}.txt`);

        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);
        console.log(`\n⏱ Время выполнения: ${duration} сек`);
    } catch (error) {
        console.error('❌ Ошибка:', error.message);
    }
}

copyAndSync();