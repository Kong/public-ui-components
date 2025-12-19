<template>
  <div ref="editorRoot" />
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import * as monaco from 'monaco-editor'

const props = defineProps({
  modelValue: {
    type: String,
    required: true,
  },
  theme: {
    type: String,
    default: 'vs',
  },
  language: {
    type: String,
    default: 'html',
  },
  options: {
    type: Object,
    default: () => ({}),
  },
})

const emits = defineEmits<{
  (e: 'update:modelValue', value: string, event: monaco.editor.IModelContentChangedEvent): void
}>()

const editorRoot = ref<HTMLElement | null>(null)
let editor: monaco.editor.IStandaloneCodeEditor

watch(() => props.options, (newOptions) => {
  if (editor) {
    editor.updateOptions(newOptions)
  }
}, { deep: true })

watch(() => props.modelValue, (newValue) => {
  if (editor && newValue !== editor.getValue()) {
    editor.setValue(newValue)
  }
})

watch(() => props.language, (newVal) => {
  if (editor) {
    monaco.editor.setModelLanguage(editor.getModel()!, newVal)
  }
})

watch(() => props.theme, (newVal) => {
  if (editor) {
    monaco.editor.setTheme(newVal)
  }
})

onMounted(() => {
  const options = Object.assign(
    {
      value: props.modelValue,
      theme: props.theme,
      language: props.language,
    },
    props.options,
  )

  editor = monaco.editor.create(editorRoot.value as HTMLElement, options)

  editor.onDidChangeModelContent((event) => {
    const value = editor!.getValue()
    if (props.modelValue !== value) {
      emits('update:modelValue', value, event)
    }
  })
})

onBeforeUnmount(() => {
  editor?.dispose()
})

</script>
