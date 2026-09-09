<template>
  <div class="test-overlay" @click.self="close">
    <div class="test-card" v-if="test">
      <button class="close" type="button" aria-label="Закрыть" @click="close">&times;</button>

      <p class="crumbs">{{ subjectLabel }} · практика</p>
      <h1>{{ test.title }}</h1>
      <p class="title-ru" v-if="test.titleRu">{{ test.titleRu }}</p>

      <p class="rules">
        {{ test.questions.length }} вопрос(ов) · для зачёта нужно {{ pass }} верных ·
        <template v-if="stage === 'answering'">попытка {{ record.attempts + 1 }} из {{ maxAttempts }}</template>
        <template v-else>использовано попыток: {{ record.attempts }} из {{ maxAttempts }}</template>
      </p>

      <ol class="questions">
        <li
            v-for="(question, index) in test.questions"
            :key="index"
            :class="marks[index]"
        >
          <div class="ask" v-html="question.text"></div>

          <div class="answer" v-if="question.type === 'choice'">
            <label v-for="(option, oi) in question.options" :key="oi">
              <input
                  type="radio"
                  :name="'q' + index"
                  :value="oi"
                  :disabled="locked"
                  v-model="answers[index]"
              >
              <span v-html="option"></span>
            </label>
          </div>

          <div class="answer" v-else-if="question.type === 'multi'">
            <label v-for="(option, oi) in question.options" :key="oi">
              <input
                  type="checkbox"
                  :value="oi"
                  :disabled="locked"
                  v-model="answers[index]"
              >
              <span v-html="option"></span>
            </label>
            <p class="note">Верных ответов может быть несколько.</p>
          </div>

          <div class="answer" v-else>
            <input
                class="field"
                type="text"
                inputmode="decimal"
                autocomplete="off"
                :placeholder="question.placeholder || 'введите ответ'"
                :disabled="locked"
                v-model="answers[index]"
                @keydown.enter.prevent="submit"
            >
            <span class="unit" v-if="question.unit">{{ question.unit }}</span>
          </div>

          <p class="verdict" v-if="stage === 'result'">
            <template v-if="review">Правильный ответ: <b v-html="correctText(question)"></b></template>
            <template v-else-if="marks[index] === 'right'">Верно</template>
            <template v-else-if="showAnswers">Неверно. Правильный ответ: <b v-html="correctText(question)"></b></template>
            <template v-else>Неверно — попробуйте ещё раз во второй попытке</template>
          </p>
          <p class="hint" v-if="stage === 'result' && showAnswers && question.hint" v-html="question.hint"></p>
        </li>
      </ol>

      <div class="foot">
        <p class="score" v-if="stage === 'result'" :class="{ok: passed, bad: !passed}">
          <template v-if="review && record.passed">Тест сдан: {{ record.best }} из {{ record.total }}. Ниже — разбор.</template>
          <template v-else-if="review">Попытки закончились. Лучший результат: {{ record.best }} из {{ record.total }}. Ниже — разбор.</template>
          <template v-else-if="passed">Тест сдан: {{ score }} из {{ test.questions.length }}</template>
          <template v-else-if="left">Верно {{ score }} из {{ test.questions.length }} — не хватает до {{ pass }}. Осталась ещё {{ left }} попытка.</template>
          <template v-else>Верно {{ score }} из {{ test.questions.length }}. Попытки закончились — посмотрите разбор и вернитесь к теории.</template>
        </p>
        <p class="score bad" v-else-if="!left">
          Попытки по этому тесту закончились. Лучший результат: {{ record.best }} из {{ record.total }}.
        </p>

        <div class="actions">
          <button
              v-if="stage === 'answering'"
              type="button"
              class="btn primary"
              :disabled="!left"
              @click="submit"
          >
            Проверить
          </button>
          <button
              v-else-if="left && !passed"
              type="button"
              class="btn primary"
              @click="retry"
          >
            Вторая попытка
          </button>
          <button type="button" class="btn" @click="openTheory">К теории</button>
          <button type="button" class="btn" @click="close">Закрыть</button>
        </div>
      </div>
    </div>

    <div class="test-card" v-else-if="failed">
      <button class="close" type="button" aria-label="Закрыть" @click="close">&times;</button>
      <p>Тест по этой теме пока не составлен.</p>
    </div>
  </div>
</template>

<script>
import {
  MAX_ATTEMPTS,
  attemptsLeft,
  isCorrect,
  loadTest,
  passScore,
  readRecord,
  writeRecord,
} from '@/tests.js';

export default {
  name: 'TopicTest',
  props: ['target', 'subjectLabel'],
  emits: ['close', 'open-theory'],
  data() {
    return {
      test: null,
      failed: false,
      maxAttempts: MAX_ATTEMPTS,
      record: {attempts: 0, best: 0, total: 0, passed: false},
      // тест открыли, когда он уже был сдан или попытки кончились: ответов этой попытки нет
      review: false,
      answers: [],
      marks: [],
      stage: 'answering',
      score: 0,
    };
  },
  computed: {
    pass() {
      return this.test ? passScore(this.test) : 0;
    },
    left() {
      return attemptsLeft(this.record);
    },
    passed() {
      return this.stage === 'result' && this.score >= this.pass;
    },
    // разбор показываем, когда тест сдан или попытки исчерпаны
    showAnswers() {
      return this.passed || !this.left;
    },
    locked() {
      return this.stage === 'result' || !this.left;
    },
  },
  async created() {
    this.test = await loadTest(this.target.subject, this.target.topic);
    if (!this.test) {
      this.failed = true;
      return;
    }

    this.record = readRecord(this.target.subject, this.target.topic);
    this.reset();

    // тест уже сдан или попытки кончились — сразу показываем итог и разбор
    if (!this.left) {
      this.stage = 'result';
      this.score = this.record.best;
      this.marks = this.test.questions.map(() => '');
      this.review = true;
    }
  },
  methods: {
    reset() {
      this.answers = this.test.questions.map((question) => (question.type === 'multi' ? [] : null));
      this.marks = this.test.questions.map(() => '');
      this.stage = 'answering';
      this.score = 0;
    },
    submit() {
      if (this.stage === 'result' || !this.left) {
        return;
      }

      this.marks = this.test.questions.map((question, index) => (
          isCorrect(question, this.answers[index]) ? 'right' : 'wrong'
      ));
      this.score = this.marks.filter((mark) => mark === 'right').length;
      this.stage = 'result';

      this.record = {
        attempts: this.record.attempts + 1,
        best: Math.max(this.record.best, this.score),
        total: this.test.questions.length,
        passed: this.record.passed || this.score >= this.pass,
      };
      writeRecord(this.target.subject, this.target.topic, this.record);
    },
    retry() {
      this.reset();
    },
    correctText(question) {
      if (question.type === 'choice') {
        return question.options[question.answer];
      }

      if (question.type === 'multi') {
        return question.answer.map((index) => question.options[index]).join('; ');
      }

      if (question.type === 'number') {
        return question.answer + (question.unit ? ' ' + question.unit : '');
      }

      return (Array.isArray(question.answer) ? question.answer[0] : question.answer);
    },
    openTheory() {
      this.$emit('open-theory', this.target);
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
  mounted() {
    window.addEventListener('keydown', this.handleKeydown);
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this.handleKeydown);
  },
};
</script>

<style scoped>
.test-overlay {
  position: fixed;
  inset: 0;
  z-index: 20;
  background-color: rgba(0, 0, 0, 0.45);
  overflow-y: auto;
  padding: 30px 16px;
}

.test-card {
  position: relative;
  max-width: 760px;
  margin: 0 auto;
  padding: 22px 26px 20px;
  background-color: #ffffff;
  border-radius: 10px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
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
}

.title-ru {
  margin: 0;
  color: #666;
  font-style: italic;
}

.rules {
  margin: 12px 0 18px;
  padding: 8px 12px;
  background-color: #f2f6fc;
  border-left: 3px solid #1a63c4;
  font-size: 14px;
  color: #444;
}

.questions {
  margin: 0;
  padding-left: 22px;
}

.questions > li {
  margin-bottom: 18px;
  padding: 8px 10px 4px;
  border-radius: 6px;
  border-left: 3px solid transparent;
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

.answer {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 4px;
}

.answer label {
  display: flex;
  align-items: baseline;
  gap: 8px;
  cursor: pointer;
}

.field {
  width: 220px;
  padding: 6px 8px;
  border: 1px solid #c4c4c4;
  border-radius: 5px;
}

.field:focus {
  outline: 2px solid #1a63c4;
  outline-offset: 1px;
}

.unit {
  margin-left: 8px;
  color: #777;
  font-size: 14px;
}

.note {
  margin: 2px 0 0;
  font-size: 13px;
  color: #888;
}

.verdict {
  margin: 6px 0 0;
  font-size: 14px;
  color: #444;
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

.score {
  margin: 0 0 12px;
  font-weight: bold;
}

.score.ok {
  color: #2e7d32;
}

.score.bad {
  color: #c62828;
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

.btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
</style>
