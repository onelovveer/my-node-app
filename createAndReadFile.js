const fs = require('fs').promises;
const path = require('path');

const studentName = "Мисовский Андрей";
const studentGroup = "477";
const variantNumber = 15;

const books = [
    '"Война и мир" - Л. Толстой',
    '"Преступление и наказание" - Ф. Достоевский',
    '"Мастер и Маргарита" - М. Булгаков',
    '"1984" - Дж. Оруэлл',
    '"Гарри Поттер" - Дж. Роулинг'
];

async function createAndReadFile() {
    try {
        const filename = `student_${variantNumber}.txt`;
        const filePath = path.join(__dirname, filename);
        const now = new Date();
        const dateStr = now.toISOString().replace('T', ' ').substring(0, 19);

        let content = `Студент: ${studentName}\n`;
        content += `Группа: ${studentGroup}\n`;
        content += `Вариант: ${variantNumber}\n`;
        content += `Дата: ${dateStr}\n`;
        content += 'Любимые книги:\n';
        books.forEach((book, index) => {
            content += `${index + 1}. ${book}\n`;
        });

        const lines = content.split('\n');
        const lineCount = lines.filter(line => line.trim() !== '').length;
        content += `Количество записей: ${lineCount}\n`;

        await fs.writeFile(filePath, content, 'utf8');
        console.log(`✅ Создан файл: ${filename}`);

        const fileContent = await fs.readFile(filePath, 'utf8');
        console.log('\n📄 Содержимое файла:');
        console.log('─'.repeat(50));
        console.log(fileContent);
        console.log('─'.repeat(50));
    } catch (error) {
        console.error('❌ Ошибка:', error.message);
    }
}

createAndReadFile();