<template>
    <div class="row">
        <div class="column">
            <div>
                <Plane
                    :data="data"
                    :min="yMin < yMax ? Number(yMin) : null"
                    :max="yMax > yMin ? Number(yMax) : null"
                />
            </div>
            <button @click="isStopped = !isStopped">
                {{ isStopped ? '⏵' : '⏸' }}
            </button>
            <button @click="save">save</button>
        </div>

        <div class="column">
            <h3>настройки</h3>
            <input v-model="yMin" type="number" placeholder="yMin">
            <input v-model="yMax" type="number" placeholder="yMax">
            <h3>функции</h3>
            <small><a href="https://mathjs.org/docs/index.html" target="_blank">math.js</a></small>
            <div v-for="(f, i) in fns" :key="i">
                <input v-model="f[1]" type="number" placeholder="count">
                <input v-model="f[0]" type="text" placeholder="function">
                <input v-model="f[2]" type="text" placeholder="label">
                <button @click="derivative(f)">dx</button>
                <button @click="fns = fns.filter((f, index) => index !== i)">-</button>
            </div>
            <button @click="fns.push(['x', 20])">+</button>
        </div>
    </div>
</template>

<script>

import Plane from "./components/Plane";
import { evaluate, derivative } from 'mathjs';


export default {
    name: 'App',
    components: {
        Plane
    },
    // TODO: вынести настрйоки области определения (start + step + count)
    created() {
        this.load();

        const fps = 24  // частота обновления
        const coof = 10 // скорость времени
        setInterval(() => {
            if (!this.isStopped) {
                this.tick = this.tick + 1 / coof
            }
        }, 1000 / fps)
    },
    computed: {
        data() {
            return this.fns.map(f => {
                return {
                    label: f[2],
                    name: f[0],
                    data: {...this.sequence(f[0], f[1])}
                }
            });
        },
        defaultValues() {
            const labels = this.fns.map(x => [x[2], 0])
            return Object.fromEntries(labels)
        },
    },
    data() {
        return {
            fns: [],
            yMin: null,
            yMax: null,
            tick: 0,
            isStopped: true
        }
    },
    methods: {
        // добавить производную от функции
        derivative(f) {
            this.fns.push([derivative(f[0], 'x').toString(), f[1], f[2] + '_dx'])
        },
        // текущие значения функций в заданной точке
        getValues(point) {
            let values = this.defaultValues
            if (this.data) {
                this.data.forEach(item => {
                    values[item.label] = item.data[point]
                });
            }
            return values
        },
        sequence(f, count) {
            const range = Array.from(Array(count).keys())
            return range.map((x) => {
                let r = 0
                const symbols = {
                    x,
                    t: this.tick,
                    ...this.getValues(x)
                }
                try {
                    r = evaluate(f, symbols)
                } catch (e) {
                    console.log(e)
                }
                return r
            })
        },
        save() {
            localStorage.setItem('math_data', JSON.stringify([
                this.fns, this.yMin, this.yMax
            ]))
        },
        load() {
            const data = JSON.parse(localStorage.getItem('math_data'))
            this.fns = [
                // ['x+t%100', 20],
                // ['x^2', 20],
                // ['sin(x+t / 10)*100', 20],
                ['sin(x+t)', 20, 'a'],
                ['cos(x+t)', 20, 'b'],
                ['2a + 2b', 20, 'c'],
                ['0.5x - 5', 20, 'linear'],
                ['0.2x^2 - 2x - 4', 20, 'quadro'],
                ['e^x', 20, 'exp'],

                // 1/n sin(nx + t) - пилообразный волномикс
                // 1/n sin(nx + t) - гле n - четные -> прямоугольный волномикс
            ]
            if (data) {
                this.fns = data[0] || this.fns
                this.yMin = data[1] || this.yMin
                this.yMax = data[2] || this.yMax
            }
        },
    },
}
</script>

<style>
#app {
    font-family: Avenir, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    color: #2c3e50;
    margin-top: 60px;
}
.row {
    display: flex;
}

.column {
    flex: 50%;
}
</style>
