require('dotenv').config();
const Koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');
const logger = require('koa-logger');
const { MongoClient } = require('mongodb');
const Joi = require('joi');
const bcrypt = require('bcryptjs');

const studentGroup = "477";
const PORT = process.env.PORT || 3001;

const app = new Koa();
const router = new Router();
const client = new MongoClient(process.env.MONGODB_URI);
let db;

class User {
    static get col() { return db.collection('users'); }
    static async findAll() { return this.col.find().toArray(); }
    static async findById(id) { const { ObjectId } = require('mongodb'); return this.col.findOne({ _id: new ObjectId(id) }); }
    static async findByEmail(email) { return this.col.findOne({ email }); }
    static async create(data) { const r = await this.col.insertOne({ ...data, created_at: new Date() }); return { _id: r.insertedId, ...data }; }
    static async update(id, data) { const { ObjectId } = require('mongodb'); const r = await this.col.updateOne({ _id: new ObjectId(id) }, { $set: { ...data, updated_at: new Date() } }); return r.modifiedCount; }
    static async delete(id) { const { ObjectId } = require('mongodb'); const r = await this.col.deleteOne({ _id: new ObjectId(id) }); return r.deletedCount; }
}

class UserService {
    static async createUser(data) {
        console.log(`[SERVICE] Создание: ${data.email}`);
        if (await User.findByEmail(data.email)) throw Object.assign(new Error('Email already exists'), { status: 409 });
        if (data.password) data.password = await bcrypt.hash(data.password, 10);
        const user = await User.create(data);
        console.log(`[SERVICE] Создан: ${user._id}`);
        return user;
    }
    static async getAll() { console.log('[SERVICE] Получение списка'); return User.findAll(); }
    static async getById(id) {
        console.log(`[SERVICE] Поиск: ${id}`);
        const user = await User.findById(id);
        if (!user) throw Object.assign(new Error('User not found'), { status: 404 });
        return user;
    }
}

class UserController {
    static async getAll(ctx) { ctx.body = { data: await UserService.getAll() }; }
    static async getById(ctx) { ctx.body = { data: await UserService.getById(ctx.params.id) }; }
    static async create(ctx) {
        const schema = Joi.object({
            name: Joi.string().min(2).max(100).required(),
            email: Joi.string().email().required(),
            group_name: Joi.string().pattern(/^ББМО-\d{2}-\d{2}$/).required(),
            age: Joi.number().integer().min(16).max(100).required(),
            password: Joi.string().min(6).optional()
        });
        const { error, value } = schema.validate(ctx.request.body);
        if (error) { ctx.status = 400; ctx.body = { error: 'Validation failed', details: error.details.map(d => ({ field: d.path[0], message: d.message })) }; return; }
        try { const user = await UserService.createUser(value); ctx.status = 201; ctx.body = { data: user }; }
        catch (err) { ctx.status = err.status || 500; ctx.body = { error: err.message, status: ctx.status }; }
    }
    static async update(ctx) { const c = await User.update(ctx.params.id, ctx.request.body); if (c === 0) { ctx.status = 404; ctx.body = { error: 'User not found', status: 404 }; return; } ctx.body = { data: { modifiedCount: c } }; }
    static async delete(ctx) { const c = await User.delete(ctx.params.id); if (c === 0) { ctx.status = 404; ctx.body = { error: 'User not found', status: 404 }; return; } ctx.body = { data: { deleted: true } }; }
}

app.use(logger());
app.use(bodyParser());
app.use(async (ctx, next) => { ctx.set('X-Group', studentGroup); await next(); });
app.use(async (ctx, next) => { try { await next(); } catch (err) { ctx.status = err.status || 500; ctx.body = { error: err.message, status: ctx.status }; } });

router.get('/api/users', UserController.getAll);
router.get('/api/users/:id', UserController.getById);
router.post('/api/users', UserController.create);
router.put('/api/users/:id', UserController.update);
router.delete('/api/users/:id', UserController.delete);

app.use(router.routes()).use(router.allowedMethods());

client.connect().then(() => {
    db = client.db(process.env.DB_NAME || 'bbmo_01_23');
    console.log(`[INFO] MongoDB подключена (MVC)`);
    app.listen(PORT, () => { console.log(`[INFO] Koa-сервер (MVC) на порту ${PORT}`); });
});