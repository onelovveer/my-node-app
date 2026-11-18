require('dotenv').config();
const Koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');
const logger = require('koa-logger');
const { MongoClient } = require('mongodb');
const Joi = require('joi');

const studentGroup = "477";
const studentName = "Мисовский Андрей";
const PORT = process.env.PORT || 3000;

const app = new Koa();
const router = new Router();
const client = new MongoClient(process.env.MONGODB_URI);
let db;

app.use(logger());
app.use(bodyParser());
app.use(async (ctx, next) => {
    ctx.set('X-Group', studentGroup);
    await next();
});
app.use(async (ctx, next) => {
    try { await next(); }
    catch (err) {
        ctx.status = err.status || 500;
        ctx.body = { error: err.message, status: ctx.status };
    }
});

router.get('/api/users', async (ctx) => {
    const users = await db.collection('users').find().toArray();
    ctx.body = { data: users };
});

router.get('/api/users/:id', async (ctx) => {
    const { ObjectId } = require('mongodb');
    try {
        const user = await db.collection('users').findOne({ _id: new ObjectId(ctx.params.id) });
        if (!user) { ctx.status = 404; ctx.body = { error: 'User not found', status: 404 }; return; }
        ctx.body = { data: user };
    } catch (err) { ctx.status = 400; ctx.body = { error: 'Invalid ID', status: 400 }; }
});

router.post('/api/users', async (ctx) => {
    const schema = Joi.object({
        name: Joi.string().min(2).max(100).required(),
        email: Joi.string().email().required(),
        group_name: Joi.string().pattern(/^ББМО-\d{2}-\d{2}$/).required(),
        age: Joi.number().integer().min(16).max(100).required()
    });
    const { error, value } = schema.validate(ctx.request.body);
    if (error) {
        ctx.status = 400;
        ctx.body = { error: 'Validation failed', details: error.details.map(d => ({ field: d.path[0], message: d.message })) };
        return;
    }
    const existing = await db.collection('users').findOne({ email: value.email });
    if (existing) { ctx.status = 409; ctx.body = { error: 'Email already exists', status: 409 }; return; }
    const result = await db.collection('users').insertOne({ ...value, created_at: new Date() });
    ctx.status = 201;
    ctx.body = { data: { _id: result.insertedId, ...value } };
});

router.put('/api/users/:id', async (ctx) => {
    const { ObjectId } = require('mongodb');
    const result = await db.collection('users').updateOne(
        { _id: new ObjectId(ctx.params.id) },
        { $set: { ...ctx.request.body, updated_at: new Date() } }
    );
    if (result.matchedCount === 0) { ctx.status = 404; ctx.body = { error: 'User not found', status: 404 }; return; }
    ctx.body = { data: { modifiedCount: result.modifiedCount } };
});

router.delete('/api/users/:id', async (ctx) => {
    const { ObjectId } = require('mongodb');
    const result = await db.collection('users').deleteOne({ _id: new ObjectId(ctx.params.id) });
    if (result.deletedCount === 0) { ctx.status = 404; ctx.body = { error: 'User not found', status: 404 }; return; }
    ctx.body = { data: { deleted: true } };
});

app.use(router.routes()).use(router.allowedMethods());

client.connect().then(() => {
    db = client.db(process.env.DB_NAME || 'bbmo_01_23');
    console.log(`[INFO] MongoDB подключена: ${db.databaseName}`);
    app.listen(PORT, () => {
        console.log(`[INFO] Koa-сервер на порту ${PORT}`);
        console.log(`[INFO] Группа: ${studentGroup}`);
    });
}).catch(err => { console.error(`[FATAL] ${err.message}`); process.exit(1); });