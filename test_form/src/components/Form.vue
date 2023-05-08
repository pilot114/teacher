<script setup>
import { ref, onMounted } from 'vue'

const props = defineProps({
  data: Object,
  meta: Object,
})

let currentData = ref({})

function clear() {
  currentData.value = structuredClone(props.data)
}

function ifSpecialType(type) {
  return ['checkbox', 'tags', 'image'].includes(type)
}

onMounted(() => clear())

</script>

<template>
  <div class="w-full max-w-md mx-auto">
    <form class="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">

      <div class="mb-2" v-for="(value, name) in currentData">
        <label class="block text-gray-700 font-bold mb-2">
          {{ meta[name].label ?? name }}
        </label>

        <template v-if="ifSpecialType(meta[name].type)">

          <input
              v-if="meta[name].type === 'checkbox'"
              class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded"
              type="checkbox"
              v-model="currentData[name]"
          >

          <template
              v-else-if="meta[name].type === 'image'"
          >
            <img
                class="w-full h-64 object-contain border border-gray-400"
                :src="value"
            />
            <input type="file"/>
          </template>

          <div
              v-else-if="meta[name].type === 'tags'"
              class="flex flex-wrap gap-2"
          >
            <a
                v-for="(tag, name) in value"
                class="bg-blue-500 hover:bg-blue-600 px-2 py-1 rounded-full text-white font-medium"
            >
              {{ tag }}
            </a>
          </div>

          <div v-else>
            {{ meta[name] }}
          </div>

        </template>
        <input
            v-else
            class="appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
            :placeholder="name"
            :type="meta[name].type"
            v-model="currentData[name]"
        />
        <p
            v-if="meta[name].desc"
            class="text-gray-600 text-xs italic">
          {{ meta[name].desc }}
        </p>
      </div>

      <div class="flex items-center justify-between">
        <button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" type="button">
          Сохранить
        </button>
        <button
            class="bg-blue-300 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            type="button"
            @click="clear"
        >
          Очистить
        </button>
      </div>

    </form>
  </div>
</template>
