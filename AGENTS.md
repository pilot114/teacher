# teacher

Программы для домашнего обучения. Части независимы:

| каталог | что | стек |
|---|---|---|
| `topics/` | домашняя школа: учебники, практика, тесты, исполнение кода (Python, PHP, Go) | Vue 3 + Vite |
| `math/` | визуализатор математики: графики, геометрия, стереометрия | Vue 3 + Vite, Chart.js 4, three.js |
| `letters/` | запоминание букв | Electron 45 |
| `backend/` | вход и прогресс по тестам | Go, SQLite (modernc) |
| `docs/` | сборка `topics` для GitHub Pages (`/teacher/`) | — |

## Как устроено

- `topics` собирается дважды: своя сборка (`npm run build`) кладёт результат в `docs/` с base `/teacher/`,
  а wshell собирает тот же код с `--base /` в `wshell/www/school` для school.wshell.com.
- Исполнители кода в `topics/src/executor/`: Python — pyodide с CDN в модульном воркере (поэтому
  `worker.format: 'es'`), PHP — php-wasm (в сборку попадает только PHP 8.4, см. плагин в
  `vite.config.js`), Go — заранее собранные `public/go/*.wasm` + `src/wasm/wasm_exec.js`.
  `wasm_exec.js` должен совпадать с версией Go, которой собраны `.wasm`.
- Адрес API при сборке — `VITE_API_URL`; без него прод-сборка ходит на свой домен.

## Грабли

- **База бэкенда — живые данные семьи.** `backend/teacher.db` в git не хранится и не должна туда попасть.
  Для проверок поднимать отдельный экземпляр: `DB_PATH=/путь/test.db PORT=8098 ./teacher-api`.
  Настоящий запущен wshell-ом на :8090 с той же командной строкой `./teacher-api` — **не гасить его
  `pkill -f teacher-api`**, только по PID.
- Учётки: `teacher-api user add <логин> [имя]` (пароль из `PASSWORD` или с консоли).

## Команды

Обслуживание — как в pretty-php: `npm run test`, `npm run check`, `npm run fix`.

- `check` — eslint и prettier в math, topics, letters; gofmt и go vet в backend; ничего не меняет
- `fix` — eslint --fix, prettier --write, gofmt -w
- `test` — go test бэкенда

Цели Makefile одинаковые во всех проектах `~/projects` (`make help` — список):

- `make install` — зависимости всех частей
- `make dev` — topics на :5173 (бэкенд: cd backend && DB_PATH=… go run .)
- `make build` — topics → docs/ (GitHub Pages), math, бэкенд
- `make audit` — уязвимости
- `make outdated` — устаревшие зависимости
