const fs = require('fs').promises;
const path = require('path');

const variantNumber = 15;

async function scanDirectory(dirPath, ignorePatterns = []) {
    const results = { files: [], directories: 0, totalSize: 0 };
    try {
        const items = await fs.readdir(dirPath, { withFileTypes: true });
        for (const item of items) {
            const fullPath = path.join(dirPath, item.name);
            const relativePath = path.relative(__dirname, fullPath);
            const shouldIgnore = ignorePatterns.some(pattern => relativePath.includes(pattern));
            if (shouldIgnore) continue;

            if (item.isDirectory()) {
                results.directories++;
                const subResults = await scanDirectory(fullPath, ignorePatterns);
                results.files.push(...subResults.files);
                results.directories += subResults.directories;
                results.totalSize += subResults.totalSize;
            } else if (item.isFile()) {
                const stats = await fs.stat(fullPath);
                results.files.push({
                    name: item.name,
                    path: relativePath,
                    size: stats.size,
                    ext: path.extname(item.name)
                });
                results.totalSize += stats.size;
            }
        }
    } catch (error) {
        console.error('Ошибка сканирования:', error.message);
    }
    return results;
}

function formatSize(bytes) {
    if (bytes < 1024) return `${bytes} байт`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} КБ`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} МБ`;
}

async function searchAndFilter() {
    try {
        const targetDir = process.argv[2] || __dirname;
        console.log(`📊 Анализ директории: ${path.relative(__dirname, targetDir) || '.'}\n`);

        // Вариант 15: анализировать только .js, .json, .txt, .md
        const extensionFilter = ['.js', '.json', '.txt', '.md'];
        console.log('⚠️  Вариант 11-15: Анализируются только .js, .json, .txt, .md\n');

        const results = await scanDirectory(targetDir);
        let files = results.files.filter(f => extensionFilter.includes(f.ext));

        const totalSize = files.reduce((sum, f) => sum + f.size, 0);
        const byExtension = {};
        files.forEach(file => {
            if (!byExtension[file.ext]) byExtension[file.ext] = { count: 0, size: 0 };
            byExtension[file.ext].count++;
            byExtension[file.ext].size += file.size;
        });

        const sortedBySize = [...files].sort((a, b) => b.size - a.size);
        const top5Largest = sortedBySize.slice(0, 5);
        const top5Smallest = [...files].sort((a, b) => a.size - b.size).slice(0, 5);

        console.log(`📁 Общее количество папок: ${results.directories}`);
        console.log(`📄 Общее количество файлов: ${files.length}`);
        console.log(`💾 Общий размер: ${formatSize(totalSize)} (${totalSize.toLocaleString()} байт)\n`);

        console.log('📂 Расширения файлов:');
        Object.entries(byExtension)
            .sort((a, b) => b[1].size - a[1].size)
            .forEach(([ext, data]) => {
                console.log(`   ${ext}: ${data.count} файлов (${formatSize(data.size)})`);
            });

        console.log('\n🏆 Топ-5 самых больших файлов:');
        top5Largest.forEach((file, index) => {
            console.log(`   ${index + 1}. ${file.name} (${formatSize(file.size)}) - ${file.path}`);
        });

        console.log('\n📄 Топ-5 самых маленьких файлов:');
        top5Smallest.forEach((file, index) => {
            console.log(`   ${index + 1}. ${file.name} (${formatSize(file.size)}) - ${file.path}`);
        });

        const report = {
            directory: targetDir,
            variant: variantNumber,
            timestamp: new Date().toISOString(),
            statistics: {
                totalFiles: files.length,
                totalDirectories: results.directories,
                totalSize: totalSize,
                totalSizeFormatted: formatSize(totalSize)
            },
            byExtension,
            top5Largest,
            top5Smallest
        };

        const reportPath = path.join(__dirname, `report_${variantNumber}.json`);
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf8');
        console.log(`\n📄 Отчет сохранен: report_${variantNumber}.json`);
    } catch (error) {
        console.error('❌ Ошибка:', error.message);
    }
}

searchAndFilter();