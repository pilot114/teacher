<template>
    <div class="trigonometry">
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
            <!-- Единичная окружность -->
            <div v-if="activeTab === 'unitCircle'" class="visualizer">
                <h2>Единичная окружность</h2>
                <div class="controls">
                    <label>
                        Угол (градусы):
                        <input v-model.number="unitCircle.degrees" type="number" step="1" @input="updateUnitCircleFromDegrees">
                    </label>
                    <label>
                        Угол (радианы):
                        <input v-model.number="unitCircle.radians" type="number" step="0.1" @input="updateUnitCircleFromRadians">
                    </label>
                    <div class="trig-values">
                        <div>sin(θ) = {{ unitCircle.sin }}</div>
                        <div>cos(θ) = {{ unitCircle.cos }}</div>
                        <div>tg(θ) = {{ unitCircle.tan }}</div>
                        <div>ctg(θ) = {{ unitCircle.cot }}</div>
                    </div>
                </div>
                <canvas ref="unitCircleCanvas" width="600" height="600" @click="handleUnitCircleClick"></canvas>
            </div>

            <!-- Тригонометрический круг -->
            <div v-if="activeTab === 'trigCircle'" class="visualizer">
                <h2>Тригонометрический круг</h2>
                <div class="controls">
                    <label>
                        Угол (градусы):
                        <input v-model.number="trigCircle.degrees" type="number" step="1" @input="updateTrigCircle">
                    </label>
                    <label>
                        <input type="checkbox" v-model="trigCircle.showQuadrants">
                        Показать квадранты
                    </label>
                    <label>
                        <input type="checkbox" v-model="trigCircle.showSpecialAngles">
                        Показать особые углы
                    </label>
                </div>
                <div class="quadrant-info">
                    <div>Квадрант: {{ currentQuadrant }}</div>
                    <div>Знаки: sin {{ sinSign }}, cos {{ cosSign }}, tg {{ tanSign }}</div>
                </div>
                <canvas ref="trigCircleCanvas" width="700" height="700"></canvas>
            </div>

            <!-- Графики тригонометрических функций -->
            <div v-if="activeTab === 'graphs'" class="visualizer">
                <h2>Графики тригонометрических функций</h2>
                <div class="controls">
                    <label>
                        Функция:
                        <select v-model="graphs.selectedFunction">
                            <option value="sin">sin(x)</option>
                            <option value="cos">cos(x)</option>
                            <option value="tan">tg(x)</option>
                            <option value="cot">ctg(x)</option>
                            <option value="asin">arcsin(x)</option>
                            <option value="acos">arccos(x)</option>
                            <option value="atan">arctg(x)</option>
                        </select>
                    </label>
                    <label>
                        <input type="checkbox" v-model="graphs.showMultiple">
                        Показать все основные
                    </label>
                </div>
                <canvas ref="graphsCanvas" width="800" height="500"></canvas>
            </div>

            <!-- Амплитуда, период, фаза -->
            <div v-if="activeTab === 'transform'" class="visualizer">
                <h2>Преобразования: y = A·sin(B·x + C) + D</h2>
                <div class="controls">
                    <label>
                        Амплитуда A:
                        <input v-model.number="transform.amplitude" type="range" min="0.1" max="5" step="0.1">
                        {{ transform.amplitude }}
                    </label>
                    <label>
                        Частота B (влияет на период):
                        <input v-model.number="transform.frequency" type="range" min="0.1" max="5" step="0.1">
                        {{ transform.frequency }}
                        <span class="info">(Период = {{ (2 * Math.PI / transform.frequency).toFixed(2) }})</span>
                    </label>
                    <label>
                        Фаза C:
                        <input v-model.number="transform.phase" type="range" min="-3.14" max="3.14" step="0.1">
                        {{ transform.phase }}
                    </label>
                    <label>
                        Сдвиг D:
                        <input v-model.number="transform.shift" type="range" min="-3" max="3" step="0.1">
                        {{ transform.shift }}
                    </label>
                    <div class="formula">
                        y = {{ transform.amplitude }} · sin({{ transform.frequency }} · x + {{ transform.phase }}) + {{ transform.shift }}
                    </div>
                </div>
                <canvas ref="transformCanvas" width="800" height="500"></canvas>
            </div>

            <!-- Тригонометрические уравнения -->
            <div v-if="activeTab === 'equations'" class="visualizer">
                <h2>Тригонометрические уравнения</h2>
                <div class="controls">
                    <div class="equation-select">
                        <label>
                            Тип уравнения:
                            <select v-model="equations.type">
                                <option value="sin">sin(x) = a</option>
                                <option value="cos">cos(x) = a</option>
                                <option value="tan">tg(x) = a</option>
                            </select>
                        </label>
                        <label>
                            Значение a:
                            <input v-model.number="equations.value" type="range" min="-1" max="1" step="0.1">
                            {{ equations.value }}
                        </label>
                    </div>
                    <div class="solutions">
                        <h4>Решения на интервале [0, 2π]:</h4>
                        <div>{{ equationSolutions }}</div>
                    </div>
                </div>
                <canvas ref="equationsCanvas" width="800" height="500"></canvas>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'Trigonometry',
    data() {
        return {
            activeTab: 'unitCircle',
            tabs: [
                { id: 'unitCircle', label: 'Единичная окружность' },
                { id: 'trigCircle', label: 'Тригонометрический круг' },
                { id: 'graphs', label: 'Графики функций' },
                { id: 'transform', label: 'Амплитуда, период, фаза' },
                { id: 'equations', label: 'Уравнения' }
            ],
            unitCircle: {
                degrees: 45,
                radians: Math.PI / 4,
                sin: 0.707,
                cos: 0.707,
                tan: 1,
                cot: 1
            },
            trigCircle: {
                degrees: 45,
                showQuadrants: true,
                showSpecialAngles: true
            },
            graphs: {
                selectedFunction: 'sin',
                showMultiple: false
            },
            transform: {
                amplitude: 1,
                frequency: 1,
                phase: 0,
                shift: 0
            },
            equations: {
                type: 'sin',
                value: 0.5
            }
        };
    },
    computed: {
        currentQuadrant() {
            const deg = ((this.trigCircle.degrees % 360) + 360) % 360;
            if (deg >= 0 && deg < 90) return 'I';
            if (deg >= 90 && deg < 180) return 'II';
            if (deg >= 180 && deg < 270) return 'III';
            return 'IV';
        },
        sinSign() {
            const q = this.currentQuadrant;
            return (q === 'I' || q === 'II') ? '+' : '-';
        },
        cosSign() {
            const q = this.currentQuadrant;
            return (q === 'I' || q === 'IV') ? '+' : '-';
        },
        tanSign() {
            const q = this.currentQuadrant;
            return (q === 'I' || q === 'III') ? '+' : '-';
        },
        equationSolutions() {
            const { type, value } = this.equations;
            const solutions = [];

            if (type === 'sin') {
                if (Math.abs(value) <= 1) {
                    const x1 = Math.asin(value);
                    const x2 = Math.PI - x1;
                    if (x1 >= 0 && x1 <= 2 * Math.PI) solutions.push(x1);
                    if (x2 >= 0 && x2 <= 2 * Math.PI && Math.abs(x2 - x1) > 0.001) solutions.push(x2);
                }
            } else if (type === 'cos') {
                if (Math.abs(value) <= 1) {
                    const x1 = Math.acos(value);
                    const x2 = 2 * Math.PI - x1;
                    if (x1 >= 0 && x1 <= 2 * Math.PI) solutions.push(x1);
                    if (x2 >= 0 && x2 <= 2 * Math.PI && Math.abs(x2 - x1) > 0.001) solutions.push(x2);
                }
            } else if (type === 'tan') {
                const x1 = Math.atan(value);
                const x2 = x1 + Math.PI;
                if (x1 >= 0 && x1 <= 2 * Math.PI) solutions.push(x1);
                if (x2 >= 0 && x2 <= 2 * Math.PI) solutions.push(x2);
            }

            if (solutions.length === 0) return 'Нет решений на данном интервале';
            return solutions.map(x => `x = ${x.toFixed(3)} (${(x * 180 / Math.PI).toFixed(1)}°)`).join(', ');
        }
    },
    mounted() {
        this.drawUnitCircle();
        this.drawTrigCircle();
        this.drawGraphs();
        this.drawTransform();
        this.drawEquations();
    },
    watch: {
        activeTab() {
            this.$nextTick(() => {
                this.drawUnitCircle();
                this.drawTrigCircle();
                this.drawGraphs();
                this.drawTransform();
                this.drawEquations();
            });
        },
        'unitCircle.degrees': 'drawUnitCircle',
        'unitCircle.radians': 'drawUnitCircle',
        'trigCircle.degrees': 'drawTrigCircle',
        'trigCircle.showQuadrants': 'drawTrigCircle',
        'trigCircle.showSpecialAngles': 'drawTrigCircle',
        'graphs.selectedFunction': 'drawGraphs',
        'graphs.showMultiple': 'drawGraphs',
        'transform.amplitude': 'drawTransform',
        'transform.frequency': 'drawTransform',
        'transform.phase': 'drawTransform',
        'transform.shift': 'drawTransform',
        'equations.type': 'drawEquations',
        'equations.value': 'drawEquations'
    },
    methods: {
        updateUnitCircleFromDegrees() {
            this.unitCircle.radians = this.unitCircle.degrees * Math.PI / 180;
            this.updateTrigValues();
        },
        updateUnitCircleFromRadians() {
            this.unitCircle.degrees = this.unitCircle.radians * 180 / Math.PI;
            this.updateTrigValues();
        },
        updateTrigValues() {
            const rad = this.unitCircle.radians;
            this.unitCircle.sin = Math.sin(rad).toFixed(3);
            this.unitCircle.cos = Math.cos(rad).toFixed(3);
            this.unitCircle.tan = Math.abs(Math.cos(rad)) > 0.001 ? Math.tan(rad).toFixed(3) : '∞';
            this.unitCircle.cot = Math.abs(Math.sin(rad)) > 0.001 ? (1 / Math.tan(rad)).toFixed(3) : '∞';
        },
        updateTrigCircle() {
            // Просто перерисовываем круг при изменении угла
        },
        handleUnitCircleClick(event) {
            const canvas = this.$refs.unitCircleCanvas;
            if (!canvas) return;

            const rect = canvas.getBoundingClientRect();
            const x = event.clientX - rect.left - canvas.width / 2;
            const y = -(event.clientY - rect.top - canvas.height / 2);

            const angle = Math.atan2(y, x);
            this.unitCircle.radians = angle;
            this.unitCircle.degrees = angle * 180 / Math.PI;
            this.updateTrigValues();
        },
        drawUnitCircle() {
            const canvas = this.$refs.unitCircleCanvas;
            if (!canvas) return;

            const ctx = canvas.getContext('2d');
            const width = canvas.width;
            const height = canvas.height;
            const centerX = width / 2;
            const centerY = height / 2;
            const radius = 200;

            ctx.clearRect(0, 0, width, height);

            // Координатные оси
            ctx.strokeStyle = '#666';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, centerY);
            ctx.lineTo(width, centerY);
            ctx.moveTo(centerX, 0);
            ctx.lineTo(centerX, height);
            ctx.stroke();

            // Окружность
            ctx.strokeStyle = '#4285F4';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
            ctx.stroke();

            // Угол
            const angle = this.unitCircle.radians;
            const x = Math.cos(angle) * radius;
            const y = -Math.sin(angle) * radius;

            // Радиус к точке
            ctx.strokeStyle = '#EA4335';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(centerX + x, centerY + y);
            ctx.stroke();

            // Точка на окружности
            ctx.fillStyle = '#EA4335';
            ctx.beginPath();
            ctx.arc(centerX + x, centerY + y, 6, 0, 2 * Math.PI);
            ctx.fill();

            // Проекция на ось X (cos)
            ctx.strokeStyle = '#34A853';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(centerX + x, centerY);
            ctx.stroke();

            // Проекция на ось Y (sin)
            ctx.strokeStyle = '#FBBC04';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(centerX + x, centerY);
            ctx.lineTo(centerX + x, centerY + y);
            ctx.stroke();

            // Подписи
            ctx.fillStyle = '#333';
            ctx.font = '14px Arial';
            ctx.fillText('cos(θ)', centerX + x / 2 - 20, centerY + 20);
            ctx.fillText('sin(θ)', centerX + x + 10, centerY + y / 2);
            ctx.fillText(`θ = ${this.unitCircle.degrees.toFixed(1)}°`, centerX + 10, centerY - 10);

            // Метки на осях
            ctx.fillText('1', centerX + radius + 10, centerY - 5);
            ctx.fillText('-1', centerX - radius - 20, centerY - 5);
            ctx.fillText('1', centerX + 5, centerY - radius - 10);
            ctx.fillText('-1', centerX + 5, centerY + radius + 15);
        },
        drawTrigCircle() {
            const canvas = this.$refs.trigCircleCanvas;
            if (!canvas) return;

            const ctx = canvas.getContext('2d');
            const width = canvas.width;
            const height = canvas.height;
            const centerX = width / 2;
            const centerY = height / 2;
            const radius = 250;

            ctx.clearRect(0, 0, width, height);

            // Квадранты
            if (this.trigCircle.showQuadrants) {
                ctx.fillStyle = 'rgba(66, 133, 244, 0.1)';
                ctx.beginPath();
                ctx.moveTo(centerX, centerY);
                ctx.arc(centerX, centerY, radius, 0, Math.PI / 2, false);
                ctx.closePath();
                ctx.fill();

                ctx.fillStyle = 'rgba(234, 67, 53, 0.1)';
                ctx.beginPath();
                ctx.moveTo(centerX, centerY);
                ctx.arc(centerX, centerY, radius, Math.PI / 2, Math.PI, false);
                ctx.closePath();
                ctx.fill();

                ctx.fillStyle = 'rgba(251, 188, 5, 0.1)';
                ctx.beginPath();
                ctx.moveTo(centerX, centerY);
                ctx.arc(centerX, centerY, radius, Math.PI, 3 * Math.PI / 2, false);
                ctx.closePath();
                ctx.fill();

                ctx.fillStyle = 'rgba(52, 168, 83, 0.1)';
                ctx.beginPath();
                ctx.moveTo(centerX, centerY);
                ctx.arc(centerX, centerY, radius, 3 * Math.PI / 2, 2 * Math.PI, false);
                ctx.closePath();
                ctx.fill();

                // Подписи квадрантов
                ctx.fillStyle = '#333';
                ctx.font = 'bold 24px Arial';
                ctx.fillText('I', centerX + radius * 0.7, centerY - radius * 0.7);
                ctx.fillText('II', centerX - radius * 0.8, centerY - radius * 0.7);
                ctx.fillText('III', centerX - radius * 0.8, centerY + radius * 0.8);
                ctx.fillText('IV', centerX + radius * 0.7, centerY + radius * 0.8);
            }

            // Оси
            ctx.strokeStyle = '#666';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, centerY);
            ctx.lineTo(width, centerY);
            ctx.moveTo(centerX, 0);
            ctx.lineTo(centerX, height);
            ctx.stroke();

            // Окружность
            ctx.strokeStyle = '#4285F4';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
            ctx.stroke();

            // Особые углы
            if (this.trigCircle.showSpecialAngles) {
                const specialAngles = [0, 30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330];
                ctx.fillStyle = '#999';
                ctx.font = '12px Arial';

                specialAngles.forEach(deg => {
                    const rad = deg * Math.PI / 180;
                    const x = Math.cos(rad) * radius;
                    const y = -Math.sin(rad) * radius;

                    ctx.beginPath();
                    ctx.arc(centerX + x, centerY + y, 3, 0, 2 * Math.PI);
                    ctx.fill();

                    const labelX = centerX + Math.cos(rad) * (radius + 30);
                    const labelY = centerY - Math.sin(rad) * (radius + 30);
                    ctx.fillText(`${deg}°`, labelX - 15, labelY + 5);
                });
            }

            // Текущий угол
            const angle = this.trigCircle.degrees * Math.PI / 180;
            const x = Math.cos(angle) * radius;
            const y = -Math.sin(angle) * radius;

            // Сектор
            ctx.fillStyle = 'rgba(234, 67, 53, 0.2)';
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, 0, -angle, true);
            ctx.closePath();
            ctx.fill();

            // Радиус
            ctx.strokeStyle = '#EA4335';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(centerX + x, centerY + y);
            ctx.stroke();

            // Точка
            ctx.fillStyle = '#EA4335';
            ctx.beginPath();
            ctx.arc(centerX + x, centerY + y, 8, 0, 2 * Math.PI);
            ctx.fill();
        },
        drawGraphs() {
            const canvas = this.$refs.graphsCanvas;
            if (!canvas) return;

            const ctx = canvas.getContext('2d');
            const width = canvas.width;
            const height = canvas.height;

            ctx.clearRect(0, 0, width, height);

            const padding = 40;
            const graphWidth = width - 2 * padding;
            const graphHeight = height - 2 * padding;

            // Оси
            ctx.strokeStyle = '#666';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(padding, height / 2);
            ctx.lineTo(width - padding, height / 2);
            ctx.moveTo(padding, padding);
            ctx.lineTo(padding, height - padding);
            ctx.stroke();

            // Сетка
            ctx.strokeStyle = '#eee';
            ctx.lineWidth = 0.5;
            for (let i = 0; i <= 4; i++) {
                const y = padding + (graphHeight / 4) * i;
                ctx.beginPath();
                ctx.moveTo(padding, y);
                ctx.lineTo(width - padding, y);
                ctx.stroke();
            }

            const functions = this.graphs.showMultiple
                ? [
                    { name: 'sin', color: '#4285F4', func: Math.sin },
                    { name: 'cos', color: '#EA4335', func: Math.cos },
                    { name: 'tan', color: '#34A853', func: Math.tan },
                ]
                : [{ name: this.graphs.selectedFunction, color: '#4285F4', func: this.getTrigFunction(this.graphs.selectedFunction) }];

            functions.forEach(({ name, color, func }) => {
                ctx.strokeStyle = color;
                ctx.lineWidth = 2;
                ctx.beginPath();

                let started = false;
                for (let px = 0; px <= graphWidth; px++) {
                    const x = (px / graphWidth) * 4 * Math.PI - 2 * Math.PI;
                    let y = func(x);

                    // Ограничение для тангенса и котангенса
                    if (name === 'tan' || name === 'cot') {
                        if (Math.abs(y) > 10) {
                            started = false;
                            continue;
                        }
                    }

                    // Ограничение для обратных функций
                    if (name === 'asin' || name === 'acos') {
                        if (Math.abs(x) > 1) continue;
                    }

                    const screenX = padding + px;
                    const screenY = height / 2 - (y / 2) * (graphHeight / 4);

                    if (!started) {
                        ctx.moveTo(screenX, screenY);
                        started = true;
                    } else {
                        ctx.lineTo(screenX, screenY);
                    }
                }
                ctx.stroke();

                // Легенда
                if (this.graphs.showMultiple) {
                    ctx.fillStyle = color;
                    ctx.font = '14px Arial';
                    const legendX = width - padding - 60;
                    const legendY = padding + 20 + functions.indexOf({ name, color, func }) * 20;
                    ctx.fillText(name, legendX, legendY);
                }
            });

            // Подписи осей
            ctx.fillStyle = '#333';
            ctx.font = '12px Arial';
            ctx.fillText('0', padding - 10, height / 2 + 15);
            ctx.fillText('π', padding + graphWidth / 4, height / 2 + 15);
            ctx.fillText('2π', padding + graphWidth / 2, height / 2 + 15);
            ctx.fillText('-π', padding - 15, height / 2 + 15);
            ctx.fillText('1', padding - 20, height / 2 - graphHeight / 4);
            ctx.fillText('-1', padding - 25, height / 2 + graphHeight / 4);
        },
        getTrigFunction(name) {
            const funcs = {
                sin: Math.sin,
                cos: Math.cos,
                tan: Math.tan,
                cot: x => 1 / Math.tan(x),
                asin: Math.asin,
                acos: Math.acos,
                atan: Math.atan
            };
            return funcs[name] || Math.sin;
        },
        drawTransform() {
            const canvas = this.$refs.transformCanvas;
            if (!canvas) return;

            const ctx = canvas.getContext('2d');
            const width = canvas.width;
            const height = canvas.height;

            ctx.clearRect(0, 0, width, height);

            const padding = 40;
            const graphWidth = width - 2 * padding;
            const graphHeight = height - 2 * padding;
            const centerY = height / 2;

            // Оси
            ctx.strokeStyle = '#666';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(padding, centerY);
            ctx.lineTo(width - padding, centerY);
            ctx.moveTo(padding, padding);
            ctx.lineTo(padding, height - padding);
            ctx.stroke();

            // Оригинальный sin(x)
            ctx.strokeStyle = '#ccc';
            ctx.lineWidth = 1;
            ctx.beginPath();
            for (let px = 0; px <= graphWidth; px++) {
                const x = (px / graphWidth) * 4 * Math.PI - 2 * Math.PI;
                const y = Math.sin(x);
                const screenX = padding + px;
                const screenY = centerY - y * (graphHeight / 8);
                if (px === 0) ctx.moveTo(screenX, screenY);
                else ctx.lineTo(screenX, screenY);
            }
            ctx.stroke();

            // Преобразованная функция
            const { amplitude, frequency, phase, shift } = this.transform;
            ctx.strokeStyle = '#EA4335';
            ctx.lineWidth = 3;
            ctx.beginPath();
            for (let px = 0; px <= graphWidth; px++) {
                const x = (px / graphWidth) * 4 * Math.PI - 2 * Math.PI;
                const y = amplitude * Math.sin(frequency * x + phase) + shift;
                const screenX = padding + px;
                const screenY = centerY - y * (graphHeight / 8);
                if (px === 0) ctx.moveTo(screenX, screenY);
                else ctx.lineTo(screenX, screenY);
            }
            ctx.stroke();

            // Подписи
            ctx.fillStyle = '#333';
            ctx.font = '12px Arial';
            ctx.fillText('sin(x) - оригинал', padding + 10, padding + 15);
            ctx.fillStyle = '#EA4335';
            ctx.fillText('y = A·sin(B·x + C) + D', padding + 10, padding + 35);
        },
        drawEquations() {
            const canvas = this.$refs.equationsCanvas;
            if (!canvas) return;

            const ctx = canvas.getContext('2d');
            const width = canvas.width;
            const height = canvas.height;

            ctx.clearRect(0, 0, width, height);

            const padding = 40;
            const graphWidth = width - 2 * padding;
            const graphHeight = height - 2 * padding;
            const centerY = height / 2;

            // Оси
            ctx.strokeStyle = '#666';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(padding, centerY);
            ctx.lineTo(width - padding, centerY);
            ctx.moveTo(padding, padding);
            ctx.lineTo(padding, height - padding);
            ctx.stroke();

            // Функция
            const func = this.getTrigFunction(this.equations.type);
            ctx.strokeStyle = '#4285F4';
            ctx.lineWidth = 2;
            ctx.beginPath();

            let started = false;
            for (let px = 0; px <= graphWidth; px++) {
                const x = (px / graphWidth) * 2 * Math.PI;
                let y = func(x);

                if (this.equations.type === 'tan' && Math.abs(y) > 10) {
                    started = false;
                    continue;
                }

                const screenX = padding + px;
                const screenY = centerY - y * (graphHeight / 4);

                if (!started) {
                    ctx.moveTo(screenX, screenY);
                    started = true;
                } else {
                    ctx.lineTo(screenX, screenY);
                }
            }
            ctx.stroke();

            // Линия y = a
            const a = this.equations.value;
            const lineY = centerY - a * (graphHeight / 4);
            ctx.strokeStyle = '#EA4335';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(padding, lineY);
            ctx.lineTo(width - padding, lineY);
            ctx.stroke();
            ctx.setLineDash([]);

            // Точки решений
            const solutions = [];
            if (this.equations.type === 'sin' && Math.abs(a) <= 1) {
                const x1 = Math.asin(a);
                const x2 = Math.PI - x1;
                if (x1 >= 0 && x1 <= 2 * Math.PI) solutions.push(x1);
                if (x2 >= 0 && x2 <= 2 * Math.PI && Math.abs(x2 - x1) > 0.001) solutions.push(x2);
            } else if (this.equations.type === 'cos' && Math.abs(a) <= 1) {
                const x1 = Math.acos(a);
                const x2 = 2 * Math.PI - x1;
                if (x1 >= 0 && x1 <= 2 * Math.PI) solutions.push(x1);
                if (x2 >= 0 && x2 <= 2 * Math.PI && Math.abs(x2 - x1) > 0.001) solutions.push(x2);
            } else if (this.equations.type === 'tan') {
                const x1 = Math.atan(a);
                const x2 = x1 + Math.PI;
                if (x1 >= 0 && x1 <= 2 * Math.PI) solutions.push(x1);
                if (x2 >= 0 && x2 <= 2 * Math.PI) solutions.push(x2);
            }

            ctx.fillStyle = '#34A853';
            solutions.forEach(x => {
                const screenX = padding + (x / (2 * Math.PI)) * graphWidth;
                const screenY = lineY;
                ctx.beginPath();
                ctx.arc(screenX, screenY, 6, 0, 2 * Math.PI);
                ctx.fill();
            });

            // Подписи
            ctx.fillStyle = '#333';
            ctx.font = '14px Arial';
            ctx.fillText(`y = ${this.equations.type}(x)`, padding + 10, padding + 15);
            ctx.fillStyle = '#EA4335';
            ctx.fillText(`y = ${a}`, padding + 10, padding + 35);
        }
    }
};
</script>

<style scoped>
.trigonometry {
    display: flex;
    flex-direction: column;
    height: calc(100vh - 70px);
    background: var(--bg-color);
}

.tabs {
    display: flex;
    gap: 5px;
    padding: 20px 20px 0 20px;
    background: var(--bg-secondary);
    border-bottom: 1px solid var(--border-color);
}

.tab {
    padding: 12px 24px;
    border: none;
    background: var(--card-bg);
    color: var(--text-color);
    border-radius: 8px 8px 0 0;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s;
    white-space: nowrap;
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
}

.visualizer {
    max-width: 1000px;
    margin: 0 auto;
    background: var(--card-bg);
    border-radius: 8px;
    padding: 30px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.visualizer h2 {
    margin-top: 0;
    color: var(--text-color);
    font-size: 24px;
    margin-bottom: 20px;
}

.controls {
    margin-bottom: 25px;
    padding: 20px;
    background: var(--bg-color);
    border-radius: 8px;
}

.controls label {
    display: block;
    margin-bottom: 15px;
    color: var(--text-color);
    font-size: 14px;
    font-weight: 500;
}

.controls input[type="number"],
.controls input[type="range"],
.controls select {
    margin-left: 10px;
    padding: 6px 10px;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    background: var(--card-bg);
    color: var(--text-color);
    font-size: 14px;
}

.controls input[type="range"] {
    width: 200px;
    vertical-align: middle;
}

.controls input[type="checkbox"] {
    margin-left: 10px;
}

canvas {
    display: block;
    margin: 0 auto;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    background: white;
    cursor: crosshair;
}

.trig-values {
    margin-top: 15px;
    padding: 15px;
    background: var(--bg-secondary);
    border-radius: 6px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
}

.trig-values div {
    font-family: 'Courier New', monospace;
    font-size: 14px;
    color: var(--text-color);
}

.quadrant-info {
    margin-top: 10px;
    padding: 15px;
    background: var(--bg-secondary);
    border-radius: 6px;
}

.quadrant-info div {
    margin-bottom: 5px;
    font-size: 14px;
    color: var(--text-color);
}

.formula {
    margin-top: 15px;
    padding: 15px;
    background: var(--bg-secondary);
    border-radius: 6px;
    font-family: 'Courier New', monospace;
    font-size: 16px;
    color: var(--text-color);
    text-align: center;
}

.info {
    margin-left: 10px;
    color: var(--text-secondary);
    font-size: 12px;
}

.equation-select {
    display: flex;
    gap: 20px;
    margin-bottom: 15px;
}

.solutions {
    margin-top: 15px;
    padding: 15px;
    background: var(--bg-secondary);
    border-radius: 6px;
}

.solutions h4 {
    margin-top: 0;
    margin-bottom: 10px;
    color: var(--text-color);
}

.solutions div {
    font-family: 'Courier New', monospace;
    font-size: 14px;
    color: var(--text-color);
}

.result {
    margin-top: 10px;
    padding: 10px;
    background: var(--bg-secondary);
    border-radius: 4px;
    font-weight: 500;
    color: var(--text-color);
}
</style>
