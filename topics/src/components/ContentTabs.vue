<!-- Tabs.vue -->
<template>
  <div class="tabs-container">
    <div class="tabs-header">
      <button
          v-for="tab in tabs"
          :key="tab.name"
          :class="['tab-button', { active: activeTabName === tab.name }]"
          @click="selectTab(tab.name)"
      >
        {{ tab.label }}
      </button>
    </div>
    <div class="tabs-content">
      <slot :active-tab="activeTabName"></slot>
    </div>
  </div>
</template>

<script>
import { ref, provide, watch } from 'vue';

export default {
  name: 'ContentTabs',
  props: {
    activeTab: {
      type: String,
      default: '',
    },
  },
  emits: ['update:activeTab', 'tab-changed'],
  setup(props, { emit }) {
    const activeTabName = ref(props.activeTab);
    const tabs = ref([]);

    const registerTab = (tab) => {
      tabs.value.push(tab);
      if (!activeTabName.value) {
        activeTabName.value = tab.name;
        emit('update:activeTab', activeTabName.value);
        emit('tab-changed', activeTabName.value);
      }
    };

    const selectTab = (name) => {
      if (activeTabName.value !== name) {
        activeTabName.value = name;
        emit('update:activeTab', name);
        emit('tab-changed', name);
      }
    };

    // Обновляем activeTabName при изменении пропса activeTab
    watch(
        () => props.activeTab,
        (newVal) => {
          if (newVal && newVal !== activeTabName.value) {
            activeTabName.value = newVal;
            emit('tab-changed', newVal);
          }
        }
    );

    provide('registerTab', registerTab);
    provide('activeTabName', activeTabName);

    return {
      activeTabName,
      tabs,
      selectTab,
    };
  },
};
</script>

<style scoped>
.tabs-container {
  max-width: 800px;
  margin: 0 auto;
}

.tabs-header {
  display: flex;
  border-bottom: 2px solid #ccc;
  margin-bottom: 10px;
}

.tab-button {
  background-color: #f1f1f1;
  border: none;
  outline: none;
  padding: 10px 20px;
  cursor: pointer;
  transition: background-color 0.3s;
  font-size: 16px;
}

.tab-button:hover {
  background-color: #ddd;
}

.tab-button.active {
  background-color: #fff;
  border-bottom: 2px solid #fff;
  font-weight: bold;
}

.tabs-content {
  position: relative;
}

</style>
