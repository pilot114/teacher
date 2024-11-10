<template>
  <button v-if="mode==='START'" @click="start">
    Начать
  </button>
  <div v-if="mode==='TASK'">
    <div id="status">
      {{ status }}
    </div>
    <div>
      <h3>{{ task.title }}</h3>
      <i> Баллов за решение: {{ task.complexity }} </i>
      <p>
        {{ task.question }}
      </p>
    </div>
    <div>
      <input
          v-model="answer"
          type="text"
          @keyup.enter="next"
      />
    </div>
  </div>
  <div v-if="mode==='END'">
    <h2>{{ progress }}</h2>
    <button @click="start">
      Ещё раз
    </button>
  </div>
</template>

<script>
import {ref} from "vue";
import { generateTask } from '@/tasks';

export default {
  // eslint-disable-next-line vue/multi-word-component-names
  name: 'Solver',
  setup() {
    let task = ref(null)
    let answer = ref(null)
    let totalTaskCount = ref(0)
    let successTaskCount = ref(0)
    let points = ref(0)
    let timer = ref(0)

    let mode = ref('START')

    return {
      task,
      answer,
      totalTaskCount,
      successTaskCount,
      points,
      timer,
      mode,
    }
  },
  methods: {
    start() {
      this.task = generateTask();
      this.timer = 5 * 60;
      this.mode = 'TASK';
      this.points = 0;
      this.totalTaskCount = 0;
      this.successTaskCount = 0;

      const id = setInterval(() => {
        this.timer--;
        if (!this.timer) {
          this.mode = 'END';
          clearInterval(id);
        }
      }, 1000);
    },
    next() {
      this.totalTaskCount++;
      if (this.task.answer === Number(this.answer)) {
        this.successTaskCount++;
        this.points += this.task.complexity;
      }
      this.answer = null;
      this.task = generateTask();
    },
  },
  computed: {
    progress() {
      const progress = this.successTaskCount + '/' + this.totalTaskCount;
      return `Прогресс: ${progress}, Баллов: ${this.points}`;
    },
    status() {
      const minutes = Math.floor(this.timer / 60);
      let seconds = String(this.timer - minutes * 60);
      if (seconds.length === 0) {
        seconds = '0'+seconds;
      }
      return `Баллов: ${this.points}, таймер: ${minutes}:${seconds}`;
    },
  },
};
</script>

<style scoped>
#status {
  background-color: black;
  color: white;
  padding: 10px;
  border-radius: 5px;
}

button {
  background: linear-gradient(to bottom, #3498db, #2980b9);
  border: none;
  color: #fff;
  padding: 10px 20px;
  border-radius: 5px;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.3s, transform 0.2s;
}

button:hover {
  background: linear-gradient(to bottom, #2980b9, #3498db);
}

input[type="text"] {
  padding: 8px;
  margin-right: 8px;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-size: 16px;
}

input[type="text"]:focus {
  border-color: #3498db;
}
</style>