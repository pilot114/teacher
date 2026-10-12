import { authorized } from '@/auth.js';

// Прогресс живёт на сервере, и пишет его только сервер — по итогам попыток (см. src/tests.js).
// Здесь держим копию за текущий вход, чтобы доска и тесты читали результаты без запроса на каждый чих.
const emptyRecord = {attempts: 0, best: 0, total: 0, passed: false};

let records = {};

function testKey(subject, topic) {
    return `${subject}|${topic}`;
}

// Вход завершён: забираем полную картину с сервера.
async function startSession() {
    const payload = await authorized('/api/progress');
    records = payload.records ?? {};

    return records;
}

function endSession() {
    records = {};
}

function readRecord(subject, topic) {
    return {...emptyRecord, ...(records[testKey(subject, topic)] ?? {})};
}

// итог по тесту, который прислал сервер, — в копию
function rememberRecord(subject, topic, record) {
    if (record) {
        records[testKey(subject, topic)] = {...emptyRecord, ...record};
    }
}

// ключи тем, чья запись подходит под условие
function keysWhere(predicate) {
    const keys = new Set();

    for (const [key, record] of Object.entries(records)) {
        if (predicate({...emptyRecord, ...record})) {
            keys.add(key);
        }
    }

    return keys;
}

// ключи тем, тест по которым сдан
function passedKeys() {
    return keysWhere((record) => record.passed);
}

export {
    endSession,
    keysWhere,
    passedKeys,
    readRecord,
    rememberRecord,
    startSession,
    testKey,
};
