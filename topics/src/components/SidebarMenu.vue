<template>
  <div class="sidebar">
    <ul>
      <li v-for="topic in topics" :key="topic.title">
        <div @click="toggle(topic)">
          {{ topic.title }}
        </div>
        <ul v-if="topic.subtopics && topic.expanded">
          <li
              v-for="subtopic in topic.subtopics"
              :key="subtopic.title"
              @click="select(subtopic, subtopic.title, $event)"
              :class="{ active: isActive(subtopic.title) }"
          >
            {{ subtopic.title }}
          </li>
        </ul>
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  name: 'SidebarMenu',
  props: ['topics', 'selectedTopic'],
  methods: {
    toggle(topic) {
      topic.expanded = !topic.expanded;
    },
    select(subtopic, title, event) {
      event.stopPropagation(); // Предотвращаем всплытие события
      this.$emit('select-topic', subtopic.content, title);
    },
    isActive(title) {
      return this.selectedTopic === title;
    }
  }
};
</script>

<style>
.sidebar {
  width: 250px;
  border-right: 1px solid #ccc;
  background-color: #f0f0f0;
}
.sidebar ul {
  list-style: none;
  padding: 0;
}
.sidebar li {
  cursor: pointer;
  padding: 5px 10px;
}
.sidebar li.active {
  background-color: #d0e4fe; /* Цвет выделения выбранного подпункта */
}
</style>