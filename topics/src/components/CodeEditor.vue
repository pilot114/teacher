<template>
  <div ref="editor" class="editor"></div>
</template>

<script>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { CodeJar } from 'codejar';
import { createHighlighter } from 'shiki'

const highlighter = await createHighlighter({
  themes: [
    'one-dark-pro', 'light-plus', 'none',
  ],
  langs: ['javascript', 'python', 'php', 'go'],
})

// fix bg
let theme = highlighter.getTheme('light-plus');
theme.bg = '#f5f5f5'
highlighter.setTheme(theme)

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
    readonly: {
      type: Boolean,
    },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const editorRef = ref(null);
    let jar = null;

    const switchJar = function(isReadonly){
      jar = CodeJar(editorRef.value, highlightSyntax, {
        tab: '    ', // Четыре пробела вместо табуляции
      });

      jar.updateCode(props.modelValue);
      jar.onUpdate((code) => {
        emit('update:modelValue', code);
      });

      if (isReadonly) {
        if (jar) {
          jar.destroy();
        }
        editorRef.value.removeAttribute('contenteditable');
      }
    }

    const highlightSyntax = async (editor) => {
      editor.innerHTML = highlighter.codeToHtml(editor.textContent, {
        lang: props.language,
        theme: 'light-plus'
      })
    };

    onMounted(async () => {
      switchJar(props.readonly)
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
            jar.updateCode(newVal.trim());
          }
        }
    );

    watch(
        () => props.readonly,
        (newVal) => switchJar(newVal)
    );

    return {
      editor: editorRef,
    };
  },
};
</script>

<style scoped>
.editor {
  border: 1px solid #ccc;
  border-radius: 4px;
  width: 400px;
  min-height: 300px;
  padding: 10px;
  outline: none;
  white-space: pre;
  overflow: auto;
  background-color: #f5f5f5;
}

</style>
