const os = require('os');

const studentGroup = "477"; 

console.log(`=== Информация о системе (группа ${studentGroup}) ===`);

console.log(`Платформа: ${os.platform()}`);
console.log(`Тип ОС: ${os.type()}`);
console.log(`Архитектура: ${os.arch()}`);
console.log(`Версия ОС: ${os.release()}`);
console.log(`Имя хоста: ${os.hostname()}`);

const uptimeSeconds = os.uptime();
const hours = Math.floor(uptimeSeconds / 3600);
const minutes = Math.floor((uptimeSeconds % 3600) / 60);
const seconds = Math.floor(uptimeSeconds % 60);
console.log(`Время работы: ${hours} ч ${minutes} мин ${seconds} сек`);

let platformName = "Неизвестная платформа";
if (os.platform() === 'win32') platformName = "Вы работаете в Windows";
else if (os.platform() === 'linux') platformName = "Вы работаете в Linux";
else if (os.platform() === 'darwin') platformName = "Вы работаете в macOS";
console.log(platformName);

console.log('\n=== Информация о процессоре ===');
const cpus = os.cpus();
console.log(`Количество логических ядер: ${cpus.length}`);
console.log(`Модель процессора: ${cpus[0].model}`);

let totalFreq = 0;
cpus.forEach(cpu => totalFreq += cpu.speed);
const avgFreq = Math.round(totalFreq / cpus.length);
console.log(`Средняя частота: ${avgFreq} МГц`);

console.log('\n=== Информация о памяти ===');
const totalMemGB = (os.totalmem() / (1024 * 1024 * 1024)).toFixed(2);
const freeMemGB = (os.freemem() / (1024 * 1024 * 1024)).toFixed(2);
const usedMemGB = (totalMemGB - freeMemGB).toFixed(2);
const memPercent = ((usedMemGB / totalMemGB) * 100).toFixed(1);

console.log(`Общий объём: ${totalMemGB} ГБ`);
console.log(`Свободно: ${freeMemGB} ГБ`);
console.log(`Использовано: ${usedMemGB} ГБ (${memPercent}%)`);
console.log(`Группа: ${studentGroup}`);

if (parseFloat(freeMemGB) < (parseFloat(totalMemGB) * 0.2)) {
    console.log('⚠️ Внимание! Свободной памяти меньше 20%');
} else {
    console.log('Память в норме');
}

console.log('\n=== Загрузка системы ===');
const loadAvg = os.loadavg();
if (os.platform() === 'win32') {
    console.log('Загрузка CPU (Windows): недоступна через os.loadavg()');
    console.log('(Для Windows используйте сторонние библиотеки или wmic)');
} else {
    console.log(`Загрузка за 1 мин: ${loadAvg[0].toFixed(2)}`);
    console.log(`Загрузка за 5 мин: ${loadAvg[1].toFixed(2)}`);
    console.log(`Загрузка за 15 мин: ${loadAvg[2].toFixed(2)}`);
}

console.log('\n=== Сетевые интерфейсы ===');
const networkInterfaces = os.networkInterfaces();
let primaryInterface = null;
let interfaceCount = 0;

for (const [name, details] of Object.entries(networkInterfaces)) {
    const ipv4 = details.find(d => d.family === 'IPv4' && !d.internal);
    if (ipv4) {
        const maskedMac = ipv4.mac.replace(/(..)(..)(..)/, '$1:$2:$3:**:**:**');
        console.log(`Интерфейс: ${name}`);
        console.log(`  IPv4: ${ipv4.address}`);
        console.log(`  MAC: ${maskedMac}`);
        console.log(`  Внутренний: ${ipv4.internal ? 'да' : 'нет'}`);
        if (!primaryInterface) primaryInterface = name;
    }
    interfaceCount++;
}

console.log(`Всего интерфейсов: ${interfaceCount}`);
if (primaryInterface) {
    const ip = networkInterfaces[primaryInterface].find(d => d.family === 'IPv4' && !d.internal)?.address || 'N/A';
    console.log(`Основной интерфейс: ${primaryInterface} (${ip})`);
}

console.log('\n=== Информация о пользователе ===');
try {
    const userInfo = os.userInfo();
    console.log(`Имя пользователя: ${userInfo.username}`);
    if (os.platform() !== 'win32') {
        console.log(`UID: ${userInfo.uid}`);
        console.log(`GID: ${userInfo.gid}`);
        console.log(`Оболочка: ${userInfo.shell}`);
    }
    console.log(`Домашняя директория: ${userInfo.homedir}`);
    
    if (os.platform() !== 'win32' && userInfo.uid === 0) {
        console.log('⚠️ Вы работаете под root!');
    } else {
        console.log(`Проверка root: нет`);
    }
} catch (err) {
    console.log(`Информация о пользователе недоступна: ${err.message}`);
}

console.log(`\nГруппа: ${studentGroup}`);