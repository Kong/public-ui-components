import { createGlobalState, createInjectionState, useLocalStorage } from '@vueuse/core'

import type { EditorMode } from './types'

export const usePreferences = createGlobalState(() => {
  const editorMode = useLocalStorage<EditorMode>(
    'datakit-editor-mode',
    'flow',
  )
  const sidePanelExpanded = useLocalStorage<boolean>(
    'datakit-editor-sidebar-expanded',
    true,
  )
  return { editorMode, sidePanelExpanded }
})

export const [provideEditorState, useEditorState] = createInjectionState(() => {
  // TODO: define editor store
  // const layoutData = reactive<any>(initialConfig)
  // const pluginConfig = reactive<any>(null)

  return {
    // layoutData,
    // pluginConfig,
  }
})
