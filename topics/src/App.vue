<template>
  <div id="app">
    <div class="header">
      <label for="subject-select">Выбери предмет:</label>
      <select id="subject-select" v-model="selectedSubject" @change="loadTopics">
        <option v-for="subject in subjects" :key="subject.value" :value="subject.value">
          {{ subject.label }}
        </option>
      </select>
    </div>
    <div class="container">
      <sidebar-menu :topics="topics" :selected-topic="selectedTopic" @select-topic="selectTopic"></sidebar-menu>
      <content-area :content="selectedContent"></content-area>
    </div>
  </div>
</template>

<script>
import SidebarMenu from './components/SidebarMenu.vue';
import ContentArea from './components/ContentArea.vue';

export default {
  name: 'App',
  components: {
    SidebarMenu,
    ContentArea
  },
  data() {
    return {
      subjects: [
        { value: 'math', label: 'Математика 5 класс' },
        { value: 'math2', label: 'Математика 6 класс' },
        { value: 'physics', label: 'Физика 6 класс' },
        { value: 'informatics', label: 'Информатика 6 класс' },
      ],
      selectedSubject: 'math2',
      topics: [],
      selectedContent: null,
      selectedTopic: null
    };
  },
  methods: {
    async loadTopics() {
      this.selectedContent = null;
      this.selectedTopic = null;

      if (this.selectedSubject === 'math') {
        const { default: topic } = await import('../data/math');
        this.topics = topic;
      } else if (this.selectedSubject === 'math2') {
        const { default: topic } = await import('../data/math2');
        this.topics = topic;
      } else if (this.selectedSubject === 'physics') {
        const { default: topic } = await import('../data/physics');
        this.topics = topic;
      } else if (this.selectedSubject === 'informatics') {
        const { default: topic } = await import('../data/informatics');
        this.topics = topic;
      }
    },
    selectTopic(content, topicTitle) {
      this.selectedContent = content;
      this.selectedTopic = topicTitle;
    }
  },
  created() {
    this.loadTopics();
  }
};
</script>

<style>
.container {
  display: flex;
  font-family: Verdana, Geneva, sans-serif;
}
</style>
