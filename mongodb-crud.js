require('dotenv').config();
const { MongoClient } = require('mongodb');

const studentGroup = "477";
const studentName = "Мисовский Андрей";

const client = new MongoClient(process.env.MONGODB_URI);

async function createCollection(db) {
    console.log("=== Создание коллекции ===\n");
    
    const collections = await db.listCollections({ name: 'students' }).toArray();
    if (collections.length > 0) {
        await db.collection('students').drop();
        console.log("Старая коллекция students удалена");
    }
    
    await db.createCollection('students', {
        validator: {
            $jsonSchema: {
                bsonType: 'object',
                required: ['name', 'group_name', 'course'],
                properties: {
                    name: { bsonType: 'string', minLength: 2 },
                    group_name: { bsonType: 'string' },
                    course: { bsonType: 'int', minimum: 1, maximum: 6 },
                    grade: { bsonType: ['double', 'int'], minimum: 0, maximum: 5 }
                }
            }
        }
    });
    
    console.log("✔ Коллекция students создана с валидацией\n");
}

async function insertStudents(db) {
    console.log("=== INSERT ===\n");
    
    const collection = db.collection('students');
    
    const result1 = await collection.insertOne({
        name: "Иван Иванов",
        group_name: studentGroup,
        course: 2,
        grade: 4.5,
        created_at: new Date()
    });
    console.log(`✔ Вставлен 1 студент: id=${result1.insertedId}`);
    
    const result2 = await collection.insertMany([
        { name: "Мария Петрова", group_name: studentGroup, course: 2, grade: 3.8, created_at: new Date() },
        { name: "Петр Сидоров", group_name: studentGroup, course: 3, grade: 4.2, created_at: new Date() },
        { name: "Анна Смирнова", group_name: studentGroup, course: 1, grade: 4.7, created_at: new Date() }
    ]);
    console.log(`✔ Вставлено ${result2.insertedCount} студента\n`);
}

async function selectStudents(db) {
    console.log("=== SELECT ===\n");
    
    const collection = db.collection('students');
    
    console.log("Все студенты:");
    const all = await collection.find().toArray();
    all.forEach(s => console.log(`  id=${s._id}, name=${s.name}, group=${s.group_name}, grade=${s.grade}`));
    
    console.log(`\nСтуденты группы ${studentGroup} (сортировка по grade):`);
    const filtered = await collection.find({ group_name: studentGroup })
        .sort({ grade: -1 })
        .toArray();
    filtered.forEach(s => console.log(`  id=${s._id}, name=${s.name}, grade=${s.grade}`));
    
    console.log("\nПагинация (limit=2, skip=1):");
    const paginated = await collection.find().limit(2).skip(1).toArray();
    paginated.forEach(s => console.log(`  id=${s._id}, name=${s.name}`));
    console.log();
}

async function updateStudent(db) {
    console.log("=== UPDATE ===\n");
    
    const collection = db.collection('students');
    
    const result1 = await collection.updateOne(
        { name: "Иван Иванов" },
        { $set: { grade: 4.8 } }
    );
    console.log(`✔ Обновлён: matched=${result1.matchedCount}, modified=${result1.modifiedCount}`);
    
    const result2 = await collection.updateOne(
        { name: "Иван Иванов" },
        { $set: { grade: 4.8 } }
    );
    console.log(`Повторное обновление: matched=${result2.matchedCount}, modified=${result2.modifiedCount}\n`);
}

async function deleteStudent(db) {
    console.log("=== DELETE ===\n");
    
    const collection = db.collection('students');
    
    const result = await collection.deleteOne({ name: "Анна Смирнова" });
    console.log(`✔ Удалено: ${result.deletedCount} студента\n`);
}

async function main() {
    console.log(`Лабораторная работа №23 (${studentName}, группа ${studentGroup})\n`);
    
    try {
        await client.connect();
        const db = client.db();
        
        await createCollection(db);
        await insertStudents(db);
        await selectStudents(db);
        await updateStudent(db);
        await deleteStudent(db);
    } catch (err) {
        console.error(`✖ Ошибка: ${err.message}`);
    } finally {
        await client.close();
    }
}

main();