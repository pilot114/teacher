<template>
  <div id="app">
    <header-menu
      :selected-section="selectedSection"
      @update:selectedSection="selectSection"
    ></header-menu>
    <div class="container">
      <Topics  v-if="selectedSection === 'Учебники'"/>
      <MultiplicationTrainer v-if="selectedSection === 'Таблица умножения'"/>
      <Solver v-if="selectedSection === 'Задачи'"/>
      <CodeExecutor v-if="selectedSection === 'Code'"/>
      <PoetryList v-if="selectedSection === 'Стихи'"/>
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

export default {
  name: 'App',
  components: {
    CodeExecutor,
    Topics,
    Solver,
    HeaderMenu,
    MultiplicationTrainer,
    PoetryList,
    StudyPerf,
  },
  data() {
    return {
      selectedSection: 'Code'
    };
  },
  methods: {
    selectSection(section) {
      this.selectedSection = section;
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
  font-family: Verdana, Geneva, sans-serif;
  padding: 10px 20px;
}

[v-cloak] {
  display: none;
}

pre {
  margin: 0;
  padding: 0;
}
</style>
