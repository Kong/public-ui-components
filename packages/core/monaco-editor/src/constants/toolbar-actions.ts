import { SearchIcon, ExpandIcon, CleaningIcon } from '@kong/icons'
import type { MonacoEditorActionConfig } from '../types'

/**
 * Built-in toolbar action configurations.
 * These commands are available by default and can be customized or disabled via toolbar options.
 */
export const BUILT_IN_TOOLBAR_ACTIONS: Record<string, Omit<MonacoEditorActionConfig, 'label'> & { labelKey: string }> = {
  format: {
    id: 'editor.action.format',
    icon: CleaningIcon,
    labelKey: 'editor.labels.action_format',
    action: 'editor.action.formatDocument',
    keybindings: ['Shift', 'Alt', 'F'],
    placement: 'right',
    order: 10,
    group: 1,
    showInContextMenu: true,
    contextMenuGroupId: 'formatting',
    contextMenuOrder: 1,
  },
  fullScreen: {
    id: 'editor.action.fullScreen',
    icon: ExpandIcon,
    labelKey: 'editor.labels.action_fullscreen',
    action: (monaco) => monaco.editor.value?.getContainerDomNode().requestFullscreen(),
    keybindings: ['Ctrl', 'F11'],
    placement: 'right',
    order: 20,
    group: 2,
    showInContextMenu: true,
    contextMenuGroupId: 'view',
    contextMenuOrder: 1,
  },
  search: {
    id: 'editor.action.find',
    icon: SearchIcon,
    labelKey: 'editor.labels.action_search',
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
