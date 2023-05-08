<script setup>
import { ref, onMounted } from 'vue'
import Form from './components/Form.vue'

const data = {
  // scalar
  name: 'Ivan',
  password: 'test1234',
  age: 32,
  remote: true,
  // "computed" scalar
  created: '1995-12-17',
  department: 42,
  posts: [1234, 5678],
  avatar: 'https://cdn-icons-png.flaticon.com/256/355/355980.png'
}

const container = {
  String: {type: String},
  Number: {type: Number},
  Boolean: {type: Boolean},
  Date: {type: Date},
  Info: {
    type: {
      name: String,
      password: String,
      age: Number,
      remote: Boolean,
      created: Date,
      department: 'Department',
      posts: ['Post'],
      avatar: 'ImageFile',
    },
    optional: ['age', 'created'],
  },
  Department: {
    type: (value) => {
      return {
        id: Number(value),
        name: String('dep name'),
      }
    }
  },
  Post: {
    type: (value) => {
      return {
        id: Number(value),
        title: String('post title'),
      }
    }
  },
  ImageFile: {
    type: async (value) => {
      const response = await fetch(value);
      const data = await response.blob();
      return {
        blob: String(URL.createObjectURL(data)),
      }
    }
  },
}

function get(key) {
  if (container.hasOwnProperty(key)) {
    return container[key]
  }
  console.warn(`Отстутствует тип ${key}`)
  return {}
}

async function recover(data, key) {
  if (typeof key === 'function') {
    return key(data)
  }

  const item = get(key)

  if (typeof item.type === 'function') {
    return item.type(data)
  }

  let result = {}
  for (const [name, type] of Object.entries(item.type)) {
    if (!data.hasOwnProperty(name) && (!item.optional || !item.optional.includes(name))) {
      console.warn(`Отстутствует обязательное поле ${name}`)
      continue
    }

    const value = data[name]

    if (typeof type === 'function') {
      result[name] = await recover(value, type)
      continue
    }

    if (Array.isArray(value)) {
      result[name] = []
      for (const x of value) {
        const val = await recover(x, type[0]);
        result[name].push(val)
      }
      continue
    }

    result[name] = await recover(value, type)
  }
  return result
}

const settings = {
  type: ['Programmer', 'QA', 'Designer']
};

let recovered = ref(null)

const meta = {
  name: {type: 'string', label: 'Имя'},
  password: {type: 'password', label: 'Пароль', desc: 'Любые символы'},
  age: {type: 'number', label: 'Возраст'},
  remote: {type: 'checkbox', label: 'Удаленная работа'},
  created: {type: 'date', label: 'Принят на работу'},
  department: {type: 'number', label: 'Департамент'},
  posts: {type: 'tags', label: 'Посты'},
  avatar: {type: 'image', label: 'Фото'}
}

onMounted(async () => {
  recovered.value = await recover(data, 'Info')
})
</script>

<template>
<!--  <p>flat data from backend API</p>-->
<!--  <pre>{{ data }}</pre>-->
<!--  <p>recovered data</p>-->
<!--  <pre>{{ recovered }}</pre>-->
  <Form :data="data" :meta="meta"/>
</template>
