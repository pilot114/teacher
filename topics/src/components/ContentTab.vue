<!-- Tab.vue -->
<template>
  <div v-if="isActive" class="tab-pane active">
    <slot></slot>
  </div>
</template>

<script>
import { inject, computed, onMounted } from 'vue';

export default {
  name: 'ContentTab',
  props: {
    name: {
      type: String,
      required: true, // Уникальное имя вкладки
    },
    label: {
      type: String,
      required: true, // Отображаемый заголовок вкладки
    },
  },
  setup(props) {
    const registerTab = inject('registerTab');
    const activeTabName = inject('activeTabName');

    onMounted(() => {
      registerTab({ name: props.name, label: props.label });
    });

    const isActive = computed(() => activeTabName.value === props.name);

    return {
      isActive,
    };
  },
};
</script>

