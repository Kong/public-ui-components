import MonacoEditor from './components/MonacoEditor.vue'
import MonacoDiffEditor from './components/MonacoDiffEditor.vue'
import MonacoEditorStatusOverlay from './components/MonacoEditorStatusOverlay.vue'

export {
  MonacoEditor,
  MonacoDiffEditor,
  MonacoEditorStatusOverlay,
}

// TODO: Add barrel exports if we have more features in the future
export * from './features/code-lenses'

export * from './singletons/model-contexts'
export * from './types'

export { useMonacoEditor } from './composables/useMonacoEditor'
export { useMonacoDiffEditor } from './composables/useMonacoDiffEditor'

// Export action helpers for creating custom toolbar actions
export { createWrapAction } from './actions'
