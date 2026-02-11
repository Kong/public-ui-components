import { ExpandIcon } from '@kong/icons'
import type { MonacoEditorActionConfig } from '../types'

/**
 * View-related toolbar actions
 */
export const viewActions: Record<string, MonacoEditorActionConfig> = {
  fullScreen: {
    id: 'editor.action.fullScreen',
    icon: ExpandIcon,
    label: 'editor.labels.action_fullscreen',
    action: (monaco) => monaco.editor.value?.getContainerDomNode().requestFullscreen(),
    keybindings: ['Ctrl', 'F11'],
    placement: 'right',
    order: 20,
    group: 2,
    showInContextMenu: true,
    contextMenuGroupId: 'view',
    contextMenuOrder: 1,
  },
}
