<template>
  <div class="header">
    <nav class="main-menu">
      <ul>
        <li
            v-for="section in sections"
            :key="section"
            :class="{ active: selectedSection === section }"
            @click="selectSection(section)"
        >
          {{ section }}
        </li>
      </ul>
    </nav>
    <nav class="sub-menu" v-if="selectedSection === 'Практика'">
      <ul>
        <li
            v-for="section in practiceSections"
            :key="section"
            :class="{ active: selectedPractice === section }"
            @click="selectPractice(section)"
        >
          {{ section }}
        </li>
      </ul>
    </nav>
  </div>
</template>

<script>
import {practiceSections, sections} from "@/sections.js";

export default {
  name: 'HeaderMenu',
  props: ['selectedSection', 'selectedPractice'],
  data() {
    return {
      sections: sections,
      practiceSections: practiceSections,
    };
  },
  methods: {
    selectSection(section) {
      this.$emit('update:selectedSection', section);
    },
    selectPractice(section) {
      this.$emit('update:selectedPractice', section);
    },
  }
};
</script>

<style>
.sub-menu {
  background-color: #f0f0f0;
  border-bottom: 1px solid #ccc;
  padding: 8px 10px;
}

.sub-menu ul {
  list-style: none;
  display: flex;
  padding: 0;
  margin: 0;
}

.sub-menu li {
  margin-right: 20px;
  cursor: pointer;
  color: #333;
}

.sub-menu li.active {
  font-weight: bold;
  text-decoration: underline;
}

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
