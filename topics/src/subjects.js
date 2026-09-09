import { readStorage, writeStorage } from '@/storage.js';

const subjects = [
    { value: 'six/math', grade: 5, id: 'math', label: 'Математика', labelRu: 'Математика', load: () => import('@/../data/six/math') },

    { value: 'six/math2', grade: 6, id: 'math', label: 'Математика', labelRu: 'Математика', load: () => import('@/../data/six/math2') },
    { value: 'six/physics', grade: 6, id: 'physics', label: 'Физика', labelRu: 'Физика', load: () => import('@/../data/six/physics') },
    { value: 'six/informatics', grade: 6, id: 'informatics', label: 'Информатика', labelRu: 'Информатика', load: () => import('@/../data/six/informatics') },

    { value: 'seven/math', grade: 7, id: 'math', label: 'Математика', labelRu: 'Математика', load: () => import('@/../data/seven/math') },
    { value: 'seven/physics', grade: 7, id: 'physics', label: 'Физика', labelRu: 'Физика', load: () => import('@/../data/seven/physics') },
    { value: 'seven/chemistry', grade: 7, id: 'chemistry', label: 'Хемија', labelRu: 'Химия', load: () => import('@/../data/seven/chemistry') },
    { value: 'seven/biology', grade: 7, id: 'biology', label: 'Биологија', labelRu: 'Биология', load: () => import('@/../data/seven/biology') },
    { value: 'seven/informatics', grade: 7, id: 'informatics', label: 'Информатика', labelRu: 'Информатика', load: () => import('@/../data/seven/informatics') },
    { value: 'seven/geography', grade: 7, id: 'geography', label: 'Географија', labelRu: 'География', load: () => import('@/../data/seven/geography') },
    { value: 'seven/history', grade: 7, id: 'history', label: 'Историја', labelRu: 'История', load: () => import('@/../data/seven/history') },
    { value: 'seven/serbian', grade: 7, id: 'serbian', label: 'Српски језик', labelRu: 'Сербский язык', load: () => import('@/../data/seven/serbian') },
    { value: 'seven/english', grade: 7, id: 'english', label: 'Енглески језик', labelRu: 'Английский язык', load: () => import('@/../data/seven/english') },
    { value: 'seven/pe', grade: 7, id: 'pe', label: 'Физичко васпитање', labelRu: 'Физкультура', load: () => import('@/../data/seven/pe') },
    { value: 'seven/russian', grade: 7, id: 'russian', label: 'Руски језик', labelRu: 'Русский язык', load: () => import('@/../data/seven/russian') },
    { value: 'seven/technology', grade: 7, id: 'technology', label: 'Техника и технологија', labelRu: 'Техника и технологии', load: () => import('@/../data/seven/technology') },
    { value: 'seven/art', grade: 7, id: 'art', label: 'Ликовна култура', labelRu: 'ИЗО', load: () => import('@/../data/seven/art') },
    { value: 'seven/music', grade: 7, id: 'music', label: 'Музичка култура', labelRu: 'Музыка', load: () => import('@/../data/seven/music') },
    { value: 'seven/religion', grade: 7, id: 'religion', label: 'Верска настава', labelRu: 'Религиоведение', load: () => import('@/../data/seven/religion') },
    { value: 'seven/classhour', grade: 7, id: 'classhour', label: 'Час одељењског старешине', labelRu: 'Классный час', load: () => import('@/../data/seven/classhour') },
];

const grades = [...new Set(subjects.map((subject) => subject.grade))].sort((a, b) => a - b);

const defaultSubject = 'six/math2';

function findSubject(value) {
    return subjects.find((subject) => subject.value === value);
}

function subjectsForGrade(grade) {
    return subjects.filter((subject) => subject.grade === grade);
}

// при смене класса стараемся остаться на том же предмете
function subjectInGrade(grade, id) {
    const list = subjectsForGrade(grade);
    const same = list.find((subject) => subject.id === id);
    return (same ?? list[0]).value;
}

async function loadSubject(value) {
    const subject = findSubject(value);
    if (!subject) {
        return [];
    }

    const { default: topics } = await subject.load();
    return topics;
}

function restoreSubject() {
    const value = readStorage('subject');
    return findSubject(value) ? value : defaultSubject;
}

function rememberSubject(value) {
    writeStorage('subject', value);
}

export {
    subjects,
    grades,
    defaultSubject,
    findSubject,
    subjectsForGrade,
    subjectInGrade,
    loadSubject,
    restoreSubject,
    rememberSubject,
};
