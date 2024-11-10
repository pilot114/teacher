<template>
  <div class="sidebar">
    <h2>Оглавление</h2>
    <ul>
      <li
          v-for="poem in poems"
          :key="poem.name"
          @click="showPoem(poem.name)"
      >
        {{ poem.name }}
      </li>
    </ul>
  </div>

  <div class="content">
    <div v-if="current">
      <h3>{{ current.name }}</h3>
      <div class="poetry">
      {{ current.text }}
      </div>
    </div>
  </div>
</template>

<script>

export default {
  data() {
    return {
      poems: [
        {
          name: 'У лукоморья',
          text: "    У лукоморья дуб зелёный;\n" +
              "    Златая цепь на дубе том:\n" +
              "    И днём и ночью кот учёный\n" +
              "    Всё ходит по цепи кругом;\n" +
              "\n" +
              "    Идёт направо — песнь заводит,\n" +
              "    Налево — сказку говорит.\n" +
              "    Там чудеса: там леший бродит,\n" +
              "    Русалка на ветвях сидит;\n" +
              "\n" +
              "    Там на неведомых дорожках\n" +
              "    Следы невиданных зверей;\n" +
              "    Избушка там на курьих ножках\n" +
              "    Стоит без окон, без дверей;\n" +
              "\n" +
              "    Там лес и дол видений полны;\n" +
              "    Там о заре прихлынут волны\n" +
              "    На брег песчаный и пустой,\n" +
              "    И тридцать витязей прекрасных\n" +
              "    Чредой из вод выходят ясных,\n" +
              "    И с ними дядька их морской;\n" +
              "\n" +
              "    Там королевич мимоходом\n" +
              "    Пленяет грозного царя;\n" +
              "    Там в облаках перед народом\n" +
              "    Через леса, через моря\n" +
              "    Колдун несёт богатыря;\n" +
              "    В темнице там царевна тужит,\n" +
              "    А бурый волк ей верно служит;\n" +
              "\n" +
              "    Там ступа с Бабою Ягой\n" +
              "    Идёт, бредёт сама собой,\n" +
              "    Там царь Кащей над златом чахнет;\n" +
              "    Там русский дух… там Русью пахнет!\n" +
              "\n" +
              "    И там я был, и мёд я пил;\n" +
              "    У моря видел дуб зелёный;\n" +
              "    Под ним сидел, и кот учёный\n" +
              "    Свои мне сказки говорил."
        }
      ],
      current: null,
    }
  },
  methods: {
    showPoem(name) {
      this.current = this.poems.filter((n) => n.name === name)[0];
    },
  },

};
</script>

<style scoped>
/* Общие стили */
body {
  font-family: Arial, sans-serif;
  margin: 0;
  padding: 0;
  display: flex;
  min-height: 100vh;
}

/* Стили для левой колонки (оглавление) */
.sidebar {
  width: 250px;
  background-color: #f4f4f4;
  padding: 20px;
  box-sizing: border-box;
  overflow-y: auto;
}

/* Стили для правой колонки (текст) */
.content {
  width: 75%;
  padding: 20px;
  box-sizing: border-box;
}

/* Пример списка в оглавлении */
.sidebar ul {
  list-style: none;
  padding: 0;
  cursor: pointer;
}

.sidebar ul li {
  margin-bottom: 10px;
}

.sidebar ul li a {
  text-decoration: none;
  color: #333;
}

.sidebar ul li a:hover {
  text-decoration: underline;
}

.poetry {
  background-color: #f4f4f4;
  padding: 20px;
  white-space: pre-wrap;
}
</style>