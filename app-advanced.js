require('dotenv').config();
const Koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');
const logger = require('koa-logger');
const { MongoClient } = require('mongodb');
const Joi = require('joi');

const studentGroup = "477";
const PORT = process.env.PORT || 3002;

const app = new Koa();
const router = new Router();
const client = new MongoClient(process.env.MONGODB_URI);
let db;

async function getUsersWithPagination(query) {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
    const skip = (page - 1) * limit;
    
    const filter = {};
    if (query.group_name) filter.group_name = query.group_name;
    if (query.course) filter.course = parseInt(query.course);
    if (query.age_min || query.age_max) {
        filter.age = {};
        if (query.age_min) filter.age.$gte = parseInt(query.age_min);
        if (query.age_max) filter.age.$lte = parseInt(query.age_max);
    }
    
    const sort = {};
    const allowedSorts = ['name', 'age', 'grade', 'created_at'];
    if (query.sort) {
        const field = query.sort.startsWith('-') ? query.sort.substring(1) : query.sort;
        if (allowedSorts.includes(field)) sort[field] = query.sort.startsWith('-') ? -1 : 1;
    }
    
    const total = await db.collection('users').countDocuments(filter);
    const data = await db.collection('users').find(filter).sort(sort).skip(skip).limit(limit).toArray();
    return { data, pagination: { total, page, limit, pages: Math.ceil(total / limit) } };
}

async function searchUsers(q) {
    const regex = new RegExp(q, 'i');
    const users = await db.collection('users').find({ $or: [{ name: regex }, { email: regex }] }).toArray();
    return { found: users.length, data: users };
}

async function getStats() {
    const allUsers = await db.collection('users').find().toArray();
    const byGroup = {};
    let totalAge = 0;
    allUsers.forEach(u => {
        byGroup[u.group_name] = (byGroup[u.group_name] || 0) + 1;
        totalAge += (u.age || 0);
    });
    return {
        total: allUsers.length,
        averageAge: allUsers.length ? (totalAge / allUsers.length).toFixed(1) : 0,
        byGroup
    };
}

app.use(logger());
app.use(bodyParser());
app.use(async (ctx, next) => { ctx.set('X-Group', studentGroup); await next(); });
app.use(async (ctx, next) => { try { await next(); } catch (err) { ctx.status = err.status || 500; ctx.body = { error: err.message, status: ctx.status }; } });

router.get('/api/users', async (ctx) => {
    const schema = Joi.object({
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(10),
        group_name: Joi.string().pattern(/^ББМО-\d{2}-\d{2}$/).optional(),
        course: Joi.number().integer().min(1).max(6).optional(),
        age_min: Joi.number().integer().min(16).optional(),
        age_max: Joi.number().integer().max(100).optional(),
        sort: Joi.string().valid('name', '-name', 'age', '-age', 'grade', '-grade', 'created_at', '-created_at').optional()
    });
    const { error } = schema.validate(ctx.query);
    if (error) { ctx.status = 400; ctx.body = { error: 'Validation failed', details: error.details.map(d => ({ field: d.path[0], message: d.message })) }; return; }
    ctx.body = await getUsersWithPagination(ctx.query);
});

router.get('/api/users/search', async (ctx) => {
    if (!ctx.query.q) { ctx.status = 400; ctx.body = { error: 'Query parameter "q" is required' }; return; }
    ctx.body = await searchUsers(ctx.query.q);
});

router.get('/api/users/stats', async (ctx) => { ctx.body = await getStats(); });

app.use(router.routes()).use(router.allowedMethods());

client.connect().then(() => {
    db = client.db(process.env.DB_NAME || 'bbmo_01_23');
    console.log(`[INFO] MongoDB подключена (Advanced)`);
    app.listen(PORT, () => { console.log(`[INFO] Koa-сервер (Advanced) на порту ${PORT}`); });
});