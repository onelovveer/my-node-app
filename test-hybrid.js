const FileManagerHybrid = require('./fileOperationsHybrid');

const fm = new FileManagerHybrid('./test-data-hybrid');

async function runTests() {
    console.log('=== ГИБРИДНЫЙ ПОДХОД ===\n');

    console.log('1. Стиль промисов (async/await):');
    try {
        const path1 = await fm.createFile('promise.txt', 'Создано через промис');
        console.log('  ✅ Создан: ' + path1);
        const content = await fm.readFile('promise.txt');
        console.log('  ✅ Прочитано: "' + content + '"');
        await fm.deleteFile('promise.txt');
        console.log('  ✅ Удалён');
    } catch (err) {
        console.error('  ❌ ' + err.message);
    }

    console.log('\n2. Стиль колбэков:');
    fm.createFile('callback.txt', 'Создано через колбэк', (err, filePath) => {
        if (err) {
            console.error('  ❌ ' + err.message);
            return;
        }
        console.log('  ✅ Создан: ' + filePath);

        fm.readFile('callback.txt', (err, data) => {
            if (err) {
                console.error('  ❌ ' + err.message);
                return;
            }
            console.log('  ✅ Прочитано: "' + data + '"');

            fm.deleteFile('callback.txt', (err) => {
                if (err) {
                    console.error('  ❌ ' + err.message);
                    return;
                }
                console.log('  ✅ Удалён');
                console.log('\n✅ Гибридный модуль работает в обоих стилях!');
            });
        });
    });
}

runTests();