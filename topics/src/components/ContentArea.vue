<template>
  <div class="content-area">
    <div v-if="content">
      <h2>{{ content.title }}</h2>
      <div class="columns">
        <div class="description">
          <div v-html="content.description"></div>
        </div>
        <div class="tasks" v-if="content.tasks">
          <h3>Задания для самопроверки</h3>
          <ol>
            <template v-if="viewAnswers">
              <li
                  v-for="(task, index) in content.tasks"
                  :key="index"
                  v-html="task.question + task.answer"
              >
              </li>
            </template>
            <template v-else>
              <li
                  v-for="(task, index) in content.tasks"
                  :key="index"
                  v-html="task.question ?? task"
              >
              </li>
            </template>
          </ol>
        </div>
      </div>
    </div>
    <div v-else>
      <p>Пожалуйста, выберите тему из меню.</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ContentArea',
  props: ['content'],
  data() {
    return {
      inputSequence: '',
      viewAnswers: false,
    };
  },
  mounted() {
    window.addEventListener('keydown', this.handleKeydown);
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this.handleKeydown);
  },
  methods: {
    handleKeydown(event) {
      this.viewAnswers = false;
      this.inputSequence += event.key;
      if (this.inputSequence.includes('iddqd')) {
        this.viewAnswers = true;
        this.inputSequence = '';
      }
      if (this.inputSequence.length > 5) {
        this.inputSequence = this.inputSequence.slice(-5);
      }
    }
  }
};
</script>

<style>
.content-area {
  flex: 1;
  padding: 20px;
}

.columns {
  display: flex;
  flex-direction: row;
}

.description {
  flex: 1;
  margin-right: 20px;
}

.tasks {
  flex: 1;
}

.tasks h3 {
  margin-top: 0;
}

.tasks ol {
  padding-left: 20px;
}

@media (max-width: 800px) {
  .columns {
    flex-direction: column;
  }
  .description, .tasks {
    margin-right: 0;
  }
}
</style>
