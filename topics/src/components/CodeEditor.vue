<template>
  <div class="code-editor">
    <div ref="editor" class="editor"></div>
  </div>
</template>

<script>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { CodeJar } from 'codejar';
import { highlight, languages } from 'prismjs/components/prism-core';
import 'prismjs/themes/prism.css';

// Импорт всех необходимых языков через динамическую загрузку
const loadLanguage = async (lang) => {
  try {
    console.log(`Loading language: ${lang}`);
    await import(`prismjs/components/prism-${lang}`);
    console.log(`Language ${lang} loaded successfully`);
  } catch (e) {
    console.warn(`Failed to load Prism language: ${lang}`);
  }
};

export default {
  name: 'CodeEditor',
  props: {
    modelValue: {
      type: String,
      default: '',
    },
    language: {
      type: String,
    },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const editorRef = ref(null);
    let jar = null;

    const highlightSyntax = (editor) => {
      const code = editor.textContent;
      const lang = languages[props.language] || languages['javascript'];
      editor.innerHTML = highlight(code, lang, props.language);
    };

    onMounted(async () => {
      await loadLanguage(props.language);

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

    watch(
        () => props.language,
        async (newLang) => {
          await loadLanguage(newLang);
          if (editorRef.value) {
            highlightSyntax(editorRef.value);
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
  background-color: #f5f5f5;
}
</style>
