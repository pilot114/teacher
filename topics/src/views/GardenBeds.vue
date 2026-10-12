<template>
  <div class="garden">
    <h1>Эффективность обучения</h1>
    <p class="lead">
      Два ученика, 60 дней учёбы. Выберите каждому стратегию занятий и посмотрите, сколько знаний
      у него останется и каких усилий это стоило. Таблица внизу объясняет, какие принципы обучения
      сработали.
    </p>

    <details class="analogy">
      <summary>Почему знания нарисованы как растение на грядке</summary>
      <div class="analogy-body">
        <p>
          Учёба очень похожа на полив. Растение — это знания ученика, вода — время занятий,
          а влажность почвы — то, насколько материал свеж в памяти.
        </p>
        <ul>
          <li><b>Вода испаряется каждый день</b> — так же каждый день идёт забывание. Не поливать — растение засохнет, не повторять — знания потускнеют.</li>
          <li><b>Почва впитывает воду не быстрее определённой скорости</b>, лишнее стекает по поверхности. За одно занятие тоже усваивается ограниченный объём, долгие марафоны проходят мимо.</li>
          <li><b>Переливать вредно</b>: в заболоченной почве корни гниют. Перегрузка ведёт к выгоранию и губит даже выученное.</li>
          <li><b>Корни растут вглубь, когда верхний слой подсох</b> — растение тянется за водой. Повторение, когда материал чуть подзабылся, укрепляет знания сильнее, чем когда всё свежо.</li>
          <li><b>Глубокие корни держат больше воды и медленнее сохнут.</b> Прочные знания забываются медленнее, и повторять их можно всё реже.</li>
          <li><b>Подвядшее растение быстро отходит после полива</b>, а погибшее не оживить. Подзабытое вспоминается легко, а брошенную учёбу приходится начинать заново.</li>
          <li><b>Каждый поход к колодцу стоит сил</b>, даже ради стакана воды. Каждое занятие требует раскачки, поэтому слишком мелкие порции неэффективны.</li>
        </ul>
        <p>
          Поэтому на рисунке растение и почва в разрезе: зелень — объём знаний, корни — их прочность,
          цвет почвы — насколько материал свеж в памяти.
        </p>
      </div>
    </details>

    <div class="bar">
      <button type="button" class="play" @click="toggle">{{ timer ? 'Пауза' : 'Запустить' }}</button>
      <span class="day">День {{ day }}</span>
      <input type="range" min="0" :max="DAYS" :value="day" aria-label="День" @input="seek">
    </div>

    <div class="beds">
      <section v-for="(side, i) in sides" :key="i" class="bed" :class="'bed-' + i">
        <header>
          <h2>Ученик {{ LETTERS[i] }}</h2>
          <span class="state" :class="stateOf(i).tone">{{ stateOf(i).text }}</span>
        </header>

        <label class="field">
          Стратегия
          <select :value="side.preset" @change="applyPreset(i, $event.target.value)">
            <option v-for="(p, key) in PRESETS" :key="key" :value="key">{{ p.name }}</option>
          </select>
        </label>
        <p class="learn">{{ PRESETS[side.preset].learn }}</p>

        <details>
          <summary>Настроить вручную</summary>
          <div class="grid">
            <label>Когда заниматься
              <select :value="side.cfg.sched" @change="setField(i, 'sched', $event)">
                <option value="interval">Каждые N дней</option>
                <option value="weekends">По выходным</option>
                <option value="threshold">Когда материал начал забываться</option>
              </select>
            </label>
            <label v-if="side.cfg.sched === 'interval'">Каждые, дней
              <input type="number" min="1" max="14" :value="side.cfg.every" @change="setField(i, 'every', $event)">
            </label>
            <label v-if="side.cfg.sched === 'threshold'">Если в памяти меньше, %
              <input type="number" min="10" max="90" step="5" :value="side.cfg.thr" @change="setField(i, 'thr', $event)">
            </label>
            <label>Начать с дня
              <input type="number" min="1" max="60" :value="side.cfg.start" @change="setField(i, 'start', $event)">
            </label>
            <label>Сколько заниматься
              <select :value="side.cfg.amount" @change="setField(i, 'amount', $event)">
                <option value="fill">Пока не освежу материал</option>
                <option value="fixed">Фиксированное время</option>
              </select>
            </label>
            <label v-if="side.cfg.amount === 'fixed'">Минут
              <input type="number" :min="UNIT_MINUTES" :max="200 * UNIT_MINUTES" :step="UNIT_MINUTES" :value="side.cfg.liters * UNIT_MINUTES" @change="setField(i, 'liters', $event, UNIT_MINUTES)">
            </label>
            <label v-if="side.cfg.amount === 'fill'">Освежить до, %
              <input type="number" min="30" max="100" step="5" :value="side.cfg.target" @change="setField(i, 'target', $event)">
            </label>
            <label>Формат занятий
              <select :value="side.cfg.tool" @change="setField(i, 'tool', $event)">
                <option v-for="(t, key) in TOOLS" :key="key" :value="key">{{ t.name }}</option>
              </select>
            </label>
          </div>
        </details>

        <div class="scene" v-html="scenes[i]"></div>
        <div class="strip" v-html="strips[i]"></div>
        <p class="cap">Занятия по дням: синим усвоенное, охрой время, потраченное впустую.</p>

        <dl class="metrics">
          <div v-for="[label, value] in metricsOf(i)" :key="label">
            <dt>{{ label }}</dt>
            <dd>{{ value }}</dd>
          </div>
        </dl>

        <ul class="log" aria-live="polite">
          <li v-if="day === 0">Нажмите «Запустить» или двигайте ползунок дней.</li>
          <li v-else-if="!runs[i][day].ev.length">
            <span class="dot" style="background: #d6d6d6"></span>
            Без занятий: в памяти {{ Math.round(runs[i][day].m * 100) }}%.
          </li>
          <template v-else>
            <li v-for="([kind, text], k) in runs[i][day].ev" :key="k">
              <span class="dot" :style="{background: dotColor[kind]}"></span>{{ text }}
            </li>
          </template>
        </ul>
      </section>
    </div>

    <section class="charts">
      <div class="chart" v-for="chart in charts" :key="chart.title">
        <h3>{{ chart.title }}</h3>
        <div class="legend"><span class="la">{{ LETTERS[0] }}</span><span class="lb">{{ LETTERS[1] }}</span></div>
        <div v-html="chart.svg"></div>
        <p>{{ chart.hint }}</p>
      </div>
    </section>

    <section class="principles">
      <h3>Что происходит и как это связано с обучением</h3>
      <p class="hint">
        Числа справа показывают, сколько дней принцип проявлялся у каждого ученика к текущему дню.
        Строки, которые сработали сегодня, подсвечены.
      </p>
      <div class="table-scroll">
        <table>
          <thead>
          <tr><th>Принцип</th><th>Что это значит</th><th>{{ LETTERS[0] }}</th><th>{{ LETTERS[1] }}</th></tr>
          </thead>
          <tbody>
          <tr v-for="p in principleRows" :key="p.id" :class="{now: p.today}">
            <td><span class="pname"><span class="dot" :style="{background: p.color}"></span>{{ p.name }}</span></td>
            <td>{{ p.learn }}</td>
            <td class="n">{{ p.a }}</td>
            <td class="n">{{ p.b }}</td>
          </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script>
import {DAYS, PRESETS, PRINCIPLES, TOOLS, UNIT_MINUTES, fmt, fmtTime, simulate} from '@/garden.js';
import {lineChart, makeBed, sceneSVG, stripSVG} from '@/gardenScene.js';

const COLORS = ['#1f8a7a', '#8e4a8c'];

// форма корней и камешков у каждой грядки своя, но постоянная
const BEDS = [makeBed(11), makeBed(29)];

export default {
  name: 'GardenBeds',
  data() {
    return {
      DAYS,
      PRESETS,
      TOOLS,
      UNIT_MINUTES,
      LETTERS: ['А', 'Б'],
      day: 0,
      timer: null,
      sides: [
        {preset: 'gardener', cfg: {...PRESETS.gardener.cfg}},
        {preset: 'barrel', cfg: {...PRESETS.barrel.cfg}},
      ],
      dotColor: {...Object.fromEntries(PRINCIPLES.map((p) => [p.id, p.color])), water: '#2f7fbf'},
    };
  },
  computed: {
    runs() {
      return this.sides.map((side) => simulate(side.cfg));
    },
    scenes() {
      return this.runs.map((run, i) => sceneSVG(run[this.day], BEDS[i], `gb${i}`, this.sides[i].cfg.tool));
    },
    strips() {
      return this.runs.map((run) => stripSVG(run, this.day));
    },
    charts() {
      const [a, b] = this.runs;
      const series = (pick) => [{v: a.map(pick), c: COLORS[0]}, {v: b.map(pick), c: COLORS[1]}];
      const effortMax = Math.max(20, Math.ceil(Math.max(a[DAYS].cum.effort, b[DAYS].cum.effort) / 20) * 20);
      return [
        {
          title: 'Насколько материал свеж в памяти',
          svg: lineChart(series((o) => o.m * 100), 100, [30, 88], this.day, '%'),
          hint: 'Зелёная полоса: материал в рабочем состоянии. Ниже — забывается, выше — перегрузка.',
        },
        {
          title: 'Прочность знаний',
          svg: lineChart(series((o) => o.D), 60, null, this.day, ''),
          hint: 'Прочные знания вмещают больше и забываются медленнее.',
        },
        {
          title: 'Усилия нарастающим итогом',
          svg: lineChart(series((o) => o.cum.effort), effortMax, null, this.day, ''),
          hint: 'Каждое занятие стоит 1 — сесть и включиться, плюс само время, а долгие занятия утомляют сильнее.',
        },
      ];
    },
    principleRows() {
      const [a, b] = this.runs;
      const d = this.day;
      const count = (run, id) => run.slice(1, d + 1).filter((o) => o.ev.some((e) => e[0] === id)).length;
      const today = new Set([...a[d].ev, ...b[d].ev].map((e) => e[0]));
      return PRINCIPLES.map((p) => ({...p, a: count(a, p.id), b: count(b, p.id), today: today.has(p.id)}));
    },
  },
  beforeUnmount() {
    this.stop();
  },
  methods: {
    stateOf(i) {
      const o = this.runs[i][this.day];
      if (o.dead) return {text: 'бросил учёбу', tone: 'bad'};
      if (o.rot >= 3) return {text: 'выгорает', tone: 'bad'};
      if (o.H < 50) return {text: 'теряет интерес', tone: 'warn'};
      if (o.m < 0.3) return {text: 'забывает', tone: 'warn'};
      return {text: 'в порядке', tone: 'ok'};
    },
    metricsOf(i) {
      const o = this.runs[i][this.day], c = o.cum;
      const eff = c.poured ? Math.round(100 * c.root / c.poured) : 0;
      return [
        ['Объём знаний', o.dead ? 'учёба брошена' : `${Math.round(o.B)} из 100`],
        ['Прочность', fmt(o.D)],
        ['Интерес к учёбе', `${Math.round(o.H)}%`],
        ['Занятий', c.outings],
        ['Усилия', fmt(c.effort)],
        ['Усвоено', c.poured ? `${eff}% из ${fmtTime(c.poured)}` : '—'],
        ['Дней с провалами в памяти', c.stress],
      ];
    },
    applyPreset(i, key) {
      this.sides[i].preset = key;
      if (PRESETS[key].cfg) {
        this.sides[i].cfg = {...PRESETS[key].cfg};
      }
    },
    // scale — во сколько раз число в поле больше значения модели (минуты против её единиц)
    setField(i, name, event, scale = 1) {
      const input = event.target;
      let value = input.value;
      if (input.type === 'number') {
        value = Math.max(+input.min || 0, Math.min(+input.max || 999, +input.value || 0));
        input.value = value;
        value /= scale;
      }
      this.sides[i].cfg[name] = value;
      this.sides[i].preset = 'custom';
    },
    seek(event) {
      this.stop();
      this.day = +event.target.value;
    },
    toggle() {
      if (this.timer) {
        this.stop();
        return;
      }
      if (this.day >= DAYS) this.day = 0;
      this.timer = setInterval(() => {
        this.day++;
        if (this.day >= DAYS) this.stop();
      }, 230);
    },
    stop() {
      clearInterval(this.timer);
      this.timer = null;
    },
  },
};
</script>

<style scoped>
.garden {
  flex: 1;
  min-width: 0;
  max-width: 1180px;
}

h1 {
  margin: 10px 0 8px;
}

.lead {
  max-width: 70ch;
  margin: 0 0 16px;
  color: #555;
}

.bar {
  position: sticky;
  top: 0;
  z-index: 5;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 18px;
  padding: 10px 0;
  border-bottom: 1px solid #e6e6e6;
  background-color: #ffffff;
}

.play {
  min-width: 110px;
  padding: 7px 16px;
  border: 1px solid #1a63c4;
  border-radius: 6px;
  background-color: #1a63c4;
  color: #ffffff;
  cursor: pointer;
}

.play:hover {
  background-color: #1755a8;
}

.day {
  min-width: 6ch;
  font-size: 20px;
  font-weight: bold;
}

.bar input[type="range"] {
  flex: 1 1 240px;
  accent-color: #1a63c4;
}

.check {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 15px;
}

.beds {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-top: 16px;
}

.bed {
  min-width: 0;
  padding: 4px 16px 14px;
  border: 1px solid #e6e6e6;
  border-radius: 8px;
  background-color: #fbfbfb;
}

.bed-0 {
  border-top: 4px solid #1f8a7a;
}

.bed-1 {
  border-top: 4px solid #8e4a8c;
}

.bed header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
}

.bed h2 {
  margin: 12px 0 8px;
}

.state {
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 13px;
}

.state.ok {
  background-color: #e3f1dc;
  color: #2f6a1f;
}

.state.warn {
  background-color: #fbefd0;
  color: #7a5a06;
}

.state.bad {
  background-color: #f6dcdc;
  color: #8a1c1c;
}

.field,
.grid label {
  display: block;
  font-size: 13px;
  color: #666;
}

select,
input[type="number"] {
  display: block;
  width: 100%;
  margin-top: 2px;
  padding: 5px 8px;
  border: 1px solid #c4c4c4;
  border-radius: 6px;
  background-color: #ffffff;
  color: #333;
  font-size: 15px;
}

.learn {
  margin: 8px 0 4px;
  font-size: 15px;
}

details {
  margin: 4px 0 10px;
  font-size: 14px;
}

summary {
  color: #1a63c4;
  cursor: pointer;
}

.analogy {
  max-width: 80ch;
  margin: 0 0 12px;
  font-size: 15px;
}

.analogy-body {
  margin-top: 8px;
  padding: 10px 14px;
  border-left: 3px solid #4c8b3a;
  border-radius: 4px;
  background-color: #f5f9f3;
  color: #333;
}

.analogy-body p {
  margin: 0 0 8px;
}

.analogy-body p:last-child {
  margin-bottom: 0;
}

.analogy-body ul {
  margin: 0 0 8px;
  padding-left: 20px;
}

.analogy-body li + li {
  margin-top: 4px;
}

.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 12px;
  margin-top: 8px;
}

.scene :deep(svg) {
  display: block;
  width: 100%;
  height: auto;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
}

.strip {
  margin-top: 8px;
}

.strip :deep(svg),
.chart :deep(svg) {
  display: block;
  width: 100%;
  height: auto;
}

.cap {
  margin: 2px 0 0;
  font-size: 12px;
  color: #888;
}

.metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin: 14px 0 8px;
}

.metrics div {
  padding-left: 8px;
  border-left: 2px solid #e0e0e0;
}

.metrics dt {
  font-size: 12px;
  color: #777;
}

.metrics dd {
  margin: 0;
  font-size: 18px;
  font-weight: bold;
}

.log {
  min-height: 5.5em;
  margin: 8px 0 0;
  padding: 0;
  list-style: none;
  font-size: 14px;
}

.log li {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 3px 0;
}

.dot {
  flex: none;
  width: 10px;
  height: 10px;
  margin-top: 0.4em;
  border-radius: 50%;
}

.charts {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 18px;
  margin-top: 24px;
}

.chart,
.principles {
  padding: 4px 14px 14px;
  border: 1px solid #e6e6e6;
  border-radius: 8px;
  background-color: #fbfbfb;
}

.chart h3,
.principles h3 {
  margin: 12px 0 6px;
}

.chart p {
  margin: 4px 0 0;
  font-size: 13px;
  color: #777;
}

.legend {
  display: flex;
  gap: 14px;
  margin: 2px 0 6px;
  font-size: 14px;
}

.legend span::before {
  content: "";
  display: inline-block;
  width: 14px;
  height: 3px;
  margin-right: 6px;
  border-radius: 2px;
  vertical-align: middle;
  background: currentColor;
}

.la {
  color: #1f8a7a;
}

.lb {
  color: #8e4a8c;
}

.principles {
  margin: 24px 0 30px;
}

.hint {
  max-width: 70ch;
  font-size: 14px;
  color: #777;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  padding: 8px 10px;
  border: 1px solid #ddd;
  text-align: left;
  vertical-align: top;
}

th {
  background-color: #f4f4f4;
}

td.n {
  width: 3.5em;
  text-align: center;
  font-weight: bold;
}

tr.now td {
  background-color: #eef2f8;
}

.pname {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-weight: bold;
}

@media (max-width: 1100px) {
  .charts {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 900px) {
  .garden {
    flex: none;
    width: 100%;
  }

  .beds {
    grid-template-columns: 1fr;
  }

  .bed {
    padding: 4px 12px 12px;
  }

  .metrics {
    grid-template-columns: repeat(2, 1fr);
  }

  .table-scroll {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  table {
    min-width: 560px;
  }

  th,
  td {
    padding: 8px 6px;
    font-size: 14px;
  }
}
</style>
