import js from '@eslint/js';
import pluginVue from 'eslint-plugin-vue';
import globals from 'globals';

export default [
  js.configs.recommended,
  ...pluginVue.configs['flat/essential'],
  {
    languageOptions: { globals: { ...globals.browser } },
    rules: { 'vue/multi-word-component-names': 'off' },
  },
  { ignores: ['dist/'] },
];
