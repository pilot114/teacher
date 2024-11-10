<template>
  <div>
    <div class="columns">
      <div class="column">
        <h3>Код:</h3>
        <PythonCodeEditor v-model="code" />

        <button @click="runPythonCode">Выполнить</button>
        <span class="loader" v-if="isLoading"></span>
      </div>

      <div class="column">
        <ContentTabs activeTab="stdout">
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
          <ContentTab name="output" label="output">
            <pre>{{ output }}</pre>
          </ContentTab>
        </ContentTabs>
      </div>
    </div>
  </div>
</template>

<script>
import ContentTabs from "@/components/ContentTabs.vue";
import ContentTab from "@/components/ContentTab.vue";
import PythonCodeEditor from "@/components/PythonCodeEditor.vue";

export default {
  name: 'PythonExecutor',
  components: {ContentTab, ContentTabs, PythonCodeEditor},
  data() {
    return {
      code: 'print("Hello, World!")',
      output: '',
      stdin: '',
      stdout: '',
      stderr: '',
      worker: null,
      isLoading: false,
    };
  },
  mounted() {
    this.worker = new Worker(new URL('../pyWorker.js', import.meta.url), { type: 'module' });

    this.worker.onmessage = (event) => {

      const { type, result, error } = event.data;

      this.isLoading = false;

      if (type === 'stdout') {
        this.stdout = result;
      } else if (type === 'result') {
        this.output = result;
      } else if (type === 'stderr') {
        this.stderr = `Ошибка в python: ${error}`;
      } else if (type === 'error') {
        this.stderr = `Ошибка выполнения кода: ${error}`;
      }
    };
  },
  beforeUnmount() {
    if (this.worker) {
      this.worker.terminate();
    }
  },

  methods: {
    runPythonCode() {
      this.output = '';
      this.stdout = '';
      this.stderr = '';
      if (this.worker) {
        this.isLoading = true;
        this.worker.postMessage({ code: this.code });
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

.code-input {
  width: 100%;
  height: 100%;
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
