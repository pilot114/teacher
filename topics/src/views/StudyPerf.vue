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
    <tr>
      <td class="subject-column">Математика</td>
      <td>4</td>
      <td>5</td>
      <td>4</td>
      <td>5</td>
      <td>5</td>
    </tr>
    <tr>
      <td class="subject-column">Русский язык</td>
      <td>5</td>
      <td>5</td>
      <td>4</td>
      <td>5</td>
      <td>5</td>
    </tr>
    <tr>
      <td class="subject-column">История</td>
      <td>4</td>
      <td>4</td>
      <td>5</td>
      <td>5</td>
      <td>4</td>
    </tr>
    <tr>
      <td class="subject-column">Физика</td>
      <td>3</td>
      <td>4</td>
      <td>4</td>
      <td>5</td>
      <td>4</td>
    </tr>
    <tr>
      <td class="subject-column">Английский язык</td>
      <td>5</td>
      <td>4</td>
      <td>4</td>
      <td>5</td>
      <td>5</td>
    </tr>
    <tr>
      <td class="subject-column">Химия</td>
      <td>4</td>
      <td>3</td>
      <td>4</td>
      <td>4</td>
      <td>4</td>
    </tr>
    </tbody>
  </table>
</template>

<script>

export default {
  data() {
    return {
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
</style>