<template>
  <div>
    <div class="columns">
      <div class="column">
        <div
            v-for="language in languages"
            :key="language.name"
        >
          <a
              v-if="language.isSupported"
              href="#" @click="selectLanguage(language.name)"
          >
            {{ language.name }}
          </a>
        </div>
      </div>

      <div class="column" style="width:100px;">
        <div
            v-for="(code, name) in sources[currentLanguage]"
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
        <h3>Код:</h3>
        <CodeEditor v-model="currentCode" :language="currentLanguage" />

        <button @click="runCode">Выполнить</button>
        <span class="loader" v-if="isLoading"></span>
      </div>

      <div class="column">
        <ContentTabs activeTab="stdout">
          <ContentTab name="args" label="args">
            <textarea v-model="args">
            </textarea>
          </ContentTab>
          <ContentTab name="stdin" label="stdin">
            <textarea v-model="stdin">
            </textarea>
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

import {ExecutionWrapper, Langs} from "@/executor/ExecutionWrapper";

export default {
  name: 'CodeExecutor',
  components: {ContentTab, ContentTabs, CodeEditor},
  data() {
    return {
      languages: [
        {name: Langs.PYTHON, logo: 'https://upload.wikimedia.org/wikipedia/commons/c/c3/Python-logo-notext.svg', isSupported: true},
        {name: Langs.PHP, logo: 'https://upload.wikimedia.org/wikipedia/commons/2/27/PHP-logo.svg', isSupported: true},
        {name: Langs.GO, logo: 'https://upload.wikimedia.org/wikipedia/commons/0/05/Go_Logo_Blue.svg', isSupported: true},
      ],
      currentLanguage: Langs.PYTHON,
      currentCode: '',
      sources: sources,
      args: '',
      stdin: '',
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
  },
  beforeUnmount() {
    if (this.wrapper) {
      this.wrapper.terminate();
    }
  },

  methods: {
    selectCurrentCode(codeName) {
      this.currentCode = this.sources[this.currentLanguage][codeName];
    },
    selectLanguage(name) {
      this.currentLanguage = name;
      this.initWrapper();
      this.autoSelectCode();
    },
    initWrapper() {
      this.wrapper = new ExecutionWrapper(this.currentLanguage);

      this.wrapper.onResult((result) => {
        this.result = result;
        this.isLoading = false;
      });

      this.wrapper.onOutput((out) => {
        this.stdout = out;
        this.isLoading = false;
      });

      this.wrapper.onError((error) => {
        this.stderr = error;
        this.isLoading = false;
      });
    },
    autoSelectCode() {
      this.currentCode = Object.values(this.sources[this.currentLanguage])[0];
    },
    runCode() {
      this.output = '';
      this.stdout = '';
      this.stderr = '';
      if (this.wrapper) {
        this.isLoading = true;
        this.wrapper.sendCode(this.currentCode);
      }
    },
  },
};
</script>

<style scoped>
.columns {
  display: flex;
  justify-content: space-between;
  gap: 1em;
  margin-bottom: 1em;
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
  width: 16px;
  height: 16px;
  border: 2px solid rgba(0, 0, 0, 0.2);
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

textarea {
  border: 1px solid #ccc;
  border-radius: 4px;
  overflow: hidden;
  width: 400px;
  padding: 1em;

  min-height: 300px;
  font-family: 'Fira Code', monospace;
  font-size: 14px;
  outline: none;
  white-space: pre;
  background-color: #f5f5f5;
}
</style>
