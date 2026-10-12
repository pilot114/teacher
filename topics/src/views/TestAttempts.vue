<template>
  <div class="review-overlay" @click.self="close">
    <div class="review-card" ref="card" tabindex="-1" role="dialog" aria-modal="true" aria-labelledby="review-title">
      <button class="close" type="button" aria-label="Закрыть" @click="close">&times;</button>

      <p class="crumbs">{{ subjectLabel }} · история теста</p>
      <h1 id="review-title">{{ target.topic }}</h1>
      <p class="title-ru" v-if="titleRu">{{ titleRu }}</p>

      <p class="summary" :class="'result-' + summaryStatus">{{ summary }}</p>

      <p class="state" v-if="loading">Загружаю попытки…</p>
      <p class="state error" v-else-if="error">
        {{ error }}
        <button type="button" class="link-btn" @click="load">Повторить</button>
      </p>
      <p class="state" v-else-if="!attempts.length">
        Подробностей нет: попытки по этому тесту прошли до того, как появилась история.
      </p>

      <template v-else>
        <div class="tabs" role="tablist" aria-label="Попытки">
          <button
              v-for="attempt in attempts"
              :key="attempt.number"
              type="button"
              role="tab"
              class="tab"
              :class="['result-' + statusOf(attempt), {active: attempt.number === selected}]"
              :aria-selected="String(attempt.number === selected)"
              @click="selected = attempt.number"
          >
            <span class="tab-name">Попытка {{ attempt.number }}</span>
            <span class="tab-score">{{ attempt.score }} из {{ attempt.total }} · {{ labels[statusOf(attempt)] }}</span>
          </button>
        </div>

        <div class="attempt" v-if="current" role="tabpanel">
          <p class="meta">
            <span>{{ formatDateTime(new Date(current.finishedAt)) }}</span>
            <span>длилась {{ formatDuration(current.seconds) }}</span>
            <span>для зачёта нужно {{ current.pass }} из {{ current.total }}</span>
          </p>

          <p class="result" :class="'result-' + statusOf(current)">
            <template v-if="current.violation">
              Попытка сорвана: {{ current.violation }}. Засчитано 0 верных — ответы этой попытки не проверялись.
            </template>
            <template v-else-if="current.passed">Сдано: верно {{ current.score }} из {{ current.total }}.</template>
            <template v-else>Не сдано: верно {{ current.score }} из {{ current.total }}, не хватило до {{ current.pass }}.</template>
          </p>

          <p class="locked" v-if="!closed">
            Правильные ответы откроются, когда тест будет сдан или попытки закончатся — так же, как в самом тесте.
          </p>

          <ol class="questions">
            <li
                v-for="(question, index) in current.questions"
                :key="index"
                :class="showMarks ? (question.right ? 'right' : 'wrong') : ''"
            >
              <div class="ask" v-html="question.text"></div>

              <ul class="options" v-if="question.options">
                <li
                    v-for="(option, oi) in question.options"
                    :key="oi"
                    :class="optionClass(question, oi)"
                >
                  <span class="pick" :class="[question.type, {on: isChosen(question, oi)}]" aria-hidden="true"></span>
                  <span class="option-text" v-html="option"></span>
                  <span class="option-note" v-if="isChosen(question, oi)">ответ ученика</span>
                  <span class="option-note correct" v-else-if="closed && isAnswer(question, oi)">верный вариант</span>
                </li>
              </ul>

              <p class="given" v-else>
                Ответ ученика:
                <b v-if="hasGiven(question)">{{ question.given }}<template v-if="question.unit"> {{ question.unit }}</template></b>
                <i v-else>нет ответа</i>
              </p>

              <p class="verdict" v-if="showMarks || closed">
                <template v-if="showMarks && question.right">Верно</template>
                <template v-else-if="closed">
                  {{ showMarks ? 'Неверно. ' : '' }}Правильный ответ: <b v-html="answerText(question)"></b>
                </template>
                <template v-else>Неверно</template>
              </p>
              <!-- причина отказа может подсказать ответ — до закрытия теста показываем только засчитанные -->
              <p class="judged" v-if="question.verdict && (question.verdict.correct || closed)">
                <template v-if="question.verdict.correct">Ответ не совпал с эталоном, но засчитан при дополнительной проверке: </template>
                <template v-else>Дополнительная проверка: </template>
                {{ question.verdict.reason }}
              </p>
              <p class="hint" v-if="closed && question.hint" v-html="question.hint"></p>
            </li>
          </ol>
        </div>
      </template>

      <div class="foot">
        <div class="actions">
          <button type="button" class="btn primary" @click="$emit('open-theory', target)">К теории</button>
          <button type="button" class="btn" @click="close">Закрыть</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import {MAX_ATTEMPTS, answerText, attemptsLeft, readRecord, testSummary} from '@/tests.js';
import {attemptLabels, attemptStatus, formatDateTime, formatDuration, loadAttempts} from '@/history.js';

export default {
  name: 'TestAttempts',
  props: ['target', 'initial', 'subjectLabel'],
  emits: ['close', 'open-theory'],
  data() {
    return {
      labels: attemptLabels,
      record: readRecord(this.target.subject, this.target.topic),
      test: null,
      attempts: [],
      selected: null,
      loading: false,
      error: '',
    };
  },
  computed: {
    titleRu() {
      return this.test?.titleRu ?? '';
    },
    // тест закрыт — сдан или попытки кончились; только тогда, как и в самом тесте, показываем правильные ответы
    closed() {
      return attemptsLeft(this.record) === 0;
    },
    current() {
      return this.attempts.find((attempt) => attempt.number === this.selected) ?? null;
    },
    // сорванная попытка засчитана с нулём, ответы в ней не проверялись — верно/неверно по вопросам не ставим
    showMarks() {
      return Boolean(this.current) && !this.current.violation;
    },
    summaryStatus() {
      if (this.record.passed) {
        return 'passed';
      }

      return this.closed ? 'failed' : 'open';
    },
    summary() {
      const used = `использовано попыток: ${this.record.attempts} из ${MAX_ATTEMPTS}`;

      if (this.record.passed) {
        return `Тест сдан · лучший результат ${this.record.best} из ${this.record.total} · ${used}`;
      }

      if (this.closed) {
        return `Тест не сдан, попытки закончились · лучший результат ${this.record.best} из ${this.record.total}`;
      }

      if (!this.record.attempts) {
        return 'Тест ещё не сдавали';
      }

      return `Тест пока не сдан · ${used}`;
    },
  },
  async created() {
    testSummary(this.target.subject, this.target.topic).then((test) => {
      this.test = test;
    }).catch(() => {
      // без русского названия разбор всё равно показываем
    });

    await this.load();
  },
  mounted() {
    window.addEventListener('keydown', this.handleKeydown);
    this.$nextTick(() => this.$refs.card?.focus({preventScroll: true}));
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this.handleKeydown);
  },
  methods: {
    answerText,
    formatDateTime,
    formatDuration,
    statusOf: attemptStatus,
    async load() {
      this.loading = true;
      this.error = '';

      try {
        this.attempts = await loadAttempts(this.target.subject, this.target.topic);

        // из ленты приходим к конкретной попытке, из списка тестов — к последней
        const wanted = this.attempts.find((attempt) => attempt.number === this.initial);
        const last = this.attempts[this.attempts.length - 1];
        this.selected = (wanted ?? last)?.number ?? null;
      } catch (error) {
        this.error = error.message;
      } finally {
        this.loading = false;
      }
    },
    isChosen(question, index) {
      return Array.isArray(question.given) ? question.given.includes(index) : question.given === index;
    },
    // правильные ответы сервер кладёт в снимок, только когда тест закрыт
    isAnswer(question, index) {
      if (question.answer === undefined) {
        return false;
      }
      return Array.isArray(question.answer) ? question.answer.includes(index) : question.answer === index;
    },
    hasGiven(question) {
      return question.given !== null && question.given !== undefined && String(question.given).trim() !== '';
    },
    // варианты подсвечиваем по существу только в закрытом тесте, иначе — лишь отмечаем выбор ученика
    optionClass(question, index) {
      if (!this.closed) {
        return {chosen: this.isChosen(question, index)};
      }

      return {
        chosen: this.isChosen(question, index),
        correct: this.isAnswer(question, index),
        mistaken: this.showMarks && this.isChosen(question, index) && !this.isAnswer(question, index),
      };
    },
    close() {
      this.$emit('close');
    },
    handleKeydown(event) {
      if (event.key === 'Escape') {
        this.close();
      }
    },
  },
};
</script>

<style scoped>
.review-overlay {
  position: fixed;
  inset: 0;
  z-index: 20;
  background-color: rgba(0, 0, 0, 0.45);
  overflow-y: auto;
  padding: 30px 16px;
}

.review-card {
  position: relative;
  max-width: 760px;
  margin: 0 auto;
  padding: 22px 26px 20px;
  background-color: #ffffff;
  border-radius: 10px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}

.review-card:focus {
  outline: none;
}

.close {
  position: absolute;
  top: 8px;
  right: 12px;
  border: none;
  background: none;
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
  color: #999;
}

.crumbs {
  margin: 0;
  font-size: 13px;
  color: #777;
}

h1 {
  margin: 4px 0 2px;
  padding-right: 28px;
}

.title-ru {
  margin: 0;
  color: #666;
  font-style: italic;
}

.result-passed {
  --accent: #2e7d32;
  --soft: #f0f8f0;
}

.result-failed {
  --accent: #c62828;
  --soft: #fdf3f2;
}

.result-violation {
  --accent: #cf9c04;
  --soft: #fdf7e3;
}

.result-open {
  --accent: #1a63c4;
  --soft: #f2f6fc;
}

.summary {
  margin: 12px 0 16px;
  padding: 8px 12px;
  border-left: 3px solid var(--accent);
  background-color: var(--soft);
  font-size: 14px;
  color: #444;
}

.state {
  margin: 0 0 12px;
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

.tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.tab {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1px;
  padding: 6px 14px 6px 12px;
  border: 1px solid #d5d5d5;
  border-left: 4px solid var(--accent);
  border-radius: 6px;
  background-color: #ffffff;
  cursor: pointer;
  text-align: left;
}

.tab:hover {
  background-color: #f6f6f6;
}

.tab.active {
  border-color: var(--accent);
  background-color: var(--soft);
  box-shadow: 0 0 0 1px var(--accent);
}

.tab:focus-visible {
  outline: 2px solid #1a63c4;
  outline-offset: 2px;
}

.tab-name {
  font-weight: bold;
  font-size: 14px;
}

.tab-score {
  font-size: 13px;
  color: #555;
}

.meta {
  display: flex;
  flex-wrap: wrap;
  gap: 2px 14px;
  margin: 0 0 6px;
  font-size: 13px;
  color: #777;
}

.result {
  margin: 0 0 10px;
  font-weight: bold;
  color: var(--accent);
}

.locked {
  margin: 0 0 14px;
  padding: 8px 12px;
  border-radius: 6px;
  background-color: #f6f6f6;
  font-size: 13px;
  color: #666;
}

.questions {
  margin: 0;
  padding-left: 22px;
}

.questions > li {
  margin-bottom: 14px;
  padding: 8px 10px 6px;
  border-radius: 6px;
  border-left: 3px solid #e6e6e6;
}

.questions > li.right {
  background-color: #f0f8f0;
  border-left-color: #2e7d32;
}

.questions > li.wrong {
  background-color: #fdf3f2;
  border-left-color: #c62828;
}

.ask :deep(p) {
  margin: 0 0 6px;
}

.options {
  list-style: none;
  margin: 4px 0 0;
  padding: 0;
}

.options li {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 3px 6px;
  border-radius: 4px;
}

/* фон вопроса уже зелёный или красный — подсветке варианта нужен свой непрозрачный цвет и полоска */
.options li.correct {
  background-color: #dcefdd;
  box-shadow: inset 3px 0 0 #2e7d32;
}

.options li.mistaken {
  background-color: #f8dcda;
  box-shadow: inset 3px 0 0 #c62828;
}

/* вариант, выбранный учеником, — как отмеченный кружок или галочка в самом тесте */
.pick {
  flex: none;
  position: relative;
  top: 2px;
  width: 12px;
  height: 12px;
  border: 1.5px solid #8a8a8a;
  background-color: #ffffff;
}

.pick.choice {
  border-radius: 50%;
}

.pick.multi {
  border-radius: 3px;
}

.pick.on {
  border-color: #333;
  background-color: #333;
  box-shadow: inset 0 0 0 2px #ffffff;
}

.option-text {
  flex: 1;
}

.option-note {
  flex: none;
  font-size: 12px;
  color: #777;
}

.option-note.correct {
  color: #2e7d32;
}

.given {
  margin: 4px 0 0;
}

.verdict {
  margin: 6px 0 0;
  font-size: 14px;
  color: #444;
}

.judged {
  margin: 4px 0 0;
  font-size: 14px;
  color: #555;
}

.hint {
  margin: 4px 0 0;
  font-size: 14px;
  color: #666;
  font-style: italic;
}

.foot {
  border-top: 1px solid #e6e6e6;
  margin-top: 16px;
  padding-top: 14px;
}

.actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
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

@media (max-width: 900px) {
  .review-overlay {
    padding: 10px 8px calc(10px + env(safe-area-inset-bottom));
    -webkit-overflow-scrolling: touch;
  }

  .review-card {
    padding: 18px 14px 16px;
  }

  .close {
    top: 2px;
    right: 4px;
    padding: 6px 10px;
    font-size: 26px;
  }

  h1 {
    padding-right: 36px;
  }

  .summary {
    margin: 10px 0 14px;
    font-size: 13px;
  }

  .tab {
    flex: 1 1 140px;
  }

  .questions {
    padding-left: 20px;
  }

  .questions > li {
    padding: 8px 8px 6px;
  }

  .options li {
    flex-wrap: wrap;
    padding: 5px 4px;
  }

  .option-note {
    flex-basis: 100%;
    padding-left: 20px;
  }

  .actions .btn {
    flex: 1 1 auto;
    min-width: 120px;
    padding: 11px 14px;
  }
}
</style>
