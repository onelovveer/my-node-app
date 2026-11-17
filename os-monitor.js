const os = require('os');
const fs = require('fs');
const path = require('path');

const studentGroup = "477";

const LOG_FILE = path.join(__dirname, 'monitor.log');

function getSnapshot() {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const memPercent = ((freeMem / totalMem) * 100).toFixed(1);
    
    return {
        timestamp: new Date().toISOString(),
        group: studentGroup,
        cpuLoad: os.loadavg()[0],
        totalMemGB: (totalMem / (1024 ** 3)).toFixed(2),
        freeMemGB: (freeMem / (1024 ** 3)).toFixed(2),
        memPercentUsed: (100 - parseFloat(memPercent)).toFixed(1)
    };
}

function calculateCpuUsage(prevCpus, currCpus) {
    let prevIdle = 0, prevTotal = 0;
    let currIdle = 0, currTotal = 0;
    
    for (let i = 0; i < prevCpus.length; i++) {
        const prev = prevCpus[i].times;
        const curr = currCpus[i].times;
        
        prevIdle += prev.idle;
        prevTotal += Object.values(prev).reduce((a, b) => a + b, 0);
        
        currIdle += curr.idle;
        currTotal += Object.values(curr).reduce((a, b) => a + b, 0);
    }
    
    const idleDiff = currIdle - prevIdle;
    const totalDiff = currTotal - prevTotal;
    
    if (totalDiff === 0) return 0;
    return ((1 - idleDiff / totalDiff) * 100).toFixed(1);
}

function logWarning(message) {
    const entry = `[${new Date().toISOString()}][${studentGroup}] ${message}\n`;
    fs.appendFileSync(LOG_FILE, entry, 'utf8');
    console.error(`\x1b[33m${message}\x1b[0m`);
}

async function monitor() {
    console.log(`Мониторинг (группа ${studentGroup}). Ctrl+C для выхода.\n`);
    
    let prevCpus = os.cpus();
    let warningsCount = 0;
    
    const initialSnapshot = getSnapshot();
    console.log('Первичный снимок системы:');
    console.log(JSON.stringify(initialSnapshot, null, 2));
    console.log('\nНачало мониторинга...\n');
    
    const interval = setInterval(() => {
        const currCpus = os.cpus();
        const cpuUsage = calculateCpuUsage(prevCpus, currCpus);
        const snapshot = getSnapshot();
        
        prevCpus = currCpus;
        
        let status = '';
        let warningLevel = 0;
        
        if (cpuUsage > 30) {
            status += ' ⚠⚠';
            warningLevel = 2;
            logWarning(`Критическая загрузка CPU: ${cpuUsage}%`);
        } else if (cpuUsage > 15) {
            status += ' ⚠';
            warningLevel = 1;
            logWarning(`Высокая загрузка CPU: ${cpuUsage}%`);
        }
        
        const freeMemPercent = parseFloat(snapshot.memPercentUsed);
        if (freeMemPercent < 10) {
            status += ' 🔴';
            logWarning(`Критически мало свободной памяти: ${snapshot.freeMemGB} ГБ`);
        }
        
        if (warningLevel > 0) warningsCount++;
        
        process.stdout.write(`\rCPU: ${cpuUsage}% | RAM: ${snapshot.memPercentUsed}% (${snapshot.freeMemGB} ГБ свободно)${status}   `);
        
    }, 2000);
    
    process.on('SIGINT', () => {
        clearInterval(interval);
        console.log(`\n\nМониторинг остановлен. Предупреждений: ${warningsCount}`);
        if (warningsCount > 0) {
            console.log(`Лог сохранён в: ${LOG_FILE}`);
        }
        process.exit(0);
    });
}

monitor();