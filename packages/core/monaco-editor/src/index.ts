import MonacoEditor from './components/MonacoEditor.vue'
import MonacoEditorStatusOverlay from './components/MonacoEditorStatusOverlay.vue'

export {
  MonacoEditor,
  MonacoEditorStatusOverlay,
}

export * from './types'

export { useMonacoEditor } from './composables/useMonacoEditor'

// Export action helpers for creating custom toolbar actions
export { createWrapAction } from './actions'
