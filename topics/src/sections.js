import { readStorage, writeStorage } from '@/storage.js';

const sections = ['Учебники', 'Практика', 'Прогресс', 'История'];

const practiceSections = ['Таблица умножения', 'Задачи', 'Программирование', 'Стихи', 'Эффективность обучения'];

const defaultSection = 'Практика';

const defaultPractice = 'Программирование';

// У некоторых разделов свой адрес — на них можно дать ссылку. Такой раздел определяется адресом,
// а не хранилищем: иначе корень сайта после перезагрузки открывал бы его вместо последнего обычного.
const sectionPaths = {
  История: 'history',
};

// в сборке приложение живёт в подкаталоге (/teacher/), в разработке — в корне
const BASE = import.meta.env.BASE_URL;

function restore(key, allowed, fallback) {
  const value = readStorage(key);
  return allowed.includes(value) ? value : fallback;
}

function currentPath() {
  const path = window.location.pathname;
  const relative = path.startsWith(BASE) ? path.slice(BASE.length) : path.replace(/^\//, '');

  return relative.replace(/\/+$/, '');
}

function sectionFromLocation() {
  const path = currentPath();
  return Object.keys(sectionPaths).find((section) => sectionPaths[section] === path) ?? null;
}

function restoreSection() {
  const plain = sections.filter((section) => !sectionPaths[section]);
  return sectionFromLocation() ?? restore('section', plain, defaultSection);
}

// Раздел поменялся — адрес следует за ним. Возврат браузерной кнопкой «Назад» приходит через popstate
// и уже стоит на нужном адресе, так что лишней записи в историю браузера не будет.
function rememberSection(value) {
  const path = sectionPaths[value] ?? '';

  if (!sectionPaths[value]) {
    writeStorage('section', value);
  }

  if (currentPath() !== path && (path || sectionFromLocation())) {
    window.history.pushState(null, '', BASE + path);
  }
}

function restorePractice() {
  return restore('practice', practiceSections, defaultPractice);
}

function rememberPractice(value) {
  writeStorage('practice', value);
}

export { sections, practiceSections, restoreSection, rememberSection, restorePractice, rememberPractice };
