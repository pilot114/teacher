<template>
  <button v-show="isStart" @click="start">Начать</button>
  <div v-show="!isStart" id="container">
    <div id="question">{{ questionText }}</div>
    <input type="number" id="inputAnswer" v-model.number="userAnswer" @keypress.enter="checkAnswer" ref="inputAnswer" />
    <button @click="checkAnswer" :disabled="isDisabled">Проверить</button>
    <div id="message">{{ message }}</div>
    <div id="stats">
      <h3>Статистика</h3>
      <div class="stats-scroll">
        <table>
          <thead>
            <tr>
              <th>Пример</th>
              <th>Правильных</th>
              <th>Попыток</th>
              <th>Среднее время (сек)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(stat, key) in sortedStats" :key="key" :class="getClassForStat(stat)">
              <td>{{ formatKey(key) }}</td>
              <td>{{ stat.correct }}</td>
              <td>{{ stat.attempts }}</td>
              <td>{{ (stat.averageTime / 1000).toFixed(2) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MultiplicationTrainer',
  emits: ['start'],
  data() {
    return {
      a: null,
      b: null,
      startTime: null,
      userAnswer: '',
      message: '',
      stats: {},
      isDisabled: false,
      msOnAnswer: 10000,
      isStart: true,
    };
  },
  computed: {
    questionText() {
      return this.isDisabled ? 'Поздравляем! Вы выучили всю таблицу умножения.' : `${this.a} × ${this.b} = `;
    },
    sortedStats() {
      return Object.keys(this.stats)
        .sort((a, b) => {
          const [a1, a2] = a.split('x').map(Number);
          const [b1, b2] = b.split('x').map(Number);
          return a1 - b1 || a2 - b2;
        })
        .reduce((acc, key) => {
          acc[key] = this.stats[key];
          return acc;
        }, {});
    },
  },
  methods: {
    start() {
      this.isStart = false;
      this.$emit('start');
    },
    generateQuestion() {
      const learnedExamples = Object.keys(this.stats).filter(
        (key) => this.stats[key].averageTime < this.msOnAnswer && this.stats[key].correct >= 3,
      );
      const totalExamples = 64;

      if (learnedExamples.length >= totalExamples) {
        this.isDisabled = true;
        this.userAnswer = '';
        this.message = '';
        return;
      }

      do {
        this.a = this.getRandomInt(2, 9);
        this.b = this.getRandomInt(2, 9);
      } while (
        this.stats[`${this.a}x${this.b}`] &&
        this.stats[`${this.a}x${this.b}`].averageTime < this.msOnAnswer &&
        this.stats[`${this.a}x${this.b}`].correct >= 3
      );

      this.userAnswer = '';
      this.message = '';
      this.$nextTick(() => {
        this.$refs.inputAnswer.focus();
      });
      this.startTime = Date.now();
    },
    checkAnswer() {
      if (this.isDisabled) return;

      const endTime = Date.now();
      const timeTaken = endTime - this.startTime;
      const answer = parseInt(this.userAnswer);
      const key = `${this.a}x${this.b}`;

      if (answer === this.a * this.b) {
        if (!this.stats[key]) {
          this.stats[key] = { correct: 0, attempts: 0, totalTime: 0 };
        }
        this.stats[key].correct++;
        this.stats[key].attempts++;
        this.stats[key].totalTime += timeTaken;
        this.stats[key].averageTime = this.stats[key].totalTime / this.stats[key].correct;
        this.generateQuestion();
      } else {
        if (!this.stats[key]) {
          this.stats[key] = {
            correct: 0,
            attempts: 0,
            totalTime: 0,
            averageTime: Infinity,
          };
        }
        this.stats[key].attempts++;
        this.message = 'Неправильно, попробуйте еще раз.';
        this.userAnswer = '';
        this.$nextTick(() => {
          this.$refs.inputAnswer.focus();
        });
      }
    },
    getRandomInt(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    formatKey(key) {
      return key.replace('x', ' × ');
    },
    getClassForStat(stat) {
      if (stat.averageTime < this.msOnAnswer) {
        return stat.correct >= 3 ? 'green' : 'blue';
      } else {
        return 'red';
      }
    },
  },
  mounted() {
    this.generateQuestion();
  },
  watch: {
    stats: {
      handler() {
        this.$forceUpdate();
      },
      deep: true,
    },
  },
};
</script>

<style scoped>
button {
  background: linear-gradient(to bottom, #3498db, #2980b9);
  border: none;
  color: #fff;
  padding: 10px 20px;
  border-radius: 5px;
  font-size: 16px;
  cursor: pointer;
  transition:
    background 0.3s,
    transform 0.2s;
}

#container {
  width: 100%;
  max-width: 600px;
  margin: 50px auto;
  text-align: center;
}

#question {
  font-size: 32px;
  margin-bottom: 20px;
}

#inputAnswer {
  padding: 10px;
  width: 150px;
  text-align: center;
}

button {
  padding: 10px 20px;
  margin-left: 10px;
}

#message {
  color: #d9534f;
  margin-top: 15px;
}

#stats {
  margin-top: 30px;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 15px;
}

th,
td {
  border: 1px solid #ccc;
  padding: 4px;
  font-size: 18px;
}

th {
  background-color: #e6e6e6;
}

.green {
  background-color: #c6efce;
}

.blue {
  background-color: lightskyblue;
}

.red {
  background-color: #ffc7ce;
}

@media (max-width: 900px) {
  #container {
    margin: 16px auto;
  }

  #question {
    font-size: 28px;
    margin-bottom: 16px;
  }

  /* поле и кнопка в одну строку не помещаются — ставим их столбиком */
  #inputAnswer {
    display: block;
    width: 100%;
    max-width: 240px;
    margin: 0 auto;
    font-size: 20px;
  }

  button {
    margin: 12px 0 0;
    width: 100%;
    max-width: 240px;
  }

  #stats {
    margin-top: 24px;
  }

  /* четыре колонки на 360px не влезают — таблице своя прокрутка */
  .stats-scroll {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .stats-scroll table {
    min-width: 340px;
  }

  th,
  td {
    padding: 5px 6px;
    font-size: 14px;
  }
}
</style>
