import { readStorage, writeStorage } from '@/storage.js';

const MAX_ATTEMPTS = 2;

const banks = {
    seven: () => import('@/../data/seven/tests.js'),
};

const cache = {};

// банк тестов класса грузим один раз и держим в памяти
async function loadBank(grade) {
    if (!banks[grade]) {
        return {};
    }

    if (!cache[grade]) {
        cache[grade] = banks[grade]().then((module) => module.default);
    }

    return cache[grade];
}

function gradeOf(subject) {
    return subject.split('/')[0];
}

async function loadTest(subject, topic) {
    const bank = await loadBank(gradeOf(subject));
    return bank[subject]?.[topic] ?? null;
}

// ключи всех тем, у которых есть тест, — по ним кнопка «Практика» решает, активна ли она
async function loadTestKeys(grade) {
    const bank = await loadBank(grade);
    const keys = new Set();

    for (const subject of Object.keys(bank)) {
        for (const topic of Object.keys(bank[subject])) {
            keys.add(testKey(subject, topic));
        }
    }

    return keys;
}

// ключи тем, тест по которым сдан, — по ним доска считает тему пройденной
async function loadPassedKeys(grade) {
    const bank = await loadBank(grade);
    const keys = new Set();

    for (const subject of Object.keys(bank)) {
        for (const topic of Object.keys(bank[subject])) {
            if (readRecord(subject, topic).passed) {
                keys.add(testKey(subject, topic));
            }
        }
    }

    return keys;
}

function testKey(subject, topic) {
    return `${subject}|${topic}`;
}

const emptyRecord = {attempts: 0, best: 0, total: 0, passed: false};

function readRecord(subject, topic) {
    const raw = readStorage(`test.${testKey(subject, topic)}`);
    if (!raw) {
        return {...emptyRecord};
    }

    try {
        return {...emptyRecord, ...JSON.parse(raw)};
    } catch (error) {
        // испорченная запись — считаем, что тест ещё не начинали
        return {...emptyRecord};
    }
}

function writeRecord(subject, topic, record) {
    writeStorage(`test.${testKey(subject, topic)}`, JSON.stringify(record));
}

// попытка есть, пока их меньше двух и тест ещё не сдан
function attemptsLeft(record) {
    return record.passed ? 0 : Math.max(0, MAX_ATTEMPTS - record.attempts);
}

// сколько верных ответов нужно для зачёта
function passScore(test) {
    return test.pass ?? Math.ceil(test.questions.length * 0.75);
}

function normalize(value) {
    return String(value)
        .toLowerCase()
        .replace(/[\u00a0\u202f]/g, ' ')
        // ученик может ввести типографские минус и апостроф — приводим к обычным
        .replace(/[\u2212\u2013\u2014]/g, '-')
        .replace(/[′’`]/g, "'")
        .replace(/\s+/g, ' ')
        .trim();
}

// число принимаем и с запятой, и с точкой
function toNumber(value) {
    const cleaned = normalize(value).replace(/\s/g, '').replace(',', '.');
    if (!/^[-+]?\d*\.?\d+$/.test(cleaned)) {
        return null;
    }

    return Number(cleaned);
}

function isCorrect(question, answer) {
    if (answer === undefined || answer === null || answer === '') {
        return false;
    }

    if (question.type === 'multi') {
        const given = [...(answer ?? [])].sort();
        const expected = [...question.answer].sort();
        return given.length === expected.length && given.every((item, index) => item === expected[index]);
    }

    if (question.type === 'choice') {
        return answer === question.answer;
    }

    if (question.type === 'number') {
        const value = toNumber(answer);
        if (value === null) {
            return false;
        }
        return Math.abs(value - question.answer) <= (question.tolerance ?? 0);
    }

    // input: список допустимых написаний
    const accepted = Array.isArray(question.answer) ? question.answer : [question.answer];
    return accepted.some((item) => normalize(item) === normalize(answer));
}

export {
    MAX_ATTEMPTS,
    loadTest,
    loadTestKeys,
    loadPassedKeys,
    testKey,
    readRecord,
    writeRecord,
    attemptsLeft,
    passScore,
    isCorrect,
};
