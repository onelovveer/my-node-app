const Koa = require('koa');
const bodyParser = require('koa-bodyparser');

const app = new Koa();

const studentName = "Мисовский Андрей";
const studentGroup = "477";
const variantNumber = 15;

app.use(bodyParser());

app.use(async (ctx, next) => {
    const start = Date.now();
    await next();
    const ms = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${ctx.method} ${ctx.path} - ${ms}ms`);
});

app.use(async (ctx, next) => {
    try {
        await next();
    } catch (err) {
        ctx.status = err.status || 500;
        ctx.body = {
            error: err.message || "Внутренняя ошибка сервера",
            status: ctx.status
        };
        console.error("❌ Ошибка:", err.message);
    }
});

app.use(async (ctx, next) => {
    if (ctx.path === "/protected") {
        const auth = ctx.headers["authorization"];
        if (!auth) {
            ctx.status = 401;
            ctx.body = { error: "Требуется авторизация", status: 401 };
            return;
        }
    }
    await next();
});

const firstNames = [
    "Александр", "Дмитрий", "Максим", "Сергей", "Андрей",
    "Алексей", "Артём", "Илья", "Кирилл", "Михаил",
    "Анна", "Мария", "Екатерина", "Дарья", "Анастасия",
    "Полина", "София", "Виктория", "Елизавета", "Валерия"
];

const lastNames = [
    "Иванов", "Смирнов", "Кузнецов", "Попов", "Васильев",
    "Петров", "Соколов", "Михайлов", "Новиков", "Фёдоров",
    "Морозов", "Волков", "Алексеев", "Лебедев", "Семёнов",
    "Егоров", "Павлов", "Козлов", "Степанов", "Николаев"
];

const groups = ["ББМО-01-23", "ББМО-02-23", "ББМО-03-23", "ИТ-21", "ИТ-22"];

function generateStudents(count, baseGroup) {
    const students = [];
    const baseGroupIndex = (variantNumber - 1) % groups.length;

    for (let i = 0; i < count; i++) {
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        const group = Math.random() < 0.6 ? baseGroup : groups[Math.floor(Math.random() * groups.length)];
        const course = Math.floor(Math.random() * 4) + 1;

        students.push({
            id: i + 1,
            name: `${lastName} ${firstName}`,
            group: group,
            course: course
        });
    }
    return students;
}

let students = generateStudents(50, studentGroup);
let nextStudentId = 51;

console.log(`📚 Сгенерировано ${students.length} студентов (вариант ${variantNumber})`);

let users = [
    { id: 1, name: "Иванов Иван", group: "П-11" }
];
let nextUserId = 2;

app.use(async (ctx) => {

    if (ctx.path === "/" && ctx.method === "GET") {
        ctx.type = "html";
        ctx.body = `
            <!DOCTYPE html>
            <html lang="ru">
            <head>
                <meta charset="UTF-8">
                <title>Лабораторная работа №15</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 40px; background: #f4f4f8; }
                    .card { background: #fff; padding: 24px; border-radius: 10px;
                            box-shadow: 0 2px 8px rgba(0,0,0,.1); max-width: 520px; }
                    h1 { color: #2c3e50; }
                    p { color: #555; }
                </style>
            </head>
            <body>
                <div class="card">
                    <h1>Лабораторная работа №15</h1>
                    <p><b>Студент:</b> ${studentName}</p>
                    <p><b>Группа:</b> ${studentGroup}</p>
                    <p><b>Дата и время:</b> ${new Date().toLocaleString("ru-RU")}</p>
                    <p>Добро пожаловать на сервер, созданный с помощью фреймворка <b>Koa.js</b>!</p>
                </div>
            </body>
            </html>
        `;
        return;
    }

    if (ctx.path === "/error") {
        throw new Error("Тестовая ошибка сервера");
    }

    if (ctx.path === "/protected") {
        ctx.body = {
            message: "Доступ разрешён",
            user: studentName,
            authorizationHeader: ctx.headers["authorization"]
        };
        return;
    }

    if (ctx.path === "/api/users" && ctx.method === "GET") {
        ctx.body = users;
        return;
    }

    if (ctx.path === "/api/users" && ctx.method === "POST") {
        const { name, group } = ctx.request.body || {};
        if (!name || !group) {
            ctx.status = 400;
            ctx.body = { error: "Поля name и group обязательны", status: 400 };
            return;
        }
        const user = { id: nextUserId++, name, group };
        users.push(user);
        ctx.status = 201;
        ctx.body = user;
        return;
    }

    const userMatch = ctx.path.match(/^\/api\/users\/(\d+)$/);
    if (userMatch) {
        const id = Number(userMatch[1]);
        const idx = users.findIndex(u => u.id === id);

        if (ctx.method === "GET") {
            if (idx === -1) {
                ctx.status = 404;
                ctx.body = { error: "Пользователь не найден", status: 404 };
                return;
            }
            ctx.body = users[idx];
            return;
        }

        if (ctx.method === "PUT") {
            if (idx === -1) {
                ctx.status = 404;
                ctx.body = { error: "Пользователь не найден", status: 404 };
                return;
            }
            const { name, group } = ctx.request.body || {};
            if (!name || !group) {
                ctx.status = 400;
                ctx.body = { error: "Поля name и group обязательны", status: 400 };
                return;
            }
            users[idx] = { ...users[idx], name, group };
            ctx.body = users[idx];
            return;
        }

        if (ctx.method === "DELETE") {
            if (idx === -1) {
                ctx.status = 404;
                ctx.body = { error: "Пользователь не найден", status: 404 };
                return;
            }
            users.splice(idx, 1);
            ctx.body = { message: "Пользователь удалён", id };
            return;
        }
    }


    if (ctx.path === "/students" && ctx.method === "GET") {
        const { group } = ctx.query;
        let result = students;
        if (group) {
            result = students.filter(s => s.group === group);
        }
        ctx.body = result;
        return;
    }

    const studentGetMatch = ctx.path.match(/^\/students\/(\d+)$/);
    if (studentGetMatch && ctx.method === "GET") {
        const id = Number(studentGetMatch[1]);
        const student = students.find(s => s.id === id);
        if (!student) {
            ctx.status = 404;
            ctx.body = { error: "Студент не найден", status: 404 };
            return;
        }
        ctx.body = student;
        return;
    }

    if (ctx.path === "/students" && ctx.method === "POST") {
        const { name, group, course } = ctx.request.body || {};
        if (!name || !group || !course) {
            ctx.status = 400;
            ctx.body = { error: "Поля name, group и course обязательны", status: 400 };
            return;
        }
        const student = { id: nextStudentId++, name, group, course: Number(course) };
        students.push(student);
        ctx.status = 201;
        ctx.body = student;
        return;
    }

    const studentPutMatch = ctx.path.match(/^\/students\/(\d+)$/);
    if (studentPutMatch && ctx.method === "PUT") {
        const id = Number(studentPutMatch[1]);
        const idx = students.findIndex(s => s.id === id);
        if (idx === -1) {
            ctx.status = 404;
            ctx.body = { error: "Студент не найден", status: 404 };
            return;
        }
        const { name, group, course } = ctx.request.body || {};
        if (!name || !group || !course) {
            ctx.status = 400;
            ctx.body = { error: "Поля name, group и course обязательны", status: 400 };
            return;
        }
        students[idx] = { ...students[idx], name, group, course: Number(course) };
        ctx.body = students[idx];
        return;
    }

    const studentDelMatch = ctx.path.match(/^\/students\/(\d+)$/);
    if (studentDelMatch && ctx.method === "DELETE") {
        const id = Number(studentDelMatch[1]);
        const idx = students.findIndex(s => s.id === id);
        if (idx === -1) {
            ctx.status = 404;
            ctx.body = { error: "Студент не найден", status: 404 };
            return;
        }
        students.splice(idx, 1);
        ctx.body = { message: "Студент удалён", id };
        return;
    }

    if (ctx.path === "/api/students" && ctx.method === "GET") {
        const { limit = "10", offset = "0", sort, search } = ctx.query;

        let result = [...students];

        if (search) {
            const searchLower = search.toLowerCase();
            result = result.filter(s => s.name.toLowerCase().includes(searchLower));
        }

        if (sort) {
            const desc = sort.startsWith("-");
            const field = desc ? sort.substring(1) : sort;
            result.sort((a, b) => {
                const va = a[field];
                const vb = b[field];
                if (va < vb) return desc ? 1 : -1;
                if (va > vb) return desc ? -1 : 1;
                return 0;
            });
        }

        const total = result.length;
        const limitNum = Math.max(1, Math.min(100, Number(limit)));
        const offsetNum = Math.max(0, Number(offset));
        const page = result.slice(offsetNum, offsetNum + limitNum);

        ctx.body = {
            total,
            limit: limitNum,
            offset: offsetNum,
            data: page
        };
        return;
    }

    const apiStudentGetMatch = ctx.path.match(/^\/api\/students\/(\d+)$/);
    if (apiStudentGetMatch && ctx.method === "GET") {
        const id = Number(apiStudentGetMatch[1]);
        const student = students.find(s => s.id === id);
        if (!student) {
            ctx.status = 404;
            ctx.body = { error: "Студент не найден", status: 404 };
            return;
        }
        ctx.body = student;
        return;
    }

    if (ctx.path === "/api/students" && ctx.method === "POST") {
        const { name, group, course } = ctx.request.body || {};
        if (!name || !group || !course) {
            ctx.status = 400;
            ctx.body = { error: "Поля name, group и course обязательны", status: 400 };
            return;
        }
        const student = { id: nextStudentId++, name, group, course: Number(course) };
        students.push(student);
        ctx.status = 201;
        ctx.body = student;
        return;
    }

    const apiStudentPutMatch = ctx.path.match(/^\/api\/students\/(\d+)$/);
    if (apiStudentPutMatch && ctx.method === "PUT") {
        const id = Number(apiStudentPutMatch[1]);
        const idx = students.findIndex(s => s.id === id);
        if (idx === -1) {
            ctx.status = 404;
            ctx.body = { error: "Студент не найден", status: 404 };
            return;
        }
        const { name, group, course } = ctx.request.body || {};
        if (!name || !group || !course) {
            ctx.status = 400;
            ctx.body = { error: "Поля name, group и course обязательны", status: 400 };
            return;
        }
        students[idx] = { ...students[idx], name, group, course: Number(course) };
        ctx.body = students[idx];
        return;
    }

    const apiStudentDelMatch = ctx.path.match(/^\/api\/students\/(\d+)$/);
    if (apiStudentDelMatch && ctx.method === "DELETE") {
        const id = Number(apiStudentDelMatch[1]);
        const idx = students.findIndex(s => s.id === id);
        if (idx === -1) {
            ctx.status = 404;
            ctx.body = { error: "Студент не найден", status: 404 };
            return;
        }
        students.splice(idx, 1);
        ctx.body = { message: "Студент удалён", id };
        return;
    }

    ctx.status = 404;
    ctx.body = { error: "Страница не найдена", status: 404 };
});

// Запуск сервера
app.listen(3000, () => {
    console.log("🚀 Koa-сервер запущен на http://localhost:3000");
});