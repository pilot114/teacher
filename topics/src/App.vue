<template>
  <div id="app">
    <header-menu
      :selected-section="selectedSection"
      @update:selectedSection="selectSection"
    ></header-menu>
    <div class="container" v-if="selectedSection === 'Учебники'">
      <Topics/>
    </div>
    <div class="container" v-if="selectedSection === 'Таблица умножения'">
      в разработке
    </div>
    <div class="container" v-if="selectedSection === 'Задачи'">
      <Solver/>
    </div>
    <div class="container" v-if="selectedSection === 'Python'">
      в разработке
    </div>
  </div>
</template>

<script>
import 'modern-normalize';
import HeaderMenu from './components/HeaderMenu.vue';
import Solver from "@/components/Solver.vue";
import Topics from "@/views/Topics.vue";

export default {
  name: 'App',
  components: {
    Topics,
    Solver,
    HeaderMenu,
  },
  data() {
    return {
      selectedSection: 'Учебники'
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
</style>
