<template>
  <div class="history">
    <div class="history-head">
      <h1>История</h1>
      <p class="subtitle">
        Открытые темы, начатая практика и попытки тестов<template v-if="user">
          · {{ user.name || user.login }}</template
        >
      </p>

      <div class="filters">
        <label v-for="option in filters" :key="option.value" :class="{ active: filter === option.value }">
          <input type="radio" :value="option.value" v-model="filter" />
          <span>{{ option.label }}</span>
        </label>
      </div>
    </div>

    <div class="days" v-if="days.length">
      <section class="day" v-for="day in days" :key="day.key">
        <h2 class="day-title">
          {{ day.title }}
          <span class="day-work" title="От первого до последнего события; паузы дольше получаса — за 15 минут">{{
            day.work
          }}</span>
        </h2>

        <p class="day-empty" v-if="!day.entries.length">Ничего по этому фильтру</p>
        <ol class="feed" v-else>
          <li
            v-for="entry in day.entries"
            :key="entry.id"
            class="entry"
            :class="['kind-' + entry.kind, entry.status ? 'result-' + entry.status : '']"
          >
            <span class="time">{{ entry.time }}</span>
            <span class="mark"></span>

            <component
              :is="entry.action ? 'button' : 'div'"
              :type="entry.action ? 'button' : null"
              class="entry-body"
              :class="{ clickable: entry.action }"
              @click="entry.action && entry.action()"
            >
              <span class="entry-main">
                <span class="entry-kind">
                  {{ entry.label }}<template v-if="entry.subject"> · {{ entry.subject }}</template>
                </span>
                <span class="entry-title">{{ entry.title }}</span>
                <span class="entry-ru" v-if="entry.titleRu">{{ entry.titleRu }}</span>
                <span class="entry-note" v-if="entry.note">{{ entry.note }}</span>
              </span>
              <span class="score" v-if="entry.score" :class="'result-' + entry.status">{{ entry.score }}</span>
            </component>
          </li>
        </ol>
      </section>
    </div>

    <p class="state error" v-if="error">
      {{ error }}
      <button type="button" class="link-btn" @click="reload">Повторить</button>
    </p>
    <p class="state" v-else-if="loading">Загружаю историю…</p>
    <p class="state" v-else-if="!items.length">История пока пуста: откройте тему в «Учебниках» или начните практику.</p>

    <button v-if="hasMore && !loading && !error" type="button" class="btn more" @click="loadMore">Показать ещё</button>

    <TestAttempts
      v-if="review"
      :target="review.target"
      :initial="review.number"
      :subject-label="subjectLabel(review.target.subject)"
      @close="review = null"
      @open-theory="openTheory"
    />
  </div>
</template>

<script>
import TestAttempts from '@/views/TestAttempts.vue';
import { testSummary } from '@/tests.js';
import { findSubject } from '@/subjects.js';
import {
  attemptLabels,
  attemptStatus,
  dayKey,
  filters,
  formatDay,
  formatDuration,
  formatTime,
  formatWork,
  loadHistory,
  splitTarget,
  workSeconds,
} from '@/history.js';

// сколько дней с активностью показываем сразу и добавляем по «Показать ещё»
const DAYS_STEP = 3;

export default {
  name: 'StudentHistory',
  components: { TestAttempts },
  props: ['user'],
  emits: ['open-theory'],
  data() {
    return {
      filters: filters,
      filter: 'all',
      // лента грузится целиком, без фильтра: время работы за день считаем по всем событиям
      items: [],
      more: false,
      dayCount: DAYS_STEP,
      loading: false,
      error: '',
      // тесты по ключу темы: русское название темы есть только в банке тестов
      tests: {},
      // открытый разбор теста: тема и попытка, с которой начать
      review: null,
      // номер запроса: ответ на устаревший (фильтр успели сменить) не должен затереть свежий
      request: 0,
    };
  },
  computed: {
    filterTypes() {
      return filters.find((item) => item.value === this.filter)?.types ?? [];
    },
    // лента по дням, от новых к старым
    allDays() {
      const days = [];

      for (const item of this.items) {
        const date = new Date(item.at);
        const key = dayKey(date);

        if (!days.length || days[days.length - 1].key !== key) {
          days.push({ key: key, date: date, items: [] });
        }

        days[days.length - 1].items.push({ item, date });
      }

      return days;
    },
    // последние дни с активностью — по колонке на день
    days() {
      const today = new Date();

      return this.allDays.slice(0, this.dayCount).map((day) => ({
        key: day.key,
        title: formatDay(day.date, today),
        work: formatWork(workSeconds(day.items.map((entry) => entry.date))),
        entries: day.items
          .filter(({ item }) => !this.filterTypes.length || this.filterTypes.includes(item.type))
          .map(({ item, date }) => this.describe(item, date)),
      }));
    },
    // ещё есть дни: загруженные, но не показанные, или не загруженные вовсе
    hasMore() {
      return this.allDays.length > this.dayCount || this.more;
    },
  },
  created() {
    this.reload();
  },
  methods: {
    async reload() {
      this.items = [];
      this.more = false;
      this.dayCount = DAYS_STEP;
      await this.fetchDays();
    },
    loadMore() {
      this.dayCount += DAYS_STEP;
      return this.fetchDays();
    },
    // Догружаем страницы, пока не начнётся день сверх показанных: только тогда последний из них
    // загружен целиком и время работы за него посчитано верно.
    async fetchDays() {
      const request = ++this.request;
      this.loading = true;
      this.error = '';

      try {
        if (!this.items.length) {
          await this.fetchPage(0, request);
        }

        while (this.more && this.allDays.length <= this.dayCount && request === this.request) {
          await this.fetchPage(this.items[this.items.length - 1].id, request);
        }
      } catch (error) {
        if (request === this.request) {
          this.error = error.message;
        }
      } finally {
        if (request === this.request) {
          this.loading = false;
        }
      }
    },
    async fetchPage(before, request) {
      const payload = await loadHistory({ before: before });
      if (request !== this.request) {
        return;
      }

      this.items = this.items.concat(payload.items ?? []);
      this.more = Boolean(payload.more);
      this.loadTitles(payload.items ?? []);
    },
    // русские названия тем берём из оглавления тестов; у тем без теста их нет — покажем как есть
    async loadTitles(items) {
      for (const item of items) {
        if (item.type === 'practice' || item.target in this.tests) {
          continue;
        }

        const { subject, topic } = splitTarget(item.target);
        this.tests[item.target] = null;
        this.tests[item.target] = await testSummary(subject, topic).catch(() => null);
      }
    },
    titleOf(subject, topic) {
      return this.tests[`${subject}|${topic}`]?.titleRu ?? '';
    },
    subjectLabel(value) {
      return findSubject(value)?.label ?? value;
    },
    // строка ленты: что показать и что делать по клику
    describe(item, date) {
      const entry = { id: item.id, kind: item.type, time: formatTime(date) };

      if (item.type === 'practice') {
        return { ...entry, label: 'Практика', title: item.target };
      }

      const { subject, topic } = splitTarget(item.target);
      const common = {
        ...entry,
        subject: this.subjectLabel(subject),
        title: topic,
        titleRu: this.titleOf(subject, topic),
      };

      if (item.type === 'theory') {
        return { ...common, label: 'Теория', action: () => this.openTheory({ subject, topic }) };
      }

      if (item.type === 'test') {
        return { ...common, label: 'Открыт тест', action: () => this.openTest(subject, topic) };
      }

      const attempt = item.attempt ?? {};
      const status = attemptStatus(attempt);
      const result = attempt.violation
        ? `${attemptLabels.violation}: ${attempt.violation}`
        : `${attemptLabels[status]}, для зачёта нужно ${attempt.pass}`;

      return {
        ...common,
        label: `Попытка ${attempt.number}`,
        status: status,
        score: `${attempt.score} из ${attempt.total}`,
        note: `${result} · ${formatDuration(attempt.seconds ?? 0)}`,
        action: () => this.openTest(subject, topic, attempt.number),
      };
    },
    openTest(subject, topic, number = null) {
      this.review = { target: { subject, topic }, number: number };
    },
    openTheory(target) {
      this.review = null;
      this.$emit('open-theory', target);
    },
  },
};
</script>

<style scoped>
.history {
  flex: 1;
  min-width: 0;
  max-width: 1300px;
  padding: 10px 0 30px;
}

h1 {
  margin: 0;
}

.subtitle {
  margin: 4px 0 12px;
  color: #666;
}

.filters {
  display: inline-flex;
  max-width: 100%;
  margin-bottom: 20px;
  border: 1px solid #c4c4c4;
  border-radius: 6px;
  overflow: hidden;
}

.filters label {
  padding: 6px 14px;
  font-size: 14px;
  cursor: pointer;
  color: #333;
  background-color: #ffffff;
  white-space: nowrap;
}

.filters label + label {
  border-left: 1px solid #c4c4c4;
}

.filters label:hover {
  background-color: #eef2f8;
}

.filters label.active {
  background-color: #1a63c4;
  color: #ffffff;
}

/* нативный кружок прячем, но фокус с клавиатуры оставляем рабочим */
.filters input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
}

.filters input:focus-visible + span {
  outline: 2px solid #1a63c4;
  outline-offset: 3px;
}

/* по колонке на день: свежий слева */
.days {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px 20px;
  align-items: start;
}

.day-title {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 4px 10px;
  margin: 0 0 6px;
  padding-bottom: 6px;
  border-bottom: 1px solid #ececec;
  font-size: 15px;
  color: #444;
}

.day-work {
  margin-left: auto;
  font-size: 13px;
  font-weight: normal;
  color: #1a63c4;
  white-space: nowrap;
  cursor: help;
}

.day-empty {
  margin: 8px 0 0;
  font-size: 13px;
  color: #999;
}

.feed {
  list-style: none;
  margin: 0;
  padding: 0;
}

/* лента: время, точка на общей линии и сама запись */
.entry {
  --dot: #9a9a9a;
  position: relative;
  display: grid;
  grid-template-columns: 44px 22px 1fr;
  align-items: start;
}

.entry::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 54px;
  width: 2px;
  background-color: #ececec;
}

.entry:first-child::before {
  top: 14px;
}

.entry:last-child::before {
  bottom: calc(100% - 14px);
}

.entry:only-child::before {
  display: none;
}

.kind-theory {
  --dot: #1a63c4;
}

.kind-practice {
  --dot: #7a52b3;
}

.kind-test {
  --dot: #b5b5b5;
}

.result-passed {
  --dot: #2e7d32;
  --bg: #2e7d32;
  --fg: #ffffff;
}

.result-failed {
  --dot: #c62828;
  --bg: #c62828;
  --fg: #ffffff;
}

.result-violation {
  --dot: #f2b705;
  --bg: #f2b705;
  --fg: #2b2b2b;
}

.time {
  padding-top: 7px;
  font-size: 13px;
  color: #888;
  font-variant-numeric: tabular-nums;
}

.mark {
  position: relative;
  z-index: 1;
  justify-self: center;
  width: 10px;
  height: 10px;
  margin-top: 10px;
  border: 2px solid #ffffff;
  border-radius: 50%;
  box-sizing: content-box;
  background-color: var(--dot);
}

.entry-body {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  margin: 1px 0;
  padding: 5px 8px;
  border: none;
  border-radius: 6px;
  background: none;
  color: inherit;
  text-align: left;
}

.entry-body.clickable {
  cursor: pointer;
}

.entry-body.clickable:hover {
  background-color: #eef2f8;
}

.entry-body.clickable:hover .entry-title {
  color: #1a63c4;
  text-decoration: underline;
}

.entry-body:focus-visible {
  outline: 2px solid #1a63c4;
  outline-offset: 1px;
}

.entry-main {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.entry-kind {
  font-size: 12px;
  color: #888;
}

.entry-title {
  overflow-wrap: anywhere;
}

.entry-ru {
  font-size: 13px;
  color: #777;
  font-style: italic;
}

.entry-note {
  margin-top: 1px;
  font-size: 13px;
  color: #666;
}

.score {
  flex: none;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 13px;
  white-space: nowrap;
  background-color: var(--bg);
  color: var(--fg);
}

.score {
  margin-top: 8px;
  font-weight: bold;
}

.state {
  margin: 16px 0 0;
  color: #888;
}

.state.error {
  color: #8a1c1c;
}

.link-btn {
  margin-left: 6px;
  padding: 0;
  border: none;
  background: none;
  color: #1a63c4;
  text-decoration: underline;
  cursor: pointer;
}

.btn {
  padding: 7px 16px;
  border-radius: 6px;
  border: 1px solid #ccc;
  background-color: #f5f5f5;
  cursor: pointer;
}

.btn:hover {
  background-color: #ececec;
}

.more {
  margin: 18px 0 0;
}

@media (max-width: 900px) {
  .history {
    flex: none;
    width: 100%;
    padding: 4px 0 24px;
  }

  .subtitle {
    margin: 4px 0 10px;
    font-size: 14px;
  }

  /* фильтры не влезают в строку — катаем вбок, как подразделы практики */
  .filters {
    margin-bottom: 14px;
    overflow-x: auto;
    scrollbar-width: none;
  }

  .filters label {
    display: flex;
    align-items: center;
    min-height: 40px;
    padding: 0 14px;
  }

  .days {
    grid-template-columns: minmax(0, 1fr);
  }

  .entry {
    grid-template-columns: 40px 18px 1fr;
  }

  .entry::before {
    left: 48px;
  }

  .entry-body {
    flex-direction: column;
    gap: 4px;
    padding: 6px 4px 8px;
  }

  .score {
    margin-top: 0;
  }

  .more {
    width: 100%;
    margin-left: 0;
    padding: 11px 16px;
  }
}
</style>
