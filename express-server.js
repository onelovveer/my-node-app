const express = require('express');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const swaggerUi = require('swagger-ui-express');
const Joi = require('joi');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

const studentName = "Мисовский Андрей";
const studentGroup = "477";
const variantNumber = 15;
const JWT_SECRET = "lab16-secret-key-" + studentGroup;

app.use(express.json());

app.use(morgan(':date[iso] :method :url :status - :response-time ms'));

app.use(compression());

const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    message: { error: "Слишком много запросов, попробуйте позже", status: 429 }
});
app.use('/api/', limiter);

const LOG_FILE = path.join(__dirname, 'express-operations.log');
function logOperation(operation) {
    const entry = `[${new Date().toISOString()}] ${operation}\n`;
    fs.appendFile(LOG_FILE, entry, 'utf8', () => {});
}

const bookTitles = [
    "Война и мир", "Преступление и наказание", "Мастер и Маргарита",
    "1984", "Гарри Поттер", "Анна Каренина", "Идиот", "Братья Карамазовы",
    "Отцы и дети", "Евгений Онегин", "Тихий Дон", "Доктор Живаго",
    "Убить пересмешника", "Великий Гэтсби", "Над пропастью во ржи",
    "Сто лет одиночества", "Гордость и предубеждение", "Джейн Эйр",
    "Граф Монте-Кристо", "Три мушкетера", "Мертвые души", "Ревизор",
    "Гроза", "Вишневый сад", "Чайка", "Дядя Ваня", "Три сестры"
];

const bookAuthors = [
    "Толстой", "Достоевский", "Булгаков", "Оруэлл", "Роулинг",
    "Чехов", "Гоголь", "Пушкин", "Шолохов", "Пастернак",
    "Харпер Ли", "Фицджеральд", "Сэлинджер", "Маркес", "Остин",
    "Бронте", "Дюма", "Тургенев", "Лермонтов", "Гончаров"
];

const bookGenres = ["роман", "повесть", "рассказ", "поэма", "драма", "комедия", "трагедия"];

function generateISBN() {
    return "978-" + Math.floor(1000000000 + Math.random() * 9000000000);
}

function generateBooks(count) {
    const books = [];
    for (let i = 0; i < count; i++) {
        const title = bookTitles[i % bookTitles.length] + (i >= bookTitles.length ? ` ${Math.floor(i / bookTitles.length) + 1}` : "");
        const author = bookAuthors[Math.floor(Math.random() * bookAuthors.length)];
        const year = Math.floor(Math.random() * (2024 - 1800 + 1)) + 1800;
        const genre = bookGenres[Math.floor(Math.random() * bookGenres.length)];
        const available = Math.random() > 0.3;

        books.push({
            id: i + 1,
            title: title,
            author: author,
            year: year,
            genre: genre,
            isbn: generateISBN(),
            available: available,
            reviews: []
        });
    }
    return books;
}

let books = generateBooks(100);
let nextBookId = 101;

console.log(`📚 Сгенерировано ${books.length} книг (вариант ${variantNumber})`);

let users = [];
let nextUserId = 1;

const registerSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    name: Joi.string().min(2).required()
});

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
});

function authenticateJWT(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: "Требуется авторизация", status: 401 });
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ error: "Недействительный токен", status: 403 });
    }
}

function requireAdmin(req, res, next) {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: "Доступ запрещен", status: 403 });
    }
    next();
}

const bookSchema = Joi.object({
    title: Joi.string().min(1).required(),
    author: Joi.string().min(1).required(),
    year: Joi.number().integer().min(1000).max(2026).required(),
    genre: Joi.string().required()
});

const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

function getCache(key) {
    const entry = cache.get(key);
    if (entry && Date.now() - entry.time < CACHE_TTL) {
        return entry.data;
    }
    cache.delete(key);
    return null;
}

function setCache(key, data) {
    cache.set(key, { data, time: Date.now() });
}

app.get('/', (req, res) => {
    res.type('html').send(`
        <!DOCTYPE html>
        <html lang="ru">
        <head>
            <meta charset="UTF-8">
            <title>Лабораторная работа №16</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 40px; background: #f4f4f8; }
                .card { background: #fff; padding: 24px; border-radius: 10px;
                        box-shadow: 0 2px 8px rgba(0,0,0,.1); max-width: 600px; }
                h1 { color: #2c3e50; }
                p { color: #555; }
                a { color: #3498db; text-decoration: none; }
                a:hover { text-decoration: underline; }
                ul { color: #555; }
            </style>
        </head>
        <body>
            <div class="card">
                <h1>Лабораторная работа №16</h1>
                <p><b>Студент:</b> ${studentName}</p>
                <p><b>Группа:</b> ${studentGroup}</p>
                <p><b>Дата и время:</b> ${new Date().toLocaleString("ru-RU")}</p>
                <p>Добро пожаловать на сервер, созданный с помощью фреймворка <b>Express.js</b>!</p>
                <h3>Доступные маршруты:</h3>
                <ul>
                    <li><a href="/">/</a> — главная страница</li>
                    <li><a href="/about">/about</a> — о разработчике</li>
                    <li><a href="/contacts">/contacts</a> — контакты</li>
                    <li><a href="/api/books">/api/books</a> — API книг</li>
                    <li><a href="/api-docs">/api-docs</a> — Swagger документация</li>
                </ul>
            </div>
        </body>
        </html>
    `);
});

app.get('/about', (req, res) => {
    res.type('html').send(`
        <!DOCTYPE html>
        <html lang="ru">
        <head><meta charset="UTF-8"><title>О разработчике</title></head>
        <body style="font-family: Arial; margin: 40px;">
            <h1>О разработчике</h1>
            <p><b>ФИО:</b> ${studentName}</p>
            <p><b>Группа:</b> ${studentGroup}</p>
            <p><b>Вариант:</b> ${variantNumber}</p>
            <p><b>Технологии:</b> Node.js, Express.js, JWT, Swagger</p>
        </body>
        </html>
    `);
});

app.get('/contacts', (req, res) => {
    res.type('html').send(`
        <!DOCTYPE html>
        <html lang="ru">
        <head><meta charset="UTF-8"><title>Контакты</title></head>
        <body style="font-family: Arial; margin: 40px;">
            <h1>Контактная информация</h1>
            <p><b>Email:</b> student@example.com</p>
            <p><b>GitHub:</b> https://github.com/onelovveer</p>
            <p><b>Телефон:</b> +375 (XX) XXX-XX-XX</p>
        </body>
        </html>
    `);
});

app.get('/error', (req, res, next) => {
    next(new Error("Тестовая синхронная ошибка"));
});

app.get('/async-error', async (req, res, next) => {
    try {
        throw new Error("Тестовая асинхронная ошибка");
    } catch (err) {
        next(err);
    }
});

app.post('/auth/register', async (req, res, next) => {
    try {
        const { error, value } = registerSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message, status: 400 });
        }
        const { email, password, name } = value;
        if (users.find(u => u.email === email)) {
            return res.status(400).json({ error: "Пользователь уже существует", status: 400 });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = {
            id: nextUserId++,
            email,
            name,
            password: hashedPassword,
            role: users.length === 0 ? 'admin' : 'user'
        };
        users.push(user);
        logOperation(`Регистрация: ${email}`);
        res.status(201).json({ message: "Пользователь зарегистрирован", userId: user.id, role: user.role });
    } catch (err) {
        next(err);
    }
});

app.post('/auth/login', async (req, res, next) => {
    try {
        const { error, value } = loginSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message, status: 400 });
        }
        const { email, password } = value;
        const user = users.find(u => u.email === email);
        if (!user) {
            return res.status(401).json({ error: "Неверный email или пароль", status: 401 });
        }
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            return res.status(401).json({ error: "Неверный email или пароль", status: 401 });
        }
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '1h' }
        );
        logOperation(`Вход: ${email}`);
        res.json({ token, role: user.role });
    } catch (err) {
        next(err);
    }
});

app.get('/api/books/stats', authenticateJWT, (req, res) => {
    const cacheKey = 'stats';
    const cached = getCache(cacheKey);
    if (cached) return res.json(cached);

    const byAuthor = {};
    const byGenre = {};
    let oldest = 9999, newest = 0;

    books.forEach(b => {
        byAuthor[b.author] = (byAuthor[b.author] || 0) + 1;
        byGenre[b.genre] = (byGenre[b.genre] || 0) + 1;
        if (b.year < oldest) oldest = b.year;
        if (b.year > newest) newest = b.year;
    });

    const stats = {
        total: books.length,
        byAuthor,
        byGenre,
        oldestYear: oldest,
        newestYear: newest
    };
    setCache(cacheKey, stats);
    res.json(stats);
});

app.get('/api/books/search', authenticateJWT, (req, res) => {
    const { author } = req.query;
    if (!author) {
        return res.status(400).json({ error: "Параметр author обязателен", status: 400 });
    }
    const results = books.filter(b => b.author.toLowerCase().includes(author.toLowerCase()));
    res.json(results);
});

app.get('/api/books', authenticateJWT, (req, res) => {
    const { author, year, yearFrom, yearTo, limit = "10", page = "1", sort, search } = req.query;

    let result = [...books];

    if (author) {
        result = result.filter(b => b.author.toLowerCase().includes(author.toLowerCase()));
    }

    if (year) {
        result = result.filter(b => b.year === Number(year));
    }
    if (yearFrom) {
        result = result.filter(b => b.year >= Number(yearFrom));
    }
    if (yearTo) {
        result = result.filter(b => b.year <= Number(yearTo));
    }

    if (search) {
        const s = search.toLowerCase();
        result = result.filter(b =>
            b.title.toLowerCase().includes(s) || b.author.toLowerCase().includes(s)
        );
    }

    if (sort) {
        const desc = sort.startsWith('-');
        const field = desc ? sort.substring(1) : sort;
        result.sort((a, b) => {
            const va = a[field];
            const vb = b[field];
            if (va < vb) return desc ? 1 : -1;
            if (va > vb) return desc ? -1 : 1;
            return 0;
        });
    }

    const limitNum = Math.max(1, Math.min(100, Number(limit)));
    const pageNum = Math.max(1, Number(page));
    const total = result.length;
    const totalPages = Math.ceil(total / limitNum);
    const offset = (pageNum - 1) * limitNum;
    const pageData = result.slice(offset, offset + limitNum);

    res.json({
        total,
        page: pageNum,
        totalPages,
        limit: limitNum,
        data: pageData
    });
});

app.get('/api/books/available', authenticateJWT, (req, res) => {
    const available = books.filter(b => b.available);
    res.json({ total: available.length, data: available });
});

app.get('/api/books/recommendations', authenticateJWT, (req, res) => {
    const { genre } = req.query;
    if (!genre) {
        return res.status(400).json({ error: "Параметр genre обязателен", status: 400 });
    }
    const recs = books.filter(b => b.genre.toLowerCase() === genre.toLowerCase()).slice(0, 5);
    res.json({ genre, recommendations: recs });
});

app.get('/api/books/export', authenticateJWT, (req, res) => {
    res.json({ total: books.length, books });
});

app.get('/api/books/:id', authenticateJWT, (req, res) => {
    const id = Number(req.params.id);
    const book = books.find(b => b.id === id);
    if (!book) {
        return res.status(404).json({ error: "Книга не найдена", status: 404 });
    }
    res.json(book);
});

app.post('/api/books', authenticateJWT, requireAdmin, (req, res, next) => {
    try {
        const { error, value } = bookSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message, status: 400 });
        }
        const { title, author, year, genre } = value;
        const duplicate = books.find(b => b.title === title && b.author === author);
        if (duplicate) {
            return res.status(400).json({ error: "Книга с таким названием и автором уже существует", status: 400 });
        }
        const book = {
            id: nextBookId++,
            title, author, year, genre,
            isbn: generateISBN(),
            available: true,
            reviews: []
        };
        books.push(book);
        logOperation(`Добавлена книга: ${title} (${author})`);
        res.status(201).json(book);
    } catch (err) {
        next(err);
    }
});

app.put('/api/books/:id', authenticateJWT, requireAdmin, (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const idx = books.findIndex(b => b.id === id);
        if (idx === -1) {
            return res.status(404).json({ error: "Книга не найдена", status: 404 });
        }
        const { error, value } = bookSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message, status: 400 });
        }
        books[idx] = { ...books[idx], ...value };
        logOperation(`Обновлена книга ID=${id}`);
        res.json(books[idx]);
    } catch (err) {
        next(err);
    }
});

app.delete('/api/books/:id', authenticateJWT, requireAdmin, (req, res) => {
    const id = Number(req.params.id);
    const idx = books.findIndex(b => b.id === id);
    if (idx === -1) {
        return res.status(404).json({ error: "Книга не найдена", status: 404 });
    }
    books.splice(idx, 1);
    logOperation(`Удалена книга ID=${id}`);
    res.json({ message: "Книга удалена", id });
});

app.post('/api/books/:id/reviews', authenticateJWT, (req, res) => {
    const id = Number(req.params.id);
    const book = books.find(b => b.id === id);
    if (!book) {
        return res.status(404).json({ error: "Книга не найдена", status: 404 });
    }
    const { text, rating } = req.body;
    if (!text || !rating) {
        return res.status(400).json({ error: "Поля text и rating обязательны", status: 400 });
    }
    const review = {
        id: book.reviews.length + 1,
        user: req.user.email,
        text,
        rating: Number(rating),
        date: new Date().toISOString()
    };
    book.reviews.push(review);
    res.status(201).json(review);
});

const swaggerDocument = {
    openapi: '3.0.0',
    info: {
        title: 'Library API (ЛР №16)',
        version: '1.0.0',
        description: `REST API для управления библиотекой. Студент: ${studentName}, группа: ${studentGroup}`
    },
    servers: [{ url: `http://localhost:${PORT}` }],
    paths: {
        '/api/books': {
            get: {
                summary: 'Получить список книг',
                parameters: [
                    { name: 'author', in: 'query', schema: { type: 'string' } },
                    { name: 'year', in: 'query', schema: { type: 'integer' } },
                    { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
                    { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
                    { name: 'sort', in: 'query', schema: { type: 'string' } },
                    { name: 'search', in: 'query', schema: { type: 'string' } }
                ],
                responses: { '200': { description: 'Список книг' } }
            },
            post: {
                summary: 'Добавить книгу (только админ)',
                requestBody: {
                    content: { 'application/json': { schema: { type: 'object', properties: { title: { type: 'string' }, author: { type: 'string' }, year: { type: 'integer' }, genre: { type: 'string' } } } } }
                },
                responses: { '201': { description: 'Книга создана' } }
            }
        },
        '/api/books/{id}': {
            get: {
                summary: 'Получить книгу по ID',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                responses: { '200': { description: 'Книга' }, '404': { description: 'Не найдена' } }
            }
        },
        '/auth/register': {
            post: {
                summary: 'Регистрация пользователя',
                requestBody: {
                    content: { 'application/json': { schema: { type: 'object', properties: { email: { type: 'string' }, password: { type: 'string' }, name: { type: 'string' } } } } }
                },
                responses: { '201': { description: 'Пользователь зарегистрирован' } }
            }
        },
        '/auth/login': {
            post: {
                summary: 'Вход в систему',
                requestBody: {
                    content: { 'application/json': { schema: { type: 'object', properties: { email: { type: 'string' }, password: { type: 'string' } } } } }
                },
                responses: { '200': { description: 'JWT токен' } }
            }
        }
    }
};

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use((err, req, res, next) => {
    console.error("❌ Ошибка:", err.message);
    res.status(err.status || 500).json({
        error: err.message || "Внутренняя ошибка сервера",
        status: err.status || 500
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Express-сервер запущен на http://localhost:${PORT}`);
    console.log(`📖 Swagger документация: http://localhost:${PORT}/api-docs`);
});