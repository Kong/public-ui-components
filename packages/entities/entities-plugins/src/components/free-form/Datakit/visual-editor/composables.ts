import { useLocalStorage } from '@vueuse/core'
import type { EditorMode } from './types'

const editorMode = useLocalStorage<EditorMode>('datakit-editor-mode', 'code', {
  listenToStorageChanges: false,
})

const sidebarExpanded = useLocalStorage<boolean>('datakit-visual-editor-sidebar-expanded', true, {
  listenToStorageChanges: false,
})

export function usePreferences() {
  return {
    editorMode,
    sidebarExpanded,
  }
}
