<template>
  <div>
    <div class="columns">
      <div class="column">
        <div
            v-for="language in languages"
            :key="language.name"
            class="language-container"
        >
          <img :src="language.logo" width="20" height="20">
          <a
              v-if="language.isSupported"
              href="#" @click="selectLanguage(language)"
          >
            {{ language.name }}
          </a>
        </div>
      </div>

      <div class="column" style="width:100px;">
        <div
            v-for="(code, name) in sources[currentLanguage.name]"
            :key="name"
        >
          <a
              href="#" @click="selectCurrentCode(name)"
          >
            {{ name }}
          </a>
        </div>
      </div>

      <div class="column">
        <CodeEditor
            v-model="currentCode"
            :language="currentLanguage.name"
            :readonly="currentLanguage.isReadonly"
        />
      </div>

      <div class="column">
        <button @click="runCode">Выполнить</button>
        <span class="loader" v-if="isLoading"></span>
      </div>

      <div class="column">
        <ContentTabs activeTab="stdout">
          <ContentTab name="args & envs" label="args & envs">
            <input v-model="args" type="text">
            <br>
            <input v-model="envs" type="text">
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
import ContentTabs from "@/components/ContentTabs.vue";
import ContentTab from "@/components/ContentTab.vue";
import CodeEditor from "@/components/CodeEditor.vue";
import {sources} from "@/sources.js";

import {WasmProcessManager, Langs} from "@/executor/WasmProcessManager";

const languages = [
  {name: Langs.PYTHON, logo: 'https://upload.wikimedia.org/wikipedia/commons/c/c3/Python-logo-notext.svg', isSupported: true, isReadonly: false},
  {name: Langs.PHP, logo: 'https://upload.wikimedia.org/wikipedia/commons/2/27/PHP-logo.svg', isSupported: true, isReadonly: false},
  {name: Langs.GO, logo: 'https://upload.wikimedia.org/wikipedia/commons/0/05/Go_Logo_Blue.svg', isSupported: true, isReadonly: true},
];

export default {
  name: 'CodeExecutor',
  components: {ContentTab, ContentTabs, CodeEditor},
  data() {
    return {
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
  mounted() {
    this.initWrapper();
    this.autoSelectCode();
    this.selectCurrentCode('check_io');
  },
  beforeUnmount() {
    if (this.wrapper) {
      this.wrapper.terminate();
    }
  },

  methods: {
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
        this.wrapper.sendCode(
            this.currentCode,
            this.currentCodeName,
            JSON.parse(this.envs),
            this.args.split(' '),
        );
      }
    },
  },
};
</script>

<style scoped>
.columns {
  display: flex;
  justify-content: start;
  gap: 1em;
}

.column {
  flex: 1;
}

pre {
  background-color: #f5f5f5;
  padding: 1em;
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

textarea, input {
  border: 1px solid #ccc;
  border-radius: 4px;
  overflow: hidden;
  width: 400px;
  padding: .5em;
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
</style>
