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
    @open-practice="practice = practiceTarget.opens ? null : practiceTarget"
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
import SidebarMenu from '@/components/SidebarMenu.vue';
import ContentArea from '@/components/ContentArea.vue';
import TopicTest from '@/views/TopicTest.vue';
import { loadTestKeys, testKey } from '@/tests.js';
import { trackTheory } from '@/history.js';
import program from '@/../data/seven/progress.json';
import { opensOn, startOfDay, themeStarts } from '@/schedule.js';
import {
  defaultSubject,
  findSubject,
  loadSubject,
  rememberSubject,
  restoreSubject,
  subjectInGrade,
} from '@/subjects.js';

const starts = themeStarts(program);

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
    // тест привязан к теме конспекта; если его нет — кнопки «Практика» тоже нет.
    // Тему по программе можно сдать не раньше чем за неделю до её недели: opens — когда откроется
    practiceTarget() {
      if (!this.selectedTopic) {
        return null;
      }

      const key = testKey(this.selectedSubject, this.selectedTopic);
      if (!this.testKeys.has(key)) {
        return null;
      }

      const opens = starts.has(key) ? opensOn(starts.get(key)) : null;
      return {
        subject: this.selectedSubject,
        topic: this.selectedTopic,
        opens: opens && opens > startOfDay(new Date()) ? opens : null,
      };
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
      // повторный клик по уже открытой теме в историю не пишем
      if (title !== this.selectedTopic) {
        trackTheory(this.selectedSubject, title);
      }

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
  },
};
</script>
