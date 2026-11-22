const http = require('http');
const url = require('url');

const studentGroup = "477";
const studentName = "Мисовский Андрей";
const PORT = 3000;

function logRequest(method, urlPath, status) {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    console.log(`[${timestamp}] ${method} ${urlPath} ${status}`);
}

function parseBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
            if (body.length > 1024 * 1024) {
                reject(new Error('Payload Too Large'));
            }
        });
        req.on('end', () => resolve(body));
        req.on('error', reject);
    });
}

function parseFormData(body) {
    const params = new URLSearchParams(body);
    const result = {};
    for (const [key, value] of params) {
        result[key] = value;
    }
    return result;
}

const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    const query = parsedUrl.query;

    if (req.method === 'GET' && pathname === '/') {
        const html = `<!DOCTYPE html><html><head><title>Лабораторная работа №20</title></head>
<body><h1>=== Лабораторная работа №20 ===</h1>
<p>Группа: ${studentGroup}</p><p>Метод: ${req.method}</p><p>URL: ${pathname}</p></body></html>`;
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
        logRequest(req.method, pathname, 200);
        return;
    }

    if (req.method === 'GET' && pathname === '/about') {
        const html = `<!DOCTYPE html><html><head><title>О студенте</title></head>
<body><h1>=== О студенте ===</h1>
<p>Группа: ${studentGroup}</p><p>Студент: ${studentName}</p></body></html>`;
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
        logRequest(req.method, pathname, 200);
        return;
    }

    if (req.method === 'GET' && pathname === '/headers') {
        const headersData = {
            headers: req.headers,
            method: req.method,
            url: req.url,
            httpVersion: req.httpVersion
        };
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(headersData, null, 2));
        logRequest(req.method, pathname, 200);
        return;
    }

    if (req.method === 'GET' && pathname === '/headers/set') {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('X-Powered-By', 'Node.js');
        res.setHeader('X-Group', studentGroup);
        res.setHeader('Cache-Control', 'no-cache');
        res.writeHead(200);
        res.end('<h1>Заголовки установлены</h1>');
        logRequest(req.method, pathname, 200);
        return;
    }

    if (req.method === 'GET' && pathname === '/headers/check') {
        const checkResult = {
            hasContentType: res.hasHeader('Content-Type'),
            hasXGroup: res.hasHeader('X-Group'),
            hasUnknown: res.hasHeader('X-Unknown')
        };
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(checkResult, null, 2));
        logRequest(req.method, pathname, 200);
        return;
    }

    if (req.method === 'POST' && pathname === '/echo') {
        try {
            const body = await parseBody(req);
            const contentType = req.headers['content-type'] || 'text/plain';
            
            if (contentType.includes('application/json')) {
                const jsonData = JSON.parse(body);
                jsonData.group = studentGroup;
                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify(jsonData, null, 2));
            } else {
                res.writeHead(200, { 'Content-Type': contentType });
                res.end(body);
            }
            logRequest(req.method, pathname, 200);
        } catch (err) {
            if (err.message === 'Payload Too Large') {
                res.writeHead(413, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end('413 Payload Too Large');
                logRequest(req.method, pathname, 413);
            } else {
                res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end('400 Bad Request');
                logRequest(req.method, pathname, 400);
            }
        }
        return;
    }

    if (req.method === 'POST' && pathname === '/form') {
        try {
            const body = await parseBody(req);
            const formData = parseFormData(body);
            formData.group = studentGroup;
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(formData, null, 2));
            logRequest(req.method, pathname, 200);
        } catch (err) {
            res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('400 Bad Request');
            logRequest(req.method, pathname, 400);
        }
        return;
    }

    const html404 = `<!DOCTYPE html><html><head><title>404 Not Found</title></head>
<body><h1>=== 404 Not Found ===</h1><p>Путь ${pathname} не найден</p></body></html>`;
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html404);
    logRequest(req.method, pathname, 404);
});

server.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
    console.log(`Группа: ${studentGroup}`);
    console.log(`Студент: ${studentName}`);
});