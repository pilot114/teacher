<template>
  <div class="sidebar" :class="{collapsed: isMobile && !open}">
    <button
        type="button"
        class="sidebar-toggle"
        :aria-expanded="String(open)"
        @click="open = !open"
    >
      <span class="toggle-label">{{ selectedTopic || 'Оглавление' }}</span>
      <span class="chevron" :class="{up: open}"></span>
    </button>

    <div class="sidebar-body">
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
          <div class="topic-title" @click="toggle(topic)">
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
  </div>
</template>

<script>
import {grades, subjectsForGrade} from "@/subjects.js";
import {isMobile} from "@/viewport.js";

export default {
  name: 'SidebarMenu',
  props: ['topics', 'selectedTopic', 'selectedSubject', 'selectedGrade'],
  data() {
    return {
      grades: grades,
      // на телефоне дерево закрыто, пока тема выбрана: иначе конспект уезжает на второй экран
      open: !isMobile.value || !this.selectedTopic,
    };
  },
  computed: {
    isMobile() {
      return isMobile.value;
    },
    gradeSubjects() {
      return subjectsForGrade(this.selectedGrade);
    },
  },
  watch: {
    isMobile(value) {
      this.open = !value;
    },
    // тему открыли (в том числе переходом из «Прогресса») — прячем дерево;
    // сменили предмет — показываем, выбирать всё равно заново
    selectedTopic(value) {
      if (this.isMobile) {
        this.open = !value;
      }
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
      if (this.isMobile) {
        this.open = false;
      }
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

.sidebar-toggle {
  display: none;
}

@media (max-width: 900px) {
  .sidebar {
    width: auto;
    margin: -10px -12px 12px;
    border-right: none;
    border-bottom: 1px solid #ccc;
  }

  .sidebar-toggle {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 11px 14px;
    border: none;
    border-bottom: 1px solid #dcdcdc;
    background-color: #f0f0f0;
    font-weight: bold;
    text-align: left;
    cursor: pointer;
  }

  .toggle-label {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .chevron {
    flex: none;
    width: 9px;
    height: 9px;
    margin-top: -4px;
    border-right: 2px solid #666;
    border-bottom: 2px solid #666;
    transform: rotate(45deg);
    transition: transform 0.2s;
  }

  .chevron.up {
    margin-top: 4px;
    transform: rotate(-135deg);
  }

  .collapsed .sidebar-body {
    display: none;
  }

  /* длинный список тем не должен отодвигать конспект за горизонт */
  .sidebar-body {
    max-height: 60vh;
    padding-bottom: 6px;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }

  .selectors {
    flex-direction: row;
    padding: 10px 14px;
  }

  .selectors select {
    flex: 1;
    min-width: 0;
  }

  .sidebar li {
    padding: 9px 14px;
  }

  .topic-title {
    font-weight: bold;
  }
}
</style>
