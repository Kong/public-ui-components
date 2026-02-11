import { SearchIcon } from '@kong/icons'
import type { MonacoEditorActionConfig } from '../types'

/**
 * Navigation-related toolbar actions
 */
export const navigationActions: Record<string, MonacoEditorActionConfig> = {
  search: {
    id: 'editor.action.find',
    icon: SearchIcon,
    label: 'editor.labels.action_search',
    action: (monaco) => monaco.toggleSearchWidget(),
    keybindings: ['Command', 'F'],
    placement: 'right',
    order: 10,
    group: 2,
    showInContextMenu: true,
    contextMenuGroupId: 'navigation',
    contextMenuOrder: 1,
  },
}
