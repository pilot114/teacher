<template>
  <div id="app">
    <LoginForm v-if="!user" @signed-in="signedIn"/>
    <template v-else>
      <header-menu
        :selected-section="selectedSection"
        :selected-practice="selectedPractice"
        :user="user"
        @update:selectedSection="selectSection"
        @update:selectedPractice="selectPractice"
        @sign-out="signOut"
      ></header-menu>
      <div class="container" v-if="ready">
        <Topics  v-if="selectedSection === 'Учебники'" :target="topicsTarget"/>
        <ProgressView v-if="selectedSection === 'Прогресс'" @open-theory="openTheory"/>
        <template v-if="selectedSection === 'Практика'">
          <MultiplicationTrainer v-if="selectedPractice === 'Таблица умножения'" @start="startPractice"/>
          <Solver v-if="selectedPractice === 'Задачи'" @start="startPractice"/>
          <CodeExecutor v-if="selectedPractice === 'Программирование'" @start="startPractice"/>
          <PoetryList v-if="selectedPractice === 'Стихи'" @start="startPractice"/>
          <GardenBeds v-if="selectedPractice === 'Эффективность обучения'"/>
        </template>
        <StudentHistory v-if="selectedSection === 'История'" :user="user" @open-theory="openTheory"/>
      </div>
      <p class="boot" v-else-if="loading">Загружаю прогресс…</p>
      <div class="boot" v-else>
        <p class="boot-error">{{ error }}</p>
        <button type="button" @click="start">Повторить</button>
      </div>
    </template>
  </div>
</template>

<script>
import 'modern-normalize';
import HeaderMenu from './components/HeaderMenu.vue';
import LoginForm from './components/LoginForm.vue';

import Solver from "@/views/Solver.vue";
import MultiplicationTrainer from "@/views/MultiplicationTrainer.vue";
import Topics from "@/views/Topics.vue";
import PoetryList from "@/views/PoetryList.vue";
import CodeExecutor from "@/views/CodeExecutor.vue";
import ProgressView from "@/views/Progress.vue";
import StudentHistory from "@/views/StudentHistory.vue";
import GardenBeds from "@/views/GardenBeds.vue";
import {
  rememberPractice,
  rememberSection,
  restorePractice,
  restoreSection,
} from "@/sections.js";
import {currentUser, logout} from "@/auth.js";
import {endSession, startSession} from "@/progress.js";
import {trackPractice} from "@/history.js";

export default {
  name: 'App',
  components: {
    CodeExecutor,
    GardenBeds,
    StudentHistory,
    LoginForm,
    ProgressView,
    Topics,
    Solver,
    HeaderMenu,
    MultiplicationTrainer,
    PoetryList,
  },
  data() {
    return {
      selectedSection: restoreSection(),
      selectedPractice: restorePractice(),
      topicsTarget: null,
      // вход мог сохраниться с прошлого раза — тогда сразу тянем прогресс
      user: currentUser(),
      ready: false,
      loading: false,
      error: '',
    };
  },
  watch: {
    selectedSection: rememberSection,
    selectedPractice: rememberPractice,
  },
  created() {
    window.addEventListener('teacher:signed-out', this.forgetSession);
    window.addEventListener('popstate', this.followLocation);

    if (this.user) {
      this.start();
    }
  },
  beforeUnmount() {
    window.removeEventListener('teacher:signed-out', this.forgetSession);
    window.removeEventListener('popstate', this.followLocation);
  },
  methods: {
    // после входа забираем прогресс с сервера
    async start() {
      this.loading = true;
      this.error = '';

      try {
        await startSession();
        this.ready = true;
      } catch (error) {
        this.ready = false;
        this.error = error.message;
      } finally {
        this.loading = false;
      }
    },
    signedIn(user) {
      this.user = user;
      this.start();
    },
    signOut() {
      logout();
      this.forgetSession();
    },
    forgetSession() {
      endSession();
      this.user = null;
      this.ready = false;
      this.error = '';
    },
    // кнопки браузера «Назад» и «Вперёд» между /history и остальными разделами
    followLocation() {
      this.topicsTarget = null;
      this.selectedSection = restoreSection();
    },
    selectSection(section) {
      this.topicsTarget = null;
      this.selectedSection = section;
    },
    selectPractice(section) {
      this.selectedPractice = section;
    },
    // в историю попадает не открытие раздела практики, а нажатие «Начать» в нём
    startPractice() {
      trackPractice(this.selectedPractice);
    },
    openTheory(target) {
      this.topicsTarget = target;
      this.selectedSection = 'Учебники';
    }
  },
};
</script>

<style>
* {
  font-family: 'Calibri', sans-serif;
  font-size: 16px;
}

html {
  /* iOS не должен самовольно увеличивать шрифт при повороте экрана */
  -webkit-text-size-adjust: 100%;
}

body {
  -webkit-tap-highlight-color: rgba(26, 99, 196, 0.15);
  overflow-x: hidden;
}

h1 {
  font-size: 22px;
}
h2 {
  font-size: 20px;
}
h3 {
  font-size: 18px;
}

.container {
  display: flex;
  font-family: 'Calibri', sans-serif;
  padding: 10px 20px;
}

.boot {
  padding: 40px 20px;
  color: #666;
}

.boot-error {
  margin: 0 0 12px;
  color: #8a1c1c;
}

.boot button {
  padding: 7px 16px;
  border: 1px solid #1a63c4;
  border-radius: 6px;
  background-color: #1a63c4;
  color: #ffffff;
  cursor: pointer;
}

[v-cloak] {
  display: none;
}

pre {
  margin: 0;
  padding: 0;
  font-family: 'Calibri', sans-serif;
}

/* --- мобильная вёрстка --- */
@media (max-width: 900px) {
  .container {
    flex-direction: column;
    padding: 10px 12px env(safe-area-inset-bottom);
    min-width: 0;
  }

  h1 {
    font-size: 20px;
  }
  h2 {
    font-size: 18px;
  }
  h3 {
    font-size: 17px;
  }

  /* пальцем в 30-пиксельную кнопку не попасть */
  button,
  select,
  input[type="text"],
  input[type="number"],
  input[type="password"] {
    min-height: 40px;
  }

  .boot {
    padding: 30px 4px;
  }
}
</style>