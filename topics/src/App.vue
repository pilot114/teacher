<template>
  <div id="app">
    <header-menu
      :selected-section="selectedSection"
      :selected-practice="selectedPractice"
      @update:selectedSection="selectSection"
      @update:selectedPractice="selectPractice"
    ></header-menu>
    <div class="container">
      <Topics  v-if="selectedSection === 'Учебники'" :target="topicsTarget"/>
      <Progress v-if="selectedSection === 'Прогресс'" @open-theory="openTheory"/>
      <template v-if="selectedSection === 'Практика'">
        <MultiplicationTrainer v-if="selectedPractice === 'Таблица умножения'"/>
        <Solver v-if="selectedPractice === 'Задачи'"/>
        <CodeExecutor v-if="selectedPractice === 'Программирование'"/>
        <PoetryList v-if="selectedPractice === 'Стихи'"/>
      </template>
      <StudyPerf v-if="selectedSection === 'Успеваемость'"/>
    </div>
  </div>
</template>

<script>
import 'modern-normalize';
import HeaderMenu from './components/HeaderMenu.vue';

import Solver from "@/views/Solver.vue";
import MultiplicationTrainer from "@/views/MultiplicationTrainer.vue";
import Topics from "@/views/Topics.vue";
import PoetryList from "@/views/PoetryList.vue";
import StudyPerf from "@/views/StudyPerf.vue";
import CodeExecutor from "@/views/CodeExecutor.vue";
import Progress from "@/views/Progress.vue";
import {
  rememberPractice,
  rememberSection,
  restorePractice,
  restoreSection,
} from "@/sections.js";

export default {
  name: 'App',
  components: {
    CodeExecutor,
    Progress,
    Topics,
    Solver,
    HeaderMenu,
    MultiplicationTrainer,
    PoetryList,
    StudyPerf,
  },
  data() {
    return {
      selectedSection: restoreSection(),
      selectedPractice: restorePractice(),
      topicsTarget: null,
    };
  },
  watch: {
    selectedSection: rememberSection,
    selectedPractice: rememberPractice,
  },
  methods: {
    selectSection(section) {
      this.topicsTarget = null;
      this.selectedSection = section;
    },
    selectPractice(section) {
      this.selectedPractice = section;
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

[v-cloak] {
  display: none;
}

pre {
  margin: 0;
  padding: 0;
  font-family: 'Calibri', sans-serif;
}
</style>
