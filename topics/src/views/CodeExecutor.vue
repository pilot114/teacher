<template>
  <div>
    <button v-if="!started" type="button" class="start-btn" @click="start">Начать</button>
    <div v-else class="columns">
      <div class="column column-langs">
        <div v-for="language in languages" :key="language.name" class="language-container">
          <img :src="language.logo" width="20" height="20" />
          <a v-if="language.isSupported" href="#" @click="selectLanguage(language)">
            {{ language.name }}
          </a>
        </div>
      </div>

      <div class="column column-names">
        <div v-for="(code, name) in sources[currentLanguage.name]" :key="name">
          <a href="#" @click="selectCurrentCode(name)">
            {{ name }}
          </a>
        </div>
      </div>

      <div class="column">
        <CodeEditor v-model="currentCode" :language="currentLanguage.name" :readonly="currentLanguage.isReadonly" />
      </div>

      <div class="column column-run">
        <button class="run-btn" @click="runCode">Выполнить</button>
        <span class="loader" v-if="isLoading"></span>
      </div>

      <div class="column">
        <ContentTabs activeTab="stdout">
          <ContentTab name="args & envs" label="args & envs">
            <input v-model="args" type="text" />
            <br />
            <input v-model="envs" type="text" />
          </ContentTab>
          <ContentTab name="stdin" label="stdin">
            <textarea v-model="stdin" type="text" rows="10"></textarea>
          </ContentTab>
          <ContentTab name="stdout" label="stdout">
            <pre>{{ stdout }}</pre>
          </ContentTab>
          <ContentTab name="stderr" label="stderr">
            <pre>{{ stderr }}</pre>
          </ContentTab>
          <ContentTab name="result" label="result">
            <pre>{{ result }}</pre>
          </ContentTab>
        </ContentTabs>
      </div>
    </div>
  </div>
</template>

<script>
import ContentTabs from '@/components/ContentTabs.vue';
import ContentTab from '@/components/ContentTab.vue';
import CodeEditor from '@/components/CodeEditor.vue';
import { sources } from '@/sources.js';

import { WasmProcessManager, Langs } from '@/executor/WasmProcessManager.js';

const languages = [
  {
    name: Langs.PYTHON,
    logo: 'https://upload.wikimedia.org/wikipedia/commons/c/c3/Python-logo-notext.svg',
    isSupported: true,
    isReadonly: false,
  },
  {
    name: Langs.PHP,
    logo: 'https://upload.wikimedia.org/wikipedia/commons/2/27/PHP-logo.svg',
    isSupported: true,
    isReadonly: false,
  },
  {
    name: Langs.GO,
    logo: 'https://upload.wikimedia.org/wikipedia/commons/0/05/Go_Logo_Blue.svg',
    isSupported: true,
    isReadonly: true,
  },
];

export default {
  name: 'CodeExecutor',
  components: { ContentTab, ContentTabs, CodeEditor },
  emits: ['start'],
  data() {
    return {
      started: false,
      languages: languages,
      currentLanguage: languages[2],
      currentCode: '',
      currentCodeName: '',
      sources: sources,

      args: 'qwe asd zxc',
      envs: '{"test": 123}',
      stdin: 'test',
      stdout: '',
      stderr: '',
      result: '',

      wrapper: null,
      isLoading: false,
    };
  },
  beforeUnmount() {
    if (this.wrapper) {
      this.wrapper.terminate();
    }
  },

  methods: {
    // интерпретатор поднимаем только по «Начать»: до этого на экране одна кнопка
    start() {
      this.started = true;
      this.initWrapper();
      this.autoSelectCode();
      this.selectCurrentCode('check_io');
      this.$emit('start');
    },
    selectCurrentCode(codeName) {
      this.currentCodeName = codeName;
      this.currentCode = this.sources[this.currentLanguage.name][codeName];
    },
    selectLanguage(language) {
      this.currentLanguage = language;
      this.initWrapper();
      this.autoSelectCode();
    },
    initWrapper() {
      this.wrapper = new WasmProcessManager(this.currentLanguage.name);

      this.wrapper.onOutput((out) => {
        this.stdout = out;
      });

      this.wrapper.onError((error) => {
        this.stderr = error;
      });

      this.wrapper.onResult((result) => {
        this.result = result;
        this.isLoading = false;
      });
    },
    autoSelectCode() {
      this.currentCodeName = Object.keys(this.sources[this.currentLanguage.name])[0];
      this.currentCode = Object.values(this.sources[this.currentLanguage.name])[0];
    },
    runCode() {
      this.output = '';
      this.stdout = '';
      this.stderr = '';
      if (this.wrapper) {
        this.isLoading = true;
        this.wrapper.sendCode(this.currentCode, this.currentCodeName, JSON.parse(this.envs), this.args.split(' '));
      }
    },
  },
};
</script>

<style scoped>
.start-btn {
  background: linear-gradient(to bottom, #3498db, #2980b9);
  border: none;
  color: #fff;
  padding: 10px 20px;
  border-radius: 5px;
  font-size: 16px;
  cursor: pointer;
  transition:
    background 0.3s,
    transform 0.2s;
}

.start-btn:hover {
  background: linear-gradient(to bottom, #2980b9, #3498db);
}

.columns {
  display: flex;
  justify-content: start;
  gap: 1em;
}

.column {
  flex: 1;
  min-width: 0;
}

.column-names {
  width: 100px;
  flex: none;
}

pre {
  background-color: #f5f5f5;
  padding: 1em;
  overflow-x: auto;
}

.loader {
  display: inline-block;
  width: 32px;
  height: 32px;
  border: 4px solid rgba(0, 0, 0, 0.2);
  border-top-color: rgba(0, 0, 0, 0.8);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  vertical-align: middle;
  margin-left: 5px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

textarea,
input {
  border: 1px solid #ccc;
  border-radius: 4px;
  overflow: hidden;
  width: 400px;
  max-width: 100%;
  padding: 0.5em;
  margin-bottom: 1em;

  outline: none;
  white-space: pre;
  background-color: #f5f5f5;
}

.language-container {
  display: flex;
  align-items: center;
  gap: 5px;
}

@media (max-width: 900px) {
  .start-btn {
    width: 100%;
  }

  /* пять колонок в строку на телефон не помещаются — раскладываем сверху вниз */
  .columns {
    flex-direction: column;
    gap: 14px;
  }

  .column,
  .column-names {
    width: auto;
    flex: none;
  }

  /* языки и примеры — строки «таблеток» с прокруткой вбок */
  .column-langs,
  .column-names {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
  }

  .column-langs::-webkit-scrollbar,
  .column-names::-webkit-scrollbar {
    display: none;
  }

  .column-langs > div,
  .column-names > div {
    flex: none;
    padding: 7px 12px;
    border: 1px solid #d5d5d5;
    border-radius: 16px;
    background-color: #f7f7f7;
    white-space: nowrap;
  }

  .column-langs a,
  .column-names a {
    color: #1a63c4;
    text-decoration: none;
  }

  .run-btn {
    width: 100%;
    padding: 11px 20px;
    border: 1px solid #1a63c4;
    border-radius: 6px;
    background-color: #1a63c4;
    color: #ffffff;
    cursor: pointer;
  }

  textarea,
  input {
    width: 100%;
  }

  textarea {
    white-space: pre-wrap;
  }
}
</style>
