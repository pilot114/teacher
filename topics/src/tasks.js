const tasks = [
    {
        title: 'Cумма',
        complexity: 1,
        templates: [
            (a, b) => `Даны числа ${a} и ${b}. Найти сумму чисел`,
            (a, b) => `У Марии есть ${a} красных мяча и ${b} синих мячей. Сколько всего мячей у Марии?`,
            (a, b) => `Если у Васи было ${a} яблок, а у Маши было ${b} яблок, сколько яблок у них всего?`,
        ],
        params: () => [randomInt(5,40), randomInt(5,40)],
        solve: (a, b) => a + b,
    },
    {
        title: 'Разность',
        complexity: 1,
        templates: [
            (a, b) => `Если у Маши было ${a} конфет, а она съела ${b}, сколько конфет осталось у Маши?`,
            (a, b) => `Если у Андрея было ${a} рубля, а он потратил ${b} рублей, сколько рублей у него осталось?`,
        ],
        params: () => {
            const a = randomInt(6, 50);
            const b = randomInt(5, a);
            return [a, b];
        },
        solve: (a, b) => a - b,
    },
    {
        title: 'Разность x2',
        complexity: 2,
        templates: [
            (a, b, c) => `В коробке было ${a} карандаша. Мальчик взял ${b} карандашей, а девочка взяла ${c} карандашей. Сколько карандашей осталось в коробке?`,
        ],
        params: () => {
            const x = randomInt(1, 20);
            const b = randomInt(1, 20);
            const c = randomInt(1, 20);
            const a = x + b + c;
            return [a, b, c];
        },
        solve: (a, b, c) => a - b - c,
    },
    {
        title: 'Разность x3',
        complexity: 2,
        templates: [
            (a, b, c) => `В книжной полке стоит ${a} книг. Мария вытащила ${b} книги, а затем вернула ${c} книги обратно, сколько книг осталось в книжной полке?`,
        ],
        params: () => {
            const a = randomGet([20, 30, 40, 50]);
            const b = randomInt(5, 20);
            const c = randomInt(5, b);
            return [a, b, c];
        },
        solve: (a, b, c) => a - b + c,
    },
    {
        title: 'Квадрат',
        complexity: 2,
        templates: [
            (a) => `Если сторона квадрата равна ${a} см, то какова его площадь?`
        ],
        params: () => [randomInt(1, 12)],
        solve: (a) => a * a,
    },
    {
        title: 'Деление',
        complexity: 2,
        templates: [
            (a, b) => `Поезд движется со скоростью ${a} км/ч. Сколько времени ему потребуется, чтобы проехать ${b} километров?`,
            (a, b) => `Учитель раздал ${b} задач по математике. Если каждый ученик решил по ${a} задач, сколько учеников было в классе?`,
        ],
        params: () => {
            const a = randomInt(40, 80);
            const x = randomInt(2, 10);
            return [a, a * x];
        },
        solve: (a, b) => b / a,
    },
    {
        title: 'Умножение',
        complexity: 2,
        templates: [
            (a, b) => `Если 1 килограмм яблок стоит ${a} рублей, сколько стоит ${b} килограмма яблок?`,
            (a, b) => `Если цена билета в кино составляет ${a} рублей, а Мария хочет пригласить ${b} своих друзей в кино, сколько она заплатит за билеты всех?`,
            (a, b) => `Вася купил ${b} ящика с яблоками. В каждом ящике было по ${a} яблока. Сколько яблок у Васи всего?`,
            (a, b) => `Если прямоугольник имеет длину ${a} см и ширину ${b} см, какова его площадь?`,
        ],
        params: () => [randomInt(20, 50), randomInt(2, 10)],
        solve: (a, b) => a * b,
    },
    {
        title: 'Уравнение',
        complexity: 3,
        templates: [
            (a, b, c) => `Решите уравнение: ${a}x + ${b} = ${c}`
        ],
        params: () => {
            const a = randomInt(2, 10);
            const x = randomInt(1, 10);
            const b = randomInt(5, 30);
            const c = a * x + b;
            return [a, b, c];
        },
        solve: (a, b, c) => (c - b) / a,
    },
    {
        title: 'Периметр',
        complexity: 4,
        templates: [
            (a, b) => `Если прямоугольник имеет длину ${a} см и ширину ${b} см, каков его периметр?`,
        ],
        params: () => [randomInt(2, 20), randomInt(2, 20)],
        solve: (a, b) => a + a + b + b,
    },
    {
        title: 'Дроби',
        complexity: 6,
        templates: [
            (a, b, c, d) => `Мария съела ${a}/${b} пирога, а её брат - ${c}/${d} пирога. Сколько пирога осталось?`
        ],
        params: () => {
            const a = randomInt(1, 4);
            const b = randomInt(a + a, 10);
            const c = randomInt(1, 4);
            const d = randomInt(c + c, 10);
            return [a, b, c, d];
        },
        solve: (a, b, c, d) => {
            const x = a * d;
            const y = b * d;
            const z = c * b;
            return 1 - (x + z) / y;
        },
    },
];

import { randomInt, randomGet } from './utils.js';

function generateTask(index = null) {
    const task = index === null ? randomGet(tasks) : tasks[index];
    const inputs = task.params();
    const question = randomGet(task.templates)(...inputs);
    const answer = task.solve(...inputs);
    return {
        title: task.title,
        complexity: task.complexity,
        question,
        answer,
    };
}

export { generateTask };
