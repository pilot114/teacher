import { createApp } from 'vue'
import Root from './App.vue'
import VueChartkick from 'vue-chartkick'
import 'chartkick/chart.js'

const app = createApp(Root)
app.use(VueChartkick)
app.mount('#app')