<template>
  <div class="code-editor">
    <div ref="editor" class="editor"></div>
  </div>
</template>

<script>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { CodeJar } from 'codejar';
import { highlight, languages } from 'prismjs/components/prism-core';
import 'prismjs/components/prism-python';
import 'prismjs/themes/prism.css';

export default {
  name: 'PythonCodeEditor',
  props: {
    modelValue: {
      type: String,
      default: '',
    },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const editorRef = ref(null);
    let jar = null;

    // Функция для подсветки синтаксиса
    const highlightSyntax = (editor) => {
      const code = editor.textContent;
      editor.innerHTML = highlight(code, languages.python, 'python');
    };

    onMounted(() => {
      if (editorRef.value) {
        jar = CodeJar(editorRef.value, highlightSyntax, {
          tab: '    ', // Четыре пробела вместо табуляции
        });

        jar.updateCode(props.modelValue);

        jar.onUpdate((code) => {
          emit('update:modelValue', code);
        });
      }
    });

    onBeforeUnmount(() => {
      if (jar) {
        jar.destroy();
      }
    });

    watch(
        () => props.modelValue,
        (newVal) => {
          if (jar && newVal !== jar.toString()) {
            jar.updateCode(newVal);
          }
        }
    );

    return {
      editor: editorRef,
    };
  },
};
</script>

<style scoped>
.code-editor {
  border: 1px solid #ccc;
  border-radius: 4px;
  overflow: hidden;
  width: 400px;
}

.editor {
  min-height: 300px;
  font-family: 'Fira Code', monospace;
  font-size: 14px;
  padding: 10px;
  outline: none;
  white-space: pre;
  overflow: auto;
}
</style>
