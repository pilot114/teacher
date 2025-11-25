<template>
    <div class="functions-graphs">
        <div class="tabs">
            <button
                v-for="tab in tabs"
                :key="tab.id"
                @click="activeTab = tab.id"
                :class="['tab', { active: activeTab === tab.id }]"
            >
                {{ tab.label }}
            </button>
        </div>

        <div class="tab-content">
            <!-- Линейная функция -->
            <div v-if="activeTab === 'linear'" class="visualizer">
                <h2>Линейная функция: y = kx + b</h2>
                <div class="controls">
                    <label>
                        k (угловой коэффициент):
                        <input v-model.number="linear.k" type="number" step="0.1">
                    </label>
                    <label>
                        b (свободный член):
                        <input v-model.number="linear.b" type="number" step="0.1">
                    </label>
                    <div class="result">
                        y = {{ linear.k }}x + {{ linear.b }}
                    </div>
                </div>
                <div class="chart-container">
                    <canvas ref="linearChart"></canvas>
                </div>
            </div>

            <!-- Квадратичная функция -->
            <div v-if="activeTab === 'quadratic'" class="visualizer">
                <h2>Квадратичная функция (парабола): y = ax² + bx + c</h2>
                <div class="controls">
                    <label>
                        a:
                        <input v-model.number="quadratic.a" type="number" step="0.1">
                    </label>
                    <label>
                        b:
                        <input v-model.number="quadratic.b" type="number" step="0.1">
                    </label>
                    <label>
                        c:
                        <input v-model.number="quadratic.c" type="number" step="0.1">
                    </label>
                    <div class="result">
                        y = {{ quadratic.a }}x² + {{ quadratic.b }}x + {{ quadratic.c }}
                        <br>
                        Вершина: ({{ vertexX.toFixed(2) }}, {{ vertexY.toFixed(2) }})
                        <br>
                        Дискриминант: {{ discriminant.toFixed(2) }}
                    </div>
                </div>
                <div class="chart-container">
                    <canvas ref="quadraticChart"></canvas>
                </div>
            </div>

            <!-- Гипербола -->
            <div v-if="activeTab === 'hyperbola'" class="visualizer">
                <h2>Гипербола: y = k/x</h2>
                <div class="controls">
                    <label>
                        k:
                        <input v-model.number="hyperbola.k" type="number" step="0.1">
                    </label>
                    <div class="result">
                        y = {{ hyperbola.k }}/x
                    </div>
                </div>
                <div class="chart-container">
                    <canvas ref="hyperbolaChart"></canvas>
                </div>
            </div>

            <!-- Степенная функция -->
            <div v-if="activeTab === 'power'" class="visualizer">
                <h2>Степенная функция: y = x^n</h2>
                <div class="controls">
                    <label>
                        n (степень):
                        <input v-model.number="power.n" type="number" step="0.1">
                    </label>
                    <div class="result">
                        y = x^{{ power.n }}
                    </div>
                </div>
                <div class="chart-container">
                    <canvas ref="powerChart"></canvas>
                </div>
            </div>

            <!-- Показательная функция -->
            <div v-if="activeTab === 'exponential'" class="visualizer">
                <h2>Показательная функция: y = a^x</h2>
                <div class="controls">
                    <label>
                        a (основание):
                        <input v-model.number="exponential.a" type="number" step="0.1" min="0.1">
                    </label>
                    <div class="result">
                        y = {{ exponential.a }}^x
                    </div>
                </div>
                <div class="chart-container">
                    <canvas ref="exponentialChart"></canvas>
                </div>
            </div>

            <!-- Логарифмическая функция -->
            <div v-if="activeTab === 'logarithmic'" class="visualizer">
                <h2>Логарифмическая функция: y = log_a(x)</h2>
                <div class="controls">
                    <label>
                        a (основание):
                        <input v-model.number="logarithmic.a" type="number" step="0.1" min="0.1">
                    </label>
                    <div class="result">
                        y = log_{{ logarithmic.a }}(x)
                    </div>
                </div>
                <div class="chart-container">
                    <canvas ref="logarithmicChart"></canvas>
                </div>
            </div>

            <!-- Кусочно-заданные функции -->
            <div v-if="activeTab === 'piecewise'" class="visualizer">
                <h2>Кусочно-заданная функция</h2>
                <div class="controls">
                    <div class="piecewise-input">
                        <p>y = </p>
                        <div class="piece">
                            <span>{ x² при x &lt; 0</span>
                        </div>
                        <div class="piece">
                            <span>{ x при 0 ≤ x &lt; 2</span>
                        </div>
                        <div class="piece">
                            <span>{ 4 - x при x ≥ 2</span>
                        </div>
                    </div>
                </div>
                <div class="chart-container">
                    <canvas ref="piecewiseChart"></canvas>
                </div>
            </div>

            <!-- Преобразования графиков -->
            <div v-if="activeTab === 'transformations'" class="visualizer">
                <h2>Преобразования графиков: y = a·f(k(x - h)) + v</h2>
                <div class="controls">
                    <div class="result">Базовая функция: f(x) = x²</div>
                    <label>
                        a (вертикальное растяжение/сжатие):
                        <input v-model.number="transformations.a" type="number" step="0.1">
                    </label>
                    <label>
                        k (горизонтальное растяжение/сжатие):
                        <input v-model.number="transformations.k" type="number" step="0.1">
                    </label>
                    <label>
                        h (горизонтальный сдвиг):
                        <input v-model.number="transformations.h" type="number" step="0.1">
                    </label>
                    <label>
                        v (вертикальный сдвиг):
                        <input v-model.number="transformations.v" type="number" step="0.1">
                    </label>
                    <div class="result">
                        y = {{ transformations.a }}·({{ transformations.k }}(x - {{ transformations.h }}))² + {{ transformations.v }}
                    </div>
                </div>
                <div class="chart-container">
                    <canvas ref="transformationsChart"></canvas>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import Chart from 'chart.js/auto';

export default {
    name: 'FunctionsGraphs',
    data() {
        return {
            activeTab: 'linear',
            tabs: [
                { id: 'linear', label: 'Линейная' },
                { id: 'quadratic', label: 'Квадратичная' },
                { id: 'hyperbola', label: 'Гипербола' },
                { id: 'power', label: 'Степенная' },
                { id: 'exponential', label: 'Показательная' },
                { id: 'logarithmic', label: 'Логарифмическая' },
                { id: 'piecewise', label: 'Кусочная' },
                { id: 'transformations', label: 'Преобразования' }
            ],
            linear: { k: 1, b: 0 },
            quadratic: { a: 1, b: 0, c: 0 },
            hyperbola: { k: 1 },
            power: { n: 2 },
            exponential: { a: 2 },
            logarithmic: { a: 2 },
            transformations: { a: 1, k: 1, h: 0, v: 0 },
            charts: {}
        };
    },
    computed: {
        vertexX() {
            return -this.quadratic.b / (2 * this.quadratic.a);
        },
        vertexY() {
            const x = this.vertexX;
            return this.quadratic.a * x * x + this.quadratic.b * x + this.quadratic.c;
        },
        discriminant() {
            return this.quadratic.b * this.quadratic.b - 4 * this.quadratic.a * this.quadratic.c;
        }
    },
    watch: {
        activeTab() {
            this.$nextTick(() => this.renderChart());
        },
        linear: {
            deep: true,
            handler() {
                if (this.activeTab === 'linear') this.renderLinearChart();
            }
        },
        quadratic: {
            deep: true,
            handler() {
                if (this.activeTab === 'quadratic') this.renderQuadraticChart();
            }
        },
        hyperbola: {
            deep: true,
            handler() {
                if (this.activeTab === 'hyperbola') this.renderHyperbolaChart();
            }
        },
        power: {
            deep: true,
            handler() {
                if (this.activeTab === 'power') this.renderPowerChart();
            }
        },
        exponential: {
            deep: true,
            handler() {
                if (this.activeTab === 'exponential') this.renderExponentialChart();
            }
        },
        logarithmic: {
            deep: true,
            handler() {
                if (this.activeTab === 'logarithmic') this.renderLogarithmicChart();
            }
        },
        transformations: {
            deep: true,
            handler() {
                if (this.activeTab === 'transformations') this.renderTransformationsChart();
            }
        }
    },
    mounted() {
        this.renderChart();
    },
    beforeUnmount() {
        Object.values(this.charts).forEach(chart => chart?.destroy());
    },
    methods: {
        renderChart() {
            switch (this.activeTab) {
                case 'linear': this.renderLinearChart(); break;
                case 'quadratic': this.renderQuadraticChart(); break;
                case 'hyperbola': this.renderHyperbolaChart(); break;
                case 'power': this.renderPowerChart(); break;
                case 'exponential': this.renderExponentialChart(); break;
                case 'logarithmic': this.renderLogarithmicChart(); break;
                case 'piecewise': this.renderPiecewiseChart(); break;
                case 'transformations': this.renderTransformationsChart(); break;
            }
        },

        renderLinearChart() {
            const ctx = this.$refs.linearChart;
            if (!ctx) return;

            const data = this.generatePoints(-10, 10, 0.1, (x) => this.linear.k * x + this.linear.b);

            this.destroyChart('linear');
            this.charts.linear = new Chart(ctx, {
                type: 'line',
                data: {
                    datasets: [{
                        label: `y = ${this.linear.k}x + ${this.linear.b}`,
                        data: data,
                        borderColor: '#4285F4',
                        backgroundColor: 'transparent',
                        tension: 0
                    }]
                },
                options: this.getChartOptions()
            });
        },

        renderQuadraticChart() {
            const ctx = this.$refs.quadraticChart;
            if (!ctx) return;

            const data = this.generatePoints(-10, 10, 0.1, (x) =>
                this.quadratic.a * x * x + this.quadratic.b * x + this.quadratic.c
            );

            const vertexData = [{
                x: this.vertexX,
                y: this.vertexY
            }];

            this.destroyChart('quadratic');
            this.charts.quadratic = new Chart(ctx, {
                type: 'line',
                data: {
                    datasets: [
                        {
                            label: `y = ${this.quadratic.a}x² + ${this.quadratic.b}x + ${this.quadratic.c}`,
                            data: data,
                            borderColor: '#EA4335',
                            backgroundColor: 'transparent',
                            tension: 0.4
                        },
                        {
                            label: 'Вершина',
                            data: vertexData,
                            borderColor: '#34A853',
                            backgroundColor: '#34A853',
                            pointRadius: 8,
                            showLine: false
                        }
                    ]
                },
                options: this.getChartOptions()
            });
        },

        renderHyperbolaChart() {
            const ctx = this.$refs.hyperbolaChart;
            if (!ctx) return;

            const data1 = this.generatePoints(0.1, 10, 0.1, (x) => this.hyperbola.k / x);
            const data2 = this.generatePoints(-10, -0.1, 0.1, (x) => this.hyperbola.k / x);

            this.destroyChart('hyperbola');
            this.charts.hyperbola = new Chart(ctx, {
                type: 'line',
                data: {
                    datasets: [
                        {
                            label: `y = ${this.hyperbola.k}/x (x > 0)`,
                            data: data1,
                            borderColor: '#FBBC04',
                            backgroundColor: 'transparent',
                            tension: 0.4
                        },
                        {
                            label: `y = ${this.hyperbola.k}/x (x < 0)`,
                            data: data2,
                            borderColor: '#FBBC04',
                            backgroundColor: 'transparent',
                            tension: 0.4
                        }
                    ]
                },
                options: this.getChartOptions()
            });
        },

        renderPowerChart() {
            const ctx = this.$refs.powerChart;
            if (!ctx) return;

            const isEven = this.power.n % 2 === 0;
            const start = isEven ? -5 : -5;
            const data = this.generatePoints(start, 5, 0.1, (x) => Math.pow(x, this.power.n));

            this.destroyChart('power');
            this.charts.power = new Chart(ctx, {
                type: 'line',
                data: {
                    datasets: [{
                        label: `y = x^${this.power.n}`,
                        data: data,
                        borderColor: '#9C27B0',
                        backgroundColor: 'transparent',
                        tension: 0.4
                    }]
                },
                options: this.getChartOptions()
            });
        },

        renderExponentialChart() {
            const ctx = this.$refs.exponentialChart;
            if (!ctx) return;

            const data = this.generatePoints(-5, 5, 0.1, (x) => Math.pow(this.exponential.a, x));

            this.destroyChart('exponential');
            this.charts.exponential = new Chart(ctx, {
                type: 'line',
                data: {
                    datasets: [{
                        label: `y = ${this.exponential.a}^x`,
                        data: data,
                        borderColor: '#FF5722',
                        backgroundColor: 'transparent',
                        tension: 0.4
                    }]
                },
                options: this.getChartOptions()
            });
        },

        renderLogarithmicChart() {
            const ctx = this.$refs.logarithmicChart;
            if (!ctx) return;

            const data = this.generatePoints(0.1, 10, 0.1, (x) =>
                Math.log(x) / Math.log(this.logarithmic.a)
            );

            this.destroyChart('logarithmic');
            this.charts.logarithmic = new Chart(ctx, {
                type: 'line',
                data: {
                    datasets: [{
                        label: `y = log_${this.logarithmic.a}(x)`,
                        data: data,
                        borderColor: '#009688',
                        backgroundColor: 'transparent',
                        tension: 0.4
                    }]
                },
                options: this.getChartOptions()
            });
        },

        renderPiecewiseChart() {
            const ctx = this.$refs.piecewiseChart;
            if (!ctx) return;

            const piece1 = this.generatePoints(-5, 0, 0.1, (x) => x * x);
            const piece2 = this.generatePoints(0, 2, 0.1, (x) => x);
            const piece3 = this.generatePoints(2, 6, 0.1, (x) => 4 - x);

            this.destroyChart('piecewise');
            this.charts.piecewise = new Chart(ctx, {
                type: 'line',
                data: {
                    datasets: [
                        {
                            label: 'x² (x < 0)',
                            data: piece1,
                            borderColor: '#4285F4',
                            backgroundColor: 'transparent',
                            tension: 0.4
                        },
                        {
                            label: 'x (0 ≤ x < 2)',
                            data: piece2,
                            borderColor: '#EA4335',
                            backgroundColor: 'transparent',
                            tension: 0
                        },
                        {
                            label: '4 - x (x ≥ 2)',
                            data: piece3,
                            borderColor: '#34A853',
                            backgroundColor: 'transparent',
                            tension: 0
                        }
                    ]
                },
                options: this.getChartOptions()
            });
        },

        renderTransformationsChart() {
            const ctx = this.$refs.transformationsChart;
            if (!ctx) return;

            const original = this.generatePoints(-5, 5, 0.1, (x) => x * x);
            const transformed = this.generatePoints(-5, 5, 0.1, (x) => {
                const inner = this.transformations.k * (x - this.transformations.h);
                return this.transformations.a * inner * inner + this.transformations.v;
            });

            this.destroyChart('transformations');
            this.charts.transformations = new Chart(ctx, {
                type: 'line',
                data: {
                    datasets: [
                        {
                            label: 'Исходная: y = x²',
                            data: original,
                            borderColor: '#999',
                            backgroundColor: 'transparent',
                            tension: 0.4,
                            borderDash: [5, 5]
                        },
                        {
                            label: 'Преобразованная',
                            data: transformed,
                            borderColor: '#E91E63',
                            backgroundColor: 'transparent',
                            tension: 0.4
                        }
                    ]
                },
                options: this.getChartOptions()
            });
        },

        generatePoints(start, end, step, fn) {
            const points = [];
            for (let x = start; x <= end; x += step) {
                const y = fn(x);
                if (isFinite(y) && !isNaN(y) && Math.abs(y) < 1000) {
                    points.push({ x, y });
                }
            }
            return points;
        },

        getChartOptions() {
            return {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 1.5,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    }
                },
                scales: {
                    x: {
                        type: 'linear',
                        position: 'center',
                        grid: {
                            color: (context) => context.tick.value === 0 ? '#666' : '#e0e0e0'
                        }
                    },
                    y: {
                        type: 'linear',
                        position: 'center',
                        grid: {
                            color: (context) => context.tick.value === 0 ? '#666' : '#e0e0e0'
                        }
                    }
                }
            };
        },

        destroyChart(name) {
            if (this.charts[name]) {
                this.charts[name].destroy();
                delete this.charts[name];
            }
        }
    }
};
</script>

<style scoped>
.functions-graphs {
    padding: 20px;
    background: var(--bg-color);
    min-height: calc(100vh - 70px);
}

.tabs {
    display: flex;
    gap: 5px;
    margin-bottom: 20px;
    flex-wrap: wrap;
}

.tab {
    padding: 10px 20px;
    border: 1px solid var(--border-color);
    background: var(--card-bg);
    color: var(--text-color);
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s;
}

.tab:hover {
    background: var(--button-hover);
    color: white;
}

.tab.active {
    background: var(--button-bg);
    color: white;
}

.tab-content {
    background: var(--card-bg);
    border-radius: 8px;
    padding: 30px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.visualizer h2 {
    margin-top: 0;
    margin-bottom: 20px;
    color: var(--text-color);
    font-size: 24px;
}

.controls {
    margin-bottom: 30px;
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.controls label {
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--text-color);
    font-size: 14px;
}

.controls input[type="number"] {
    padding: 8px 12px;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    background: var(--bg-color);
    color: var(--text-color);
    font-size: 14px;
    width: 120px;
}

.result {
    padding: 15px;
    background: var(--bg-secondary);
    border-radius: 4px;
    color: var(--text-color);
    font-family: 'Courier New', monospace;
    font-size: 16px;
}

.chart-container {
    margin-top: 20px;
    padding: 20px;
    background: white;
    border-radius: 8px;
}

.piecewise-input {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 15px;
    background: var(--bg-secondary);
    border-radius: 4px;
    font-family: 'Courier New', monospace;
}

.piece {
    padding-left: 30px;
}

@media (max-width: 768px) {
    .tabs {
        flex-direction: column;
    }

    .tab {
        width: 100%;
    }

    .controls {
        gap: 10px;
    }

    .controls label {
        flex-direction: column;
        align-items: flex-start;
    }

    .controls input[type="number"] {
        width: 100%;
    }
}
</style>
