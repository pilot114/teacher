<template>
  <div class="sidebar">
    <select id="subject-select" v-model="selectedSubject" @change="load">
      <option v-for="subject in subjects" :key="subject.value" :value="subject.value">
        {{ subject.label }}
      </option>
    </select>
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
  data() {
    return {
      subjects: [
        { value: 'math', label: 'Математика 5 класс' },
        { value: 'math2', label: 'Математика 6 класс' },
        { value: 'physics', label: 'Физика 6 класс' },
        { value: 'informatics', label: 'Информатика 6 класс' },
      ],
      selectedSubject: 'math2',
    };
  },
  methods: {
    toggle(topic) {
      topic.expanded = !topic.expanded;
    },
    select(subtopic, title, event) {
      event.stopPropagation();
      this.$emit('select-topic', subtopic.content, title);
    },
    load() {
      this.$emit('load-topics', this.selectedSubject);
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
  background-color: #d0e4fe;
}

select {
  padding: 8px;
  margin-left: 32px;
  margin-top: 8px;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-size: 16px;
  background: white;
}
</style>