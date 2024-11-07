<template>
  <div class="header">
    <nav class="main-menu">
      <ul>
        <li :class="{ active: selectedSection === 'Учебники' }" @click="selectSection('Учебники')">Учебники</li>
        <li :class="{ active: selectedSection === 'Таблица умножения' }" @click="selectSection('Таблица умножения')">Таблица умножения</li>
        <li :class="{ active: selectedSection === 'Задачи' }" @click="selectSection('Задачи')">Задачи</li>
        <li :class="{ active: selectedSection === 'Python' }" @click="selectSection('Python')">Python</li>
      </ul>
    </nav>
    <label for="subject-select">Выбери предмет:</label>
    <select id="subject-select" v-model="selectedSubject" @change="loadTopics">
      <option v-for="subject in subjects" :key="subject.value" :value="subject.value">
        {{ subject.label }}
      </option>
    </select>
  </div>
</template>

<script>
export default {
  name: 'HeaderMenu',
  props: ['selectedSection', 'selectedSubject', 'subjects'],
  methods: {
    selectSection(section) {
      this.$emit('update:selectedSection', section);
    },
    loadTopics() {
      this.$emit('load-topics');
    }
  }
};
</script>

<style>
.main-menu {
  background-color: #333;
  color: white;
  padding: 10px;
}

.main-menu ul {
  list-style: none;
  display: flex;
  padding: 0;
  margin: 0;
}

.main-menu li {
  margin-right: 20px;
  cursor: pointer;
}

.main-menu li.active {
  font-weight: bold;
  text-decoration: underline;
}
</style>
