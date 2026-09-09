<template>
  <h1>Годовая успеваемость ученика</h1>

  <table>
    <thead>
    <tr>
      <th>Предмет</th>
      <th>1 четверть</th>
      <th>2 четверть</th>
      <th>3 четверть</th>
      <th>4 четверть</th>
      <th>Итоговая оценка</th>
    </tr>
    </thead>
    <tbody>
    <tr v-for="row in rows" :key="row.subject">
      <td class="subject-column">{{ row.subject }}</td>
      <td v-for="(mark, index) in row.marks" :key="index">{{ mark }}</td>
      <td>{{ row.total }}</td>
    </tr>
    <tr v-if="!rows.length">
      <td class="empty" colspan="6">Оценок пока нет</td>
    </tr>
    </tbody>
  </table>
</template>

<script>

export default {
  data() {
    return {
      rows: [],
    }
  },
};
</script>

<style scoped>
body {
  font-family: Arial, sans-serif;
  padding: 20px;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
}

th, td {
  padding: 10px;
  text-align: center;
  border: 1px solid #ddd;
}

th {
  background-color: #f4f4f4;
}

.subject-column {
  text-align: left;
}

.empty {
  color: #888;
}
</style>