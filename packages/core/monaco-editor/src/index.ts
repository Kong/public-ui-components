import MonacoEditor from './components/MonacoEditor.vue'
import MonacoEditorStatusOverlay from './components/MonacoEditorStatusOverlay.vue'

export {
  MonacoEditor,
  MonacoEditorStatusOverlay,
}

// TODO: Add barrel exports if we have more features in the future
export * from './features/code-lenses'

export * from './singletons/model-contexts'
export * from './types'

export { useMonacoEditor } from './composables/useMonacoEditor'
