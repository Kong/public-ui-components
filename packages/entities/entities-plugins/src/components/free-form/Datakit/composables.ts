import { toValue } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import {
  createGlobalState,
  useEventListener,
  useLocalStorage,
} from '@vueuse/core'
import { createI18n } from '@kong-ui-public/i18n'
import english from '../../../locales/en.json'
export { provideEditorStore, useEditorStore } from './flow-editor/store/store'

import type { MaybeRefOrGetter } from 'vue'
import type { EditorMode } from './types'

const { t } = createI18n<typeof english>('en-us', english)

export const usePreferences = createGlobalState(() => {
  const editorMode = useLocalStorage<EditorMode>('datakit-editor-mode', 'flow')
  const sidePanelExpanded = useLocalStorage<boolean>(
    'datakit-editor-sidebar-expanded',
    true,
  )
  const responsePanelCollapsed = useLocalStorage<boolean>(
    'datakit-editor-response-panel-collapsed',
    false,
  )
  return { editorMode, sidePanelExpanded, responsePanelCollapsed }
})

interface LeaveConfirmationOptions {
  enabled: MaybeRefOrGetter<boolean> // whether the confirmation step is enabled
  confirm?: () => boolean | Promise<boolean> // custom confirm function
}

export function useLeaveConfirmation({
  enabled,
  confirm,
}: LeaveConfirmationOptions) {
  // Soft navigation guard
  onBeforeRouteLeave(() => {
    if (!toValue(enabled)) return true

    return confirm
      ? confirm()
      : window.confirm(t('plugins.free-form.datakit.flow_editor.leave_confirm'))
  })

  // Hard navigation guard
  const onBeforeUnload = (e: BeforeUnloadEvent) => {
    if (!toValue(enabled)) return
    e.preventDefault()
  }

  useEventListener('beforeunload', onBeforeUnload)
}
