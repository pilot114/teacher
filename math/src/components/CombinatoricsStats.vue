<template>
    <div class="combinatorics-stats">
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
            <!-- Комбинаторика -->
            <div v-if="activeTab === 'combinatorics'" class="visualizer">
                <h2>Комбинаторика</h2>
                <div class="controls">
                    <label>
                        n (всего элементов):
                        <input v-model.number="combinatorics.n" type="number" min="1" max="20">
                    </label>
                    <label>
                        k (выбираем элементов):
                        <input v-model.number="combinatorics.k" type="number" min="0" max="20">
                    </label>
                    <div class="result">
                        <strong>Перестановки P(n) = n!</strong> = {{ factorial(combinatorics.n) }}
                        <br>
                        <strong>Размещения A(n,k) = n!/(n-k)!</strong> = {{ arrangements(combinatorics.n, combinatorics.k) }}
                        <br>
                        <strong>Сочетания C(n,k) = n!/(k!(n-k)!)</strong> = {{ combinations(combinatorics.n, combinatorics.k) }}
                    </div>
                </div>
                <div class="chart-container">
                    <canvas ref="combinatoricsChart"></canvas>
                </div>
            </div>

            <!-- Дерево вариантов -->
            <div v-if="activeTab === 'tree'" class="visualizer">
                <h2>Дерево вариантов</h2>
                <div class="controls">
                    <label>
                        Количество монет для подбрасывания:
                        <input v-model.number="tree.depth" type="number" min="1" max="4">
                    </label>
                    <div class="result">
                        Всего возможных исходов: {{ Math.pow(2, tree.depth) }}
                    </div>
                </div>
                <div class="canvas-container">
                    <canvas ref="treeCanvas" width="800" height="600"></canvas>
                </div>
            </div>

            <!-- Вероятность (Диаграммы Венна) -->
            <div v-if="activeTab === 'probability'" class="visualizer">
                <h2>Вероятность событий (Диаграммы Венна)</h2>
                <div class="controls">
                    <label>
                        |A| (элементы только в A):
                        <input v-model.number="probability.onlyA" type="number" min="0" max="100">
                    </label>
                    <label>
                        |B| (элементы только в B):
                        <input v-model.number="probability.onlyB" type="number" min="0" max="100">
                    </label>
                    <label>
                        |A ∩ B| (элементы в обоих):
                        <input v-model.number="probability.both" type="number" min="0" max="100">
                    </label>
                    <label>
                        Остальные элементы:
                        <input v-model.number="probability.neither" type="number" min="0" max="100">
                    </label>
                    <div class="result">
                        Всего элементов: {{ totalElements }}
                        <br>
                        P(A) = {{ probA.toFixed(3) }}
                        <br>
                        P(B) = {{ probB.toFixed(3) }}
                        <br>
                        P(A ∩ B) = {{ probAandB.toFixed(3) }}
                        <br>
                        P(A ∪ B) = {{ probAorB.toFixed(3) }}
                    </div>
                </div>
                <div class="canvas-container">
                    <canvas ref="vennCanvas" width="600" height="400"></canvas>
                </div>
            </div>

            <!-- Статистика: Гистограммы -->
            <div v-if="activeTab === 'histogram'" class="visualizer">
                <h2>Статистика: Гистограммы и показатели</h2>
                <div class="controls">
                    <label>
                        Данные (через запятую):
                        <input v-model="statistics.dataInput" type="text" placeholder="1,2,3,4,5,5,6,7,8,9">
                    </label>
                    <button @click="generateRandomData" class="btn-generate">
                        🎲 Сгенерировать случайные данные
                    </button>
                    <div class="result">
                        <strong>Среднее (Mean):</strong> {{ mean.toFixed(2) }}
                        <br>
                        <strong>Медиана (Median):</strong> {{ median.toFixed(2) }}
                        <br>
                        <strong>Мода (Mode):</strong> {{ mode.join(', ') }}
                        <br>
                        <strong>Дисперсия (Variance):</strong> {{ variance.toFixed(2) }}
                        <br>
                        <strong>Стандартное отклонение (σ):</strong> {{ stdDev.toFixed(2) }}
                    </div>
                </div>
                <div class="chart-container">
                    <canvas ref="histogramChart"></canvas>
                </div>
            </div>

            <!-- Диаграммы рассеивания -->
            <div v-if="activeTab === 'scatter'" class="visualizer">
                <h2>Диаграмма рассеивания и линия тренда</h2>
                <div class="controls">
                    <label>
                        Данные X (через запятую):
                        <input v-model="scatter.xInput" type="text" placeholder="1,2,3,4,5">
                    </label>
                    <label>
                        Данные Y (через запятую):
                        <input v-model="scatter.yInput" type="text" placeholder="2,4,5,4,5">
                    </label>
                    <button @click="generateScatterData" class="btn-generate">
                        🎲 Сгенерировать данные
                    </button>
                    <div class="result">
                        <strong>Линия тренда:</strong> y = {{ slope.toFixed(2) }}x + {{ intercept.toFixed(2) }}
                        <br>
                        <strong>Коэффициент корреляции (r):</strong> {{ correlation.toFixed(3) }}
                    </div>
                </div>
                <div class="chart-container">
                    <canvas ref="scatterChart"></canvas>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import Chart from 'chart.js/auto';

export default {
    name: 'CombinatoricsStats',
    data() {
        return {
            activeTab: 'combinatorics',
            tabs: [
                { id: 'combinatorics', label: 'Комбинаторика' },
                { id: 'tree', label: 'Дерево вариантов' },
                { id: 'probability', label: 'Вероятность (Венна)' },
                { id: 'histogram', label: 'Статистика' },
                { id: 'scatter', label: 'Рассеивание' }
            ],
            combinatorics: {
                n: 5,
                k: 3
            },
            tree: {
                depth: 3
            },
            probability: {
                onlyA: 20,
                onlyB: 15,
                both: 10,
                neither: 5
            },
            statistics: {
                dataInput: '1,2,2,3,3,3,4,4,5,6,6,7,8,9,10'
            },
            scatter: {
                xInput: '1,2,3,4,5,6,7,8,9,10',
                yInput: '2.1,3.9,6.2,8.1,9.8,12.3,13.9,16.2,18.1,19.9'
            },
            charts: {}
        };
    },
    computed: {
        // Probability computations
        totalElements() {
            return this.probability.onlyA + this.probability.onlyB +
                   this.probability.both + this.probability.neither;
        },
        probA() {
            if (this.totalElements === 0) return 0;
            return (this.probability.onlyA + this.probability.both) / this.totalElements;
        },
        probB() {
            if (this.totalElements === 0) return 0;
            return (this.probability.onlyB + this.probability.both) / this.totalElements;
        },
        probAandB() {
            if (this.totalElements === 0) return 0;
            return this.probability.both / this.totalElements;
        },
        probAorB() {
            if (this.totalElements === 0) return 0;
            return (this.probability.onlyA + this.probability.onlyB + this.probability.both) / this.totalElements;
        },

        // Statistics computations
        dataArray() {
            return this.statistics.dataInput
                .split(',')
                .map(x => parseFloat(x.trim()))
                .filter(x => !isNaN(x));
        },
        mean() {
            if (this.dataArray.length === 0) return 0;
            return this.dataArray.reduce((a, b) => a + b, 0) / this.dataArray.length;
        },
        median() {
            if (this.dataArray.length === 0) return 0;
            const sorted = [...this.dataArray].sort((a, b) => a - b);
            const mid = Math.floor(sorted.length / 2);
            return sorted.length % 2 === 0
                ? (sorted[mid - 1] + sorted[mid]) / 2
                : sorted[mid];
        },
        mode() {
            if (this.dataArray.length === 0) return [0];
            const freq = {};
            this.dataArray.forEach(x => freq[x] = (freq[x] || 0) + 1);
            const maxFreq = Math.max(...Object.values(freq));
            return Object.keys(freq).filter(k => freq[k] === maxFreq).map(x => parseFloat(x));
        },
        variance() {
            if (this.dataArray.length === 0) return 0;
            const m = this.mean;
            return this.dataArray.reduce((acc, x) => acc + Math.pow(x - m, 2), 0) / this.dataArray.length;
        },
        stdDev() {
            return Math.sqrt(this.variance);
        },

        // Scatter plot computations
        xArray() {
            return this.scatter.xInput
                .split(',')
                .map(x => parseFloat(x.trim()))
                .filter(x => !isNaN(x));
        },
        yArray() {
            return this.scatter.yInput
                .split(',')
                .map(x => parseFloat(x.trim()))
                .filter(x => !isNaN(x));
        },
        scatterData() {
            const minLength = Math.min(this.xArray.length, this.yArray.length);
            return this.xArray.slice(0, minLength).map((x, i) => ({ x, y: this.yArray[i] }));
        },
        slope() {
            if (this.scatterData.length < 2) return 0;
            const n = this.scatterData.length;
            const sumX = this.scatterData.reduce((acc, p) => acc + p.x, 0);
            const sumY = this.scatterData.reduce((acc, p) => acc + p.y, 0);
            const sumXY = this.scatterData.reduce((acc, p) => acc + p.x * p.y, 0);
            const sumX2 = this.scatterData.reduce((acc, p) => acc + p.x * p.x, 0);

            return (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        },
        intercept() {
            if (this.scatterData.length < 2) return 0;
            const n = this.scatterData.length;
            const sumX = this.scatterData.reduce((acc, p) => acc + p.x, 0);
            const sumY = this.scatterData.reduce((acc, p) => acc + p.y, 0);

            return (sumY - this.slope * sumX) / n;
        },
        correlation() {
            if (this.scatterData.length < 2) return 0;
            const n = this.scatterData.length;
            const sumX = this.scatterData.reduce((acc, p) => acc + p.x, 0);
            const sumY = this.scatterData.reduce((acc, p) => acc + p.y, 0);
            const sumXY = this.scatterData.reduce((acc, p) => acc + p.x * p.y, 0);
            const sumX2 = this.scatterData.reduce((acc, p) => acc + p.x * p.x, 0);
            const sumY2 = this.scatterData.reduce((acc, p) => acc + p.y * p.y, 0);

            const numerator = n * sumXY - sumX * sumY;
            const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

            return denominator === 0 ? 0 : numerator / denominator;
        }
    },
    watch: {
        activeTab() {
            this.$nextTick(() => this.renderChart());
        },
        combinatorics: {
            deep: true,
            handler() {
                if (this.activeTab === 'combinatorics') this.renderCombinatoricsChart();
            }
        },
        tree: {
            deep: true,
            handler() {
                if (this.activeTab === 'tree') this.drawTree();
            }
        },
        probability: {
            deep: true,
            handler() {
                if (this.activeTab === 'probability') this.drawVenn();
            }
        },
        statistics: {
            deep: true,
            handler() {
                if (this.activeTab === 'histogram') this.renderHistogram();
            }
        },
        scatter: {
            deep: true,
            handler() {
                if (this.activeTab === 'scatter') this.renderScatter();
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
        // Factorial
        factorial(n) {
            if (n < 0) return 0;
            if (n === 0 || n === 1) return 1;
            if (n > 20) return 'Слишком большое число';
            let result = 1;
            for (let i = 2; i <= n; i++) {
                result *= i;
            }
            return result;
        },

        // Arrangements A(n,k)
        arrangements(n, k) {
            if (k > n || k < 0 || n < 0) return 0;
            const nFact = this.factorial(n);
            const nMinusKFact = this.factorial(n - k);
            if (typeof nFact === 'string' || typeof nMinusKFact === 'string') return 'Слишком большое число';
            return nFact / nMinusKFact;
        },

        // Combinations C(n,k)
        combinations(n, k) {
            if (k > n || k < 0 || n < 0) return 0;
            const nFact = this.factorial(n);
            const kFact = this.factorial(k);
            const nMinusKFact = this.factorial(n - k);
            if (typeof nFact === 'string' || typeof kFact === 'string' || typeof nMinusKFact === 'string') {
                return 'Слишком большое число';
            }
            return nFact / (kFact * nMinusKFact);
        },

        generateRandomData() {
            const data = [];
            for (let i = 0; i < 50; i++) {
                data.push(Math.floor(Math.random() * 20) + 1);
            }
            this.statistics.dataInput = data.join(',');
        },

        generateScatterData() {
            const data = [];
            const slope = 2 + Math.random() * 2;
            const intercept = Math.random() * 5;
            for (let i = 1; i <= 15; i++) {
                const noise = (Math.random() - 0.5) * 3;
                data.push({ x: i, y: slope * i + intercept + noise });
            }
            this.scatter.xInput = data.map(p => p.x).join(',');
            this.scatter.yInput = data.map(p => p.y.toFixed(1)).join(',');
        },

        renderChart() {
            switch (this.activeTab) {
                case 'combinatorics': this.renderCombinatoricsChart(); break;
                case 'tree': this.drawTree(); break;
                case 'probability': this.drawVenn(); break;
                case 'histogram': this.renderHistogram(); break;
                case 'scatter': this.renderScatter(); break;
            }
        },

        renderCombinatoricsChart() {
            const ctx = this.$refs.combinatoricsChart;
            if (!ctx) return;

            const n = this.combinatorics.n;
            const k = this.combinatorics.k;

            // Generate data for different values of k
            const labels = [];
            const permutationsData = [];
            const arrangementsData = [];
            const combinationsData = [];

            for (let i = 0; i <= Math.min(n, 10); i++) {
                labels.push(`k=${i}`);
                const perm = i === 0 ? this.factorial(n) : this.factorial(n);
                const arr = this.arrangements(n, i);
                const comb = this.combinations(n, i);

                permutationsData.push(typeof perm === 'number' ? perm : null);
                arrangementsData.push(typeof arr === 'number' ? arr : null);
                combinationsData.push(typeof comb === 'number' ? comb : null);
            }

            this.destroyChart('combinatorics');
            this.charts.combinatorics = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: `Сочетания C(${n},k)`,
                            data: combinationsData,
                            backgroundColor: '#4285F4',
                            borderColor: '#4285F4'
                        },
                        {
                            label: `Размещения A(${n},k)`,
                            data: arrangementsData,
                            backgroundColor: '#EA4335',
                            borderColor: '#EA4335'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    aspectRatio: 2,
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top'
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            type: 'logarithmic'
                        }
                    }
                }
            });
        },

        drawTree() {
            const canvas = this.$refs.treeCanvas;
            if (!canvas) return;

            const ctx = canvas.getContext('2d');
            const width = canvas.width;
            const height = canvas.height;

            // Clear canvas
            ctx.clearRect(0, 0, width, height);

            const depth = this.tree.depth;
            const levelHeight = height / (depth + 1);

            // Draw tree recursively
            const drawNode = (x, y, level, label) => {
                // Draw circle
                ctx.beginPath();
                ctx.arc(x, y, 20, 0, 2 * Math.PI);
                ctx.fillStyle = '#4285F4';
                ctx.fill();
                ctx.strokeStyle = '#333';
                ctx.lineWidth = 2;
                ctx.stroke();

                // Draw label
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 14px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(label, x, y);

                // Draw children
                if (level < depth) {
                    const nextY = y + levelHeight;
                    const spacing = width / Math.pow(2, level + 1);
                    const leftX = x - spacing / 2;
                    const rightX = x + spacing / 2;

                    // Draw lines to children
                    ctx.beginPath();
                    ctx.moveTo(x, y + 20);
                    ctx.lineTo(leftX, nextY - 20);
                    ctx.strokeStyle = '#666';
                    ctx.lineWidth = 2;
                    ctx.stroke();

                    ctx.beginPath();
                    ctx.moveTo(x, y + 20);
                    ctx.lineTo(rightX, nextY - 20);
                    ctx.stroke();

                    // Recursively draw children
                    drawNode(leftX, nextY, level + 1, 'О');
                    drawNode(rightX, nextY, level + 1, 'Р');
                }
            };

            // Start drawing from root
            drawNode(width / 2, 50, 0, 'S');
        },

        drawVenn() {
            const canvas = this.$refs.vennCanvas;
            if (!canvas) return;

            const ctx = canvas.getContext('2d');
            const width = canvas.width;
            const height = canvas.height;

            // Clear canvas
            ctx.clearRect(0, 0, width, height);

            const centerX1 = width / 2 - 80;
            const centerY1 = height / 2;
            const centerX2 = width / 2 + 80;
            const centerY2 = height / 2;
            const radius = 120;

            // Draw circle A
            ctx.beginPath();
            ctx.arc(centerX1, centerY1, radius, 0, 2 * Math.PI);
            ctx.fillStyle = 'rgba(66, 133, 244, 0.3)';
            ctx.fill();
            ctx.strokeStyle = '#4285F4';
            ctx.lineWidth = 3;
            ctx.stroke();

            // Draw circle B
            ctx.beginPath();
            ctx.arc(centerX2, centerY2, radius, 0, 2 * Math.PI);
            ctx.fillStyle = 'rgba(234, 67, 53, 0.3)';
            ctx.fill();
            ctx.strokeStyle = '#EA4335';
            ctx.lineWidth = 3;
            ctx.stroke();

            // Labels
            ctx.fillStyle = '#000';
            ctx.font = 'bold 24px Arial';
            ctx.fillText('A', centerX1 - 60, centerY1);
            ctx.fillText('B', centerX2 + 60, centerY2);

            // Values
            ctx.font = 'bold 20px Arial';
            ctx.fillText(this.probability.onlyA.toString(), centerX1 - 40, centerY1);
            ctx.fillText(this.probability.onlyB.toString(), centerX2 + 40, centerY2);
            ctx.fillText(this.probability.both.toString(), width / 2, centerY2);
            ctx.fillText(this.probability.neither.toString(), 50, 50);

            // Legend
            ctx.font = '14px Arial';
            ctx.fillStyle = '#666';
            ctx.fillText('Только A: ' + this.probability.onlyA, 20, height - 80);
            ctx.fillText('Только B: ' + this.probability.onlyB, 20, height - 60);
            ctx.fillText('A ∩ B: ' + this.probability.both, 20, height - 40);
            ctx.fillText('Ни A, ни B: ' + this.probability.neither, 20, height - 20);
        },

        renderHistogram() {
            const ctx = this.$refs.histogramChart;
            if (!ctx) return;

            // Create frequency map
            const freq = {};
            this.dataArray.forEach(x => {
                freq[x] = (freq[x] || 0) + 1;
            });

            const labels = Object.keys(freq).sort((a, b) => a - b);
            const data = labels.map(k => freq[k]);

            this.destroyChart('histogram');
            this.charts.histogram = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Частота',
                        data: data,
                        backgroundColor: '#4285F4',
                        borderColor: '#357ae8',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    aspectRatio: 2,
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top'
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                stepSize: 1
                            }
                        }
                    }
                }
            });
        },

        renderScatter() {
            const ctx = this.$refs.scatterChart;
            if (!ctx) return;

            // Calculate trend line points
            const minX = Math.min(...this.xArray);
            const maxX = Math.max(...this.xArray);
            const trendLine = [
                { x: minX, y: this.slope * minX + this.intercept },
                { x: maxX, y: this.slope * maxX + this.intercept }
            ];

            this.destroyChart('scatter');
            this.charts.scatter = new Chart(ctx, {
                type: 'scatter',
                data: {
                    datasets: [
                        {
                            label: 'Данные',
                            data: this.scatterData,
                            backgroundColor: '#4285F4',
                            borderColor: '#4285F4',
                            pointRadius: 6
                        },
                        {
                            label: 'Линия тренда',
                            data: trendLine,
                            type: 'line',
                            borderColor: '#EA4335',
                            backgroundColor: 'transparent',
                            borderWidth: 2,
                            pointRadius: 0
                        }
                    ]
                },
                options: {
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
                            position: 'bottom'
                        },
                        y: {
                            type: 'linear',
                            position: 'left'
                        }
                    }
                }
            });
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
.combinatorics-stats {
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

.controls input[type="number"],
.controls input[type="text"] {
    padding: 8px 12px;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    background: var(--bg-color);
    color: var(--text-color);
    font-size: 14px;
    flex: 1;
    max-width: 400px;
}

.btn-generate {
    padding: 10px 20px;
    border: 1px solid var(--border-color);
    background: var(--button-bg);
    color: white;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s;
    align-self: flex-start;
}

.btn-generate:hover {
    background: var(--button-hover);
}

.result {
    padding: 15px;
    background: var(--bg-secondary);
    border-radius: 4px;
    color: var(--text-color);
    font-family: 'Courier New', monospace;
    font-size: 16px;
    line-height: 1.6;
}

.chart-container {
    margin-top: 20px;
    padding: 20px;
    background: white;
    border-radius: 8px;
}

.canvas-container {
    margin-top: 20px;
    padding: 20px;
    background: white;
    border-radius: 8px;
    display: flex;
    justify-content: center;
}

.canvas-container canvas {
    border: 1px solid #ddd;
    border-radius: 4px;
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

    .controls input[type="number"],
    .controls input[type="text"] {
        width: 100%;
        max-width: 100%;
    }

    .canvas-container canvas {
        max-width: 100%;
        height: auto;
    }
}
</style>
