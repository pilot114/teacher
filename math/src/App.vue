<template>
  <div :class="['app-container', { 'dark-theme': isDarkTheme, fullscreen: isFullscreen }]">
    <!-- Верхняя панель -->
    <div class="top-bar">
      <h1>Math Visualizer</h1>
      <div class="mode-selector">
        <button @click="currentMode = 'functions'" :class="['mode-btn', { active: currentMode === 'functions' }]">
          📈 Графики функций
        </button>
        <button @click="currentMode = 'school'" :class="['mode-btn', { active: currentMode === 'school' }]">
          🎓 Школьная математика
        </button>
        <button @click="currentMode = 'geometry'" :class="['mode-btn', { active: currentMode === 'geometry' }]">
          📐 Геометрия (2D)
        </button>
        <button @click="currentMode = 'stereometry'" :class="['mode-btn', { active: currentMode === 'stereometry' }]">
          🧊 Стереометрия (3D)
        </button>
        <button @click="currentMode = 'trigonometry'" :class="['mode-btn', { active: currentMode === 'trigonometry' }]">
          📐 Тригонометрия
        </button>
        <button
          @click="currentMode = 'functionsGraphs'"
          :class="['mode-btn', { active: currentMode === 'functionsGraphs' }]"
        >
          📊 Функции и графики
        </button>
        <button
          @click="currentMode = 'combinatoricsStats'"
          :class="['mode-btn', { active: currentMode === 'combinatoricsStats' }]"
        >
          🎲 Комбинаторика и статистика
        </button>
      </div>
      <div class="top-bar-actions">
        <button @click="toggleTheme" class="icon-btn" title="Переключить тему">
          {{ isDarkTheme ? '☀️' : '🌙' }}
        </button>
        <button @click="toggleFullscreen" class="icon-btn" title="Полноэкранный режим">
          {{ isFullscreen ? '⊡' : '⊞' }}
        </button>
        <button v-if="currentMode === 'functions'" @click="exportChart('png')" class="icon-btn" title="Экспорт PNG">
          📥 PNG
        </button>
        <button v-if="currentMode === 'functions'" @click="exportChart('svg')" class="icon-btn" title="Экспорт SVG">
          📥 SVG
        </button>
        <button
          v-if="currentMode === 'functions'"
          @click="undo"
          :disabled="historyIndex <= 0"
          class="icon-btn"
          title="Отменить"
        >
          ↶
        </button>
        <button
          v-if="currentMode === 'functions'"
          @click="redo"
          :disabled="historyIndex >= history.length - 1"
          class="icon-btn"
          title="Вернуть"
        >
          ↷
        </button>
      </div>
    </div>

    <!-- Режим школьной математики -->
    <SchoolMath v-if="currentMode === 'school'" />

    <!-- Режим геометрии -->
    <Geometry v-if="currentMode === 'geometry'" />

    <!-- Режим стереометрии -->
    <Stereometry v-if="currentMode === 'stereometry'" />

    <!-- Режим тригонометрии -->
    <Trigonometry v-if="currentMode === 'trigonometry'" />

    <!-- Режим функций и графиков -->
    <FunctionsGraphs v-if="currentMode === 'functionsGraphs'" />

    <!-- Режим комбинаторики и статистики -->
    <CombinatoricsStats v-if="currentMode === 'combinatoricsStats'" />

    <!-- Режим графиков функций -->
    <div v-else-if="currentMode === 'functions'" class="main-content">
      <!-- Панель графика -->
      <div class="chart-panel">
        <div ref="chartContainer" class="chart-container">
          <Plane
            :data="data"
            :min="yMin < yMax ? Number(yMin) : null"
            :max="yMax > yMin ? Number(yMax) : null"
            :logarithmic="isLogarithmic"
          />
        </div>

        <div class="chart-controls">
          <button @click="isStopped = !isStopped" class="control-btn">
            {{ isStopped ? '⏵ Play' : '⏸ Pause' }}
          </button>
          <button @click="resetView" class="control-btn">🔄 Reset</button>
          <button @click="save" class="control-btn">💾 Save</button>
        </div>
      </div>

      <!-- Боковая панель -->
      <div class="sidebar">
        <!-- Настройки -->
        <div class="settings-section">
          <h3>⚙️ Настройки</h3>

          <div class="settings-group">
            <label>Область значений Y:</label>
            <div class="input-row">
              <input v-model.number="yMin" type="number" placeholder="yMin" step="any" />
              <input v-model.number="yMax" type="number" placeholder="yMax" step="any" />
            </div>
          </div>

          <div class="settings-group">
            <label>Область определения X:</label>
            <div class="input-row">
              <input v-model.number="xStart" type="number" placeholder="start" step="any" />
              <input v-model.number="xEnd" type="number" placeholder="end" step="any" />
              <input v-model.number="xStep" type="number" placeholder="step" step="any" />
            </div>
          </div>

          <div class="settings-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="isLogarithmic" />
              Логарифмическая шкала
            </label>
          </div>

          <div class="settings-group">
            <label>Тип координат:</label>
            <select v-model="coordinateSystem">
              <option value="cartesian">Декартовы</option>
              <option value="polar">Полярные</option>
              <option value="parametric">Параметрические</option>
            </select>
          </div>
        </div>

        <!-- Функции -->
        <div class="functions-section">
          <div class="functions-header">
            <h3>📊 Функции</h3>
            <button @click="showGallery = true" class="btn-gallery">🖼️ Галерея</button>
          </div>

          <small class="math-link">
            <a href="https://mathjs.org/docs/index.html" target="_blank">📖 math.js docs</a>
          </small>

          <div
            v-for="(f, i) in fns"
            :key="i"
            class="function-item"
            draggable="true"
            @dragstart="dragStart(i)"
            @dragover.prevent
            @drop="drop(i)"
          >
            <div class="drag-handle">⋮⋮</div>

            <input v-model="f.color" type="color" class="color-picker" title="Цвет" />

            <div class="function-inputs">
              <input v-model="f.label" type="text" placeholder="Название" class="input-label" />

              <input
                v-if="coordinateSystem === 'parametric'"
                v-model="f.fnX"
                type="text"
                placeholder="x(t)"
                class="input-func"
              />

              <input
                v-model="f.fn"
                type="text"
                :placeholder="
                  coordinateSystem === 'parametric' ? 'y(t)' : coordinateSystem === 'polar' ? 'r(θ)' : 'f(x)'
                "
                class="input-func"
              />

              <input v-model.number="f.count" type="number" placeholder="Точек" class="input-count" />
            </div>

            <div class="function-actions">
              <button @click="computeDerivative(i)" class="action-btn" title="Производная">dx</button>
              <button @click="computeIntegral(i)" class="action-btn" title="Интеграл">∫</button>
              <button @click="showAnalysis(i)" class="action-btn" title="Анализ">🔍</button>
              <button @click="removeFunction(i)" class="action-btn delete" title="Удалить">✕</button>
            </div>
          </div>

          <button @click="addFunction" class="btn-add">➕ Добавить функцию</button>
        </div>

        <!-- Анализ функции -->
        <div v-if="selectedFunction !== null" class="analysis-section">
          <h3>🔬 Анализ функции</h3>
          <button @click="selectedFunction = null" class="close-analysis">✕</button>

          <div class="analysis-content">
            <button @click="findExtremaForFunction(selectedFunction)" class="analysis-btn">📍 Найти экстремумы</button>
            <button @click="findInflectionForFunction(selectedFunction)" class="analysis-btn">📍 Точки перегиба</button>
            <button @click="findAsymptotesForFunction(selectedFunction)" class="analysis-btn">📍 Асимптоты</button>
            <button @click="findRootsForFunction(selectedFunction)" class="analysis-btn">📍 Найти корни</button>

            <div v-if="analysisResults" class="analysis-results">
              <h4>Результаты:</h4>
              <pre>{{ analysisResults }}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Галерея функций -->
    <FunctionGallery :isOpen="showGallery" @close="showGallery = false" @select="addFromGallery" />
  </div>
</template>

<script>
import Plane from './components/Plane.vue';
import FunctionGallery from './components/FunctionGallery.vue';
import SchoolMath from './components/SchoolMath.vue';
import Geometry from './components/Geometry.vue';
import Stereometry from './components/Stereometry.vue';
import Trigonometry from './components/Trigonometry.vue';
import FunctionsGraphs from './components/FunctionsGraphs.vue';
import CombinatoricsStats from './components/CombinatoricsStats.vue';
import { evaluate, derivative } from 'mathjs';
import { defaultColors } from './utils/functionExamples.js';
import {
  numericalIntegral,
  findAllRoots,
  // findIntersections,
  findExtrema,
  findInflectionPoints,
  // getTangentLine,
  // getNormalLine,
  findAsymptotes,
  generatePolarPoints,
  // polarToCartesian
} from './utils/mathUtils.js';

export default {
  name: 'App',
  components: {
    Plane,
    FunctionGallery,
    SchoolMath,
    Geometry,
    Stereometry,
    Trigonometry,
    FunctionsGraphs,
    CombinatoricsStats,
  },
  created() {
    this.load();
    this.loadTheme();

    const fps = 24;
    const coof = 10;
    setInterval(() => {
      if (!this.isStopped) {
        this.tick = this.tick + 1 / coof;
      }
    }, 1000 / fps);
  },
  computed: {
    data() {
      if (this.coordinateSystem === 'polar') {
        return this.generatePolarData();
      } else if (this.coordinateSystem === 'parametric') {
        return this.generateParametricData();
      } else {
        return this.generateCartesianData();
      }
    },
    defaultValues() {
      const labels = this.fns.map((x) => [x.label, 0]);
      return Object.fromEntries(labels);
    },
  },
  data() {
    return {
      currentMode: 'functions',
      fns: [],
      yMin: null,
      yMax: null,
      xStart: 0,
      xEnd: null,
      xStep: 1,
      tick: 0,
      isStopped: true,
      isDarkTheme: false,
      isFullscreen: false,
      isLogarithmic: false,
      coordinateSystem: 'cartesian',
      showGallery: false,
      selectedFunction: null,
      analysisResults: null,
      draggedIndex: null,
      history: [],
      historyIndex: -1,
    };
  },
  watch: {
    fns: {
      deep: true,
      handler() {
        this.saveToHistory();
      },
    },
  },
  methods: {
    // === История изменений ===
    saveToHistory() {
      const state = JSON.stringify(this.fns);
      if (this.history[this.historyIndex] !== state) {
        this.history = this.history.slice(0, this.historyIndex + 1);
        this.history.push(state);
        this.historyIndex++;

        if (this.history.length > 50) {
          this.history.shift();
          this.historyIndex--;
        }
      }
    },
    undo() {
      if (this.historyIndex > 0) {
        this.historyIndex--;
        this.fns = JSON.parse(this.history[this.historyIndex]);
      }
    },
    redo() {
      if (this.historyIndex < this.history.length - 1) {
        this.historyIndex++;
        this.fns = JSON.parse(this.history[this.historyIndex]);
      }
    },

    // === Темы ===
    toggleTheme() {
      this.isDarkTheme = !this.isDarkTheme;
      localStorage.setItem('math_theme', this.isDarkTheme ? 'dark' : 'light');
    },
    loadTheme() {
      const theme = localStorage.getItem('math_theme');
      this.isDarkTheme = theme === 'dark';
    },

    // === Полноэкранный режим ===
    toggleFullscreen() {
      this.isFullscreen = !this.isFullscreen;
    },

    // === Экспорт ===
    exportChart(format) {
      const canvas = this.$refs.chartContainer.querySelector('canvas');
      if (!canvas) {
        alert('График не найден');
        return;
      }

      if (format === 'png') {
        const url = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = 'chart.png';
        link.href = url;
        link.click();
      } else if (format === 'svg') {
        alert('SVG экспорт будет доступен в следующей версии');
      }
    },

    // === Drag & Drop ===
    dragStart(index) {
      this.draggedIndex = index;
    },
    drop(index) {
      if (this.draggedIndex === null) return;

      const item = this.fns[this.draggedIndex];
      this.fns.splice(this.draggedIndex, 1);
      this.fns.splice(index, 0, item);
      this.draggedIndex = null;
    },

    // === Функции ===
    addFunction() {
      const colorIndex = this.fns.length % defaultColors.length;
      this.fns.push({
        fn: 'x',
        fnX: 'x',
        count: 50,
        label: `f${this.fns.length + 1}`,
        color: defaultColors[colorIndex],
      });
    },
    removeFunction(index) {
      this.fns.splice(index, 1);
    },
    addFromGallery(example) {
      this.fns.push({
        fn: example.fn,
        fnX: example.fnX || 'x',
        count: example.count || 50,
        label: example.label,
        color: example.color,
      });

      if (example.type) {
        this.coordinateSystem = example.type;
      }
    },

    // === Математические операции ===
    computeDerivative(index) {
      const f = this.fns[index];
      try {
        const derivativeFunc = derivative(f.fn, 'x').toString();
        const colorIndex = this.fns.length % defaultColors.length;
        this.fns.push({
          fn: derivativeFunc,
          fnX: 'x',
          count: f.count,
          label: f.label + "'",
          color: defaultColors[colorIndex],
        });
      } catch (e) {
        alert('Ошибка вычисления производной: ' + e.message);
      }
    },

    computeIntegral(index) {
      const f = this.fns[index];
      const start = this.xStart;
      const end = this.xEnd || f.count;

      try {
        const result = numericalIntegral(f.fn, start, end);
        alert(`Интеграл от ${start} до ${end}: ${result.toFixed(4)}`);
      } catch (e) {
        alert('Ошибка вычисления интеграла: ' + e.message);
      }
    },

    showAnalysis(index) {
      this.selectedFunction = index;
      this.analysisResults = null;
    },

    findExtremaForFunction(index) {
      const f = this.fns[index];
      const start = this.xStart;
      const end = this.xEnd || f.count;

      try {
        const extrema = findExtrema(f.fn, start, end);
        this.analysisResults =
          extrema.length > 0
            ? extrema
                .map((e) => `${e.type === 'max' ? 'Max' : 'Min'}: (${e.x.toFixed(3)}, ${e.y.toFixed(3)})`)
                .join('\n')
            : 'Экстремумы не найдены';
      } catch (e) {
        this.analysisResults = 'Ошибка: ' + e.message;
      }
    },

    findInflectionForFunction(index) {
      const f = this.fns[index];
      const start = this.xStart;
      const end = this.xEnd || f.count;

      try {
        const points = findInflectionPoints(f.fn, start, end);
        this.analysisResults =
          points.length > 0
            ? points.map((p) => `(${p.x.toFixed(3)}, ${p.y.toFixed(3)})`).join('\n')
            : 'Точки перегиба не найдены';
      } catch (e) {
        this.analysisResults = 'Ошибка: ' + e.message;
      }
    },

    findAsymptotesForFunction(index) {
      const f = this.fns[index];
      const start = this.xStart;
      const end = this.xEnd || f.count;

      try {
        const asymptotes = findAsymptotes(f.fn, start, end);
        let result = '';

        if (asymptotes.vertical.length > 0) {
          result += 'Вертикальные: x = ' + asymptotes.vertical.map((x) => x.toFixed(2)).join(', ') + '\n';
        }
        if (asymptotes.horizontal !== null) {
          result += 'Горизонтальная: y = ' + asymptotes.horizontal.toFixed(2) + '\n';
        }

        this.analysisResults = result || 'Асимптоты не найдены';
      } catch (e) {
        this.analysisResults = 'Ошибка: ' + e.message;
      }
    },

    findRootsForFunction(index) {
      const f = this.fns[index];
      const start = this.xStart;
      const end = this.xEnd || f.count;

      try {
        const roots = findAllRoots(f.fn, start, end);
        this.analysisResults =
          roots.length > 0 ? 'Корни: ' + roots.map((r) => r.toFixed(3)).join(', ') : 'Корни не найдены';
      } catch (e) {
        this.analysisResults = 'Ошибка: ' + e.message;
      }
    },

    // === Генерация данных ===
    generateCartesianData() {
      return this.fns.map((f) => {
        return {
          name: f.fn,
          data: { ...this.sequence(f.fn, f.count) },
          borderColor: f.color,
          backgroundColor: f.color,
        };
      });
    },

    generatePolarData() {
      return this.fns.map((f) => {
        const points = generatePolarPoints(f.fn, 0, 2 * Math.PI, f.count);
        const data = {};
        points.forEach((p, i) => {
          data[i] = [p.x, p.y];
        });
        return {
          name: f.fn,
          data: data,
          borderColor: f.color,
          backgroundColor: f.color,
        };
      });
    },

    generateParametricData() {
      return this.fns.map((f) => {
        const data = {};
        const count = f.count;

        for (let i = 0; i <= count; i++) {
          const t = i;
          try {
            const x = evaluate(f.fnX || 'x', { x: t, t: this.tick });
            const y = evaluate(f.fn, { x: t, t: this.tick });
            data[x] = y;
          } catch (e) {
            console.error('Error at t=' + t, e);
          }
        }

        return {
          name: f.label,
          data: data,
          borderColor: f.color,
          backgroundColor: f.color,
        };
      });
    },

    getValues(point) {
      let values = this.defaultValues;
      if (this.data) {
        this.data.forEach((item) => {
          values[item.name] = item.data[point];
        });
      }
      return values;
    },

    sequence(f, count) {
      const start = this.xStart;
      const step = this.xStep;
      const end = this.xEnd || start + count * step;
      const actualCount = Math.ceil((end - start) / step);

      const data = {};
      for (let i = 0; i <= actualCount; i++) {
        const x = start + i * step;
        let r = 0;
        const symbols = {
          x,
          t: this.tick,
          ...this.getValues(x),
        };

        try {
          r = evaluate(f, symbols);
        } catch (e) {
          console.log(e);
        }
        data[x] = r;
      }
      return data;
    },

    resetView() {
      this.yMin = null;
      this.yMax = null;
      this.xStart = 0;
      this.xEnd = null;
      this.xStep = 1;
      this.tick = 0;
    },

    save() {
      localStorage.setItem(
        'math_data',
        JSON.stringify({
          fns: this.fns,
          yMin: this.yMin,
          yMax: this.yMax,
          xStart: this.xStart,
          xEnd: this.xEnd,
          xStep: this.xStep,
          coordinateSystem: this.coordinateSystem,
          isLogarithmic: this.isLogarithmic,
        }),
      );
    },

    load() {
      const dataStr = localStorage.getItem('math_data');
      if (dataStr) {
        try {
          const data = JSON.parse(dataStr);
          if (data.fns) {
            this.fns = data.fns;
            this.yMin = data.yMin;
            this.yMax = data.yMax;
            this.xStart = data.xStart || 0;
            this.xEnd = data.xEnd;
            this.xStep = data.xStep || 1;
            this.coordinateSystem = data.coordinateSystem || 'cartesian';
            this.isLogarithmic = data.isLogarithmic || false;
          }
        } catch (e) {
          console.error('Error loading data:', e);
        }
      }

      if (this.fns.length === 0) {
        this.fns = [
          { fn: 'sin(x+t)', count: 100, label: 'sin', color: '#4285F4' },
          { fn: 'cos(x+t)', count: 100, label: 'cos', color: '#EA4335' },
          { fn: 'x^2/20', count: 50, label: 'parabola', color: '#34A853' },
        ];
      }

      this.saveToHistory();
    },
  },
};
</script>

<style>
:root {
  --bg-color: #ffffff;
  --bg-secondary: #f5f5f5;
  --text-color: #2c3e50;
  --text-secondary: #666;
  --border-color: #ddd;
  --card-bg: #fff;
  --button-bg: #4285f4;
  --button-hover: #357ae8;
}

.dark-theme {
  --bg-color: #1a1a1a;
  --bg-secondary: #2d2d2d;
  --text-color: #e0e0e0;
  --text-secondary: #aaa;
  --border-color: #444;
  --card-bg: #2d2d2d;
  --button-bg: #5a9fd4;
  --button-hover: #4a8fc4;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
}

.app-container {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: var(--bg-color);
  color: var(--text-color);
  min-height: 100vh;
  transition: all 0.3s ease;
}

.app-container.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 9999;
}

/* Верхняя панель */
.top-bar {
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  padding: 15px 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
}

.top-bar h1 {
  margin: 0;
  font-size: 24px;
  color: var(--text-color);
}

.mode-selector {
  display: flex;
  gap: 5px;
  flex: 1;
  justify-content: center;
}

.mode-btn {
  padding: 10px 20px;
  border: 1px solid var(--border-color);
  background: var(--card-bg);
  color: var(--text-color);
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
  white-space: nowrap;
}

.mode-btn:hover {
  background: var(--button-hover);
  color: white;
}

.mode-btn.active {
  background: var(--button-bg);
  color: white;
}

.top-bar-actions {
  display: flex;
  gap: 10px;
}

.icon-btn {
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  background: var(--card-bg);
  color: var(--text-color);
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.icon-btn:hover:not(:disabled) {
  background: var(--button-hover);
  color: white;
  transform: translateY(-1px);
}

.icon-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Основной контент */
.main-content {
  display: flex;
  height: calc(100vh - 70px);
}

.chart-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px;
}

.chart-container {
  flex: 1;
  background: var(--card-bg);
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.chart-controls {
  display: flex;
  gap: 10px;
  margin-top: 15px;
  justify-content: center;
}

.control-btn {
  padding: 10px 20px;
  border: none;
  background: var(--button-bg);
  color: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.control-btn:hover {
  background: var(--button-hover);
  transform: translateY(-1px);
}

/* Боковая панель */
.sidebar {
  width: 400px;
  background: var(--bg-secondary);
  border-left: 1px solid var(--border-color);
  overflow-y: auto;
  padding: 20px;
}

.settings-section,
.functions-section,
.analysis-section {
  background: var(--card-bg);
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.settings-section h3,
.functions-section h3,
.analysis-section h3 {
  margin-top: 0;
  color: var(--text-color);
  font-size: 18px;
  margin-bottom: 15px;
}

.settings-group {
  margin-bottom: 15px;
}

.settings-group label {
  display: block;
  margin-bottom: 5px;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
}

.input-row {
  display: flex;
  gap: 8px;
}

.settings-group input[type='number'],
.settings-group select {
  width: 100%;
  padding: 8px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--bg-color);
  color: var(--text-color);
  font-size: 14px;
}

.checkbox-label {
  display: flex !important;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.checkbox-label input[type='checkbox'] {
  width: auto;
}

/* Функции */
.functions-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.btn-gallery {
  padding: 6px 12px;
  border: 1px solid var(--border-color);
  background: var(--button-bg);
  color: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}

.btn-gallery:hover {
  background: var(--button-hover);
}

.math-link {
  display: block;
  margin-bottom: 15px;
  color: var(--text-secondary);
}

.math-link a {
  color: var(--button-bg);
  text-decoration: none;
}

.math-link a:hover {
  text-decoration: underline;
}

.function-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px;
  background: var(--bg-color);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  margin-bottom: 10px;
  transition: all 0.2s;
  cursor: move;
}

.function-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.drag-handle {
  color: var(--text-secondary);
  cursor: grab;
  font-size: 18px;
  line-height: 1;
  padding: 4px 0;
}

.drag-handle:active {
  cursor: grabbing;
}

.color-picker {
  width: 40px;
  height: 40px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  cursor: pointer;
  flex-shrink: 0;
}

.function-inputs {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.input-label,
.input-func,
.input-count {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--bg-color);
  color: var(--text-color);
  font-size: 13px;
}

.input-func {
  font-family: 'Courier New', monospace;
}

.input-count {
  width: 80px;
}

.function-actions {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.action-btn {
  padding: 4px 8px;
  border: 1px solid var(--border-color);
  background: var(--card-bg);
  color: var(--text-color);
  border-radius: 3px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.action-btn:hover {
  background: var(--button-bg);
  color: white;
}

.action-btn.delete:hover {
  background: #dc3545;
  border-color: #dc3545;
}

.btn-add {
  width: 100%;
  padding: 10px;
  border: 2px dashed var(--border-color);
  background: transparent;
  color: var(--text-color);
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.btn-add:hover {
  border-color: var(--button-bg);
  color: var(--button-bg);
  background: var(--bg-color);
}

/* Анализ */
.analysis-section {
  position: relative;
}

.close-analysis {
  position: absolute;
  top: 15px;
  right: 15px;
  padding: 4px 8px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 18px;
  cursor: pointer;
  line-height: 1;
}

.close-analysis:hover {
  color: var(--text-color);
}

.analysis-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.analysis-btn {
  padding: 10px;
  border: 1px solid var(--border-color);
  background: var(--card-bg);
  color: var(--text-color);
  border-radius: 4px;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s;
}

.analysis-btn:hover {
  background: var(--button-bg);
  color: white;
}

.analysis-results {
  margin-top: 15px;
  padding: 15px;
  background: var(--bg-color);
  border: 1px solid var(--border-color);
  border-radius: 4px;
}

.analysis-results h4 {
  margin-top: 0;
  margin-bottom: 10px;
  color: var(--text-color);
}

.analysis-results pre {
  margin: 0;
  color: var(--text-secondary);
  font-size: 13px;
  white-space: pre-wrap;
  word-wrap: break-word;
}

/* Адаптивность */
@media (max-width: 1200px) {
  .sidebar {
    width: 350px;
  }
}

@media (max-width: 768px) {
  .main-content {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    border-left: none;
    border-top: 1px solid var(--border-color);
  }

  .chart-panel {
    height: 400px;
  }
}
</style>
