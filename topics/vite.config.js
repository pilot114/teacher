import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// PhpWeb перечисляет в switch все версии PHP, и Vite кладёт в сборку все шесть
// .wasm по 12–16 МБ. Берём только версию по умолчанию, остальные — заглушка.
const PHP_VERSION = '8.4';
const onlyOnePhp = {
  name: 'only-one-php',
  enforce: 'pre',
  resolveId(source, importer) {
    const match = source.match(/^\.\/php(\d\.\d)-web\.mjs$/);
    if (match && match[1] !== PHP_VERSION && importer?.includes('php-wasm')) {
      return `\0php-stub-${match[1]}`;
    }
    return null;
  },
  load(id) {
    if (id.startsWith('\0php-stub-')) {
      return `throw new Error('PHP ${id.slice(10)} не входит в сборку, есть только ${PHP_VERSION}');`;
    }
    return null;
  },
};

// Своя сборка — для GitHub Pages, сайт там в подкаталоге /teacher/.
// wshell собирает тот же код с --base / для school.wshell.com.
export default defineConfig(({ command }) => ({
  plugins: [vue(), onlyOnePhp],
  base: command === 'build' ? '/teacher/' : '/',
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  // php-wasm грузит свой .wasm относительно собственного модуля — предсборка Vite ломает этот путь
  optimizeDeps: { exclude: ['php-wasm'] },
  // воркер Python — модульный: pyodide подключается через import с CDN
  worker: { format: 'es' },
}));
