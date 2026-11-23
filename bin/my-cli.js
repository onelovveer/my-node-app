#!/usr/bin/env node

const { Command } = require('commander');
const path = require('path');
const fs = require('fs');

const studentName = "Мисовский Андрей";
const studentGroup = "477";
const variantNumber = 15;

const program = new Command();

program
    .name('my-cli')
    .description(`CLI-приложение для лабораторной работы №17`)
    .version('1.0.0')
    .option('-v, --verbose', 'подробный вывод')
    .option('--no-interactive', 'отключить интерактивный режим');

program
    .command('greet <name>')
    .description('поприветствовать пользователя')
    .action((name) => {
        console.log(`Привет, ${name}! Добро пожаловать в CLI-приложение группы ${studentGroup}.`);
    });

program
    .command('info')
    .description('вывести информацию о группе')
    .action(() => {
        console.log(`Группа: ${studentGroup}`);
        console.log(`Студент: ${studentName}`);
        console.log(`Лабораторная работа: №17`);
        console.log(`Дата: ${new Date().toISOString().split('T')[0]}`);
    });

program
    .command('generate')
    .description('сгенерировать отчёт')
    .option('-t, --type <type>', 'тип отчёта', 'html')
    .option('-o, --output <path>', 'путь для сохранения', './output.html')
    .option('-f, --force', 'перезаписать существующий файл')
    .option('--dry-run', 'показать что будет сделано без выполнения')
    .action((options) => {
        const validTypes = ['html', 'pdf', 'json', 'csv'];
        if (!validTypes.includes(options.type)) {
            console.error(`Ошибка: недопустимый тип отчёта "${options.type}". Допустимые значения: ${validTypes.join(', ')}`);
            process.exit(1);
        }

        if (options.dryRun) {
            console.log(`[DRY-RUN] Будет сгенерирован отчёт типа: ${options.type}`);
            console.log(`[DRY-RUN] Файл будет сохранён в: ${options.output}`);
            console.log('[DRY-RUN] Действия не выполнены (режим проверки)');
            return;
        }

        if (fs.existsSync(options.output) && !options.force) {
            console.error(`Ошибка: файл ${options.output} уже существует. Используйте --force для перезаписи.`);
            process.exit(1);
        }

        if (options.verbose) {
            console.log(`[VERBOSE] Запуск генерации отчёта...`);
            console.log(`[VERBOSE] Тип отчёта: ${options.type}`);
            console.log(`[VERBOSE] Путь сохранения: ${options.output}`);
        }

        const content = `Отчёт (${options.type})\nСтудент: ${studentName}\nГруппа: ${studentGroup}\nДата: ${new Date().toISOString()}`;
        fs.writeFileSync(options.output, content, 'utf8');
        console.log(`Отчёт успешно сгенерирован: ${options.output}`);
    });

program
    .command('convert')
    .description('конвертировать файл')
    .option('-i, --input <path>', 'входной файл')
    .option('-o, --output <path>', 'выходной файл')
    .action((options) => {
        if (!options.input || !options.output) {
            console.error('Ошибка: укажите --input и --output');
            process.exit(1);
        }
        if (!fs.existsSync(options.input)) {
            console.error(`Ошибка: файл ${options.input} не найден`);
            process.exit(1);
        }
        const content = fs.readFileSync(options.input, 'utf8');
        fs.writeFileSync(options.output, content.toUpperCase(), 'utf8');
        console.log(`Файл конвертирован: ${options.output}`);
    });

program
    .command('init')
    .description('инициализация проекта')
    .option('--name <name>', 'название проекта')
    .option('--type <type>', 'тип проекта')
    .option('--typescript', 'использовать TypeScript')
    .option('--prettier', 'использовать Prettier')
    .option('--git', 'инициализировать Git')
    .action(async (options) => {
        const interactive = program.opts().interactive !== false;

        if (!interactive || (options.name && options.type)) {
            if (!options.name || !options.type) {
                console.error('Ошибка: в неинтерактивном режиме необходимо указать --name и --type');
                process.exit(1);
            }
            await createProject(options);
            return;
        }

        const inquirer = require('inquirer');
        const answers = await inquirer.prompt([
            { type: 'input', name: 'name', message: 'Введите название проекта:', default: options.name || 'my-project' },
            {
                type: 'list', name: 'type', message: 'Выберите тип проекта:',
                choices: ['Web-приложение', 'CLI-утилита', 'Библиотека', 'Микросервис'],
                default: options.type || 'CLI-утилита'
            },
            {
                type: 'checkbox', name: 'features', message: 'Выберите дополнительные опции:',
                choices: [
                    { name: 'TypeScript', value: 'typescript', checked: options.typescript },
                    { name: 'ESLint', value: 'eslint' },
                    { name: 'Prettier', value: 'prettier', checked: options.prettier },
                    { name: 'Jest', value: 'jest' }
                ]
            },
            { type: 'confirm', name: 'git', message: 'Использовать Git?', default: options.git || true },
            { type: 'password', name: 'token', message: 'Введите токен доступа:' }
        ]);

        await createProject({ ...options, ...answers });
    });

async function createProject(options) {
    const features = options.features ? options.features.filter(f => f !== true) : [];
    const featureList = features.length > 0 ? features.join(', ') : 'нет';

    console.log(`✓ Проект "${options.name}" успешно инициализирован!`);
    console.log(`Тип: ${options.type}`);
    console.log(`Опции: ${featureList}`);
    console.log(`Git: ${options.git ? 'да' : 'нет'}`);
}

program
    .command('process')
    .description('обработка файлов')
    .option('--files <files...>', 'список файлов')
    .action(async (options) => {
        if (!options.files || options.files.length === 0) {
            console.error('Ошибка: укажите файлы через --files');
            process.exit(1);
        }

        const chalk = require('chalk');
        const ora = require('ora');
        const cliProgress = require('cli-progress');

        const spinner = ora('Обработка файлов...').start();
        const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
        progressBar.start(options.files.length, 0);

        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < options.files.length; i++) {
            const file = options.files[i];
            progressBar.update(i + 1);

            if (fs.existsSync(file)) {
                successCount++;
            } else {
                failCount++;
                console.error(chalk.red(`✖ Файл ${file} не найден`));
            }
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        progressBar.stop();
        spinner.stop();

        if (failCount > 0) {
            console.warn(chalk.yellow(`⚠ Пропущено ${failCount} файл(ов)`));
        }

        if (successCount > 0) {
            console.log(chalk.green(`✔ Обработано ${successCount} файл(ов) из ${options.files.length}`));
        }

        if (failCount > 0) {
            process.exit(1);
        }
    });

process.on('uncaughtException', (err) => {
    console.error(`✖ Ошибка: ${err.message}`);
    if (process.env.NODE_ENV === 'development') {
        console.error(err.stack);
    }
    process.exit(1);
});

process.on('unhandledRejection', (reason) => {
    console.error(`✖ Неперехваченное исключение: ${reason}`);
    process.exit(1);
});

program.parse(process.argv);