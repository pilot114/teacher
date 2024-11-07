<template>
  <div
      class="scatter-text"
      @mouseenter="scatterLetters"
      @mouseleave="resetLetters"
  >
    <template v-for="(char, index) in chars">
      <span
          v-if="char !== ' '"
          :key="`letter-${index}`"
          ref="letters"
          class="letter"
      >
        {{ char }}
      </span>
      <span
          v-else
          :key="`space-${index}`"
          class="space"
      >
        &nbsp;
      </span>
    </template>
  </div>
</template>

<script>
export default {
  name: 'ScatterText',
  data() {
    return {
      chars: [],
    };
  },
  mounted() {
    let text = '';

    // Для Vue 3
    const slotContent = this.$slots.default ? this.$slots.default() : [];

    slotContent.forEach((vnode) => {
      if (vnode.children && typeof vnode.children === 'string') {
        text += vnode.children;
      }
    });

    this.chars = text.split('');
  },
  methods: {
    scatterLetters() {
      const letters = this.$refs.letters;
      letters.forEach((span) => {
        if (span.classList.contains('space')) return;
        const x = Math.floor(Math.random() * 200 - 100);
        const y = Math.floor(Math.random() * 200 - 100);
        const rotation = Math.floor(Math.random() * 360);
        span.style.transform = `translate(${x}px, ${y}px) rotate(${rotation}deg)`;
        span.style.opacity = '0';
        span.style.transitionDelay = `${Math.random() * 0.5}s`;
      });
    },
    resetLetters() {
      const letters = this.$refs.letters;
      letters.forEach((span) => {
        if (span.classList.contains('space')) return;
        span.style.transform = 'translate(0, 0) rotate(0deg)';
        span.style.opacity = '1';
        span.style.transitionDelay = '0s';
      });
    },
  },
};
</script>

<style scoped>
.scatter-text {
  display: inline-block;
  position: relative;
  cursor: pointer;
  overflow: hidden;
  white-space: nowrap;
}

.scatter-text .letter {
  display: inline-block;
  position: relative;
  transition: all 0.5s ease;
}

.scatter-text .space {
  display: inline-block;
  width: 0.3em; /* Настройте по необходимости */
}
</style>
