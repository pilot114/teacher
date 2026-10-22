<template>
  <!-- оверлей выносим из #app: саму страницу под тестом размываем и отключаем целиком -->
  <Teleport to="body">
  <div
      class="test-overlay"
      :class="{guarded: answering}"
      ref="overlay"
      @click.self="close"
      @copy="guardClipboard"
      @cut="guardClipboard"
      @contextmenu="guardClipboard"
      @dragstart="guardClipboard"
  >
    <div class="test-card" v-if="test" ref="card" tabindex="-1">
      <button class="close" type="button" aria-label="Закрыть" @click="close">&times;</button>

      <p class="crumbs">{{ subjectLabel }} · практика</p>
      <h1>{{ test.title }}</h1>
      <p class="title-ru" v-if="test.titleRu">{{ test.titleRu }}</p>

      <p class="rules">
        {{ test.count }} вопрос(ов) · для зачёта нужно {{ pass }} верных ·
        <template v-if="stage === 'answering'">попытка {{ number }} из {{ maxAttempts }}</template>
        <template v-else>использовано попыток: {{ record.attempts }} из {{ maxAttempts }}</template>
        <span class="strict" v-if="answering || (stage === 'ready' && left)">
          Тест идёт в полноэкранном режиме. До проверки нельзя выходить из него (в том числе клавишей Esc),
          закрывать тест, переходить к теории, перезагружать страницу, переключаться на другую вкладку,
          окно или программу, менять размер окна или масштаб, подключать второй монитор — всё это засчитывается
          как проваленная попытка. Копировать вопросы и вставлять ответы нельзя.
        </span>
      </p>

      <div class="start" v-if="stage === 'ready' && left">
        <p>Вопросы появятся после нажатия «Начать попытку» — с этого момента попытка засчитана.</p>
        <p class="start-error" v-if="startError" role="alert">{{ startError }}</p>
      </div>

      <ol class="questions" v-else>
        <li
            v-for="(question, index) in test.questions"
            :key="index"
            :class="stage === 'result' ? marks[index] : ''"
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
                @paste="guardClipboard"
                @drop="guardClipboard"
            >
            <span class="unit" v-if="question.unit">{{ question.unit }}</span>
          </div>

          <!-- за сорванную попытку ответы не проверяем: разбор по вопросам покажем, только когда попытки кончились -->
          <p class="verdict" v-if="stage === 'result' && checked && (!violation || showAnswers)">
            <template v-if="review || violation">Правильный ответ: <b v-html="correctText(question)"></b></template>
            <template v-else-if="marks[index] === 'right'">Верно</template>
            <template v-else-if="showAnswers">Неверно. Правильный ответ: <b v-html="correctText(question)"></b></template>
            <template v-else>Неверно — попробуйте ещё раз во второй попытке</template>
          </p>
          <!-- причину отказа арбитра показываем вместе с правильным ответом: до этого она могла бы подсказать -->
          <p class="judged" v-if="stage === 'result' && checked && verdicts[index] && (verdicts[index].correct || showAnswers)">
            <template v-if="verdicts[index].correct">Ответ не совпал с эталоном, но засчитан при дополнительной проверке: </template>
            <template v-else>Дополнительная проверка: </template>
            {{ verdicts[index].reason }}
          </p>
          <p class="hint" v-if="stage === 'result' && checked && showAnswers && question.hint" v-html="question.hint"></p>
        </li>
      </ol>

      <div class="foot">
        <p class="score" v-if="stage === 'result' && checked" :class="{ok: passed, bad: !passed}">
          <template v-if="review && record.passed">Тест сдан: {{ record.best }} из {{ record.total }}. Ниже — разбор.</template>
          <template v-else-if="review">Попытки закончились. Лучший результат: {{ record.best }} из {{ record.total }}. Ниже — разбор.</template>
          <template v-else-if="violation && left">Попытка провалена: {{ violation }}. {{ leftText }}.</template>
          <template v-else-if="violation">Попытка провалена: {{ violation }}. Попытки закончились — посмотрите разбор и вернитесь к теории.</template>
          <template v-else-if="passed">Тест сдан: {{ score }} из {{ test.count }}</template>
          <template v-else-if="left">Верно {{ score }} из {{ test.count }} — не хватает до {{ pass }}. {{ leftText }}.</template>
          <template v-else>Верно {{ score }} из {{ test.count }}. Попытки закончились — посмотрите разбор и вернитесь к теории.</template>
        </p>
        <p class="checking" v-else-if="stage === 'checking'" role="status">
          <span class="spinner" aria-hidden="true"></span>
          Проверяю ответы. Если какие-то не совпали с эталоном, их посмотрит дополнительная проверка — это займёт несколько секунд.
        </p>
        <p class="score bad" v-else-if="stage !== 'result' && !left">
          Попытки по этому тесту закончились. Лучший результат: {{ record.best }} из {{ record.total }}.
        </p>

        <p class="save-error" v-if="saveError">
          {{ saveError }}
          <button type="button" class="again" @click="save">Сохранить ещё раз</button>
        </p>

        <div class="actions">
          <button
              v-if="stage === 'ready'"
              type="button"
              class="btn primary"
              :disabled="!left || starting"
              @click="start"
          >
            {{ starting ? 'Начинаю…' : 'Начать попытку' }}
          </button>
          <button
              v-else-if="stage === 'answering'"
              type="button"
              class="btn primary"
              @click="submit"
          >
            Проверить
          </button>
          <button v-else-if="stage === 'checking'" type="button" class="btn primary" disabled>
            Проверяю…
          </button>
          <button
              v-else-if="left && !passed"
              type="button"
              class="btn primary"
              @click="retry"
          >
            Ещё попытка
          </button>
          <button type="button" class="btn" @click="openTheory">К теории</button>
          <button type="button" class="btn" @click="close">Закрыть</button>
        </div>
      </div>
    </div>

    <div class="test-card" v-else-if="failed">
      <button class="close" type="button" aria-label="Закрыть" @click="close">&times;</button>
      <p v-if="loadError">Не удалось открыть тест: {{ loadError }}</p>
      <p v-else>Тест по этой теме пока не составлен.</p>
    </div>

    <div class="leave" v-if="leaving" role="alertdialog" aria-modal="true" aria-labelledby="leave-text" @click.self="stay">
      <div class="leave-box">
        <p id="leave-text">Ответы ещё не проверены. Если выйти сейчас, попытка будет засчитана как проваленная.</p>
        <div class="actions">
          <button type="button" class="btn danger" @click="confirmLeave">Выйти и провалить попытку</button>
          <button type="button" class="btn primary" ref="stay" @click="stay">Вернуться к тесту</button>
        </div>
      </div>
    </div>
  </div>
  </Teleport>
</template>

<script>
import {
  MAX_ATTEMPTS,
  answerText,
  attemptsLeft,
  loadTest,
  readRecord,
  startAttempt,
  submitAttempt,
} from '@/tests.js';
import {trackTest} from '@/history.js';
// окно с тестом сузилось больше чем на столько — значит, рядом открыли что-то ещё
const SHRINK_LIMIT = 0.9;

function fullscreenElement() {
  return document.fullscreenElement ?? document.webkitFullscreenElement ?? null;
}

function canFullscreen() {
  return Boolean(document.fullscreenEnabled || document.webkitFullscreenEnabled);
}

// старый Safari на iPad знает только webkitRequestFullscreen, и тот не возвращает промис
async function enterFullscreen() {
  const root = document.documentElement;

  if (root.requestFullscreen) {
    await root.requestFullscreen({navigationUI: 'hide'});
  } else {
    root.webkitRequestFullscreen();
  }
}

function exitFullscreen() {
  if (!fullscreenElement()) {
    return;
  }

  if (document.exitFullscreen) {
    document.exitFullscreen().catch(() => {});
  } else {
    document.webkitExitFullscreen?.();
  }
}

function orientation() {
  return window.screen.orientation?.type ?? (window.innerWidth > window.innerHeight ? 'landscape' : 'portrait');
}

// ширина окна в физических пикселях: от масштаба страницы (Ctrl +/−) она не зависит
function windowWidth() {
  return window.innerWidth * (window.devicePixelRatio || 1);
}

// без полноэкранного режима (iPhone) проверяем хотя бы, что окно занимает весь экран по ширине
function fillsScreen() {
  const {width, height} = window.screen;
  const screenWidth = orientation().startsWith('landscape') ? Math.max(width, height) : Math.min(width, height);
  return window.innerWidth >= screenWidth * SHRINK_LIMIT;
}

export default {
  name: 'TopicTest',
  props: ['target', 'subjectLabel'],
  emits: ['close', 'open-theory'],
  data() {
    return {
      // заголовок теста от сервера; вопросы в нём появляются с началом попытки (или с разбором закрытого теста)
      test: null,
      failed: false,
      // тест не загрузился (нет связи) — в отличие от «теста нет»
      loadError: '',
      maxAttempts: MAX_ATTEMPTS,
      record: {attempts: 0, best: 0, total: 0, passed: false},
      // тест открыли, когда он уже был сдан или попытки кончились: ответов этой попытки нет
      review: false,
      // ответы не дошли до сервера — покажем это и дадим отправить ещё раз
      saveError: '',
      // чем сорвана попытка (пусто — не сорвана); ответы такой попытки не проверяем
      violation: '',
      // ученик хочет выйти посреди попытки: 'close' или 'theory', ждём подтверждения
      leaving: null,
      // почему попытку не удалось начать: второй монитор, браузер не пустил в полноэкранный режим, нет связи
      startError: '',
      // ждём от сервера вопросы новой попытки
      starting: false,
      // попытка идёт в полноэкранном режиме — выход из него срывает её
      fullscreen: false,
      // ширина и ориентация окна в начале попытки: сужение окна срывает её
      size: null,
      // номер текущей попытки — его выдаёт сервер при старте
      number: 0,
      answers: [],
      marks: [],
      stage: 'ready',
      // итог попытки пришёл от сервера: до этого ни отметок, ни балла нет
      checked: false,
      score: 0,
      // отправленная попытка; держим её, чтобы «Сохранить ещё раз» отправил ту же самую
      pending: null,
      // решения дополнительной проверки по вопросам (null — вопрос ей не отдавался)
      verdicts: [],
    };
  },
  computed: {
    // зачёт — только если все ответы верные
    pass() {
      return this.test ? this.test.count : 0;
    },
    left() {
      return attemptsLeft(this.record);
    },
    leftText() {
      return this.left === 1 ? 'Осталась ещё 1 попытка' : `Осталось ещё ${this.left} попытки`;
    },
    passed() {
      return this.stage === 'result' && this.checked && this.score >= this.pass;
    },
    // разбор показываем, когда тест сдан или попытки исчерпаны; правильные ответы сервер пришлёт только тогда же
    showAnswers() {
      return this.passed || !this.left;
    },
    locked() {
      return this.stage !== 'answering';
    },
    // идёт попытка: только в это время следим, не ушёл ли ученик из теста.
    // Попытку сервер засчитывает при старте, поэтому на последней из них left уже 0.
    answering() {
      return Boolean(this.test) && this.stage === 'answering';
    },
  },
  async created() {
    try {
      this.test = await loadTest(this.target.subject, this.target.topic);
    } catch (error) {
      this.loadError = error.message;
    }

    if (!this.test) {
      this.failed = true;
      return;
    }

    // итог свежий: сервер прислал его вместе с тестом
    this.record = readRecord(this.target.subject, this.target.topic);
    this.reset();
    trackTest(this.target.subject, this.target.topic);

    // фокус остался на кнопке «Практика» под оверлеем — забираем его в тест
    this.$nextTick(() => this.$refs.card?.focus({preventScroll: true}));

    // тест уже сдан или попытки кончились — сразу показываем итог и разбор: вопросы с ответами пришли от сервера
    if (!this.left) {
      this.answers = (this.test.questions ?? []).map(() => null);
      this.marks = (this.test.questions ?? []).map(() => '');
      this.stage = 'result';
      this.checked = true;
      this.score = this.record.best;
      this.review = true;
    }
  },
  methods: {
    reset() {
      this.answers = [];
      this.marks = [];
      this.stage = 'ready';
      this.checked = false;
      this.score = 0;
      this.violation = '';
      this.verdicts = [];
      this.saveError = '';
      this.pending = null;
    },
    // Попытку начинаем только по нажатию: браузер пускает в полноэкранный режим лишь в ответ на действие ученика.
    // Вопросы сервер отдаёт уже после всех проверок окна — и с этого момента попытка засчитана.
    async start() {
      if (this.starting) {
        return;
      }
      this.startError = '';

      if (window.screen.isExtended) {
        this.startError = 'К компьютеру подключён второй монитор. Отключите его или включите в системе режим '
            + '«Только один экран» и начните попытку снова.';
        return;
      }

      const wantsFullscreen = canFullscreen();
      if (wantsFullscreen) {
        try {
          await enterFullscreen();
        } catch {
          this.startError = 'Браузер не включил полноэкранный режим, а без него тест не начать. Попробуйте ещё раз.';
          return;
        }
        this.fullscreen = true;
      } else if (!fillsScreen()) {
        this.startError = 'Разверните окно браузера на весь экран и начните попытку снова.';
        return;
      }

      let payload;
      this.starting = true;
      try {
        payload = await startAttempt(this.target.subject, this.target.topic);
      } catch (error) {
        this.leaveFullscreen();
        this.record = readRecord(this.target.subject, this.target.topic);
        this.startError = `Не удалось начать попытку: ${error.message}`;
        return;
      } finally {
        this.starting = false;
      }

      this.record = readRecord(this.target.subject, this.target.topic);
      this.number = payload.number;
      this.test = {...this.test, questions: payload.questions};
      this.answers = payload.questions.map((question) => (question.type === 'multi' ? [] : null));
      this.marks = payload.questions.map(() => '');
      this.size = {width: windowWidth(), orientation: orientation()};
      this.stage = 'answering';
      this.$nextTick(() => this.$refs.card?.focus({preventScroll: true}));

      // пока сервер отвечал, из полноэкранного режима уже вышли — вопросы получены, попытка сгорает
      if (wantsFullscreen && !fullscreenElement()) {
        this.forfeit('во время теста вы вышли из полноэкранного режима');
      }
    },
    submit() {
      return this.finish('');
    },
    // ученик ушёл из теста посреди попытки — попытка сгорает с нулём верных
    forfeit(reason = 'во время теста вы ушли на другую вкладку или в другое окно') {
      return this.finish(reason);
    },
    // ответы проверяет сервер: отправляем их и ждём итог
    async finish(violation) {
      if (!this.answering) {
        return;
      }

      this.violation = violation;
      this.leaving = null;
      this.stage = 'checking';
      this.leaveFullscreen();

      this.pending = {
        number: this.number,
        answers: JSON.parse(JSON.stringify(this.answers)),
        violation: violation,
      };

      await this.save();
    },
    async save() {
      this.saveError = '';
      this.stage = 'checking';

      try {
        const payload = await submitAttempt(this.target.subject, this.target.topic, this.pending);
        this.adopt(payload);
      } catch (error) {
        // ответы не дошли — «Сохранить ещё раз» отправит ту же попытку заново
        this.saveError = `Ответы не проверены: ${error.message}`;
      } finally {
        this.stage = 'result';
      }
    },
    // итог попытки — с отметками по вопросам и, если тест теперь закрыт, с правильными ответами
    adopt(payload) {
      const questions = payload.attempt?.questions ?? [];

      // попытку успел закрыть сам сервер (например, тест открыли в другой вкладке) — показываем его причину
      if (payload.attempt?.violation) {
        this.violation = payload.attempt.violation;
      }

      this.record = readRecord(this.target.subject, this.target.topic);
      this.score = payload.attempt?.score ?? 0;
      this.verdicts = questions.map((question) => question.verdict ?? null);
      this.checked = true;

      // у сорванной попытки ответы не проверяются — отметок по вопросам у неё нет
      if (!this.violation) {
        this.marks = questions.map((question) => (question.right ? 'right' : 'wrong'));
      }

      this.test = {
        ...this.test,
        questions: this.test.questions.map((question, index) => (
            questions[index] && 'answer' in questions[index]
                ? {...question, answer: questions[index].answer, hint: questions[index].hint}
                : question
        )),
      };
    },
    retry() {
      this.reset();
      this.start();
    },
    leaveFullscreen() {
      this.fullscreen = false;
      this.size = null;
      exitFullscreen();
    },
    correctText(question) {
      return answerText(question);
    },
    openTheory() {
      this.requestLeave('theory');
    },
    close() {
      this.requestLeave('close');
    },
    // после проверки выходим сразу, а посреди попытки сначала предупреждаем, что она сгорит
    requestLeave(action) {
      if (!this.answering) {
        this.leave(action);
        return;
      }

      this.leaving = action;
      this.$nextTick(() => this.$refs.stay?.focus());
    },
    stay() {
      this.leaving = null;
      this.$nextTick(() => this.$refs.card?.focus({preventScroll: true}));
    },
    async confirmLeave() {
      const action = this.leaving;
      await this.forfeit('тест закрыт до проверки');

      // провал не сохранился — остаёмся, чтобы ученик увидел ошибку и сохранил ещё раз
      if (!this.saveError) {
        this.leave(action);
      }
    },
    leave(action) {
      if (action === 'theory') {
        this.$emit('open-theory', this.target);
      } else {
        this.$emit('close');
      }
    },
    handleKeydown(event) {
      if (event.key !== 'Escape') {
        return;
      }

      if (this.leaving) {
        this.stay();
      } else {
        this.close();
      }
    },
    // вкладку переключили, свернули браузер, перезагрузили или закрыли страницу
    handleVisibility() {
      if (document.hidden) {
        this.forfeit();
      }
    },
    // фокус ушёл из окна браузера: другое окно, программа, адресная строка
    handleWindowBlur(event) {
      if (event.target === window) {
        this.forfeit();
      }
    },
    // фокус перешёл на элемент страницы за пределами теста (например, адресная строка вернула его в документ);
    // клик по тексту вопроса focusin не вызывает, поэтому попытку он не срывает
    handleFocusIn(event) {
      if (!this.$refs.overlay?.contains(event.target)) {
        this.forfeit();
      }
    },
    // из полноэкранного режима вышли: Esc, F11, жест на телефоне, разделение экрана
    handleFullscreen() {
      if (this.fullscreen && !fullscreenElement()) {
        this.fullscreen = false;
        this.forfeit('во время теста вы вышли из полноэкранного режима');
      }
    },
    // окно сузили: поставили рядом другое окно, открыли боковую панель браузера или инструменты разработчика.
    // Поворот телефона ширину тоже меняет — тогда просто запоминаем новую.
    handleResize() {
      if (!this.answering || !this.size) {
        return;
      }

      const width = windowWidth();
      if (this.size.orientation !== orientation()) {
        this.size = {width, orientation: orientation()};
      } else if (width < this.size.width * SHRINK_LIMIT) {
        this.forfeit('во время теста окно с ним уменьшили');
      } else {
        // окно может дорасти до полного размера уже после начала попытки — например, при входе в полноэкранный режим
        this.size.width = Math.max(this.size.width, width);
      }
    },
    // подключили второй монитор — на нём можно держать теорию, не трогая окно с тестом
    handleScreenChange() {
      if (window.screen.isExtended) {
        this.forfeit('во время теста к компьютеру подключили второй монитор');
      }
    },
    // перезагрузку и закрытие вкладки браузер ещё раз подтвердит у ученика
    handleBeforeUnload(event) {
      if (this.answering) {
        event.preventDefault();
        event.returnValue = '';
      }
    },
    // вопросы не копируем (в поиск или чат-бот), заготовленные ответы не вставляем
    guardClipboard(event) {
      if (this.answering) {
        event.preventDefault();
      }
    },
  },
  mounted() {
    // теорию под тестом размываем, а её текст убираем из поиска по странице, Tab и экранного диктора
    const page = document.getElementById('app');
    page?.classList.add('under-test');
    page?.setAttribute('inert', '');

    window.addEventListener('keydown', this.handleKeydown);
    window.addEventListener('blur', this.handleWindowBlur);
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('beforeunload', this.handleBeforeUnload);
    window.screen.addEventListener?.('change', this.handleScreenChange);
    document.addEventListener('visibilitychange', this.handleVisibility);
    document.addEventListener('focusin', this.handleFocusIn);
    document.addEventListener('fullscreenchange', this.handleFullscreen);
    document.addEventListener('webkitfullscreenchange', this.handleFullscreen);
  },
  beforeUnmount() {
    // тест убрали с экрана в обход кнопок (сменили предмет, раздел, вышли из учётки) — попытка тоже сгорает
    this.forfeit('тест закрыт до проверки');
    this.leaveFullscreen();

    const page = document.getElementById('app');
    page?.classList.remove('under-test');
    page?.removeAttribute('inert');

    window.removeEventListener('keydown', this.handleKeydown);
    window.removeEventListener('blur', this.handleWindowBlur);
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('beforeunload', this.handleBeforeUnload);
    window.screen.removeEventListener?.('change', this.handleScreenChange);
    document.removeEventListener('visibilitychange', this.handleVisibility);
    document.removeEventListener('focusin', this.handleFocusIn);
    document.removeEventListener('fullscreenchange', this.handleFullscreen);
    document.removeEventListener('webkitfullscreenchange', this.handleFullscreen);
  },
};
</script>

<style scoped>
.test-overlay {
  position: fixed;
  inset: 0;
  z-index: 20;
  background-color: rgba(0, 0, 0, 0.55);
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

.test-card:focus {
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

/* пока идёт попытка, текст вопросов не выделяется — копировать нечего */
.guarded .questions {
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
}

.guarded .field {
  user-select: text;
  -webkit-user-select: text;
}

.start {
  margin: 0 0 4px;
  color: #444;
}

.start p {
  margin: 0 0 10px;
}

.start-error {
  padding: 8px 10px;
  border-radius: 6px;
  font-size: 14px;
  color: #8a1c1c;
  background-color: #fdecec;
}

.strict {
  display: block;
  margin-top: 4px;
  color: #a4540a;
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

.judged {
  margin: 4px 0 0;
  font-size: 14px;
  color: #555;
}

.checking {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 12px;
  color: #444;
}

.spinner {
  flex: none;
  width: 18px;
  height: 18px;
  border: 3px solid #d5e2f5;
  border-top-color: #1a63c4;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
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

.save-error {
  margin: 0 0 10px;
  padding: 8px 10px;
  border-radius: 6px;
  font-size: 13px;
  color: #8a1c1c;
  background-color: #fdecec;
}

.again {
  margin-left: 6px;
  border: none;
  background: none;
  padding: 0;
  font-size: 13px;
  color: #1a63c4;
  text-decoration: underline;
  cursor: pointer;
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

.btn.danger {
  background-color: #ffffff;
  border-color: #c62828;
  color: #c62828;
}

.leave {
  position: fixed;
  inset: 0;
  z-index: 21;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background-color: rgba(0, 0, 0, 0.35);
}

.leave-box {
  max-width: 420px;
  padding: 18px 20px;
  background-color: #ffffff;
  border-radius: 10px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}

.leave-box p {
  margin: 0 0 14px;
}

.btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

@media (max-width: 900px) {
  .test-overlay {
    padding: 10px 8px calc(10px + env(safe-area-inset-bottom));
    -webkit-overflow-scrolling: touch;
  }

  .test-card {
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

  .rules {
    margin: 10px 0 14px;
    font-size: 13px;
  }

  .questions {
    padding-left: 20px;
  }

  .questions > li {
    margin-bottom: 14px;
    padding: 8px 8px 4px;
  }

  /* вариант ответа — цель для пальца, а не для курсора */
  .answer {
    gap: 2px;
  }

  .answer label {
    align-items: flex-start;
    gap: 10px;
    padding: 7px 2px;
  }

  .answer input[type="radio"],
  .answer input[type="checkbox"] {
    flex: none;
    width: 20px;
    height: 20px;
    margin-top: 1px;
  }

  .field {
    width: 100%;
    max-width: 260px;
    padding: 9px 10px;
  }

  .unit {
    display: inline-block;
    margin: 4px 0 0 2px;
  }

  /* ссылка «Сохранить ещё раз» остаётся ссылкой, а не кнопкой в 40px */
  .again {
    min-height: 0;
  }

  .actions {
    gap: 8px;
  }

  .actions .btn {
    flex: 1 1 auto;
    min-width: 120px;
    padding: 11px 14px;
  }
}
</style>

<style>
/* страница под открытым тестом: теорию не прочитать сквозь затемнение */
#app.under-test {
  filter: blur(14px);
  user-select: none;
  -webkit-user-select: none;
}
</style>
