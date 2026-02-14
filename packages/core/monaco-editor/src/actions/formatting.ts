import { CleaningIcon, BoldIcon, ItalicIcon, StrikethroughIcon } from '@kong/icons'
import { createWrapAction } from './helpers'
import type { MonacoEditorActionConfig } from '../types'

/**
 * Formatting-related toolbar actions
 */
export const formattingActions: Record<string, MonacoEditorActionConfig> = {
  format: {
    id: 'editor.action.format',
    icon: CleaningIcon,
    label: 'editor.labels.action_format',
    action: 'editor.action.formatDocument',
    keybindings: ['Shift', 'Alt', 'F'],
    placement: 'left',
    order: 1,
    group: 1,
    showInContextMenu: true,
    contextMenuGroupId: 'formatting',
    contextMenuOrder: 1,
  },
  bold: {
    id: 'editor.action.bold',
    icon: BoldIcon,
    label: 'editor.labels.action_bold',
    action: createWrapAction('**', 'bold'),
    keybindings: ['Command', 'B'],
    placement: 'left',
    group: 2,
    order: 1,
    showInContextMenu: true,
    contextMenuGroupId: 'formatting',
    contextMenuOrder: 2,
    languages: ['markdown', 'mdc'],
  },
  italic: {
    id: 'editor.action.italic',
    icon: ItalicIcon,
    label: 'editor.labels.action_italic',
    action: createWrapAction('_', 'italic'),
    keybindings: ['Command', 'I'],
    placement: 'left',
    group: 2,
    order: 2,
    showInContextMenu: true,
    contextMenuGroupId: 'formatting',
    contextMenuOrder: 3,
    languages: ['markdown', 'mdc'],
  },
  strikethrough: {
    id: 'editor.action.strikethrough',
    icon: StrikethroughIcon,
    label: 'editor.labels.action_strikethrough',
    action: createWrapAction('~~', 'strikethrough'),
    keybindings: ['Command', 'Shift', 'X'],
    placement: 'left',
    group: 2,
    order: 3,
    showInContextMenu: true,
    contextMenuGroupId: 'formatting',
    contextMenuOrder: 4,
    languages: ['markdown', 'mdc'],
  },
}
