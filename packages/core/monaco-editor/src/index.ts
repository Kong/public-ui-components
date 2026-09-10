import MonacoEditor from './components/MonacoEditor.vue'
import MonacoEditorStatusOverlay from './components/MonacoEditorStatusOverlay.vue'

export {
  MonacoEditor,
  MonacoEditorStatusOverlay,
}

// TODO: Add barrel exports if we have more features in the future
export * from './features/code-lenses'
export * from './features/validation'
export * from './features/zod-validation'

export * from './singletons/model-contexts'
export * from './types'

export { useMonacoEditor } from './composables/useMonacoEditor'

// Export action helpers for creating custom toolbar actions
export { createWrapAction } from './actions'
