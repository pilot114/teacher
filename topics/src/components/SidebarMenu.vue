<template>
  <div class="sidebar">
    <div class="selectors">
      <select id="grade-select" :value="selectedGrade" @change="selectGrade(Number($event.target.value))">
        <option v-for="grade in grades" :key="grade" :value="grade">
          {{ grade }} класс
        </option>
      </select>
      <select id="subject-select" :value="selectedSubject" @change="load($event.target.value)">
        <option v-for="subject in gradeSubjects" :key="subject.value" :value="subject.value">
          {{ subjectLabel(subject) }}
        </option>
      </select>
    </div>
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
import {grades, subjectsForGrade} from "@/subjects.js";

export default {
  name: 'SidebarMenu',
  props: ['topics', 'selectedTopic', 'selectedSubject', 'selectedGrade'],
  data() {
    return {
      grades: grades,
    };
  },
  computed: {
    gradeSubjects() {
      return subjectsForGrade(this.selectedGrade);
    },
  },
  methods: {
    subjectLabel(subject) {
      return subject.label === subject.labelRu
          ? subject.label
          : `${subject.label} (${subject.labelRu})`;
    },
    selectGrade(grade) {
      this.$emit('select-grade', grade);
    },
    toggle(topic) {
      topic.expanded = !topic.expanded;
    },
    select(subtopic, title, event) {
      event.stopPropagation();
      this.$emit('select-topic', subtopic.content, title);
    },
    load(subject) {
      this.$emit('load-topics', subject);
    },
    isActive(title) {
      return this.selectedTopic === title;
    }
  }
};
</script>

<style scoped>
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

.selectors {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
}

select {
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-size: 16px;
  background: white;
}
</style>