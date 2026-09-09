<template>
  <sidebar-menu
      :topics="topics"
      :selected-topic="selectedTopic"
      :selected-subject="selectedSubject"
      :selected-grade="selectedGrade"
      @select-topic="selectTopic"
      @select-grade="selectGrade"
      @load-topics="loadTopics"
  ></sidebar-menu>
  <content-area
      :content="selectedContent"
      :practice="practiceTarget"
      @open-practice="practice = practiceTarget"
  ></content-area>

  <TopicTest
      v-if="practice"
      :target="practice"
      :subject-label="currentSubject.label"
      @close="practice = null"
      @open-theory="practice = null"
  />
</template>

<script>

import SidebarMenu from "@/components/SidebarMenu.vue";
import ContentArea from "@/components/ContentArea.vue";
import TopicTest from "@/views/TopicTest.vue";
import {loadTestKeys, testKey} from "@/tests.js";
import {
  defaultSubject,
  findSubject,
  loadSubject,
  rememberSubject,
  restoreSubject,
  subjectInGrade,
} from "@/subjects.js";

export default {
  name: 'App',
  components: {
    SidebarMenu,
    ContentArea,
    TopicTest,
  },
  props: ['target'],
  data() {
    return {
      selectedSubject: restoreSubject(),
      topics: [],

      selectedContent: null,
      selectedTopic: null,

      testKeys: new Set(),
      practice: null,
    };
  },
  computed: {
    currentSubject() {
      return findSubject(this.selectedSubject) ?? findSubject(defaultSubject);
    },
    selectedGrade() {
      return this.currentSubject.grade;
    },
    // тест привязан к теме конспекта; если его нет — кнопки «Практика» тоже нет
    practiceTarget() {
      if (!this.selectedTopic) {
        return null;
      }

      const target = {subject: this.selectedSubject, topic: this.selectedTopic};
      return this.testKeys.has(testKey(target.subject, target.topic)) ? target : null;
    },
  },
  methods: {
    async loadTopics(selectedSubject) {
      if (selectedSubject) {
        this.selectedSubject = selectedSubject;
      }
      rememberSubject(this.selectedSubject);

      this.selectedContent = null;
      this.selectedTopic = null;
      this.practice = null;

      this.topics = await loadSubject(this.selectedSubject);
      this.testKeys = await loadTestKeys(this.selectedSubject.split('/')[0]);
    },
    selectGrade(grade) {
      this.loadTopics(subjectInGrade(grade, this.currentSubject.id));
    },
    selectTopic(content, title) {
      this.selectedContent = content;
      this.selectedTopic = title;
    },
    async openTarget(target) {
      await this.loadTopics(target.subject);

      for (const topic of this.topics) {
        const subtopic = (topic.subtopics ?? []).find((item) => item.title === target.topic);
        if (subtopic) {
          topic.expanded = true;
          this.selectTopic(subtopic.content, subtopic.title);
          return;
        }
      }
    },
  },
  created() {
    if (this.target) {
      this.openTarget(this.target);
    } else {
      this.loadTopics();
    }
  }
}
</script>
