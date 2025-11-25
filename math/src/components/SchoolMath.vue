<template>
    <div class="school-math">
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
            <!-- Числовая прямая -->
            <div v-if="activeTab === 'numberLine'" class="visualizer">
                <h2>Числовая прямая</h2>
                <div class="controls">
                    <label>
                        Отметить числа:
                        <input v-model="numberLine.numbers" type="text" placeholder="0, 1.5, -2, 3.7">
                    </label>
                </div>
                <svg ref="numberLineSvg" class="number-line-svg" width="100%" height="150"></svg>
            </div>

            <!-- Дроби -->
            <div v-if="activeTab === 'fractions'" class="visualizer">
                <h2>Операции с дробями</h2>
                <div class="controls">
                    <div class="fraction-input">
                        <input v-model.number="fractions.a.num" type="number" class="num-input">
                        <div class="fraction-line"></div>
                        <input v-model.number="fractions.a.den" type="number" class="num-input">
                    </div>
                    <select v-model="fractions.operation">
                        <option value="+">+</option>
                        <option value="-">-</option>
                        <option value="*">×</option>
                        <option value="/">÷</option>
                    </select>
                    <div class="fraction-input">
                        <input v-model.number="fractions.b.num" type="number" class="num-input">
                        <div class="fraction-line"></div>
                        <input v-model.number="fractions.b.den" type="number" class="num-input">
                    </div>
                    <span>=</span>
                    <div class="fraction-result">{{ fractionResult }}</div>
                </div>
                <svg ref="fractionSvg" class="fraction-svg" width="100%" height="300"></svg>
            </div>

            <!-- Проценты -->
            <div v-if="activeTab === 'percentages'" class="visualizer">
                <h2>Проценты</h2>
                <div class="controls">
                    <label>
                        Значение:
                        <input v-model.number="percentages.value" type="number">
                    </label>
                    <label>
                        Процент:
                        <input v-model.number="percentages.percent" type="number">%
                    </label>
                    <div class="result">
                        {{ percentages.percent }}% от {{ percentages.value }} = {{ percentageResult }}
                    </div>
                </div>
                <div class="chart-container">
                    <canvas ref="percentageChart"></canvas>
                </div>
            </div>

            <!-- Пропорции -->
            <div v-if="activeTab === 'proportions'" class="visualizer">
                <h2>Пропорции и масштаб</h2>
                <div class="controls">
                    <div class="proportion-input">
                        <input v-model.number="proportions.a" type="number" placeholder="a">
                        <span>:</span>
                        <input v-model.number="proportions.b" type="number" placeholder="b">
                        <span>=</span>
                        <input v-model.number="proportions.c" type="number" placeholder="c">
                        <span>:</span>
                        <input v-model.number="proportions.x" type="number" placeholder="x" disabled>
                    </div>
                    <div class="result">
                        x = {{ proportionResult }}
                    </div>
                </div>
                <svg ref="proportionSvg" class="proportion-svg" width="100%" height="300"></svg>
            </div>

            <!-- Системы уравнений -->
            <div v-if="activeTab === 'linearSystem'" class="visualizer">
                <h2>Системы линейных уравнений</h2>
                <div class="controls">
                    <div class="equation-input">
                        <input v-model.number="linearSystem.a1" type="number" class="coef">x +
                        <input v-model.number="linearSystem.b1" type="number" class="coef">y =
                        <input v-model.number="linearSystem.c1" type="number" class="coef">
                    </div>
                    <div class="equation-input">
                        <input v-model.number="linearSystem.a2" type="number" class="coef">x +
                        <input v-model.number="linearSystem.b2" type="number" class="coef">y =
                        <input v-model.number="linearSystem.c2" type="number" class="coef">
                    </div>
                    <div class="result">
                        {{ systemSolution }}
                    </div>
                </div>
                <canvas ref="linearSystemChart"></canvas>
            </div>

            <!-- Неравенства -->
            <div v-if="activeTab === 'inequalities'" class="visualizer">
                <h2>Неравенства на числовой прямой</h2>
                <div class="controls">
                    <label>
                        x
                        <select v-model="inequalities.operator">
                            <option value="<">&lt;</option>
                            <option value="<=">&lt;=</option>
                            <option value=">">&gt;</option>
                            <option value=">=">&gt;=</option>
                        </select>
                        <input v-model.number="inequalities.value" type="number">
                    </label>
                </div>
                <svg ref="inequalitySvg" class="inequality-svg" width="100%" height="150"></svg>
            </div>

            <!-- Модуль -->
            <div v-if="activeTab === 'absolute'" class="visualizer">
                <h2>Модуль числа |x|</h2>
                <div class="controls">
                    <label>
                        |x| функция для визуализации
                    </label>
                    <label>
                        a:
                        <input v-model.number="absolute.a" type="number" step="0.1">
                    </label>
                    <label>
                        b:
                        <input v-model.number="absolute.b" type="number" step="0.1">
                    </label>
                    <div class="result">
                        y = |{{ absolute.a }}x + {{ absolute.b }}|
                    </div>
                </div>
                <canvas ref="absoluteChart"></canvas>
            </div>

            <!-- Квадратные уравнения -->
            <div v-if="activeTab === 'quadratic'" class="visualizer">
                <h2>Квадратные уравнения</h2>
                <div class="controls">
                    <div class="equation-input">
                        <input v-model.number="quadratic.a" type="number" step="0.1" class="coef">x² +
                        <input v-model.number="quadratic.b" type="number" step="0.1" class="coef">x +
                        <input v-model.number="quadratic.c" type="number" step="0.1" class="coef"> = 0
                    </div>
                    <div class="result">
                        <div>Дискриминант D = {{ discriminant }}</div>
                        <div v-if="discriminant >= 0">
                            Корни: {{ roots }}
                        </div>
                        <div v-else>
                            Нет действительных корней
                        </div>
                    </div>
                </div>
                <canvas ref="quadraticChart"></canvas>
            </div>
        </div>
    </div>
</template>

<script>
import { Chart } from 'chart.js';

export default {
    name: 'SchoolMath',
    data() {
        return {
            activeTab: 'numberLine',
            tabs: [
                { id: 'numberLine', label: 'Числовая прямая' },
                { id: 'fractions', label: 'Дроби' },
                { id: 'percentages', label: 'Проценты' },
                { id: 'proportions', label: 'Пропорции' },
                { id: 'linearSystem', label: 'Системы уравнений' },
                { id: 'inequalities', label: 'Неравенства' },
                { id: 'absolute', label: 'Модуль |x|' },
                { id: 'quadratic', label: 'Квадратные уравнения' }
            ],
            numberLine: {
                numbers: '0, 1, 2, 3, -1, -2, 1.5, -1.5'
            },
            fractions: {
                a: { num: 1, den: 2 },
                b: { num: 1, den: 3 },
                operation: '+'
            },
            percentages: {
                value: 100,
                percent: 25
            },
            proportions: {
                a: 2,
                b: 3,
                c: 4,
                x: 6
            },
            linearSystem: {
                a1: 2, b1: 1, c1: 5,
                a2: 1, b2: -1, c2: 1
            },
            inequalities: {
                operator: '<=',
                value: 3
            },
            absolute: {
                a: 1,
                b: 0
            },
            quadratic: {
                a: 1,
                b: -5,
                c: 6
            },
            charts: {}
        };
    },
    computed: {
        fractionResult() {
            const { a, b, operation } = this.fractions;
            let num, den;

            switch (operation) {
                case '+':
                    num = a.num * b.den + b.num * a.den;
                    den = a.den * b.den;
                    break;
                case '-':
                    num = a.num * b.den - b.num * a.den;
                    den = a.den * b.den;
                    break;
                case '*':
                    num = a.num * b.num;
                    den = a.den * b.den;
                    break;
                case '/':
                    num = a.num * b.den;
                    den = a.den * b.num;
                    break;
            }

            const gcd = this.gcd(Math.abs(num), Math.abs(den));
            return `${num / gcd}/${den / gcd} = ${(num / den).toFixed(3)}`;
        },
        percentageResult() {
            return (this.percentages.value * this.percentages.percent / 100).toFixed(2);
        },
        proportionResult() {
            if (this.proportions.a && this.proportions.b && this.proportions.c) {
                const result = (this.proportions.b * this.proportions.c / this.proportions.a).toFixed(2);
                return result;
            }
            return 0;
        },
        systemSolution() {
            const { a1, b1, c1, a2, b2, c2 } = this.linearSystem;
            const det = a1 * b2 - a2 * b1;

            if (Math.abs(det) < 0.0001) {
                return 'Система не имеет единственного решения';
            }

            const x = (c1 * b2 - c2 * b1) / det;
            const y = (a1 * c2 - a2 * c1) / det;

            return `x = ${x.toFixed(3)}, y = ${y.toFixed(3)}`;
        },
        discriminant() {
            const { a, b, c } = this.quadratic;
            return b * b - 4 * a * c;
        },
        roots() {
            const { a, b } = this.quadratic;
            const d = this.discriminant;

            if (d < 0) return 'Нет действительных корней';

            const x1 = (-b + Math.sqrt(d)) / (2 * a);
            const x2 = (-b - Math.sqrt(d)) / (2 * a);

            if (Math.abs(d) < 0.0001) {
                return `x = ${x1.toFixed(3)}`;
            }

            return `x₁ = ${x1.toFixed(3)}, x₂ = ${x2.toFixed(3)}`;
        }
    },
    watch: {
        activeTab() {
            this.$nextTick(() => {
                this.renderCurrentVisualization();
            });
        },
        numberLine: {
            deep: true,
            handler() {
                this.drawNumberLine();
            }
        },
        fractions: {
            deep: true,
            handler() {
                this.drawFractions();
            }
        },
        percentages: {
            deep: true,
            handler() {
                this.drawPercentages();
            }
        },
        proportions: {
            deep: true,
            handler() {
                if (this.proportions.a && this.proportions.b && this.proportions.c) {
                    this.proportions.x = (this.proportions.b * this.proportions.c / this.proportions.a).toFixed(2);
                }
                this.drawProportions();
            }
        },
        linearSystem: {
            deep: true,
            handler() {
                this.drawLinearSystem();
            }
        },
        inequalities: {
            deep: true,
            handler() {
                this.drawInequality();
            }
        },
        absolute: {
            deep: true,
            handler() {
                this.drawAbsolute();
            }
        },
        quadratic: {
            deep: true,
            handler() {
                this.drawQuadratic();
            }
        }
    },
    mounted() {
        this.renderCurrentVisualization();
    },
    methods: {
        renderCurrentVisualization() {
            switch (this.activeTab) {
                case 'numberLine':
                    this.drawNumberLine();
                    break;
                case 'fractions':
                    this.drawFractions();
                    break;
                case 'percentages':
                    this.drawPercentages();
                    break;
                case 'proportions':
                    this.drawProportions();
                    break;
                case 'linearSystem':
                    this.drawLinearSystem();
                    break;
                case 'inequalities':
                    this.drawInequality();
                    break;
                case 'absolute':
                    this.drawAbsolute();
                    break;
                case 'quadratic':
                    this.drawQuadratic();
                    break;
            }
        },

        // Числовая прямая
        drawNumberLine() {
            const svg = this.$refs.numberLineSvg;
            if (!svg) return;

            svg.innerHTML = '';
            const width = svg.clientWidth;
            const height = 150;
            const margin = 50;

            const numbers = this.numberLine.numbers.split(',').map(n => parseFloat(n.trim())).filter(n => !isNaN(n));
            const min = Math.min(...numbers, -5);
            const max = Math.max(...numbers, 5);
            const range = max - min;

            const scale = (value) => margin + (value - min) / range * (width - 2 * margin);

            // Основная линия
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', margin);
            line.setAttribute('y1', height / 2);
            line.setAttribute('x2', width - margin);
            line.setAttribute('y2', height / 2);
            line.setAttribute('stroke', '#333');
            line.setAttribute('stroke-width', '2');
            svg.appendChild(line);

            // Деления и числа
            for (let i = Math.ceil(min); i <= Math.floor(max); i++) {
                const x = scale(i);

                // Деление
                const tick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                tick.setAttribute('x1', x);
                tick.setAttribute('y1', height / 2 - 10);
                tick.setAttribute('x2', x);
                tick.setAttribute('y2', height / 2 + 10);
                tick.setAttribute('stroke', '#333');
                tick.setAttribute('stroke-width', '2');
                svg.appendChild(tick);

                // Подпись
                const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                text.setAttribute('x', x);
                text.setAttribute('y', height / 2 + 30);
                text.setAttribute('text-anchor', 'middle');
                text.setAttribute('fill', '#333');
                text.textContent = i;
                svg.appendChild(text);
            }

            // Отмеченные числа
            numbers.forEach(num => {
                const x = scale(num);

                const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                circle.setAttribute('cx', x);
                circle.setAttribute('cy', height / 2);
                circle.setAttribute('r', '6');
                circle.setAttribute('fill', '#4285F4');
                svg.appendChild(circle);

                if (!Number.isInteger(num)) {
                    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                    label.setAttribute('x', x);
                    label.setAttribute('y', height / 2 - 15);
                    label.setAttribute('text-anchor', 'middle');
                    label.setAttribute('fill', '#4285F4');
                    label.setAttribute('font-weight', 'bold');
                    label.textContent = num;
                    svg.appendChild(label);
                }
            });
        },

        // Дроби
        drawFractions() {
            const svg = this.$refs.fractionSvg;
            if (!svg) return;

            svg.innerHTML = '';

            const { a, b } = this.fractions;
            const aValue = a.num / a.den;
            const bValue = b.num / b.den;

            // Визуализация первой дроби
            this.drawFractionRect(svg, 50, 50, 200, 80, a.num, a.den, '#4285F4');

            // Визуализация второй дроби
            this.drawFractionRect(svg, 50, 150, 200, 80, b.num, b.den, '#EA4335');

            // Подписи
            const textA = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            textA.setAttribute('x', 270);
            textA.setAttribute('y', 90);
            textA.setAttribute('font-size', '24');
            textA.textContent = `${a.num}/${a.den} = ${aValue.toFixed(2)}`;
            svg.appendChild(textA);

            const textB = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            textB.setAttribute('x', 270);
            textB.setAttribute('y', 190);
            textB.setAttribute('font-size', '24');
            textB.textContent = `${b.num}/${b.den} = ${bValue.toFixed(2)}`;
            svg.appendChild(textB);
        },

        drawFractionRect(svg, x, y, width, height, num, den, color) {
            // Рамка
            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('x', x);
            rect.setAttribute('y', y);
            rect.setAttribute('width', width);
            rect.setAttribute('height', height);
            rect.setAttribute('fill', 'none');
            rect.setAttribute('stroke', '#333');
            rect.setAttribute('stroke-width', '2');
            svg.appendChild(rect);

            // Заполнение
            const partWidth = width / den;
            for (let i = 0; i < num; i++) {
                const part = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                part.setAttribute('x', x + i * partWidth);
                part.setAttribute('y', y);
                part.setAttribute('width', partWidth);
                part.setAttribute('height', height);
                part.setAttribute('fill', color);
                part.setAttribute('opacity', '0.6');
                svg.appendChild(part);
            }

            // Деления
            for (let i = 1; i < den; i++) {
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', x + i * partWidth);
                line.setAttribute('y1', y);
                line.setAttribute('x2', x + i * partWidth);
                line.setAttribute('y2', y + height);
                line.setAttribute('stroke', '#333');
                line.setAttribute('stroke-width', '1');
                svg.appendChild(line);
            }
        },

        // Проценты
        drawPercentages() {
            const canvas = this.$refs.percentageChart;
            if (!canvas) return;

            if (this.charts.percentage) {
                this.charts.percentage.destroy();
            }

            const value = this.percentages.value;
            const percent = this.percentages.percent;
            const result = value * percent / 100;

            this.charts.percentage = new Chart(canvas, {
                type: 'doughnut',
                data: {
                    labels: [`${percent}%`, `${100 - percent}%`],
                    datasets: [{
                        data: [result, value - result],
                        backgroundColor: ['#4285F4', '#e0e0e0']
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        },
                        title: {
                            display: true,
                            text: `${percent}% от ${value} = ${result}`
                        }
                    }
                }
            });
        },

        // Пропорции
        drawProportions() {
            const svg = this.$refs.proportionSvg;
            if (!svg) return;

            svg.innerHTML = '';
            const width = svg.clientWidth;

            const { a, b, c } = this.proportions;
            const x = this.proportionResult;

            // Первая пара
            this.drawProportionPair(svg, 50, 50, a, b, '#4285F4');

            // Вторая пара
            this.drawProportionPair(svg, 50, 180, c, x, '#EA4335');

            // Формула
            const formula = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            formula.setAttribute('x', width / 2);
            formula.setAttribute('y', 150);
            formula.setAttribute('text-anchor', 'middle');
            formula.setAttribute('font-size', '20');
            formula.textContent = `${a} : ${b} = ${c} : ${x}`;
            svg.appendChild(formula);
        },

        drawProportionPair(svg, x, y, val1, val2, color) {
            const maxWidth = 200;
            const scale = maxWidth / Math.max(val1, val2);

            // Первый прямоугольник
            const rect1 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect1.setAttribute('x', x);
            rect1.setAttribute('y', y);
            rect1.setAttribute('width', val1 * scale);
            rect1.setAttribute('height', 40);
            rect1.setAttribute('fill', color);
            rect1.setAttribute('opacity', '0.7');
            svg.appendChild(rect1);

            const text1 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text1.setAttribute('x', x + val1 * scale / 2);
            text1.setAttribute('y', y + 25);
            text1.setAttribute('text-anchor', 'middle');
            text1.setAttribute('fill', 'white');
            text1.setAttribute('font-weight', 'bold');
            text1.textContent = val1;
            svg.appendChild(text1);

            // Второй прямоугольник
            const rect2 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect2.setAttribute('x', x + 250);
            rect2.setAttribute('y', y);
            rect2.setAttribute('width', val2 * scale);
            rect2.setAttribute('height', 40);
            rect2.setAttribute('fill', color);
            rect2.setAttribute('opacity', '0.7');
            svg.appendChild(rect2);

            const text2 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text2.setAttribute('x', x + 250 + val2 * scale / 2);
            text2.setAttribute('y', y + 25);
            text2.setAttribute('text-anchor', 'middle');
            text2.setAttribute('fill', 'white');
            text2.setAttribute('font-weight', 'bold');
            text2.textContent = val2;
            svg.appendChild(text2);
        },

        // Системы уравнений
        drawLinearSystem() {
            const canvas = this.$refs.linearSystemChart;
            if (!canvas) return;

            if (this.charts.linearSystem) {
                this.charts.linearSystem.destroy();
            }

            const { a1, b1, c1, a2, b2, c2 } = this.linearSystem;

            // Построение линий
            const xValues = [];
            const line1 = [];
            const line2 = [];

            for (let x = -10; x <= 10; x += 0.5) {
                xValues.push(x);
                // y = (c - ax) / b
                if (b1 !== 0) line1.push((c1 - a1 * x) / b1);
                if (b2 !== 0) line2.push((c2 - a2 * x) / b2);
            }

            this.charts.linearSystem = new Chart(canvas, {
                type: 'line',
                data: {
                    labels: xValues,
                    datasets: [
                        {
                            label: `${a1}x + ${b1}y = ${c1}`,
                            data: line1,
                            borderColor: '#4285F4',
                            backgroundColor: 'transparent',
                            borderWidth: 2,
                            pointRadius: 0
                        },
                        {
                            label: `${a2}x + ${b2}y = ${c2}`,
                            data: line2,
                            borderColor: '#EA4335',
                            backgroundColor: 'transparent',
                            borderWidth: 2,
                            pointRadius: 0
                        }
                    ]
                },
                options: {
                    responsive: true,
                    scales: {
                        x: {
                            type: 'linear',
                            title: {
                                display: true,
                                text: 'x'
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: 'y'
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            display: true
                        }
                    }
                }
            });
        },

        // Неравенства
        drawInequality() {
            const svg = this.$refs.inequalitySvg;
            if (!svg) return;

            svg.innerHTML = '';
            const width = svg.clientWidth;
            const height = 150;
            const margin = 50;

            const { operator, value } = this.inequalities;

            const min = value - 10;
            const max = value + 10;
            const range = max - min;

            const scale = (v) => margin + (v - min) / range * (width - 2 * margin);

            // Основная линия
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', margin);
            line.setAttribute('y1', height / 2);
            line.setAttribute('x2', width - margin);
            line.setAttribute('y2', height / 2);
            line.setAttribute('stroke', '#333');
            line.setAttribute('stroke-width', '2');
            svg.appendChild(line);

            // Деления
            for (let i = Math.ceil(min); i <= Math.floor(max); i++) {
                const x = scale(i);

                const tick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                tick.setAttribute('x1', x);
                tick.setAttribute('y1', height / 2 - 10);
                tick.setAttribute('x2', x);
                tick.setAttribute('y2', height / 2 + 10);
                tick.setAttribute('stroke', '#333');
                tick.setAttribute('stroke-width', '2');
                svg.appendChild(tick);

                const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                text.setAttribute('x', x);
                text.setAttribute('y', height / 2 + 30);
                text.setAttribute('text-anchor', 'middle');
                text.setAttribute('fill', '#333');
                text.textContent = i;
                svg.appendChild(text);
            }

            // Закрашенная область
            const valueX = scale(value);
            let regionX1, regionX2;

            if (operator === '<' || operator === '<=') {
                regionX1 = margin;
                regionX2 = valueX;
            } else {
                regionX1 = valueX;
                regionX2 = width - margin;
            }

            const region = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            region.setAttribute('x1', regionX1);
            region.setAttribute('y1', height / 2);
            region.setAttribute('x2', regionX2);
            region.setAttribute('y2', height / 2);
            region.setAttribute('stroke', '#4285F4');
            region.setAttribute('stroke-width', '8');
            region.setAttribute('opacity', '0.5');
            svg.appendChild(region);

            // Точка
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', valueX);
            circle.setAttribute('cy', height / 2);
            circle.setAttribute('r', '8');
            circle.setAttribute('fill', (operator === '<=' || operator === '>=') ? '#4285F4' : 'white');
            circle.setAttribute('stroke', '#4285F4');
            circle.setAttribute('stroke-width', '3');
            svg.appendChild(circle);
        },

        // Модуль
        drawAbsolute() {
            const canvas = this.$refs.absoluteChart;
            if (!canvas) return;

            if (this.charts.absolute) {
                this.charts.absolute.destroy();
            }

            const { a, b } = this.absolute;

            const xValues = [];
            const yValues = [];

            for (let x = -10; x <= 10; x += 0.1) {
                xValues.push(x);
                yValues.push(Math.abs(a * x + b));
            }

            this.charts.absolute = new Chart(canvas, {
                type: 'line',
                data: {
                    labels: xValues,
                    datasets: [{
                        label: `y = |${a}x + ${b}|`,
                        data: yValues,
                        borderColor: '#4285F4',
                        backgroundColor: 'transparent',
                        borderWidth: 2,
                        pointRadius: 0
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        x: {
                            type: 'linear',
                            title: {
                                display: true,
                                text: 'x'
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: 'y'
                            }
                        }
                    }
                }
            });
        },

        // Квадратные уравнения
        drawQuadratic() {
            const canvas = this.$refs.quadraticChart;
            if (!canvas) return;

            if (this.charts.quadratic) {
                this.charts.quadratic.destroy();
            }

            const { a, b, c } = this.quadratic;

            const xValues = [];
            const yValues = [];

            for (let x = -10; x <= 10; x += 0.1) {
                xValues.push(x);
                yValues.push(a * x * x + b * x + c);
            }

            const datasets = [{
                label: `y = ${a}x² + ${b}x + ${c}`,
                data: yValues,
                borderColor: '#4285F4',
                backgroundColor: 'transparent',
                borderWidth: 2,
                pointRadius: 0
            }];

            // Добавляем точки корней если есть
            if (this.discriminant >= 0) {
                const x1 = (-b + Math.sqrt(this.discriminant)) / (2 * a);
                const x2 = (-b - Math.sqrt(this.discriminant)) / (2 * a);

                const rootsX = [x1];
                const rootsY = [0];

                if (Math.abs(this.discriminant) > 0.0001) {
                    rootsX.push(x2);
                    rootsY.push(0);
                }

                datasets.push({
                    label: 'Корни',
                    data: rootsY,
                    backgroundColor: '#EA4335',
                    borderColor: '#EA4335',
                    pointRadius: 8,
                    showLine: false,
                    parsing: false,
                    normalized: true
                });
            }

            this.charts.quadratic = new Chart(canvas, {
                type: 'line',
                data: {
                    labels: xValues,
                    datasets: datasets
                },
                options: {
                    responsive: true,
                    scales: {
                        x: {
                            type: 'linear',
                            title: {
                                display: true,
                                text: 'x'
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: 'y'
                            }
                        }
                    }
                }
            });
        },

        // Утилиты
        gcd(a, b) {
            return b === 0 ? a : this.gcd(b, a % b);
        }
    },
    beforeUnmount() {
        // Очистка графиков
        Object.values(this.charts).forEach(chart => {
            if (chart) chart.destroy();
        });
    }
};
</script>

<style scoped>
.school-math {
    height: 100%;
    display: flex;
    flex-direction: column;
}

.tabs {
    display: flex;
    gap: 5px;
    padding: 10px;
    background: var(--bg-secondary);
    border-bottom: 1px solid var(--border-color);
    overflow-x: auto;
}

.tab {
    padding: 10px 20px;
    border: none;
    background: var(--card-bg);
    color: var(--text-color);
    border-radius: 4px 4px 0 0;
    cursor: pointer;
    white-space: nowrap;
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
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    background: var(--bg-color);
}

.visualizer {
    max-width: 1000px;
    margin: 0 auto;
}

.visualizer h2 {
    color: var(--text-color);
    margin-bottom: 20px;
}

.controls {
    background: var(--card-bg);
    padding: 20px;
    border-radius: 8px;
    margin-bottom: 20px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.controls label {
    display: block;
    margin-bottom: 10px;
    color: var(--text-color);
}

.controls input,
.controls select {
    padding: 8px;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    background: var(--bg-color);
    color: var(--text-color);
    margin-left: 10px;
}

.controls input[type="text"] {
    width: 300px;
}

.controls input[type="number"] {
    width: 100px;
}

.fraction-input {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    margin: 0 10px;
}

.fraction-line {
    width: 60px;
    height: 2px;
    background: var(--text-color);
    margin: 2px 0;
}

.num-input {
    width: 60px !important;
    text-align: center;
    margin: 0 !important;
}

.fraction-result {
    display: inline-block;
    padding: 10px;
    background: var(--bg-secondary);
    border-radius: 4px;
    font-weight: bold;
    margin-left: 10px;
}

.proportion-input {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 15px;
}

.proportion-input input {
    width: 80px !important;
}

.equation-input {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 15px;
}

.coef {
    width: 80px !important;
}

.result {
    margin-top: 15px;
    padding: 15px;
    background: var(--bg-secondary);
    border-radius: 4px;
    font-size: 16px;
    color: var(--text-color);
    font-weight: bold;
}

.number-line-svg,
.fraction-svg,
.proportion-svg,
.inequality-svg {
    background: white;
    border-radius: 8px;
    border: 1px solid var(--border-color);
}

.chart-container {
    max-width: 600px;
    margin: 0 auto;
}

canvas {
    max-height: 400px;
}
</style>
