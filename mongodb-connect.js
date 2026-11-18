require('dotenv').config();
const { MongoClient } = require('mongodb');

const studentGroup = "477";
const studentName = "Мисовский Андрей";

async function singleConnection() {
    console.log("=== Одиночное соединение ===\n");
    
    const client = new MongoClient(process.env.MONGODB_URI);
    
    try {
        await client.connect();
        console.log("✔ Подключение установлено");
        
        const db = client.db();
        const adminDb = client.db('admin');
        
        const serverInfo = await adminDb.command({ buildInfo: 1 });
        console.log(`Версия MongoDB: ${serverInfo.version}`);
        console.log(`Текущая БД: ${db.databaseName}`);
        console.log(`Группа: ${studentGroup}`);
        console.log(`Студент: ${studentName}`);
        
    } catch (err) {
        console.error(`✖ Ошибка подключения: ${err.message}`);
    } finally {
        await client.close();
        console.log("✖ Соединение закрыто\n");
    }
}

async function connectionPool() {
    console.log("=== Пул соединений ===\n");
    
    const client = new MongoClient(process.env.MONGODB_URI, {
        maxPoolSize: 10,
        minPoolSize: 2
    });
    
    try {
        await client.connect();
        console.log("✔ Пул создан (min: 2, max: 10)");
        
        const db = client.db();
        const collections = await db.listCollections().toArray();
        console.log(`Коллекций в БД: ${collections.length}`);
        console.log(`Группа: ${studentGroup}`);
        console.log("✔ Пул готов к работе\n");
        
    } catch (err) {
        console.error(`✖ Ошибка: ${err.message}`);
    } finally {
        await client.close();
    }
}

async function main() {
    console.log(`Лабораторная работа №23 (${studentName}, группа ${studentGroup})\n`);
    await singleConnection();
    await connectionPool();
}

main();