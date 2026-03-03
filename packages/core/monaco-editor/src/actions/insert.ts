import { CodeIcon, LinkIcon, ImageIcon } from '@kong/icons'
import { createWrapAction, createInsertAction } from './helpers'
import type { MonacoEditorActionConfig } from '../types'

/**
 * Insert-related toolbar actions (code, links, images)
 * 3d group in the toolbar, after formatting
 */
export const insertActions: Record<string, MonacoEditorActionConfig> = {
  inlineCode: {
    id: 'editor.action.inlineCode',
    icon: CodeIcon,
    label: 'editor.labels.action_inline_code',
    action: createWrapAction('`', 'inlineCode'),
    keybindings: ['Command', 'E'],
    placement: 'left',
    group: 3,
    order: 1,
    showInContextMenu: true,
    contextMenuGroupId: 'insert',
    contextMenuOrder: 1,
    languages: ['markdown', 'mdc'],
  },
  link: {
    id: 'editor.action.link',
    icon: LinkIcon,
    label: 'editor.labels.action_link',
    action: createInsertAction('[', '](url)', 'link', 'url'),
    keybindings: ['Command', 'K'],
    placement: 'left',
    group: 3,
    order: 2,
    showInContextMenu: true,
    contextMenuGroupId: 'insert',
    contextMenuOrder: 2,
    languages: ['markdown', 'mdc'],
  },
  image: {
    id: 'editor.action.image',
    icon: ImageIcon,
    label: 'editor.labels.action_image',
    action: createInsertAction('![', '](url)', 'image', 'url'),
    keybindings: ['Command', 'Shift', 'I'],
    placement: 'left',
    group: 3,
    order: 3,
    showInContextMenu: true,
    contextMenuGroupId: 'insert',
    contextMenuOrder: 3,
    languages: ['markdown', 'mdc'],
  },
}
