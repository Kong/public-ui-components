import { ListUnorderedIcon, ListOrderedIcon, TasklistIcon } from '@kong/icons'
import { createLinePrefixAction } from './helpers'
import type { MonacoEditorActionConfig } from '../types'

/**
 * List-related toolbar actions (unordered, ordered, task list)
 * 4th group in the toolbar, after insert
 */
export const listActions: Record<string, MonacoEditorActionConfig> = {
  unorderedList: {
    id: 'editor.action.unorderedList',
    icon: ListUnorderedIcon,
    label: 'editor.labels.action_unordered_list',
    action: createLinePrefixAction('- ', 'unorderedList'),
    keybindings: [],
    placement: 'left',
    group: 4,
    order: 1,
    showInContextMenu: true,
    contextMenuGroupId: 'list',
    contextMenuOrder: 1,
    languages: ['markdown', 'mdc'],
  },
  orderedList: {
    id: 'editor.action.orderedList',
    icon: ListOrderedIcon,
    label: 'editor.labels.action_ordered_list',
    action: createLinePrefixAction(
      (i) => `${i}. `,
      'orderedList',
      /^\d+\.\s/,
    ),
    keybindings: [],
    placement: 'left',
    group: 4,
    order: 2,
    showInContextMenu: true,
    contextMenuGroupId: 'list',
    contextMenuOrder: 2,
    languages: ['markdown', 'mdc'],
  },
  taskList: {
    id: 'editor.action.taskList',
    icon: TasklistIcon,
    label: 'editor.labels.action_task_list',
    action: createLinePrefixAction('- [ ] ', 'taskList'),
    keybindings: [],
    placement: 'left',
    group: 4,
    order: 3,
    showInContextMenu: true,
    contextMenuGroupId: 'list',
    contextMenuOrder: 3,
    languages: ['markdown', 'mdc'],
  },
}
