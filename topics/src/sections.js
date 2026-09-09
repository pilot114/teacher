import { readStorage, writeStorage } from '@/storage.js';

const sections = ['Учебники', 'Практика', 'Прогресс', 'Успеваемость'];

const practiceSections = ['Таблица умножения', 'Задачи', 'Программирование', 'Стихи'];

const defaultSection = 'Практика';

const defaultPractice = 'Программирование';

function restore(key, allowed, fallback) {
    const value = readStorage(key);
    return allowed.includes(value) ? value : fallback;
}

function restoreSection() {
    return restore('section', sections, defaultSection);
}

function rememberSection(value) {
    writeStorage('section', value);
}

function restorePractice() {
    return restore('practice', practiceSections, defaultPractice);
}

function rememberPractice(value) {
    writeStorage('practice', value);
}

export {
    sections,
    practiceSections,
    restoreSection,
    rememberSection,
    restorePractice,
    rememberPractice,
};
