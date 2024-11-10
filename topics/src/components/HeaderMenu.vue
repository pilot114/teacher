<template>
  <div class="header">
    <nav class="main-menu">
      <ul>
        <li :class="{ active: selectedSection === 'Учебники' }" @click="selectSection('Учебники')">Учебники</li>
        <li :class="{ active: selectedSection === 'Таблица умножения' }" @click="selectSection('Таблица умножения')">Таблица умножения</li>
        <li :class="{ active: selectedSection === 'Задачи' }" @click="selectSection('Задачи')">Задачи</li>
        <li :class="{ active: selectedSection === 'Python' }" @click="selectSection('Python')">Python</li>
        <li :class="{ active: selectedSection === 'Стихи' }" @click="selectSection('Стихи')">Стихи</li>
        <li :class="{ active: selectedSection === 'Успеваемость' }" @click="selectSection('Успеваемость')">Успеваемость</li>
      </ul>
    </nav>
  </div>
</template>

<script>
export default {
  name: 'HeaderMenu',
  props: ['selectedSection'],
  methods: {
    selectSection(section) {
      this.$emit('update:selectedSection', section);
    },
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
