<template>
  <div class="stereometry">
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
      <!-- Координаты в пространстве -->
      <div v-if="activeTab === 'coordinates'" class="visualizer">
        <h2>Координаты в пространстве</h2>
        <div class="controls">
          <label>X: <input v-model.number="coordinates.x" type="number" step="0.5" /></label>
          <label>Y: <input v-model.number="coordinates.y" type="number" step="0.5" /></label>
          <label>Z: <input v-model.number="coordinates.z" type="number" step="0.5" /></label>
          <div class="result">Точка A({{ coordinates.x }}, {{ coordinates.y }}, {{ coordinates.z }})</div>
          <div class="result">Расстояние от начала координат: {{ distanceFromOrigin.toFixed(2) }}</div>
        </div>
        <div ref="coordinatesContainer" class="three-container"></div>
      </div>

      <!-- Векторы в пространстве -->
      <div v-if="activeTab === 'vectors'" class="visualizer">
        <h2>Векторы в пространстве</h2>
        <div class="controls">
          <div class="vector-group">
            <h4>Вектор a:</h4>
            <label>X: <input v-model.number="vectors.a.x" type="number" step="0.5" /></label>
            <label>Y: <input v-model.number="vectors.a.y" type="number" step="0.5" /></label>
            <label>Z: <input v-model.number="vectors.a.z" type="number" step="0.5" /></label>
          </div>
          <div class="vector-group">
            <h4>Вектор b:</h4>
            <label>X: <input v-model.number="vectors.b.x" type="number" step="0.5" /></label>
            <label>Y: <input v-model.number="vectors.b.y" type="number" step="0.5" /></label>
            <label>Z: <input v-model.number="vectors.b.z" type="number" step="0.5" /></label>
          </div>
          <div class="result">|a| = {{ vectorLength(vectors.a).toFixed(2) }}</div>
          <div class="result">|b| = {{ vectorLength(vectors.b).toFixed(2) }}</div>
          <div class="result">a · b (скалярное произведение) = {{ dotProduct.toFixed(2) }}</div>
          <div class="result">Угол между векторами: {{ angleBetweenVectors.toFixed(2) }}°</div>
        </div>
        <div ref="vectorsContainer" class="three-container"></div>
      </div>

      <!-- Прямые и плоскости -->
      <div v-if="activeTab === 'planesLines'" class="visualizer">
        <h2>Прямые и плоскости в пространстве</h2>
        <div class="controls">
          <label>
            Режим:
            <select v-model="planesLines.mode">
              <option value="plane">Плоскость</option>
              <option value="line">Прямая</option>
              <option value="both">Прямая и плоскость</option>
            </select>
          </label>
          <div v-if="planesLines.mode !== 'line'">
            <h4>Уравнение плоскости: Ax + By + Cz + D = 0</h4>
            <label>A: <input v-model.number="planesLines.A" type="number" /></label>
            <label>B: <input v-model.number="planesLines.B" type="number" /></label>
            <label>C: <input v-model.number="planesLines.C" type="number" /></label>
            <label>D: <input v-model.number="planesLines.D" type="number" /></label>
          </div>
        </div>
        <div ref="planesLinesContainer" class="three-container"></div>
      </div>

      <!-- Многогранники -->
      <div v-if="activeTab === 'polyhedra'" class="visualizer">
        <h2>Многогранники</h2>
        <div class="controls">
          <label>
            Тип:
            <select v-model="polyhedra.type">
              <option value="cube">Куб</option>
              <option value="box">Параллелепипед</option>
              <option value="prism">Призма</option>
              <option value="pyramid">Пирамида</option>
              <option value="tetrahedron">Тетраэдр (Платоново тело)</option>
              <option value="octahedron">Октаэдр (Платоново тело)</option>
              <option value="dodecahedron">Додекаэдр (Платоново тело)</option>
              <option value="icosahedron">Икосаэдр (Платоново тело)</option>
            </select>
          </label>
          <div v-if="polyhedra.type === 'cube'">
            <label>Сторона: <input v-model.number="polyhedra.size" type="number" min="0.5" /></label>
            <div class="result">Объём: {{ (polyhedra.size ** 3).toFixed(2) }}</div>
            <div class="result">Площадь поверхности: {{ (6 * polyhedra.size ** 2).toFixed(2) }}</div>
          </div>
          <div v-if="polyhedra.type === 'box'">
            <label>Длина: <input v-model.number="polyhedra.length" type="number" min="0.5" /></label>
            <label>Ширина: <input v-model.number="polyhedra.width" type="number" min="0.5" /></label>
            <label>Высота: <input v-model.number="polyhedra.height" type="number" min="0.5" /></label>
            <div class="result">Объём: {{ (polyhedra.length * polyhedra.width * polyhedra.height).toFixed(2) }}</div>
            <div class="result">
              Площадь поверхности:
              {{
                (
                  2 *
                  (polyhedra.length * polyhedra.width +
                    polyhedra.width * polyhedra.height +
                    polyhedra.height * polyhedra.length)
                ).toFixed(2)
              }}
            </div>
          </div>
          <div v-if="polyhedra.type === 'pyramid'">
            <label>Основание: <input v-model.number="polyhedra.base" type="number" min="0.5" /></label>
            <label>Высота: <input v-model.number="polyhedra.pyramidHeight" type="number" min="0.5" /></label>
            <div class="result">Объём: {{ ((polyhedra.base ** 2 * polyhedra.pyramidHeight) / 3).toFixed(2) }}</div>
          </div>
        </div>
        <div ref="polyhedraContainer" class="three-container"></div>
      </div>

      <!-- Тела вращения -->
      <div v-if="activeTab === 'solidsOfRevolution'" class="visualizer">
        <h2>Тела вращения</h2>
        <div class="controls">
          <label>
            Тип:
            <select v-model="solids.type">
              <option value="cylinder">Цилиндр</option>
              <option value="cone">Конус</option>
              <option value="sphere">Шар и сфера</option>
            </select>
          </label>
          <div v-if="solids.type === 'cylinder'">
            <label>Радиус: <input v-model.number="solids.radius" type="number" min="0.5" /></label>
            <label>Высота: <input v-model.number="solids.height" type="number" min="0.5" /></label>
            <div class="result">Объём: V = πr²h = {{ (Math.PI * solids.radius ** 2 * solids.height).toFixed(2) }}</div>
            <div class="result">
              Площадь боковой поверхности: S = 2πrh = {{ (2 * Math.PI * solids.radius * solids.height).toFixed(2) }}
            </div>
            <div class="result">
              Площадь полной поверхности:
              {{ (2 * Math.PI * solids.radius * (solids.radius + solids.height)).toFixed(2) }}
            </div>
          </div>
          <div v-if="solids.type === 'cone'">
            <label>Радиус: <input v-model.number="solids.radius" type="number" min="0.5" /></label>
            <label>Высота: <input v-model.number="solids.height" type="number" min="0.5" /></label>
            <div class="result">
              Объём: V = (πr²h)/3 = {{ ((Math.PI * solids.radius ** 2 * solids.height) / 3).toFixed(2) }}
            </div>
            <div class="result">
              Образующая: l = √(r² + h²) = {{ Math.sqrt(solids.radius ** 2 + solids.height ** 2).toFixed(2) }}
            </div>
            <div class="result">
              Площадь боковой поверхности: S = πrl =
              {{ (Math.PI * solids.radius * Math.sqrt(solids.radius ** 2 + solids.height ** 2)).toFixed(2) }}
            </div>
          </div>
          <div v-if="solids.type === 'sphere'">
            <label>Радиус: <input v-model.number="solids.radius" type="number" min="0.5" /></label>
            <div class="result">Объём: V = (4πr³)/3 = {{ ((4 * Math.PI * solids.radius ** 3) / 3).toFixed(2) }}</div>
            <div class="result">
              Площадь поверхности: S = 4πr² = {{ (4 * Math.PI * solids.radius ** 2).toFixed(2) }}
            </div>
          </div>
        </div>
        <div ref="solidsContainer" class="three-container"></div>
      </div>

      <!-- Сечения многогранников -->
      <div v-if="activeTab === 'sections'" class="visualizer">
        <h2>Сечения многогранников</h2>
        <div class="controls">
          <label>
            Многогранник:
            <select v-model="sections.shape">
              <option value="cube">Куб</option>
              <option value="pyramid">Пирамида</option>
            </select>
          </label>
          <label>
            Положение сечения (Y):
            <input v-model.number="sections.position" type="range" min="-2" max="2" step="0.1" />
            {{ sections.position.toFixed(1) }}
          </label>
          <div class="result">Сечение плоскостью y = {{ sections.position.toFixed(1) }}</div>
        </div>
        <div ref="sectionsContainer" class="three-container"></div>
      </div>
    </div>
  </div>
</template>

<script>
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export default {
  name: 'Stereometry',
  data() {
    return {
      activeTab: 'coordinates',
      tabs: [
        { id: 'coordinates', label: '📍 Координаты' },
        { id: 'vectors', label: '➡️ Векторы' },
        { id: 'planesLines', label: '📐 Плоскости и прямые' },
        { id: 'polyhedra', label: '🧊 Многогранники' },
        { id: 'solidsOfRevolution', label: '🎡 Тела вращения' },
        { id: 'sections', label: '✂️ Сечения' },
      ],
      coordinates: {
        x: 3,
        y: 4,
        z: 2,
      },
      vectors: {
        a: { x: 3, y: 2, z: 1 },
        b: { x: 1, y: 3, z: 2 },
      },
      planesLines: {
        mode: 'plane',
        A: 1,
        B: 1,
        C: 1,
        D: -3,
      },
      polyhedra: {
        type: 'cube',
        size: 2,
        length: 3,
        width: 2,
        height: 2,
        base: 2,
        pyramidHeight: 3,
      },
      solids: {
        type: 'cylinder',
        radius: 1,
        height: 3,
      },
      sections: {
        shape: 'cube',
        position: 0,
      },
      scenes: {},
      cameras: {},
      renderers: {},
      controls: {},
      animationFrames: {},
    };
  },
  computed: {
    distanceFromOrigin() {
      const { x, y, z } = this.coordinates;
      return Math.sqrt(x * x + y * y + z * z);
    },
    dotProduct() {
      const { a, b } = this.vectors;
      return a.x * b.x + a.y * b.y + a.z * b.z;
    },
    angleBetweenVectors() {
      const lenA = this.vectorLength(this.vectors.a);
      const lenB = this.vectorLength(this.vectors.b);
      if (lenA === 0 || lenB === 0) return 0;
      const cosAngle = this.dotProduct / (lenA * lenB);
      return (Math.acos(Math.max(-1, Math.min(1, cosAngle))) * 180) / Math.PI;
    },
  },
  watch: {
    activeTab(newTab) {
      this.$nextTick(() => {
        this.initScene(newTab);
      });
    },
    coordinates: {
      deep: true,
      handler() {
        if (this.activeTab === 'coordinates') {
          this.updateCoordinatesScene();
        }
      },
    },
    vectors: {
      deep: true,
      handler() {
        if (this.activeTab === 'vectors') {
          this.updateVectorsScene();
        }
      },
    },
    planesLines: {
      deep: true,
      handler() {
        if (this.activeTab === 'planesLines') {
          this.updatePlanesLinesScene();
        }
      },
    },
    polyhedra: {
      deep: true,
      handler() {
        if (this.activeTab === 'polyhedra') {
          this.updatePolyhedraScene();
        }
      },
    },
    solids: {
      deep: true,
      handler() {
        if (this.activeTab === 'solidsOfRevolution') {
          this.updateSolidsScene();
        }
      },
    },
    sections: {
      deep: true,
      handler() {
        if (this.activeTab === 'sections') {
          this.updateSectionsScene();
        }
      },
    },
  },
  mounted() {
    this.$nextTick(() => {
      this.initScene(this.activeTab);
    });
  },
  beforeUnmount() {
    Object.values(this.animationFrames).forEach((id) => cancelAnimationFrame(id));
    Object.values(this.renderers).forEach((renderer) => renderer.dispose());
  },
  methods: {
    vectorLength(v) {
      return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
    },

    initScene(tab) {
      const container = this.$refs[`${tab}Container`];
      if (!container) return;

      // Очистка предыдущей сцены
      if (this.animationFrames[tab]) {
        cancelAnimationFrame(this.animationFrames[tab]);
      }
      if (this.renderers[tab]) {
        container.removeChild(this.renderers[tab].domElement);
        this.renderers[tab].dispose();
      }

      // Создание сцены
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0xf0f0f0);
      this.scenes[tab] = scene;

      // Камера
      const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
      camera.position.set(8, 8, 8);
      camera.lookAt(0, 0, 0);
      this.cameras[tab] = camera;

      // Рендерер
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(container.clientWidth, container.clientHeight);
      container.appendChild(renderer.domElement);
      this.renderers[tab] = renderer;

      // Управление
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      this.controls[tab] = controls;

      // Добавление осей координат
      const axesHelper = new THREE.AxesHelper(5);
      scene.add(axesHelper);

      // Добавление сетки
      const gridHelper = new THREE.GridHelper(10, 10);
      scene.add(gridHelper);

      // Освещение
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
      directionalLight.position.set(5, 10, 5);
      scene.add(directionalLight);

      // Обновление сцены в зависимости от вкладки
      switch (tab) {
        case 'coordinates':
          this.updateCoordinatesScene();
          break;
        case 'vectors':
          this.updateVectorsScene();
          break;
        case 'planesLines':
          this.updatePlanesLinesScene();
          break;
        case 'polyhedra':
          this.updatePolyhedraScene();
          break;
        case 'solidsOfRevolution':
          this.updateSolidsScene();
          break;
        case 'sections':
          this.updateSectionsScene();
          break;
      }

      // Анимация
      const animate = () => {
        this.animationFrames[tab] = requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
      };
      animate();

      // Обработка изменения размера
      const resizeObserver = new ResizeObserver(() => {
        if (container.clientWidth > 0 && container.clientHeight > 0) {
          camera.aspect = container.clientWidth / container.clientHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(container.clientWidth, container.clientHeight);
        }
      });
      resizeObserver.observe(container);
    },

    updateCoordinatesScene() {
      const scene = this.scenes['coordinates'];
      if (!scene) return;

      // Удаление старых объектов (кроме сетки, осей и света)
      const objectsToRemove = scene.children.filter(
        (child) => child.type === 'Mesh' || child.type === 'Line' || child.type === 'Points',
      );
      objectsToRemove.forEach((obj) => scene.remove(obj));

      const { x, y, z } = this.coordinates;

      // Точка
      const pointGeometry = new THREE.SphereGeometry(0.15, 16, 16);
      const pointMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });
      const point = new THREE.Mesh(pointGeometry, pointMaterial);
      point.position.set(x, y, z);
      scene.add(point);

      // Линия от начала координат до точки
      const lineGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(x, y, z),
      ]);
      const lineMaterial = new THREE.LineBasicMaterial({ color: 0x0000ff, linewidth: 2 });
      const line = new THREE.Line(lineGeometry, lineMaterial);
      scene.add(line);

      // Проекции на плоскости
      const projectionMaterial = new THREE.LineBasicMaterial({
        color: 0x888888,
        linewidth: 1,
        transparent: true,
        opacity: 0.5,
      });

      // Проекция на XY
      const projXY = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x, y, z), new THREE.Vector3(x, y, 0)]);
      scene.add(new THREE.Line(projXY, projectionMaterial));

      // Проекция на XZ
      const projXZ = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x, y, z), new THREE.Vector3(x, 0, z)]);
      scene.add(new THREE.Line(projXZ, projectionMaterial));

      // Проекция на YZ
      const projYZ = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x, y, z), new THREE.Vector3(0, y, z)]);
      scene.add(new THREE.Line(projYZ, projectionMaterial));
    },

    updateVectorsScene() {
      const scene = this.scenes['vectors'];
      if (!scene) return;

      const objectsToRemove = scene.children.filter(
        (child) => child.type === 'Mesh' || child.type === 'Line' || child.type === 'ArrowHelper',
      );
      objectsToRemove.forEach((obj) => scene.remove(obj));

      const { a, b } = this.vectors;

      // Вектор a (красный)
      const dirA = new THREE.Vector3(a.x, a.y, a.z).normalize();
      const lengthA = this.vectorLength(a);
      const arrowA = new THREE.ArrowHelper(dirA, new THREE.Vector3(0, 0, 0), lengthA, 0xff0000, 0.5, 0.3);
      scene.add(arrowA);

      // Вектор b (синий)
      const dirB = new THREE.Vector3(b.x, b.y, b.z).normalize();
      const lengthB = this.vectorLength(b);
      const arrowB = new THREE.ArrowHelper(dirB, new THREE.Vector3(0, 0, 0), lengthB, 0x0000ff, 0.5, 0.3);
      scene.add(arrowB);

      // Вектор суммы a + b (зеленый)
      const sumX = a.x + b.x;
      const sumY = a.y + b.y;
      const sumZ = a.z + b.z;
      const dirSum = new THREE.Vector3(sumX, sumY, sumZ).normalize();
      const lengthSum = Math.sqrt(sumX * sumX + sumY * sumY + sumZ * sumZ);
      const arrowSum = new THREE.ArrowHelper(dirSum, new THREE.Vector3(0, 0, 0), lengthSum, 0x00ff00, 0.5, 0.3);
      scene.add(arrowSum);

      // Линии для параллелограмма сложения
      const lineGeometry1 = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(a.x, a.y, a.z),
        new THREE.Vector3(sumX, sumY, sumZ),
      ]);
      const lineGeometry2 = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(b.x, b.y, b.z),
        new THREE.Vector3(sumX, sumY, sumZ),
      ]);
      const dashedMaterial = new THREE.LineDashedMaterial({
        color: 0x888888,
        linewidth: 1,
        dashSize: 0.2,
        gapSize: 0.1,
      });
      const line1 = new THREE.Line(lineGeometry1, dashedMaterial);
      const line2 = new THREE.Line(lineGeometry2, dashedMaterial);
      line1.computeLineDistances();
      line2.computeLineDistances();
      scene.add(line1);
      scene.add(line2);
    },

    updatePlanesLinesScene() {
      const scene = this.scenes['planesLines'];
      if (!scene) return;

      const objectsToRemove = scene.children.filter((child) => child.type === 'Mesh' || child.type === 'Line');
      objectsToRemove.forEach((obj) => scene.remove(obj));

      const { mode, A, B, C, D } = this.planesLines;

      if (mode === 'plane' || mode === 'both') {
        // Создание плоскости Ax + By + Cz + D = 0
        const size = 8;
        const planeGeometry = new THREE.PlaneGeometry(size, size, 10, 10);
        const planeMaterial = new THREE.MeshPhongMaterial({
          color: 0x4285f4,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.6,
          wireframe: false,
        });
        const plane = new THREE.Mesh(planeGeometry, planeMaterial);

        // Вычисление нормали и положения плоскости
        const normal = new THREE.Vector3(A, B, C).normalize();

        // Находим точку на плоскости
        let point = new THREE.Vector3();
        if (C !== 0) {
          point.z = -D / C;
        } else if (B !== 0) {
          point.y = -D / B;
        } else if (A !== 0) {
          point.x = -D / A;
        }

        plane.position.copy(point);
        plane.lookAt(point.clone().add(normal));
        scene.add(plane);

        // Добавление вектора нормали
        const arrowNormal = new THREE.ArrowHelper(normal, point, 2, 0xff00ff, 0.5, 0.3);
        scene.add(arrowNormal);
      }

      if (mode === 'line' || mode === 'both') {
        // Прямая через две точки
        const lineGeometry = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(-5, -5, 0),
          new THREE.Vector3(5, 5, 0),
        ]);
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 2 });
        const line = new THREE.Line(lineGeometry, lineMaterial);
        scene.add(line);
      }
    },

    updatePolyhedraScene() {
      const scene = this.scenes['polyhedra'];
      if (!scene) return;

      const objectsToRemove = scene.children.filter((child) => child.type === 'Mesh' || child.type === 'LineSegments');
      objectsToRemove.forEach((obj) => scene.remove(obj));

      const { type, size, length, width, height, base, pyramidHeight } = this.polyhedra;

      let geometry;
      switch (type) {
        case 'cube':
          geometry = new THREE.BoxGeometry(size, size, size);
          break;
        case 'box':
          geometry = new THREE.BoxGeometry(length, height, width);
          break;
        case 'prism':
          geometry = new THREE.CylinderGeometry(1.5, 1.5, 3, 6);
          break;
        case 'pyramid':
          geometry = new THREE.ConeGeometry(base, pyramidHeight, 4);
          break;
        case 'tetrahedron':
          geometry = new THREE.TetrahedronGeometry(2);
          break;
        case 'octahedron':
          geometry = new THREE.OctahedronGeometry(2);
          break;
        case 'dodecahedron':
          geometry = new THREE.DodecahedronGeometry(2);
          break;
        case 'icosahedron':
          geometry = new THREE.IcosahedronGeometry(2);
          break;
      }

      const material = new THREE.MeshPhongMaterial({
        color: 0x4285f4,
        transparent: true,
        opacity: 0.8,
      });
      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);

      // Добавление рёбер
      const edges = new THREE.EdgesGeometry(geometry);
      const edgesMaterial = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 });
      const edgesMesh = new THREE.LineSegments(edges, edgesMaterial);
      scene.add(edgesMesh);
    },

    updateSolidsScene() {
      const scene = this.scenes['solidsOfRevolution'];
      if (!scene) return;

      const objectsToRemove = scene.children.filter((child) => child.type === 'Mesh' || child.type === 'LineSegments');
      objectsToRemove.forEach((obj) => scene.remove(obj));

      const { type, radius, height } = this.solids;

      let geometry;
      switch (type) {
        case 'cylinder':
          geometry = new THREE.CylinderGeometry(radius, radius, height, 32);
          break;
        case 'cone':
          geometry = new THREE.ConeGeometry(radius, height, 32);
          break;
        case 'sphere':
          geometry = new THREE.SphereGeometry(radius, 32, 32);
          break;
      }

      const material = new THREE.MeshPhongMaterial({
        color: 0xea4335,
        transparent: true,
        opacity: 0.8,
      });
      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);

      // Добавление рёбер для цилиндра и конуса
      if (type !== 'sphere') {
        const edges = new THREE.EdgesGeometry(geometry);
        const edgesMaterial = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 1 });
        const edgesMesh = new THREE.LineSegments(edges, edgesMaterial);
        scene.add(edgesMesh);
      }
    },

    updateSectionsScene() {
      const scene = this.scenes['sections'];
      if (!scene) return;

      const objectsToRemove = scene.children.filter((child) => child.type === 'Mesh' || child.type === 'LineSegments');
      objectsToRemove.forEach((obj) => scene.remove(obj));

      const { shape, position } = this.sections;

      // Создание основного многогранника
      let geometry;
      if (shape === 'cube') {
        geometry = new THREE.BoxGeometry(4, 4, 4);
      } else {
        geometry = new THREE.ConeGeometry(2, 4, 4);
      }

      const material = new THREE.MeshPhongMaterial({
        color: 0x4285f4,
        transparent: true,
        opacity: 0.5,
      });
      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);

      // Добавление рёбер
      const edges = new THREE.EdgesGeometry(geometry);
      const edgesMaterial = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 });
      const edgesMesh = new THREE.LineSegments(edges, edgesMaterial);
      scene.add(edgesMesh);

      // Плоскость сечения
      const planeGeometry = new THREE.PlaneGeometry(6, 6);
      const planeMaterial = new THREE.MeshPhongMaterial({
        color: 0xff0000,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.6,
      });
      const plane = new THREE.Mesh(planeGeometry, planeMaterial);
      plane.position.y = position;
      plane.rotation.x = Math.PI / 2;
      scene.add(plane);
    },
  },
};
</script>

<style scoped>
.stereometry {
  padding: 20px;
  height: calc(100vh - 70px);
  display: flex;
  flex-direction: column;
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
  flex: 1;
  overflow-y: auto;
}

.visualizer {
  background: var(--card-bg);
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.visualizer h2 {
  margin-top: 0;
  color: var(--text-color);
  font-size: 24px;
  margin-bottom: 20px;
}

.controls {
  margin-bottom: 20px;
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  align-items: center;
}

.controls label {
  color: var(--text-color);
  font-size: 14px;
}

.controls input[type='number'],
.controls input[type='range'],
.controls select {
  margin-left: 8px;
  padding: 6px 10px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--bg-color);
  color: var(--text-color);
  font-size: 14px;
}

.controls input[type='range'] {
  width: 200px;
}

.vector-group {
  border: 1px solid var(--border-color);
  padding: 10px;
  border-radius: 4px;
  background: var(--bg-secondary);
}

.vector-group h4 {
  margin: 0 0 10px 0;
  color: var(--text-color);
  font-size: 14px;
}

.result {
  background: var(--bg-secondary);
  padding: 8px 12px;
  border-radius: 4px;
  color: var(--text-color);
  font-size: 14px;
  font-family: monospace;
}

.three-container {
  width: 100%;
  height: 600px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
}

@media (max-width: 768px) {
  .three-container {
    height: 400px;
  }

  .controls {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
