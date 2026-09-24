const http = require('http');

const studentName = "Мисовский Андрей Дмитриевич";
const studentGroup = "477";
const journalNumber = 15;

function calculatePi(decimalPlaces) {
    let pi = 3.0;
    let sign = 1;
    for (let i = 1; i <= 100000; i++) {
        let term = 4.0 / ((2 * i) * (2 * i + 1) * (2 * i + 2));
        pi += sign * term;
        sign = -sign;
    }
    return pi.toFixed(decimalPlaces);
}

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    
    const piValue = calculatePi(journalNumber);
    
    const html = `
        <h1>${studentName}</h1>
        <h2>${studentGroup}</h2>
        <p>Число Пи: ${piValue}</p>
    `;
    
    res.end(html);
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});