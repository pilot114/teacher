import { authorized } from '@/auth.js';
import { ApiError } from '@/api.js';
import { keysWhere, passedKeys, readRecord, rememberRecord, testKey } from '@/progress.js';

// Банк тестов и проверка ответов живут на сервере (backend/tests, backend/bank.go): правильных ответов
// во фронте нет. Вопросы приходят только с началом попытки, разбор — когда тест сдан или попытки кончились.

// столько попыток даётся на тест; то же число — maxAttempts на сервере
const MAX_ATTEMPTS = 3;

const indexes = {};

// Оглавление тестов класса: {ключ темы: {title, titleRu, count}}. Грузим один раз за сессию;
// если не вышло — в следующий раз спросим снова.
function loadIndex(grade) {
  if (!indexes[grade]) {
    const params = new URLSearchParams({ grade: grade });
    indexes[grade] = authorized(`/api/tests?${params}`)
      .then((payload) => payload.tests ?? {})
      .catch((error) => {
        delete indexes[grade];
        throw error;
      });
  }

  return indexes[grade];
}

function gradeOf(subject) {
  return subject.split('/')[0];
}

// заголовок теста (title, titleRu, count) из оглавления; null — теста по теме нет
async function testSummary(subject, topic) {
  const index = await loadIndex(gradeOf(subject));
  return index[testKey(subject, topic)] ?? null;
}

// Тест для открытия: заголовок и итог ученика. Вопросы с правильными ответами сервер кладёт,
// только когда тест закрыт. Начатую и не сданную попытку сервер при этом засчитывает как сорванную.
async function loadTest(subject, topic) {
  const params = new URLSearchParams({ key: testKey(subject, topic) });

  try {
    const payload = await authorized(`/api/tests/item?${params}`);
    rememberRecord(subject, topic, payload.record);
    return payload.test;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

// Начать попытку: сервер сразу её засчитывает и отдаёт номер и вопросы без ответов.
async function startAttempt(subject, topic) {
  const payload = await authorized('/api/tests/start', { method: 'POST', body: { key: testKey(subject, topic) } });
  rememberRecord(subject, topic, payload.record);
  return payload;
}

// Сдать попытку. violation — чем она сорвана (тогда ответы не проверяются). Ответ — {record, attempt}:
// итог с учётом арбитра и снимок вопросов с отметками; правильные ответы в нём — только по закрытому тесту.
// Сорванную попытку шлём и при уходе со страницы — запрос не должен оборваться вместе с ней.
async function submitAttempt(subject, topic, { number, answers, violation }) {
  const payload = await authorized('/api/tests/attempt', {
    method: 'POST',
    body: { key: testKey(subject, topic), number: number, answers: answers, violation: violation },
    keepalive: true,
  });
  rememberRecord(subject, topic, payload.record);
  return payload;
}

// ключи всех тем, у которых есть тест, — по ним кнопка «Практика» решает, активна ли она
async function loadTestKeys(grade) {
  return new Set(Object.keys(await loadIndex(grade)));
}

// из набора ключей оставляем темы, которые есть в банке класса
async function bankKeys(grade, wanted) {
  const keys = await loadTestKeys(grade);
  return new Set([...keys].filter((key) => wanted.has(key)));
}

// ключи тем, тест по которым сдан, — по ним доска считает тему пройденной
function loadPassedKeys(grade) {
  return bankKeys(grade, passedKeys());
}

// ключи заваленных тем: все попытки потрачены, а зачёта нет
function loadFailedKeys(grade) {
  return bankKeys(
    grade,
    keysWhere((record) => !record.passed && record.attempts >= MAX_ATTEMPTS),
  );
}

// попытка есть, пока не потрачены все и тест ещё не сдан
function attemptsLeft(record) {
  return record.passed ? 0 : Math.max(0, MAX_ATTEMPTS - record.attempts);
}

// правильный ответ для разбора; варианты в банке — HTML, поэтому и результат выводится как HTML
function answerText(question) {
  if (question.answer === undefined) {
    return '';
  }

  if (question.type === 'choice') {
    return question.options[question.answer];
  }

  if (question.type === 'multi') {
    return question.answer.map((index) => question.options[index]).join('; ');
  }

  if (question.type === 'number') {
    return question.answer + (question.unit ? ' ' + question.unit : '');
  }

  return Array.isArray(question.answer) ? question.answer[0] : question.answer;
}

export {
  MAX_ATTEMPTS,
  loadTest,
  loadTestKeys,
  loadPassedKeys,
  loadFailedKeys,
  startAttempt,
  submitAttempt,
  testSummary,
  testKey,
  readRecord,
  attemptsLeft,
  answerText,
};
