import { createGlobalState, useLocalStorage } from '@vueuse/core'
import type { EditorMode } from './types'
export { provideEditorStore, useEditorStoreOrThrow } from './flow-editor/store/store'

export const usePreferences = createGlobalState(() => {
  const editorMode = useLocalStorage<EditorMode>('datakit-editor-mode', 'flow')
  const sidePanelExpanded = useLocalStorage<boolean>(
    'datakit-editor-sidebar-expanded',
    true,
  )
  return { editorMode, sidePanelExpanded }
})
