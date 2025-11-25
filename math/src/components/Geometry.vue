<template>
    <div class="geometry">
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
            <!-- Примитивы: точки, прямые, отрезки, лучи -->
            <div v-if="activeTab === 'primitives'" class="visualizer">
                <h2>Примитивы: Точки, Прямые, Отрезки, Лучи</h2>
                <div class="controls">
                    <label>
                        Тип примитива:
                        <select v-model="primitives.type">
                            <option value="point">Точка</option>
                            <option value="line">Прямая</option>
                            <option value="segment">Отрезок</option>
                            <option value="ray">Луч</option>
                        </select>
                    </label>
                </div>
                <canvas ref="primitivesCanvas" class="geometry-canvas" width="800" height="600"></canvas>
            </div>

            <!-- Углы -->
            <div v-if="activeTab === 'angles'" class="visualizer">
                <h2>Углы (градусы и радианы)</h2>
                <div class="controls">
                    <label>
                        Угол (градусы):
                        <input v-model.number="angles.degrees" type="number" min="0" max="360">
                    </label>
                    <div class="result">
                        {{ angles.degrees }}° = {{ angleInRadians }} радиан
                    </div>
                    <div class="result">
                        Тип угла: {{ angleType }}
                    </div>
                </div>
                <canvas ref="anglesCanvas" class="geometry-canvas" width="800" height="600"></canvas>
            </div>

            <!-- Треугольники -->
            <div v-if="activeTab === 'triangles'" class="visualizer">
                <h2>Треугольники</h2>
                <div class="controls">
                    <label>
                        Режим:
                        <select v-model="triangles.mode">
                            <option value="types">Виды треугольников</option>
                            <option value="pythagoras">Теорема Пифагора</option>
                            <option value="similarity">Подобие треугольников</option>
                            <option value="area">Площадь треугольника</option>
                        </select>
                    </label>
                    <div v-if="triangles.mode === 'types'">
                        <label>
                            Тип:
                            <select v-model="triangles.triangleType">
                                <option value="equilateral">Равносторонний</option>
                                <option value="isosceles">Равнобедренный</option>
                                <option value="scalene">Разносторонний</option>
                                <option value="right">Прямоугольный</option>
                            </select>
                        </label>
                    </div>
                    <div v-if="triangles.mode === 'pythagoras'">
                        <label>Катет a: <input v-model.number="triangles.a" type="number" min="1"></label>
                        <label>Катет b: <input v-model.number="triangles.b" type="number" min="1"></label>
                        <div class="result">
                            Гипотенуза c = √(a² + b²) = {{ pythagorasResult }}
                        </div>
                    </div>
                    <div v-if="triangles.mode === 'area'">
                        <label>Основание: <input v-model.number="triangles.base" type="number" min="1"></label>
                        <label>Высота: <input v-model.number="triangles.height" type="number" min="1"></label>
                        <div class="result">
                            Площадь S = (основание × высота) / 2 = {{ triangleArea }}
                        </div>
                    </div>
                </div>
                <canvas ref="trianglesCanvas" class="geometry-canvas" width="800" height="600"></canvas>
            </div>

            <!-- Четырёхугольники -->
            <div v-if="activeTab === 'quadrilaterals'" class="visualizer">
                <h2>Четырёхугольники</h2>
                <div class="controls">
                    <label>
                        Тип:
                        <select v-model="quadrilaterals.type">
                            <option value="square">Квадрат</option>
                            <option value="rectangle">Прямоугольник</option>
                            <option value="rhombus">Ромб</option>
                            <option value="parallelogram">Параллелограмм</option>
                            <option value="trapezoid">Трапеция</option>
                        </select>
                    </label>
                    <div v-if="quadrilaterals.type === 'square'">
                        <label>Сторона: <input v-model.number="quadrilaterals.side" type="number" min="1"></label>
                        <div class="result">Площадь: {{ quadrilaterals.side * quadrilaterals.side }}</div>
                        <div class="result">Периметр: {{ 4 * quadrilaterals.side }}</div>
                    </div>
                    <div v-if="quadrilaterals.type === 'rectangle'">
                        <label>Ширина: <input v-model.number="quadrilaterals.width" type="number" min="1"></label>
                        <label>Высота: <input v-model.number="quadrilaterals.height" type="number" min="1"></label>
                        <div class="result">Площадь: {{ quadrilaterals.width * quadrilaterals.height }}</div>
                        <div class="result">Периметр: {{ 2 * (quadrilaterals.width + quadrilaterals.height) }}</div>
                    </div>
                </div>
                <canvas ref="quadrilateralsCanvas" class="geometry-canvas" width="800" height="600"></canvas>
            </div>

            <!-- Окружность и круг -->
            <div v-if="activeTab === 'circles'" class="visualizer">
                <h2>Окружность и круг</h2>
                <div class="controls">
                    <label>
                        Режим:
                        <select v-model="circles.mode">
                            <option value="basic">Радиус, диаметр, хорда</option>
                            <option value="formulas">Длина окружности и площадь</option>
                            <option value="angles">Центральный и вписанный углы</option>
                        </select>
                    </label>
                    <label>
                        Радиус:
                        <input v-model.number="circles.radius" type="number" min="10" max="200">
                    </label>
                    <div v-if="circles.mode === 'formulas'">
                        <div class="result">Диаметр d = 2r = {{ 2 * circles.radius }}</div>
                        <div class="result">Длина окружности C = 2πr = {{ (2 * Math.PI * circles.radius).toFixed(2) }}</div>
                        <div class="result">Площадь круга S = πr² = {{ (Math.PI * circles.radius * circles.radius).toFixed(2) }}</div>
                    </div>
                    <div v-if="circles.mode === 'angles'">
                        <label>
                            Центральный угол (°):
                            <input v-model.number="circles.centralAngle" type="number" min="0" max="360">
                        </label>
                        <div class="result">Вписанный угол = {{ circles.centralAngle / 2 }}°</div>
                    </div>
                </div>
                <canvas ref="circlesCanvas" class="geometry-canvas" width="800" height="600"></canvas>
            </div>

            <!-- Многоугольники -->
            <div v-if="activeTab === 'polygons'" class="visualizer">
                <h2>Многоугольники</h2>
                <div class="controls">
                    <label>
                        Количество сторон:
                        <input v-model.number="polygons.sides" type="number" min="3" max="12">
                    </label>
                    <label>
                        Радиус описанной окружности:
                        <input v-model.number="polygons.radius" type="number" min="50" max="200">
                    </label>
                    <div class="result">
                        {{ polygonName }} ({{ polygons.sides }} сторон)
                    </div>
                    <div class="result">
                        Сумма внутренних углов: {{ (polygons.sides - 2) * 180 }}°
                    </div>
                    <div class="result">
                        Внутренний угол: {{ ((polygons.sides - 2) * 180 / polygons.sides).toFixed(2) }}°
                    </div>
                </div>
                <canvas ref="polygonsCanvas" class="geometry-canvas" width="800" height="600"></canvas>
            </div>

            <!-- Векторы -->
            <div v-if="activeTab === 'vectors'" class="visualizer">
                <h2>Векторы на плоскости</h2>
                <div class="controls">
                    <label>
                        Режим:
                        <select v-model="vectors.mode">
                            <option value="basic">Основы</option>
                            <option value="addition">Сложение векторов</option>
                            <option value="scalar">Умножение на скаляр</option>
                            <option value="dot">Скалярное произведение</option>
                        </select>
                    </label>
                    <div class="vector-controls">
                        <div>
                            <h4>Вектор A</h4>
                            <label>x: <input v-model.number="vectors.a.x" type="number" step="0.5"></label>
                            <label>y: <input v-model.number="vectors.a.y" type="number" step="0.5"></label>
                        </div>
                        <div v-if="vectors.mode !== 'scalar'">
                            <h4>Вектор B</h4>
                            <label>x: <input v-model.number="vectors.b.x" type="number" step="0.5"></label>
                            <label>y: <input v-model.number="vectors.b.y" type="number" step="0.5"></label>
                        </div>
                        <div v-if="vectors.mode === 'scalar'">
                            <h4>Скаляр</h4>
                            <label>k: <input v-model.number="vectors.scalar" type="number" step="0.5"></label>
                        </div>
                    </div>
                    <div v-if="vectors.mode === 'addition'" class="result">
                        A + B = ({{ vectors.a.x + vectors.b.x }}, {{ vectors.a.y + vectors.b.y }})
                    </div>
                    <div v-if="vectors.mode === 'scalar'" class="result">
                        k × A = ({{ vectors.scalar * vectors.a.x }}, {{ vectors.scalar * vectors.a.y }})
                    </div>
                    <div v-if="vectors.mode === 'dot'" class="result">
                        A · B = {{ vectors.a.x * vectors.b.x + vectors.a.y * vectors.b.y }}
                    </div>
                </div>
                <canvas ref="vectorsCanvas" class="geometry-canvas" width="800" height="600"></canvas>
            </div>

            <!-- Преобразования -->
            <div v-if="activeTab === 'transformations'" class="visualizer">
                <h2>Преобразования плоскости</h2>
                <div class="controls">
                    <label>
                        Тип преобразования:
                        <select v-model="transformations.type">
                            <option value="translation">Параллельный перенос</option>
                            <option value="rotation">Поворот</option>
                            <option value="reflection">Симметрия (осевая)</option>
                            <option value="central">Симметрия (центральная)</option>
                            <option value="homothety">Гомотетия</option>
                        </select>
                    </label>
                    <div v-if="transformations.type === 'translation'">
                        <label>Смещение X: <input v-model.number="transformations.tx" type="number" step="10"></label>
                        <label>Смещение Y: <input v-model.number="transformations.ty" type="number" step="10"></label>
                    </div>
                    <div v-if="transformations.type === 'rotation'">
                        <label>Угол (°): <input v-model.number="transformations.angle" type="number" min="0" max="360"></label>
                    </div>
                    <div v-if="transformations.type === 'homothety'">
                        <label>Коэффициент: <input v-model.number="transformations.scale" type="number" step="0.1" min="0.1" max="3"></label>
                    </div>
                </div>
                <canvas ref="transformationsCanvas" class="geometry-canvas" width="800" height="600"></canvas>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'Geometry',
    data() {
        return {
            activeTab: 'primitives',
            tabs: [
                { id: 'primitives', label: 'Примитивы' },
                { id: 'angles', label: 'Углы' },
                { id: 'triangles', label: 'Треугольники' },
                { id: 'quadrilaterals', label: 'Четырёхугольники' },
                { id: 'circles', label: 'Окружность' },
                { id: 'polygons', label: 'Многоугольники' },
                { id: 'vectors', label: 'Векторы' },
                { id: 'transformations', label: 'Преобразования' }
            ],
            primitives: {
                type: 'point'
            },
            angles: {
                degrees: 45
            },
            triangles: {
                mode: 'types',
                triangleType: 'equilateral',
                a: 3,
                b: 4,
                base: 100,
                height: 80
            },
            quadrilaterals: {
                type: 'square',
                side: 100,
                width: 150,
                height: 100
            },
            circles: {
                mode: 'basic',
                radius: 100,
                centralAngle: 60
            },
            polygons: {
                sides: 6,
                radius: 150
            },
            vectors: {
                mode: 'basic',
                a: { x: 3, y: 2 },
                b: { x: 1, y: 3 },
                scalar: 2
            },
            transformations: {
                type: 'translation',
                tx: 50,
                ty: 30,
                angle: 45,
                scale: 1.5
            }
        };
    },
    computed: {
        angleInRadians() {
            return (this.angles.degrees * Math.PI / 180).toFixed(4);
        },
        angleType() {
            const deg = this.angles.degrees % 360;
            if (deg === 0) return 'Нулевой угол';
            if (deg < 90) return 'Острый угол';
            if (deg === 90) return 'Прямой угол';
            if (deg < 180) return 'Тупой угол';
            if (deg === 180) return 'Развёрнутый угол';
            return 'Больше развёрнутого';
        },
        pythagorasResult() {
            const { a, b } = this.triangles;
            return Math.sqrt(a * a + b * b).toFixed(2);
        },
        triangleArea() {
            return (this.triangles.base * this.triangles.height / 2).toFixed(2);
        },
        polygonName() {
            const names = {
                3: 'Треугольник',
                4: 'Четырёхугольник',
                5: 'Пятиугольник',
                6: 'Шестиугольник',
                7: 'Семиугольник',
                8: 'Восьмиугольник',
                9: 'Девятиугольник',
                10: 'Десятиугольник',
                11: 'Одиннадцатиугольник',
                12: 'Двенадцатиугольник'
            };
            return names[this.polygons.sides] || `${this.polygons.sides}-угольник`;
        }
    },
    watch: {
        activeTab() {
            this.$nextTick(() => {
                this.renderCurrentVisualization();
            });
        },
        primitives: {
            deep: true,
            handler() {
                this.drawPrimitives();
            }
        },
        angles: {
            deep: true,
            handler() {
                this.drawAngles();
            }
        },
        triangles: {
            deep: true,
            handler() {
                this.drawTriangles();
            }
        },
        quadrilaterals: {
            deep: true,
            handler() {
                this.drawQuadrilaterals();
            }
        },
        circles: {
            deep: true,
            handler() {
                this.drawCircles();
            }
        },
        polygons: {
            deep: true,
            handler() {
                this.drawPolygons();
            }
        },
        vectors: {
            deep: true,
            handler() {
                this.drawVectors();
            }
        },
        transformations: {
            deep: true,
            handler() {
                this.drawTransformations();
            }
        }
    },
    mounted() {
        this.renderCurrentVisualization();
    },
    methods: {
        renderCurrentVisualization() {
            switch (this.activeTab) {
                case 'primitives':
                    this.drawPrimitives();
                    break;
                case 'angles':
                    this.drawAngles();
                    break;
                case 'triangles':
                    this.drawTriangles();
                    break;
                case 'quadrilaterals':
                    this.drawQuadrilaterals();
                    break;
                case 'circles':
                    this.drawCircles();
                    break;
                case 'polygons':
                    this.drawPolygons();
                    break;
                case 'vectors':
                    this.drawVectors();
                    break;
                case 'transformations':
                    this.drawTransformations();
                    break;
            }
        },

        // Вспомогательные методы для рисования
        getCanvas(ref) {
            const canvas = this.$refs[ref];
            if (!canvas) return null;
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            return { canvas, ctx };
        },

        drawGrid(ctx, width, height) {
            ctx.strokeStyle = '#e0e0e0';
            ctx.lineWidth = 1;

            // Вертикальные линии
            for (let x = 0; x <= width; x += 50) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, height);
                ctx.stroke();
            }

            // Горизонтальные линии
            for (let y = 0; y <= height; y += 50) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(width, y);
                ctx.stroke();
            }

            // Оси координат
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 2;
            const cx = width / 2;
            const cy = height / 2;

            // Ось X
            ctx.beginPath();
            ctx.moveTo(0, cy);
            ctx.lineTo(width, cy);
            ctx.stroke();

            // Ось Y
            ctx.beginPath();
            ctx.moveTo(cx, 0);
            ctx.lineTo(cx, height);
            ctx.stroke();
        },

        // Примитивы
        drawPrimitives() {
            const result = this.getCanvas('primitivesCanvas');
            if (!result) return;
            const { ctx, canvas } = result;

            this.drawGrid(ctx, canvas.width, canvas.height);

            const cx = canvas.width / 2;
            const cy = canvas.height / 2;

            ctx.strokeStyle = '#4285F4';
            ctx.fillStyle = '#4285F4';
            ctx.lineWidth = 3;

            switch (this.primitives.type) {
                case 'point':
                    // Несколько точек
                    const points = [
                        { x: cx, y: cy, label: 'A' },
                        { x: cx + 100, y: cy - 50, label: 'B' },
                        { x: cx - 80, y: cy + 60, label: 'C' }
                    ];
                    points.forEach(p => {
                        ctx.beginPath();
                        ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.fillText(p.label, p.x + 10, p.y - 10);
                    });
                    break;

                case 'line':
                    // Прямая через две точки
                    ctx.beginPath();
                    ctx.moveTo(50, cy - 100);
                    ctx.lineTo(canvas.width - 50, cy + 100);
                    ctx.stroke();

                    // Точки на прямой
                    ctx.fillStyle = '#EA4335';
                    ctx.beginPath();
                    ctx.arc(cx - 100, cy - 50, 5, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.beginPath();
                    ctx.arc(cx + 100, cy + 50, 5, 0, Math.PI * 2);
                    ctx.fill();

                    ctx.fillStyle = '#000';
                    ctx.fillText('Прямая AB', cx, cy - 120);
                    break;

                case 'segment':
                    // Отрезок
                    const x1 = cx - 150, y1 = cy;
                    const x2 = cx + 150, y2 = cy;

                    ctx.beginPath();
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);
                    ctx.stroke();

                    // Концы отрезка
                    ctx.fillStyle = '#EA4335';
                    ctx.beginPath();
                    ctx.arc(x1, y1, 6, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.beginPath();
                    ctx.arc(x2, y2, 6, 0, Math.PI * 2);
                    ctx.fill();

                    ctx.fillStyle = '#000';
                    ctx.fillText('A', x1 - 20, y1 - 10);
                    ctx.fillText('B', x2 + 10, y2 - 10);
                    ctx.fillText('Отрезок AB', cx, cy - 30);
                    break;

                case 'ray':
                    // Луч
                    const startX = cx - 100, startY = cy;
                    const dirX = 250, dirY = -100;

                    ctx.beginPath();
                    ctx.moveTo(startX, startY);
                    ctx.lineTo(startX + dirX, startY + dirY);
                    ctx.stroke();

                    // Начало луча
                    ctx.fillStyle = '#EA4335';
                    ctx.beginPath();
                    ctx.arc(startX, startY, 6, 0, Math.PI * 2);
                    ctx.fill();

                    ctx.fillStyle = '#000';
                    ctx.fillText('A', startX - 20, startY + 20);
                    ctx.fillText('Луч AB', cx, cy - 80);
                    break;
            }
        },

        // Углы
        drawAngles() {
            const result = this.getCanvas('anglesCanvas');
            if (!result) return;
            const { ctx, canvas } = result;

            this.drawGrid(ctx, canvas.width, canvas.height);

            const cx = canvas.width / 2;
            const cy = canvas.height / 2;
            const radius = 150;

            // Лучи угла
            ctx.strokeStyle = '#4285F4';
            ctx.lineWidth = 3;

            // Первый луч (горизонтальный)
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + radius, cy);
            ctx.stroke();

            // Второй луч под углом
            const angleRad = this.angles.degrees * Math.PI / 180;
            const x2 = cx + radius * Math.cos(angleRad);
            const y2 = cy - radius * Math.sin(angleRad);

            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(x2, y2);
            ctx.stroke();

            // Дуга угла
            ctx.strokeStyle = '#EA4335';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(cx, cy, 50, -angleRad, 0);
            ctx.stroke();

            // Точки
            ctx.fillStyle = '#333';
            ctx.font = '16px Arial';
            ctx.fillText('O', cx - 20, cy + 20);
            ctx.fillText('A', cx + radius + 10, cy + 5);
            ctx.fillText('B', x2 + 10, y2);
            ctx.fillText(`${this.angles.degrees}°`, cx + 60, cy - 10);
        },

        // Треугольники
        drawTriangles() {
            const result = this.getCanvas('trianglesCanvas');
            if (!result) return;
            const { ctx, canvas } = result;

            this.drawGrid(ctx, canvas.width, canvas.height);

            const cx = canvas.width / 2;
            const cy = canvas.height / 2;

            ctx.strokeStyle = '#4285F4';
            ctx.fillStyle = 'rgba(66, 133, 244, 0.2)';
            ctx.lineWidth = 3;

            if (this.triangles.mode === 'types') {
                let p1, p2, p3;

                switch (this.triangles.triangleType) {
                    case 'equilateral':
                        // Равносторонний
                        const side = 200;
                        const h = side * Math.sqrt(3) / 2;
                        p1 = { x: cx, y: cy - h / 2 };
                        p2 = { x: cx - side / 2, y: cy + h / 2 };
                        p3 = { x: cx + side / 2, y: cy + h / 2 };
                        break;

                    case 'isosceles':
                        // Равнобедренный
                        p1 = { x: cx, y: cy - 100 };
                        p2 = { x: cx - 80, y: cy + 100 };
                        p3 = { x: cx + 80, y: cy + 100 };
                        break;

                    case 'scalene':
                        // Разносторонний
                        p1 = { x: cx - 50, y: cy - 80 };
                        p2 = { x: cx - 120, y: cy + 80 };
                        p3 = { x: cx + 100, y: cy + 60 };
                        break;

                    case 'right':
                        // Прямоугольный
                        p1 = { x: cx - 100, y: cy + 80 };
                        p2 = { x: cx - 100, y: cy - 80 };
                        p3 = { x: cx + 120, y: cy + 80 };

                        // Отметка прямого угла
                        ctx.strokeStyle = '#EA4335';
                        ctx.lineWidth = 2;
                        ctx.strokeRect(p1.x, p1.y - 20, 20, 20);
                        ctx.strokeStyle = '#4285F4';
                        ctx.lineWidth = 3;
                        break;
                }

                // Рисуем треугольник
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.lineTo(p3.x, p3.y);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();

                // Вершины
                ctx.fillStyle = '#333';
                ctx.font = '16px Arial';
                ctx.fillText('A', p1.x - 10, p1.y - 10);
                ctx.fillText('B', p2.x - 20, p2.y + 5);
                ctx.fillText('C', p3.x + 10, p3.y + 5);

            } else if (this.triangles.mode === 'pythagoras') {
                // Теорема Пифагора
                const scale = 30;
                const a = this.triangles.a * scale;
                const b = this.triangles.b * scale;
                const c = Math.sqrt(a * a + b * b);

                const p1 = { x: cx - b / 2, y: cy + a / 2 };
                const p2 = { x: cx - b / 2, y: cy - a / 2 };
                const p3 = { x: cx + b / 2, y: cy + a / 2 };

                // Треугольник
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.lineTo(p3.x, p3.y);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();

                // Квадраты на сторонах
                ctx.fillStyle = 'rgba(234, 67, 53, 0.3)';
                ctx.fillRect(p2.x - a, p2.y, a, a); // На катете a

                ctx.fillStyle = 'rgba(52, 168, 83, 0.3)';
                ctx.fillRect(p2.x, p2.y - b, b, b); // На катете b

                // Подписи
                ctx.fillStyle = '#333';
                ctx.font = '16px Arial';
                ctx.fillText(`a = ${this.triangles.a}`, p1.x - 30, p1.y + (p2.y - p1.y) / 2);
                ctx.fillText(`b = ${this.triangles.b}`, p2.x + (p3.x - p2.x) / 2, p2.y - 10);
                ctx.fillText(`c = ${this.pythagorasResult}`, p1.x + (p3.x - p1.x) / 2 + 20, p1.y + 20);

            } else if (this.triangles.mode === 'area') {
                // Площадь треугольника
                const base = this.triangles.base;
                const height = this.triangles.height;

                const p1 = { x: cx - base / 2, y: cy + height / 2 };
                const p2 = { x: cx, y: cy - height / 2 };
                const p3 = { x: cx + base / 2, y: cy + height / 2 };

                // Треугольник
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.lineTo(p3.x, p3.y);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();

                // Высота
                ctx.strokeStyle = '#EA4335';
                ctx.setLineDash([5, 5]);
                ctx.beginPath();
                ctx.moveTo(p2.x, p2.y);
                ctx.lineTo(p2.x, p1.y);
                ctx.stroke();
                ctx.setLineDash([]);

                // Основание
                ctx.strokeStyle = '#34A853';
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p3.x, p3.y);
                ctx.stroke();

                // Подписи
                ctx.fillStyle = '#333';
                ctx.font = '16px Arial';
                ctx.fillText(`h = ${height}`, p2.x + 10, p2.y + height / 4);
                ctx.fillText(`b = ${base}`, p1.x + base / 2 - 30, p1.y + 25);
            }
        },

        // Четырёхугольники
        drawQuadrilaterals() {
            const result = this.getCanvas('quadrilateralsCanvas');
            if (!result) return;
            const { ctx, canvas } = result;

            this.drawGrid(ctx, canvas.width, canvas.height);

            const cx = canvas.width / 2;
            const cy = canvas.height / 2;

            ctx.strokeStyle = '#4285F4';
            ctx.fillStyle = 'rgba(66, 133, 244, 0.2)';
            ctx.lineWidth = 3;

            switch (this.quadrilaterals.type) {
                case 'square':
                    const side = this.quadrilaterals.side;
                    ctx.fillRect(cx - side / 2, cy - side / 2, side, side);
                    ctx.strokeRect(cx - side / 2, cy - side / 2, side, side);

                    // Диагонали
                    ctx.strokeStyle = '#EA4335';
                    ctx.setLineDash([5, 5]);
                    ctx.beginPath();
                    ctx.moveTo(cx - side / 2, cy - side / 2);
                    ctx.lineTo(cx + side / 2, cy + side / 2);
                    ctx.moveTo(cx + side / 2, cy - side / 2);
                    ctx.lineTo(cx - side / 2, cy + side / 2);
                    ctx.stroke();
                    ctx.setLineDash([]);
                    break;

                case 'rectangle':
                    const w = this.quadrilaterals.width;
                    const h = this.quadrilaterals.height;
                    ctx.fillRect(cx - w / 2, cy - h / 2, w, h);
                    ctx.strokeRect(cx - w / 2, cy - h / 2, w, h);

                    ctx.fillStyle = '#333';
                    ctx.font = '16px Arial';
                    ctx.fillText(`w = ${w}`, cx, cy + h / 2 + 25);
                    ctx.fillText(`h = ${h}`, cx - w / 2 - 40, cy);
                    break;

                case 'rhombus':
                    const d1 = 200, d2 = 120;
                    ctx.beginPath();
                    ctx.moveTo(cx, cy - d2 / 2);
                    ctx.lineTo(cx + d1 / 2, cy);
                    ctx.lineTo(cx, cy + d2 / 2);
                    ctx.lineTo(cx - d1 / 2, cy);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();
                    break;

                case 'parallelogram':
                    const base = 180, height = 100, skew = 40;
                    ctx.beginPath();
                    ctx.moveTo(cx - base / 2, cy + height / 2);
                    ctx.lineTo(cx - base / 2 + skew, cy - height / 2);
                    ctx.lineTo(cx + base / 2 + skew, cy - height / 2);
                    ctx.lineTo(cx + base / 2, cy + height / 2);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();
                    break;

                case 'trapezoid':
                    const topWidth = 120, bottomWidth = 200, trapHeight = 100;
                    ctx.beginPath();
                    ctx.moveTo(cx - bottomWidth / 2, cy + trapHeight / 2);
                    ctx.lineTo(cx - topWidth / 2, cy - trapHeight / 2);
                    ctx.lineTo(cx + topWidth / 2, cy - trapHeight / 2);
                    ctx.lineTo(cx + bottomWidth / 2, cy + trapHeight / 2);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();

                    // Средняя линия
                    ctx.strokeStyle = '#EA4335';
                    ctx.setLineDash([5, 5]);
                    const midWidth = (topWidth + bottomWidth) / 2;
                    ctx.beginPath();
                    ctx.moveTo(cx - midWidth / 2, cy);
                    ctx.lineTo(cx + midWidth / 2, cy);
                    ctx.stroke();
                    ctx.setLineDash([]);
                    break;
            }
        },

        // Окружность и круг
        drawCircles() {
            const result = this.getCanvas('circlesCanvas');
            if (!result) return;
            const { ctx, canvas } = result;

            this.drawGrid(ctx, canvas.width, canvas.height);

            const cx = canvas.width / 2;
            const cy = canvas.height / 2;
            const r = this.circles.radius;

            // Окружность
            ctx.strokeStyle = '#4285F4';
            ctx.fillStyle = 'rgba(66, 133, 244, 0.1)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Центр
            ctx.fillStyle = '#EA4335';
            ctx.beginPath();
            ctx.arc(cx, cy, 5, 0, Math.PI * 2);
            ctx.fill();

            if (this.circles.mode === 'basic' || this.circles.mode === 'formulas') {
                // Радиус
                ctx.strokeStyle = '#EA4335';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.lineTo(cx + r, cy);
                ctx.stroke();

                // Диаметр
                ctx.strokeStyle = '#34A853';
                ctx.beginPath();
                ctx.moveTo(cx - r, cy);
                ctx.lineTo(cx + r, cy);
                ctx.stroke();

                // Хорда
                const angle1 = Math.PI / 6;
                const angle2 = Math.PI / 3;
                const x1 = cx + r * Math.cos(angle1);
                const y1 = cy - r * Math.sin(angle1);
                const x2 = cx + r * Math.cos(angle2);
                const y2 = cy - r * Math.sin(angle2);

                ctx.strokeStyle = '#F4B400';
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();

                // Подписи
                ctx.fillStyle = '#333';
                ctx.font = '16px Arial';
                ctx.fillText('O', cx + 10, cy + 15);
                ctx.fillText('r', cx + r / 2, cy - 10);
                ctx.fillText('d', cx, cy + 20);
                ctx.fillText('хорда', (x1 + x2) / 2, (y1 + y2) / 2 - 10);
            }

            if (this.circles.mode === 'angles') {
                // Центральный угол
                const angleRad = this.circles.centralAngle * Math.PI / 180;

                // Радиусы к концам дуги
                ctx.strokeStyle = '#EA4335';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.lineTo(cx + r, cy);
                ctx.stroke();

                const x2 = cx + r * Math.cos(angleRad);
                const y2 = cy - r * Math.sin(angleRad);
                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.lineTo(x2, y2);
                ctx.stroke();

                // Дуга центрального угла
                ctx.strokeStyle = '#F4B400';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(cx, cy, r * 0.3, -angleRad, 0);
                ctx.stroke();

                // Вписанный угол (на окружности)
                const inscribedX = cx;
                const inscribedY = cy + r * 0.7;

                ctx.strokeStyle = '#34A853';
                ctx.beginPath();
                ctx.moveTo(inscribedX, inscribedY);
                ctx.lineTo(cx + r, cy);
                ctx.moveTo(inscribedX, inscribedY);
                ctx.lineTo(x2, y2);
                ctx.stroke();

                // Дуга вписанного угла
                const inscribedAngle = angleRad / 2;
                ctx.strokeStyle = '#34A853';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(inscribedX, inscribedY, 30, Math.atan2(cy - inscribedY, cx + r - inscribedX), Math.atan2(y2 - inscribedY, x2 - inscribedX), true);
                ctx.stroke();

                // Подписи
                ctx.fillStyle = '#333';
                ctx.font = '16px Arial';
                ctx.fillText(`Центральный: ${this.circles.centralAngle}°`, cx - 80, cy - r - 20);
                ctx.fillText(`Вписанный: ${this.circles.centralAngle / 2}°`, inscribedX - 80, inscribedY + 50);
            }
        },

        // Многоугольники
        drawPolygons() {
            const result = this.getCanvas('polygonsCanvas');
            if (!result) return;
            const { ctx, canvas } = result;

            this.drawGrid(ctx, canvas.width, canvas.height);

            const cx = canvas.width / 2;
            const cy = canvas.height / 2;
            const r = this.polygons.radius;
            const n = this.polygons.sides;

            // Описанная окружность
            ctx.strokeStyle = '#e0e0e0';
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);

            // Многоугольник
            ctx.strokeStyle = '#4285F4';
            ctx.fillStyle = 'rgba(66, 133, 244, 0.2)';
            ctx.lineWidth = 3;
            ctx.beginPath();

            for (let i = 0; i <= n; i++) {
                const angle = (i * 2 * Math.PI / n) - Math.PI / 2;
                const x = cx + r * Math.cos(angle);
                const y = cy + r * Math.sin(angle);

                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }

            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Центр и радиусы
            ctx.fillStyle = '#EA4335';
            ctx.beginPath();
            ctx.arc(cx, cy, 5, 0, Math.PI * 2);
            ctx.fill();

            // Один радиус
            const angle = -Math.PI / 2;
            ctx.strokeStyle = '#EA4335';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
            ctx.stroke();

            // Подписи вершин
            ctx.fillStyle = '#333';
            ctx.font = '14px Arial';
            for (let i = 0; i < n; i++) {
                const angle = (i * 2 * Math.PI / n) - Math.PI / 2;
                const x = cx + (r + 20) * Math.cos(angle);
                const y = cy + (r + 20) * Math.sin(angle);
                ctx.fillText(String.fromCharCode(65 + i), x - 5, y + 5);
            }
        },

        // Векторы
        drawVectors() {
            const result = this.getCanvas('vectorsCanvas');
            if (!result) return;
            const { ctx, canvas } = result;

            this.drawGrid(ctx, canvas.width, canvas.height);

            const cx = canvas.width / 2;
            const cy = canvas.height / 2;
            const scale = 30;

            const drawVector = (x, y, color, label, fromOrigin = true) => {
                const startX = fromOrigin ? cx : x;
                const startY = fromOrigin ? cy : y;
                const endX = fromOrigin ? cx + x * scale : x;
                const endY = fromOrigin ? cy - y * scale : y;

                // Линия вектора
                ctx.strokeStyle = color;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(startX, startY);
                ctx.lineTo(endX, endY);
                ctx.stroke();

                // Стрелка
                const angle = Math.atan2(endY - startY, endX - startX);
                const arrowLength = 15;
                ctx.beginPath();
                ctx.moveTo(endX, endY);
                ctx.lineTo(
                    endX - arrowLength * Math.cos(angle - Math.PI / 6),
                    endY - arrowLength * Math.sin(angle - Math.PI / 6)
                );
                ctx.moveTo(endX, endY);
                ctx.lineTo(
                    endX - arrowLength * Math.cos(angle + Math.PI / 6),
                    endY - arrowLength * Math.sin(angle + Math.PI / 6)
                );
                ctx.stroke();

                // Подпись
                ctx.fillStyle = color;
                ctx.font = 'bold 16px Arial';
                ctx.fillText(label, endX + 10, endY - 10);
            };

            const { a, b } = this.vectors;

            switch (this.vectors.mode) {
                case 'basic':
                    drawVector(a.x, a.y, '#4285F4', 'A');
                    drawVector(b.x, b.y, '#EA4335', 'B');

                    // Координаты
                    ctx.fillStyle = '#333';
                    ctx.font = '14px Arial';
                    ctx.fillText(`A(${a.x}, ${a.y})`, cx + a.x * scale + 15, cy - a.y * scale + 25);
                    ctx.fillText(`B(${b.x}, ${b.y})`, cx + b.x * scale + 15, cy - b.y * scale + 25);
                    break;

                case 'addition':
                    drawVector(a.x, a.y, '#4285F4', 'A');
                    drawVector(b.x, b.y, '#EA4335', 'B');

                    // Результат сложения
                    const sumX = a.x + b.x;
                    const sumY = a.y + b.y;
                    drawVector(sumX, sumY, '#34A853', 'A+B');

                    // Параллелограмм
                    ctx.strokeStyle = '#999';
                    ctx.setLineDash([5, 5]);
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(cx + a.x * scale, cy - a.y * scale);
                    ctx.lineTo(cx + sumX * scale, cy - sumY * scale);
                    ctx.moveTo(cx + b.x * scale, cy - b.y * scale);
                    ctx.lineTo(cx + sumX * scale, cy - sumY * scale);
                    ctx.stroke();
                    ctx.setLineDash([]);
                    break;

                case 'scalar':
                    drawVector(a.x, a.y, '#4285F4', 'A');

                    const k = this.vectors.scalar;
                    const scaledX = k * a.x;
                    const scaledY = k * a.y;
                    drawVector(scaledX, scaledY, '#EA4335', `${k}A`);

                    ctx.fillStyle = '#333';
                    ctx.font = '14px Arial';
                    ctx.fillText(`k = ${k}`, 20, 30);
                    break;

                case 'dot':
                    drawVector(a.x, a.y, '#4285F4', 'A');
                    drawVector(b.x, b.y, '#EA4335', 'B');

                    const dotProduct = a.x * b.x + a.y * b.y;

                    // Угол между векторами
                    const lenA = Math.sqrt(a.x * a.x + a.y * a.y);
                    const lenB = Math.sqrt(b.x * b.x + b.y * b.y);
                    const angle = Math.acos(dotProduct / (lenA * lenB)) * 180 / Math.PI;

                    ctx.fillStyle = '#333';
                    ctx.font = '16px Arial';
                    ctx.fillText(`A · B = ${dotProduct}`, 20, 30);
                    ctx.fillText(`Угол между векторами: ${angle.toFixed(2)}°`, 20, 55);

                    // Дуга угла
                    ctx.strokeStyle = '#F4B400';
                    ctx.lineWidth = 2;
                    const angleA = Math.atan2(-a.y, a.x);
                    const angleB = Math.atan2(-b.y, b.x);
                    ctx.beginPath();
                    ctx.arc(cx, cy, 40, Math.min(angleA, angleB), Math.max(angleA, angleB));
                    ctx.stroke();
                    break;
            }
        },

        // Преобразования
        drawTransformations() {
            const result = this.getCanvas('transformationsCanvas');
            if (!result) return;
            const { ctx, canvas } = result;

            this.drawGrid(ctx, canvas.width, canvas.height);

            const cx = canvas.width / 2;
            const cy = canvas.height / 2;

            // Исходная фигура (треугольник)
            const originalPoints = [
                { x: -60, y: -40 },
                { x: -60, y: 40 },
                { x: 20, y: 0 }
            ];

            // Рисуем исходную фигуру
            ctx.strokeStyle = '#4285F4';
            ctx.fillStyle = 'rgba(66, 133, 244, 0.3)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(cx + originalPoints[0].x, cy + originalPoints[0].y);
            for (let i = 1; i < originalPoints.length; i++) {
                ctx.lineTo(cx + originalPoints[i].x, cy + originalPoints[i].y);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Применяем преобразование
            let transformedPoints = [];

            switch (this.transformations.type) {
                case 'translation':
                    transformedPoints = originalPoints.map(p => ({
                        x: p.x + this.transformations.tx,
                        y: p.y + this.transformations.ty
                    }));
                    break;

                case 'rotation':
                    const angleRad = this.transformations.angle * Math.PI / 180;
                    const cosA = Math.cos(angleRad);
                    const sinA = Math.sin(angleRad);
                    transformedPoints = originalPoints.map(p => ({
                        x: p.x * cosA - p.y * sinA,
                        y: p.x * sinA + p.y * cosA
                    }));
                    break;

                case 'reflection':
                    // Осевая симметрия относительно оси Y
                    transformedPoints = originalPoints.map(p => ({
                        x: -p.x,
                        y: p.y
                    }));

                    // Рисуем ось симметрии
                    ctx.strokeStyle = '#EA4335';
                    ctx.setLineDash([5, 5]);
                    ctx.beginPath();
                    ctx.moveTo(cx, 0);
                    ctx.lineTo(cx, canvas.height);
                    ctx.stroke();
                    ctx.setLineDash([]);
                    break;

                case 'central':
                    // Центральная симметрия относительно начала координат
                    transformedPoints = originalPoints.map(p => ({
                        x: -p.x,
                        y: -p.y
                    }));

                    // Отмечаем центр симметрии
                    ctx.fillStyle = '#EA4335';
                    ctx.beginPath();
                    ctx.arc(cx, cy, 6, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillText('O', cx + 10, cy - 10);
                    break;

                case 'homothety':
                    const k = this.transformations.scale;
                    transformedPoints = originalPoints.map(p => ({
                        x: p.x * k,
                        y: p.y * k
                    }));

                    // Центр гомотетии
                    ctx.fillStyle = '#EA4335';
                    ctx.beginPath();
                    ctx.arc(cx, cy, 6, 0, Math.PI * 2);
                    ctx.fill();
                    break;
            }

            // Рисуем преобразованную фигуру
            ctx.strokeStyle = '#34A853';
            ctx.fillStyle = 'rgba(52, 168, 83, 0.3)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(cx + transformedPoints[0].x, cy + transformedPoints[0].y);
            for (let i = 1; i < transformedPoints.length; i++) {
                ctx.lineTo(cx + transformedPoints[i].x, cy + transformedPoints[i].y);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Легенда
            ctx.fillStyle = '#333';
            ctx.font = '14px Arial';
            ctx.fillText('Синий: Исходная фигура', 20, 30);
            ctx.fillText('Зелёный: Преобразованная фигура', 20, 50);
        }
    }
};
</script>

<style scoped>
.geometry {
    height: 100%;
    display: flex;
    flex-direction: column;
    background: var(--bg-color);
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
    margin-bottom: 15px;
    color: var(--text-color);
    font-size: 14px;
}

.controls input,
.controls select {
    padding: 8px;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    background: var(--bg-color);
    color: var(--text-color);
    margin-left: 10px;
    font-size: 14px;
}

.controls input[type="number"] {
    width: 100px;
}

.controls select {
    width: 200px;
}

.result {
    margin-top: 10px;
    padding: 12px;
    background: var(--bg-secondary);
    border-radius: 4px;
    font-size: 16px;
    color: var(--text-color);
    font-weight: bold;
}

.geometry-canvas {
    width: 100%;
    max-width: 800px;
    height: 600px;
    background: white;
    border-radius: 8px;
    border: 1px solid var(--border-color);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    display: block;
    margin: 0 auto;
}

.vector-controls {
    display: flex;
    gap: 30px;
    margin-top: 15px;
    flex-wrap: wrap;
}

.vector-controls > div {
    flex: 1;
    min-width: 200px;
}

.vector-controls h4 {
    margin: 0 0 10px 0;
    color: var(--text-color);
}

.vector-controls label {
    display: inline-block;
    margin-right: 15px;
}

@media (max-width: 768px) {
    .geometry-canvas {
        width: 100%;
        height: 400px;
    }

    .tabs {
        overflow-x: scroll;
    }

    .vector-controls {
        flex-direction: column;
    }
}
</style>
