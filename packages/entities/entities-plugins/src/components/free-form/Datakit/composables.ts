import { createGlobalState, useLocalStorage } from '@vueuse/core'
export { provideEditorStore, useEditorStore } from './flow-editor/store/store'

import type { EditorMode } from './types'

export const usePreferences = createGlobalState(() => {
  const editorMode = useLocalStorage<EditorMode>('datakit-editor-mode', 'flow')
  const sidePanelExpanded = useLocalStorage<boolean>(
    'datakit-editor-sidebar-expanded',
    true,
  )
  return { editorMode, sidePanelExpanded }
})
