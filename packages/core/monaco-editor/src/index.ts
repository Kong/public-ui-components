import MonacoEditor from './components/MonacoEditor.vue'

export { MonacoEditor }

// TODO: Add barrel exports if we have more features in the future
export * from './features/code-lenses'

export * from './singletons/model-contexts'
export * from './types'

export { useMonacoEditor } from './composables/useMonacoEditor'
