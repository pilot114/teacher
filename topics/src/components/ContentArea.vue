<template>
  <div class="content-area">
    <div v-if="content">
      <h2>{{ content.title }}</h2>
      <div v-html="content.description"></div>
    </div>
    <div v-else>
      <p>Пожалуйста, выберите тему из меню.</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ContentArea',
  props: ['content']
};
</script>

<style>
.content-area {
  flex: 1;
  padding: 20px;
}
</style>
