<template>
  <div id="app">
    <header-menu
      :selected-section="selectedSection"
      :selected-subject="selectedSubject"
      :subjects="subjects"
      @update:selectedSection="selectSection"
      @load-topics="loadTopics"
    ></header-menu>
    <div class="container">
      <sidebar-menu :topics="topics" :selected-topic="selectedTopic" @select-topic="selectTopic"></sidebar-menu>
      <content-area :content="selectedContent"></content-area>
    </div>
  </div>
</template>

<script>
import SidebarMenu from './components/SidebarMenu.vue';
import HeaderMenu from './components/HeaderMenu.vue';
import ContentArea from './components/ContentArea.vue';

export default {
  name: 'App',
  components: {
    SidebarMenu,
    HeaderMenu
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
      selectedTopic: null,
      selectedSection: 'Учебники'
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
    },
    selectSection(section) {
      this.selectedSection = section;
      // Add logic here to handle section changes if needed
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
