import { createApp } from 'vue'
import Root from './App.vue'
import VueChartkick from 'vue-chartkick'
import 'chartkick/chart.js'
import { Chart } from 'chart.js'
import zoomPlugin from 'chartjs-plugin-zoom'

// Регистрируем плагин zoom
Chart.register(zoomPlugin)

const app = createApp(Root)
app.use(VueChartkick)
app.mount('#app')