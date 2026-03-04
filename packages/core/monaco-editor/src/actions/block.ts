import { CodeblockIcon, BlockquoteIcon, TableIcon } from '@kong/icons'
import { createCodeblockAction, createLinePrefixAction, createTableAction } from './helpers'
import type { MonacoEditorActionConfig } from '../types'


/**
 * Block-level toolbar actions (code block, blockquote, table)
 * 5th group in the toolbar, after lists
 */
export const blockActions: Record<string, MonacoEditorActionConfig> = {
  codeblock: {
    id: 'editor.action.codeblock',
    icon: CodeblockIcon,
    label: 'editor.labels.action_codeblock',
    action: createCodeblockAction('codeblock'),
    keybindings: [],
    placement: 'left',
    group: 5,
    order: 1,
    showInContextMenu: true,
    contextMenuGroupId: 'block',
    contextMenuOrder: 1,
    languages: ['markdown', 'mdc'],
  },
  blockquote: {
    id: 'editor.action.blockquote',
    icon: BlockquoteIcon,
    label: 'editor.labels.action_blockquote',
    action: createLinePrefixAction('> ', 'blockquote'),
    keybindings: [],
    placement: 'left',
    group: 5,
    order: 2,
    showInContextMenu: true,
    contextMenuGroupId: 'block',
    contextMenuOrder: 2,
    languages: ['markdown', 'mdc'],
  },
  table: {
    id: 'editor.action.table',
    icon: TableIcon,
    label: 'editor.labels.action_table',
    action: createTableAction('table'),
    keybindings: [],
    placement: 'left',
    group: 5,
    order: 3,
    showInContextMenu: true,
    contextMenuGroupId: 'block',
    contextMenuOrder: 3,
    languages: ['markdown', 'mdc'],
  },
}
