<template>
  <div class="gallery-container" v-if="isOpen">
    <div class="gallery-overlay" @click="closeGallery"></div>
    <div class="gallery-modal">
      <div class="gallery-header">
        <h2>Галерея функций</h2>
        <button class="close-btn" @click="closeGallery">✕</button>
      </div>

      <div class="gallery-content">
        <div v-for="(category, key) in examples" :key="key" class="category">
          <h3>{{ category.name }}</h3>
          <div class="examples-grid">
            <div
              v-for="(example, index) in category.examples"
              :key="index"
              class="example-card"
              @click="selectExample(example)"
            >
              <div class="example-color" :style="{ backgroundColor: example.color }"></div>
              <div class="example-info">
                <div class="example-label">{{ example.label }}</div>
                <div class="example-func">{{ example.fn }}</div>
                <div v-if="example.fnY" class="example-func">y: {{ example.fnY }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { functionExamples } from '../utils/functionExamples';

export default {
  name: 'FunctionGallery',
  props: {
    isOpen: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      examples: functionExamples
    };
  },
  methods: {
    closeGallery() {
      this.$emit('close');
    },
    selectExample(example) {
      this.$emit('select', example);
      this.closeGallery();
    }
  }
};
</script>

<style scoped>
.gallery-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1000;
}

.gallery-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
}

.gallery-modal {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: var(--bg-color, white);
  border-radius: 8px;
  width: 90%;
  max-width: 1000px;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.gallery-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid var(--border-color, #ddd);
}

.gallery-header h2 {
  margin: 0;
  color: var(--text-color, #333);
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--text-color, #666);
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: var(--text-color, #333);
}

.gallery-content {
  padding: 20px;
  overflow-y: auto;
  max-height: calc(80vh - 80px);
}

.category {
  margin-bottom: 30px;
}

.category h3 {
  color: var(--text-color, #555);
  margin-bottom: 15px;
}

.examples-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 15px;
}

.example-card {
  display: flex;
  align-items: center;
  padding: 12px;
  border: 1px solid var(--border-color, #ddd);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  background: var(--card-bg, white);
}

.example-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.example-color {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  margin-right: 12px;
  flex-shrink: 0;
}

.example-info {
  flex: 1;
  min-width: 0;
}

.example-label {
  font-weight: bold;
  color: var(--text-color, #333);
  margin-bottom: 4px;
}

.example-func {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: var(--text-secondary, #666);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
