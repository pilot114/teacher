<template>
  <div class="content-area">
    <div v-if="content">
      <h2>{{ content.title }}</h2>
      <div class="columns">
        <div class="description">
          <div v-html="content.description"></div>
        </div>
        <div class="tasks" v-if="content.tasks">
          <h3>Задания для самопроверки</h3>
          <ol>
            <li
                v-for="(task, index) in content.tasks"
                :key="index"
                v-html="task"
            >
            </li>
          </ol>
        </div>
      </div>
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

.columns {
  display: flex;
  flex-direction: row;
}

.description {
  flex: 1;
  margin-right: 20px;
}

.tasks {
  flex: 1;
}

.tasks h3 {
  margin-top: 0;
}

.tasks ol {
  padding-left: 20px;
}

@media (max-width: 800px) {
  .columns {
    flex-direction: column;
  }
  .description, .tasks {
    margin-right: 0;
  }
}
</style>
