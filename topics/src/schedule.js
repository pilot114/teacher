const DAY_KEYS = ['PONEDELJAK', 'UTORAK', 'SREDA', 'ČETVRTAK', 'PETAK'];

const DAY_SHORT = ['пн', 'вт', 'ср', 'чт', 'пт'];

const DAY_NAMES = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница'];

const MONTHS_SHORT = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];

// строку 'YYYY-MM-DD' разбираем вручную: конструктор Date считает её UTC и сдвигает день
function parseDate(value) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date, days) {
  const result = startOfDay(date);
  result.setDate(result.getDate() + days);
  return result;
}

function startOfWeek(date) {
  return addDays(date, -((date.getDay() + 6) % 7));
}

function formatDate(date) {
  return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]}`;
}

function formatLesson(lesson) {
  const line = `${DAY_SHORT[lesson.dayIndex]}, ${formatDate(lesson.date)} · ${lesson.period} урок`;
  return lesson.time ? `${line} · ${lesson.time}` : line;
}

// недели показываем с понедельника текущей, по учебным дням пн–пт
function weeksAhead(today, count) {
  const first = startOfWeek(today);
  return Array.from({ length: count }, (item, index) => {
    const from = addDays(first, index * 7);
    return { from, to: addDays(from, 4) };
  });
}

// расписаний несколько, они чередуются по неделям начиная с недели startDate
function scheduleForWeek(schedules, weekIndex) {
  return schedules[((weekIndex % schedules.length) + schedules.length) % schedules.length];
}

// номер недели от начала учебного года; 0 — неделя, в которую попал startDate
function weekIndexOf(date, startDate) {
  const week = 7 * 24 * 60 * 60 * 1000;
  // переход на летнее время сдвигает разницу на час, поэтому округляем
  return Math.round((startOfWeek(date) - startOfWeek(startDate)) / week);
}

// смена дневная, если уроки начинаются после полудня
function isAfternoon(schedule) {
  const starts = Object.values(schedule.times ?? {}).map((time) => Number(time.split(':')[0]));
  return starts.length > 0 && Math.min(...starts) >= 12;
}

// номера уроков, которые встречаются в этом расписании
function periodsOf(days) {
  const all = Object.values(days).flatMap((day) => Object.keys(day).map(Number));
  return [...new Set(all)].sort((a, b) => a - b);
}

// все места предмета в недельной сетке, по порядку
function lessonSlots(days, subjectName) {
  const slots = [];

  DAY_KEYS.forEach((key, dayIndex) => {
    const day = days[key] ?? {};
    Object.keys(day).forEach((period) => {
      if (day[period] === subjectName) {
        slots.push({ dayIndex, period: Number(period) });
      }
    });
  });

  return slots.sort((a, b) => a.dayIndex - b.dayIndex || a.period - b.period);
}

// сколько часов предмета в неделю — по одному числу на каждое расписание
function weeklyHours(schedules, subjectName) {
  return schedules.map((schedule) => lessonSlots(schedule.days, subjectName).length);
}

// даты первых count уроков предмета начиная с startDate
function lessonsFor(schedules, subjectName, startDate, count) {
  const perWeek = schedules.map((schedule) => ({
    slots: lessonSlots(schedule.days, subjectName),
    times: schedule.times ?? {},
  }));
  if (count <= 0 || perWeek.every((week) => !week.slots.length)) {
    return [];
  }

  const lessons = [];
  const firstWeek = startOfWeek(startDate);
  let weekIndex = 0;

  while (lessons.length < count) {
    const weekStart = addDays(firstWeek, weekIndex * 7);
    const week = scheduleForWeek(perWeek, weekIndex);

    for (const slot of week.slots) {
      const date = addDays(weekStart, slot.dayIndex);
      if (date >= startDate) {
        lessons.push({
          date,
          dayIndex: slot.dayIndex,
          period: slot.period,
          time: week.times[slot.period] ?? null,
        });
      }
      if (lessons.length >= count) {
        break;
      }
    }

    weekIndex += 1;
  }

  return lessons;
}

function inWeek(date, week) {
  return date >= week.from && date <= week.to;
}

// ключ урока: дата + номер урока
function lessonKey(date, period) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}|${period}`;
}

export {
  DAY_KEYS,
  DAY_NAMES,
  lessonKey,
  parseDate,
  startOfDay,
  addDays,
  startOfWeek,
  formatDate,
  formatLesson,
  weeksAhead,
  lessonSlots,
  lessonsFor,
  scheduleForWeek,
  weekIndexOf,
  isAfternoon,
  periodsOf,
  weeklyHours,
  inWeek,
};
