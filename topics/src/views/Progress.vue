<template>
  <div class="progress-board">
    <div class="board-head">
      <h1>{{ program.title }}</h1>
      <p class="subtitle">{{ program.subtitle }}</p>

      <div class="controls">
        <div class="modes">
          <label
              v-for="option in modes"
              :key="option.value"
              :class="{active: mode === option.value}"
          >
            <input type="radio" :value="option.value" v-model="mode">
            <span>{{ option.label }}</span>
          </label>
        </div>
        <ul class="legend">
          <li v-for="(label, status) in statusLabels" :key="status">
            <span class="sample" :class="'status-' + status"></span>{{ label }}
          </li>
        </ul>
      </div>
    </div>

    <div class="board-body">
      <div class="board-main">
        <div class="grid" v-if="mode === 'subjects'">
          <div class="row head-row">
            <div></div>
            <div class="week-head" v-for="(week, index) in weeks" :key="index">
              <div class="week-name">{{ index + 1 }} неделя</div>
              <div class="week-dates">{{ formatDate(week.from) }} — {{ formatDate(week.to) }}</div>
              <div class="week-shift">{{ week.schedule.label }}</div>
            </div>
            <div></div>
          </div>

          <div class="row" v-for="row in rows" :key="row.subject.id">
            <div class="subject">
              <div class="subject-sr">{{ row.subject.name.sr }}</div>
              <div class="subject-ru" v-if="secondName(row.subject)">{{ row.subject.name.ru }}</div>
            </div>
            <div class="week" v-for="(items, index) in row.weeks" :key="index">
              <button
                  v-for="item in items"
                  :key="item.number"
                  type="button"
                  class="cell"
                  :class="['status-' + item.status, {open: isOpen(item)}]"
                  :title="item.topic ? item.topic.title.sr : row.subject.name.sr"
                  @click="openLesson(row.subject, item, $event)"
              >
                {{ item.number }}
              </button>
              <span class="week-empty" v-if="!items.length">—</span>
            </div>
            <div class="counter">
              <div :title="row.hoursHint">{{ row.hours }} ч/нед</div>
              <div>{{ row.total ? `${row.done} / ${row.total}` : '—' }}</div>
            </div>
          </div>
        </div>

        <div class="days" v-else>
          <div class="day-week" v-for="(block, index) in dayWeeks" :key="index">
            <div class="day-week-title">
              {{ index + 1 }} неделя
              <span class="day-week-dates">{{ formatDate(block.week.from) }} — {{ formatDate(block.week.to) }}</span>
              <span class="day-week-shift">{{ block.week.schedule.label }}</span>
            </div>
            <div
                class="timetable"
                :style="{gridTemplateColumns: `78px repeat(${block.days.length}, minmax(0, 1fr))`}"
            >
              <div class="tt-corner"></div>
              <div class="tt-day" v-for="day in block.days" :key="day.dayIndex">
                {{ dayNames[day.dayIndex] }}
                <span class="tt-date">{{ formatDate(day.date) }}</span>
              </div>

              <template v-for="period in block.periods" :key="period">
                <div class="tt-period">
                  <span class="tt-period-num">{{ period }}</span>
                  <span class="tt-period-time" v-if="block.times[period]">{{ block.times[period] }}</span>
                </div>
                <div class="tt-slot" v-for="day in block.days" :key="day.dayIndex">
                  <button
                      v-if="day.lessons[period]"
                      type="button"
                      class="slot"
                      :class="{open: isOpen(day.lessons[period].item)}"
                      :title="day.lessons[period].item.topic ? day.lessons[period].item.topic.title.sr : day.lessons[period].subject.name.sr"
                      @click="openLesson(day.lessons[period].subject, day.lessons[period].item, $event)"
                  >
                    <span class="slot-name">{{ day.lessons[period].subject.name.sr }}</span>
                    <span
                        class="slot-topic"
                        :class="'status-' + day.lessons[period].item.status"
                        v-if="day.lessons[period].item.topic"
                    >
                      {{ day.lessons[period].item.number }}
                    </span>
                  </button>
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>

      <aside class="panel">
        <section class="panel-block need">
          <h2><span class="dot"></span>Нужно сдать<b>{{ toPass.length }}</b></h2>
          <p class="panel-note">Все уроки темы прошли, тема не закрыта</p>
          <ul v-if="toPass.length">
            <li v-for="theme in toPass" :key="theme.key">
              <button type="button" class="link" @click="$emit('open-theory', theme.theory)">
                <span class="link-subject">{{ theme.subject.name.sr }}</span>
                <span class="link-title">{{ theme.theory.topic }}</span>
              </button>
            </li>
          </ul>
          <p class="panel-empty" v-else>Долгов нет</p>
        </section>

        <section class="panel-block read">
          <h2><span class="dot"></span>Прочитать<b>{{ toRead.length }}</b></h2>
          <p class="panel-note" v-if="nextDay">{{ readTitle }}</p>
          <ul v-if="toRead.length">
            <li v-for="theme in toRead" :key="theme.key">
              <button type="button" class="link" @click="$emit('open-theory', theme.theory)">
                <span class="link-subject">{{ theme.subject.name.sr }}</span>
                <span class="link-title">{{ theme.theory.topic }}</span>
              </button>
            </li>
          </ul>
          <p class="panel-empty" v-else>Готовиться не к чему</p>
        </section>

        <section class="panel-block done">
          <h2><span class="dot"></span>Пройдено<b>{{ doneThemes.length }}</b></h2>
          <p class="panel-note">из {{ themes.length }} тем за год</p>
        </section>
      </aside>
    </div>

    <div
        class="popover"
        v-if="selected"
        ref="popover"
        :class="'placement-' + placement"
        :style="[popoverStyle, {visibility: positioned ? 'visible' : 'hidden'}]"
    >
      <span class="arrow" :style="{left: arrowOffset + 'px'}"></span>
      <button class="close" type="button" aria-label="Закрыть" @click="close">&times;</button>

      <template v-if="selected.item.topic">
        <p class="crumbs">{{ selected.subject.name.sr }} · тема {{ selected.item.theme }}, урок {{ selected.item.number }}</p>
        <h2 class="title-sr">{{ selected.item.topic.title.sr }}</h2>
        <p class="title-ru">{{ selected.item.topic.title.ru }}</p>
      </template>
      <template v-else>
        <p class="crumbs">Урок по расписанию</p>
        <h2 class="title-sr">{{ selected.subject.name.sr }}</h2>
        <p class="title-ru" v-if="secondName(selected.subject)">{{ selected.subject.name.ru }}</p>
      </template>

      <p class="lesson-line">
        <span class="badge" :class="'status-' + selected.item.status">
          {{ statusLabels[selected.item.status] }}
        </span>
        <span class="lesson">{{ formatLesson(selected.item.lesson) }}</span>
      </p>

      <div class="actions">
        <button
            type="button"
            class="btn primary"
            :disabled="!theoryOf(selected.item)"
            @click="openTheory"
        >
          Теория
        </button>
      </div>
      <p class="note" v-if="!selected.item.topic">
        Программа по этому предмету пока не заведена.
      </p>
    </div>
  </div>
</template>

<script>
import program from '@/../data/seven/progress.json';
import {loadPassedKeys, testKey} from '@/tests.js';
import {readStorage, writeStorage} from '@/storage.js';
import {
  DAY_KEYS,
  DAY_NAMES,
  addDays,
  startOfDay,
  formatDate,
  formatLesson,
  inWeek,
  isAfternoon,
  lessonKey,
  lessonsFor,
  parseDate,
  periodsOf,
  scheduleForWeek,
  weekIndexOf,
  weeklyHours,
  weeksAhead,
} from '@/schedule.js';

const statusLabels = {
  done: 'Пройдено',
  overdue: 'Нужно пройти',
  planned: 'Ещё не пройдено',
  none: 'Программы нет',
};

const modes = [
  {value: 'subjects', label: 'По предметам'},
  {value: 'days', label: 'По дням'},
];

const WEEKS = 4;

// одна тема — подряд идущие уроки с общим конспектом (обрада, утврђивање, вежбање)
function themeNumbers(topics) {
  const numbers = [];
  let previous = null;
  let number = 0;

  for (const topic of topics) {
    const key = topic.theory ? `${topic.theory.subject}|${topic.theory.topic}` : null;
    if (key === null || key !== previous) {
      number += 1;
    }
    previous = key;
    numbers.push(number);
  }

  return numbers;
}

function sameDay(a, b) {
  return Boolean(a) && Boolean(b) && a.getTime() === b.getTime();
}

function restoreMode() {
  const value = readStorage('progressView');
  return modes.some((option) => option.value === value) ? value : 'subjects';
}

export default {
  name: 'ProgressBoard',
  emits: ['open-theory'],
  data() {
    return {
      program: program,
      passedKeys: new Set(),
      statusLabels: statusLabels,
      modes: modes,
      dayNames: DAY_NAMES,
      mode: restoreMode(),
      selected: null,
      placement: 'bottom',
      popoverStyle: {},
      arrowOffset: 0,
      positioned: false,
    };
  },
  computed: {
    startDate() {
      return parseDate(this.program.startDate);
    },
    // темы с уроками до этой даты должны быть пройдены
    dueUntil() {
      return this.program.dueUntil ? parseDate(this.program.dueUntil) : null;
    },
    // недели нумеруем от начала учебного года; первую подрезаем, если год начался не с понедельника
    weeks() {
      return weeksAhead(this.startDate, WEEKS).map((week, index) => ({
        start: week.from,
        from: week.from < this.startDate ? this.startDate : week.from,
        to: week.to,
        schedule: scheduleForWeek(this.program.schedules, index),
      }));
    },
    rows() {
      return this.program.subjects.map((subject) => {
        // часов в неделю столько же, сколько расписаний: они чередуются
        const hours = weeklyHours(this.program.schedules, subject.scheduleName);
        const total = subject.topics.length;
        // без программы всё равно показываем уроки по расписанию
        const count = total || this.weeks.reduce((sum, week, index) => sum + hours[index % hours.length], 0);
        const lessons = lessonsFor(this.program.schedules, subject.scheduleName, this.startDate, count);
        const themes = themeNumbers(subject.topics);

        const items = total
            ? subject.topics.map((topic, index) => ({
              topic: topic,
              number: index + 1,
              theme: themes[index],
              lesson: lessons[index],
              status: this.statusOf(topic, lessons[index]),
            }))
            : lessons.map((lesson, index) => ({
              topic: null,
              number: index + 1,
              theme: null,
              lesson: lesson,
              status: 'none',
            }));

        return {
          subject: subject,
          hours: [...new Set(hours)].length === 1 ? String(hours[0]) : hours.join(' / '),
          hoursHint: this.program.schedules.map((item, index) => `${item.label} — ${hours[index]} ч`).join(', '),
          total: total,
          done: subject.topics.filter((topic) => this.isDone(topic)).length,
          items: items,
          weeks: this.weeks.map((week) => items.filter((item) => item.lesson && inWeek(item.lesson.date, week))),
        };
      });
    },
    // тема — уроки с общим конспектом; по ним и считаем сводку справа
    themes() {
      const map = new Map();

      for (const row of this.rows) {
        for (const item of row.items) {
          const theory = item.topic ? item.topic.theory : null;
          if (!theory || !item.lesson) {
            continue;
          }

          const key = testKey(theory.subject, theory.topic);
          const entry = map.get(key) ?? {
            key: key,
            theory: theory,
            subject: row.subject,
            done: this.isDone(item.topic),
            // долг — только когда прошли все уроки темы, а не первый из них
            overdue: true,
            date: item.lesson.date,
          };

          entry.overdue = entry.overdue && item.status === 'overdue';
          if (item.lesson.date < entry.date) {
            entry.date = item.lesson.date;
          }

          map.set(key, entry);
        }
      }

      return [...map.values()];
    },
    // оранжевое: тема пройдена целиком, а не закрыта
    toPass() {
      return this.themes
          .filter((theme) => theme.overdue && !theme.done)
          .sort((a, b) => a.date - b.date);
    },
    doneThemes() {
      return this.themes.filter((theme) => theme.done);
    },
    // готовимся к ближайшему учебному дню; во вторую смену успеваем и к сегодняшним урокам
    nextDay() {
      const today = startOfDay(new Date());
      const shift = scheduleForWeek(this.program.schedules, weekIndexOf(today, this.startDate));

      for (let step = isAfternoon(shift) ? 0 : 1; step <= 7; step += 1) {
        const date = addDays(today, step);
        if ((date.getDay() + 6) % 7 < 5) {
          return date;
        }
      }

      return null;
    },
    readTitle() {
      if (!this.nextDay) {
        return '';
      }

      const day = this.dayNames[(this.nextDay.getDay() + 6) % 7].toLowerCase();
      const today = sameDay(this.nextDay, startOfDay(new Date()));
      return `${today ? 'К сегодняшним урокам' : `К урокам на ${day}`}, ${formatDate(this.nextDay)}`;
    },
    // синее: по одной теме на каждый урок ближайшего дня
    toRead() {
      const seen = new Set();
      const list = [];

      for (const row of this.rows) {
        for (const item of row.items) {
          const theory = item.topic ? item.topic.theory : null;
          if (!theory || !item.lesson || !sameDay(item.lesson.date, this.nextDay)) {
            continue;
          }

          const key = testKey(theory.subject, theory.topic);
          if (seen.has(key) || this.isDone(item.topic)) {
            continue;
          }

          seen.add(key);
          list.push({key: key, theory: theory, subject: row.subject, period: item.lesson.period});
        }
      }

      return list.sort((a, b) => a.period - b.period);
    },
    // урок по дате и номеру -> предмет и тема
    lessonMap() {
      const map = {};

      for (const row of this.rows) {
        for (const item of row.items) {
          if (item.lesson) {
            map[lessonKey(item.lesson.date, item.lesson.period)] = {subject: row.subject, item: item};
          }
        }
      }

      return map;
    },
    dayWeeks() {
      return this.weeks.map((week) => {
        const periods = periodsOf(week.schedule.days);

        return {
          week: week,
          periods: periods,
          times: week.schedule.times ?? {},
          days: DAY_KEYS
              .map((key, dayIndex) => ({key, dayIndex, date: addDays(week.start, dayIndex)}))
              .filter((day) => day.date >= this.startDate)
              .map((day) => {
                const lessons = {};

                for (const period of periods) {
                  const entry = this.lessonMap[lessonKey(day.date, period)];
                  if (entry) {
                    lessons[period] = entry;
                  }
                }

                return {...day, lessons};
              }),
        };
      });
    },
  },
  watch: {
    mode(value) {
      this.close();
      writeStorage('progressView', value);
    },
  },
  async created() {
    this.passedKeys = await loadPassedKeys('seven');
  },
  mounted() {
    window.addEventListener('keydown', this.handleKeydown);
    document.addEventListener('click', this.handleDocumentClick);
    window.addEventListener('resize', this.close);
    window.addEventListener('scroll', this.close, true);
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this.handleKeydown);
    document.removeEventListener('click', this.handleDocumentClick);
    window.removeEventListener('resize', this.close);
    window.removeEventListener('scroll', this.close, true);
  },
  methods: {
    formatDate,
    formatLesson,
    secondName(subject) {
      return subject.name.ru && subject.name.ru !== subject.name.sr;
    },
    theoryOf(item) {
      return item.topic ? item.topic.theory : null;
    },
    // сданная практика засчитывает всю тему: все её уроки идут с общим конспектом
    isDone(topic) {
      const theory = topic.theory;
      return topic.done || (Boolean(theory) && this.passedKeys.has(testKey(theory.subject, theory.topic)));
    },
    statusOf(topic, lesson) {
      if (this.isDone(topic)) {
        return 'done';
      }

      if (!lesson || !this.dueUntil) {
        return 'planned';
      }

      return lesson.date <= this.dueUntil ? 'overdue' : 'planned';
    },
    isOpen(item) {
      return this.selected !== null && this.selected.item === item;
    },
    openLesson(subject, item, event) {
      if (this.isOpen(item)) {
        this.close();
        return;
      }

      this.anchor = event.currentTarget;
      this.selected = {subject, item};
      this.positioned = false;
      this.$nextTick(this.position);
    },
    position() {
      const popover = this.$refs.popover;
      if (!popover || !this.anchor) {
        return;
      }

      const margin = 8;
      const gap = 10;
      const cell = this.anchor.getBoundingClientRect();
      const width = popover.offsetWidth;
      const height = popover.offsetHeight;

      const left = Math.max(
          margin,
          Math.min(cell.left + cell.width / 2 - width / 2, window.innerWidth - width - margin)
      );

      let placement = 'bottom';
      let top = cell.bottom + gap;
      if (top + height + margin > window.innerHeight && cell.top - gap - height > margin) {
        placement = 'top';
        top = cell.top - gap - height;
      }

      this.placement = placement;
      this.arrowOffset = cell.left + cell.width / 2 - left;
      this.popoverStyle = {left: `${left}px`, top: `${top}px`};
      this.positioned = true;
    },
    close() {
      this.selected = null;
      this.anchor = null;
    },
    openTheory() {
      const theory = this.theoryOf(this.selected.item);
      if (!theory) {
        return;
      }

      this.close();
      this.$emit('open-theory', theory);
    },
    handleKeydown(event) {
      if (event.key === 'Escape') {
        this.close();
      }
    },
    handleDocumentClick(event) {
      if (this.selected && !event.target.closest('.popover, .cell, .slot')) {
        this.close();
      }
    },
  },
};
</script>

<style scoped>
.progress-board {
  flex: 1;
  padding: 10px 0 30px;
}

h1 {
  margin: 0;
}

.subtitle {
  margin: 4px 0 12px;
  color: #666;
}

.controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 24px;
  margin-bottom: 20px;
}

.modes {
  display: inline-flex;
  border: 1px solid #c4c4c4;
  border-radius: 6px;
  overflow: hidden;
}

.modes label {
  padding: 6px 14px;
  font-size: 14px;
  cursor: pointer;
  color: #333;
  background-color: #ffffff;
  white-space: nowrap;
}

.modes label + label {
  border-left: 1px solid #c4c4c4;
}

.modes label:hover {
  background-color: #eef2f8;
}

.modes label.active {
  background-color: #1a63c4;
  border-color: #1a63c4;
  color: #ffffff;
}

/* нативный кружок прячем, но фокус с клавиатуры оставляем рабочим */
.modes input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
}

.modes input:focus-visible + span {
  outline: 2px solid #1a63c4;
  outline-offset: 3px;
}

.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  list-style: none;
  padding: 0;
  margin: 0;
}

.legend li {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #444;
}

.status-done {
  --bg: #2e7d32;
  --fg: #ffffff;
  --br: #256428;
}

.status-overdue {
  --bg: #f2b705;
  --fg: #2b2b2b;
  --br: #cf9c04;
}

.status-planned {
  --bg: #e3e3e3;
  --fg: #5a5a5a;
  --br: #cfcfcf;
}

.status-none {
  --bg: #ffffff;
  --fg: #9a9a9a;
  --br: #d8d8d8;
}

.sample {
  display: inline-block;
  width: 16px;
  height: 16px;
  border-radius: 4px;
  background-color: var(--bg);
  border: 1px solid var(--br);
}

.board-body {
  display: flex;
  align-items: flex-start;
  gap: 24px;
}

/* сетка широкая — пусть скроллится сама, не растягивая панель */
.board-main {
  min-width: 0;
  overflow-x: auto;
}

.panel {
  flex: none;
  width: 260px;
  padding: 2px 14px 14px;
  border: 1px solid #e6e6e6;
  border-radius: 8px;
  background-color: #fbfbfb;
}

.panel-block + .panel-block {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #ececec;
}

.panel-block h2 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 12px 0 2px;
  font-size: 15px;
}

.panel-block h2 b {
  margin-left: auto;
  font-size: 15px;
}

.dot {
  flex: none;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: var(--dot);
}

.panel-block.need {
  --dot: #f2b705;
}

.panel-block.read {
  --dot: #1a63c4;
}

.panel-block.done {
  --dot: #2e7d32;
}

.panel-note {
  margin: 0 0 8px;
  font-size: 12px;
  color: #999;
}

.panel-empty {
  margin: 0;
  font-size: 13px;
  color: #999;
}

.panel ul {
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 240px;
  overflow-y: auto;
}

.link {
  display: block;
  width: 100%;
  padding: 4px 6px;
  border: none;
  border-radius: 4px;
  background: none;
  cursor: pointer;
  text-align: left;
}

.link:hover {
  background-color: #eef2f8;
}

.link-subject {
  display: block;
  font-size: 11px;
  color: #999;
}

.link-title {
  display: block;
  font-size: 13px;
  color: #1a63c4;
}

.link:hover .link-title {
  text-decoration: underline;
}

.grid {
  width: max-content;
}

.row {
  display: grid;
  grid-template-columns: 190px repeat(4, 180px) 80px;
  align-items: center;
  border-top: 1px solid #e6e6e6;
}

.row:last-child {
  border-bottom: 1px solid #e6e6e6;
}

.head-row {
  border-top: none;
  align-items: end;
}

.week-head {
  padding: 0 10px 6px;
  border-left: 1px solid #e6e6e6;
}

.week-name {
  font-size: 13px;
  font-weight: bold;
  color: #444;
}

.week-dates {
  font-size: 12px;
  color: #888;
}

.week-shift {
  font-size: 11px;
  color: #a08000;
}

.subject {
  padding-right: 10px;
}

.subject-sr {
  font-weight: bold;
}

.subject-ru {
  font-size: 13px;
  color: #777;
}

.week {
  display: grid;
  grid-template-columns: repeat(4, 34px);
  justify-content: start;
  align-content: center;
  gap: 6px;
  min-height: 54px;
  padding: 10px;
  border-left: 1px solid #e6e6e6;
}

.week-empty {
  color: #c4c4c4;
}

.cell {
  width: 34px;
  height: 34px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  background-color: var(--bg);
  color: var(--fg);
  border: 1px solid var(--br);
}

.cell.status-none {
  border-style: dashed;
}

.cell:hover {
  filter: brightness(1.1);
}

.cell.open, .slot.open {
  box-shadow: 0 0 0 2px #ffffff, 0 0 0 4px #1a63c4;
}

.cell:focus-visible, .slot:focus-visible {
  outline: 2px solid #1a63c4;
  outline-offset: 2px;
}

.counter {
  text-align: right;
  font-size: 13px;
  color: #888;
}

.day-week {
  margin-bottom: 24px;
  max-width: 900px;
}

.day-week-title {
  font-weight: bold;
  margin-bottom: 6px;
}

.day-week-dates {
  font-weight: normal;
  color: #888;
  font-size: 13px;
  margin-left: 6px;
}

.day-week-shift {
  font-weight: normal;
  font-size: 12px;
  color: #a08000;
  margin-left: 6px;
}

.timetable {
  display: grid;
  gap: 1px;
  background-color: #e6e6e6;
  border: 1px solid #e6e6e6;
}

.tt-corner, .tt-day, .tt-period, .tt-slot {
  background-color: #ffffff;
}

.tt-day {
  padding: 6px 8px;
  font-size: 13px;
  font-weight: bold;
  color: #444;
  background-color: #f6f6f6;
}

.tt-date {
  font-weight: normal;
  color: #888;
  margin-left: 5px;
}

.tt-period {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
  padding: 6px 4px;
  font-size: 13px;
  color: #888;
  background-color: #f6f6f6;
}

.tt-period-time {
  font-size: 11px;
  color: #a3a3a3;
  white-space: nowrap;
}

.tt-slot {
  padding: 3px;
}

.slot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  width: 100%;
  padding: 5px 6px;
  border: none;
  border-radius: 4px;
  background: none;
  cursor: pointer;
  text-align: left;
}

.slot:hover {
  background-color: #f0f4fa;
}

.slot-name {
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.slot-topic {
  flex: none;
  min-width: 20px;
  padding: 1px 4px;
  border-radius: 4px;
  font-size: 12px;
  text-align: center;
  background-color: var(--bg);
  color: var(--fg);
  border: 1px solid var(--br);
}

.popover {
  position: fixed;
  z-index: 10;
  width: 320px;
  padding: 14px 16px;
  background-color: #ffffff;
  border: 1px solid #d5d5d5;
  border-radius: 8px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.18);
}

.arrow {
  position: absolute;
  width: 10px;
  height: 10px;
  margin-left: -5px;
  background-color: #ffffff;
  transform: rotate(45deg);
}

.placement-bottom .arrow {
  top: -6px;
  border-top: 1px solid #d5d5d5;
  border-left: 1px solid #d5d5d5;
}

.placement-top .arrow {
  bottom: -6px;
  border-bottom: 1px solid #d5d5d5;
  border-right: 1px solid #d5d5d5;
}

.close {
  position: absolute;
  top: 4px;
  right: 8px;
  border: none;
  background: none;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  color: #999;
}

.crumbs {
  margin: 0;
  font-size: 13px;
  color: #777;
}

.title-sr {
  margin: 4px 0 2px;
  font-size: 18px;
}

.title-ru {
  margin: 0 0 10px;
  color: #666;
  font-style: italic;
}

.lesson-line {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
}

.lesson {
  font-size: 13px;
  color: #666;
}

.badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 13px;
  background-color: var(--bg);
  color: var(--fg);
  border: 1px solid var(--br);
}

.actions {
  display: flex;
  gap: 10px;
  margin-top: 14px;
}

.btn {
  padding: 7px 16px;
  border-radius: 6px;
  border: 1px solid #ccc;
  background-color: #f5f5f5;
  cursor: pointer;
}

.btn.primary {
  background-color: #1a63c4;
  border-color: #1a63c4;
  color: #ffffff;
}

.btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.note {
  margin: 10px 0 0;
  font-size: 13px;
  color: #888;
}

@media (max-width: 1180px) {
  .board-body {
    flex-direction: column;
  }

  .panel {
    width: 100%;
    max-width: 520px;
  }
}

@media (max-width: 900px) {
  .grid {
    width: auto;
  }

  .row {
    grid-template-columns: 1fr 1fr;
  }

  .week, .week-head {
    border-left: none;
  }
}
</style>
