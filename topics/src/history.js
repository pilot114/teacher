import { authorized } from '@/auth.js';
import { testKey } from '@/progress.js';

// История действий ученика: что открывал и как сдавал тесты. Сама лента живёт на сервере,
// попытки тестов попадают в неё вместе с результатом — их пишет сервер, см. submitAttempt() в tests.js.

const PAGE_SIZE = 50;

// фильтры ленты: у «Тестов» два типа — открытие теста и сданная попытка
const filters = [
    {value: 'all', label: 'Всё', types: []},
    {value: 'theory', label: 'Теория', types: ['theory']},
    {value: 'practice', label: 'Практика', types: ['practice']},
    {value: 'tests', label: 'Тесты', types: ['test', 'attempt']},
];

// Отметка в истории не должна мешать учёбе: не записалась — и ладно, ошибку не показываем.
// keepalive — чтобы отметка дошла, даже если сразу после неё страницу перезагрузят.
async function track(type, target) {
    try {
        await authorized('/api/history/event', {method: 'POST', body: {type: type, target: target}, keepalive: true});
    } catch (error) {
        console.warn('история: не записал событие', type, target, error.message);
    }
}

function trackTheory(subject, topic) {
    return track('theory', testKey(subject, topic));
}

function trackTest(subject, topic) {
    return track('test', testKey(subject, topic));
}

function trackPractice(section) {
    return track('practice', section);
}

// страница ленты от новых к старым; before — id последней уже показанной записи
function loadHistory({before = 0, filter = 'all'} = {}) {
    const params = new URLSearchParams({limit: String(PAGE_SIZE)});
    const types = filters.find((item) => item.value === filter)?.types ?? [];

    if (before) {
        params.set('before', String(before));
    }
    if (types.length) {
        params.set('type', types.join(','));
    }

    return authorized(`/api/history?${params}`);
}

// все попытки одного теста со снимками вопросов
async function loadAttempts(subject, topic) {
    const params = new URLSearchParams({key: testKey(subject, topic)});
    const payload = await authorized(`/api/history/attempts?${params}`);

    return payload.attempts ?? [];
}

// ключ ленты «класс/предмет|тема» обратно в тему, как её понимают конспекты и тесты
function splitTarget(target) {
    const index = target.indexOf('|');
    return index === -1
        ? {subject: '', topic: target}
        : {subject: target.slice(0, index), topic: target.slice(index + 1)};
}

const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

const WEEKDAYS = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];

function pad(value) {
    return String(value).padStart(2, '0');
}

// сервер отдаёт время в UTC — показываем в часовом поясе устройства
function dayKey(date) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatDay(date, today = new Date()) {
    const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);

    if (dayKey(date) === dayKey(today)) {
        return 'Сегодня';
    }
    if (dayKey(date) === dayKey(yesterday)) {
        return 'Вчера';
    }

    const year = date.getFullYear() === today.getFullYear() ? '' : ` ${date.getFullYear()}`;
    return `${date.getDate()} ${MONTHS[date.getMonth()]}${year}, ${WEEKDAYS[date.getDay()]}`;
}

function formatTime(date) {
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatDateTime(date) {
    return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}, ${formatTime(date)}`;
}

function formatDuration(seconds) {
    if (seconds < 60) {
        return `${seconds} с`;
    }

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
        return seconds % 60 ? `${minutes} мин ${seconds % 60} с` : `${minutes} мин`;
    }

    const hours = Math.floor(minutes / 60);
    return minutes % 60 ? `${hours} ч ${minutes % 60} мин` : `${hours} ч`;
}

// Пауза дольше получаса — страница просто была открыта: засчитываем за ней 15 минут, а не весь простой.
const IDLE_GAP = 30 * 60;
const IDLE_CREDIT = 15 * 60;

// время работы за день по моментам событий: от первого до последнего, без простоев
function workSeconds(dates) {
    const times = dates.map((date) => date.getTime() / 1000).sort((a, b) => a - b);
    let total = 0;

    for (let index = 1; index < times.length; index++) {
        const gap = times[index] - times[index - 1];
        total += gap > IDLE_GAP ? IDLE_CREDIT : gap;
    }

    return total;
}

// время приблизительное — до пяти минут точнее и не нужно
function formatWork(seconds) {
    const minutes = Math.round(seconds / 300) * 5;
    if (minutes < 5) {
        return 'меньше 5 мин';
    }

    const hours = Math.floor(minutes / 60);
    if (!hours) {
        return `≈ ${minutes} мин`;
    }

    return minutes % 60 ? `≈ ${hours} ч ${minutes % 60} мин` : `≈ ${hours} ч`;
}

// итог попытки: сорванную считаем отдельно — её ответы не проверялись
function attemptStatus(attempt) {
    if (attempt.violation) {
        return 'violation';
    }

    return attempt.passed ? 'passed' : 'failed';
}

const attemptLabels = {
    passed: 'сдано',
    failed: 'не сдано',
    violation: 'сорвана',
};

export {
    attemptLabels,
    attemptStatus,
    dayKey,
    filters,
    formatDateTime,
    formatDay,
    formatDuration,
    formatTime,
    formatWork,
    loadAttempts,
    loadHistory,
    splitTarget,
    trackPractice,
    trackTest,
    trackTheory,
    workSeconds,
};
