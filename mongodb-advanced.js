require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

const studentGroup = "477";
const studentName = "Мисовский Андрей";

const client = new MongoClient(process.env.MONGODB_URI);

async function demonstrateErrors(db) {
    console.log("=== Демонстрация ошибок ===\n");
    
    const collection = db.collection('students');
    
    try {
        await collection.insertOne({ name: "X", group_name: studentGroup, course: 2 });
    } catch (err) {
        console.log(`[VALIDATION_ERROR] name слишком короткое: ${err.codeName || err.message.split('\n')[0]}`);
    }
    
    try {
        await collection.createIndex({ name: 1 }, { unique: true });
        await collection.insertOne({ name: "Дубликат", group_name: studentGroup, course: 1, grade: 4.0 });
        await collection.insertOne({ name: "Дубликат", group_name: studentGroup, course: 2, grade: 3.5 });
    } catch (err) {
        console.log(`[DUPLICATE_KEY] Дублирование уникального индекса: ${err.codeName}\n`);
    }
    
    try {
        await collection.findOne({ _id: new ObjectId('invalid') });
    } catch (err) {
        console.log(`[INVALID_OID] Невалидный ObjectId: ${err.message}\n`);
    }
}

async function aggregationPipeline(db) {
    console.log("=== Агрегация (Aggregation Pipeline) ===\n");
    
    const collection = db.collection('students');
    
    const pipeline = [
        { $match: { group_name: studentGroup } },
        { $group: {
            _id: '$course',
            count: { $sum: 1 },
            avgGrade: { $avg: '$grade' },
            maxGrade: { $max: '$grade' },
            minGrade: { $min: '$grade' }
        }},
        { $sort: { _id: 1 } }
    ];
    
    const results = await collection.aggregate(pipeline).toArray();
    
    console.log("Статистика по курсам:");
    results.forEach(r => {
        console.log(`  Курс ${r._id}: ${r.count} студ., средний балл ${r.avgGrade.toFixed(2)}, мин ${r.minGrade}, макс ${r.maxGrade}`);
    });
    console.log();
}

async function transactions(db) {
    console.log("=== Транзакция ===\n");
    
    const session = client.startSession();
    
    try {
        session.startTransaction();
        console.log("Начало транзакции");
        
        const collection = db.collection('students');
        
        await collection.insertOne(
            { name: "Транзакция1", group_name: studentGroup, course: 2, grade: 4.0 },
            { session }
        );
        console.log("✔ INSERT 1 выполнен");
        
        await collection.insertOne(
            { name: "Транзакция2", group_name: studentGroup, course: 2, grade: 4.5 },
            { session }
        );
        console.log("✔ INSERT 2 выполнен");
        
        await collection.insertOne(
            { name: "Дубликат", group_name: studentGroup, course: 2, grade: 3.5 },
            { session }
        );
        
        await session.commitTransaction();
        console.log("✔ Commit выполнен\n");
        
    } catch (err) {
        await session.abortTransaction();
        console.log(`✖ Ошибка: ${err.codeName || err.message}`);
        console.log("✔ Rollback выполнен\n");
    } finally {
        await session.endSession();
        console.log("Сессия закрыта");
    }
}

async function main() {
    console.log(`Лабораторная работа №23 (${studentName}, группа ${studentGroup})\n`);
    
    try {
        await client.connect();
        const db = client.db();
        
        await demonstrateErrors(db);
        await aggregationPipeline(db);
        await transactions(db);
    } catch (err) {
        console.error(`✖ Ошибка: ${err.message}`);
    } finally {
        await client.close();
    }
}

main();