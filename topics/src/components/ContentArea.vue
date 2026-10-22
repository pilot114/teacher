<template>
  <div class="content-area">
    <div v-if="content">
      <div class="content-head">
        <div>
          <h1>
            {{ content.title }}
          </h1>
          <p class="title-ru" v-if="content.titleRu">
            {{ content.titleRu }}
          </p>
        </div>
        <div class="practice" v-if="practice">
          <button type="button" class="practice-btn" @click="$emit('open-practice')">Практика</button>
          <span class="practice-hint">Тест по теме, {{ maxAttempts }} попытки</span>
        </div>
      </div>
      <div class="columns">
        <div class="description">
          <h2>Краткое содержание</h2>
          <div v-html="content.description"></div>
        </div>
        <div class="tasks" v-if="content.tasks">
          <h2>Задания для самопроверки</h2>
          <ol>
            <template v-if="viewAnswers">
              <li v-for="(task, index) in content.tasks" :key="index" v-html="task.question + task.answer"></li>
            </template>
            <template v-else>
              <li v-for="(task, index) in content.tasks" :key="index" v-html="task.question ?? task"></li>
            </template>
          </ol>
        </div>
      </div>
    </div>
    <div v-else>
      <p>
        <ScatterText> Пожалуйста, выберите тему из меню. </ScatterText>
      </p>
    </div>
  </div>
</template>

<script>
import ScatterText from './ScatterText.vue';
import { MAX_ATTEMPTS } from '@/tests.js';

export default {
  components: {
    ScatterText,
  },
  name: 'ContentArea',
  props: ['content', 'practice'],
  emits: ['open-practice'],
  data() {
    return {
      inputSequence: '',
      viewAnswers: false,
      maxAttempts: MAX_ATTEMPTS,
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
    },
  },
};
</script>

<style>
.content-area {
  flex: 1;
  padding: 20px;
}

.content-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 16px;
}

.content-head h1 {
  margin: 0;
}

.content-area .title-ru {
  margin: 4px 0 0;
  color: #777;
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

.practice {
  display: flex;
  flex: none;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.practice-btn {
  padding: 8px 20px;
  border-radius: 6px;
  border: 1px solid #1a63c4;
  background-color: #1a63c4;
  color: #ffffff;
  cursor: pointer;
}

.practice-btn:hover {
  background-color: #1755a8;
}

.practice-hint {
  font-size: 12px;
  color: #999;
}

@media (max-width: 900px) {
  .content-area {
    flex: none;
    width: 100%;
    min-width: 0;
    padding: 4px 0 24px;
  }

  .columns {
    flex-direction: column;
    gap: 8px;
  }

  .description,
  .tasks {
    margin-right: 0;
  }

  .content-head {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    margin-bottom: 12px;
  }

  .practice {
    flex-direction: row;
    align-items: center;
    gap: 10px;
  }

  .practice-btn {
    padding: 10px 20px;
  }

  .tasks ol {
    padding-left: 18px;
  }

  /* в конспектах попадаются широкие таблицы и формулы — им отдельная прокрутка */
  .content-area table {
    display: block;
    width: max-content;
    max-width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .content-area pre {
    overflow-x: auto;
  }

  .content-area img {
    max-width: 100%;
    height: auto;
  }
}
</style>
