// TODO: make this configurable by user | this is just for demo


import { KeyMod, KeyCode } from 'monaco-editor'
import type { editor } from 'monaco-editor'
import type { BuiltInActionIds } from 'src/types'

interface ActionGroup {
  contextMenuGroupId: string
  actionList: editor.IActionDescriptor[]
  supportedLanguages: string[]
}

export const MonacoEditorDefaultActions = [
  {
    contextMenuGroupId: 'actions-group:basic',
    actionList: [
      {
        id: 'actions:format-document',
        label: 'Format Document',
        keybindings: [KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.KeyF],
        contextMenuOrder: 1,
        run: (editor) => {
          editor.getAction?.('editor.action.formatDocument')?.run()
        },
      },
      {
        id: 'actions:full-screen',
        label: 'Full Screen',
        keybindings: [],
        contextMenuOrder: 1,
        run: (editor) => {
          editor.getContainerDomNode().requestFullscreen()
        },
      },
    ],
    supportedLanguages: ['javascript', 'typescript', 'json', 'html', 'css', 'markdown', 'mdc', 'yaml'],
  },
  {
    contextMenuGroupId: 'actions-group:markdown',
    actionList: [
      {
        id: 'actions:markdown:bold',
        label: 'Bold',
        keybindings: [KeyMod.CtrlCmd | KeyCode.KeyB],
        contextMenuOrder: 1,
        run: (editor) => {},
      },
    ],
    supportedLanguages: ['javascript', 'typescript', 'json', 'html', 'css', 'markdown', 'mdc', 'yaml'],
  },
] as const satisfies ActionGroup[]

/**
 * This allows for a union type of all possible `id` values present in the `markdownActionList` array
 */
export type MarkdownActionIds = BuiltInActionIds
  | typeof MonacoEditorDefaultActions[number]['actionList'][number]['id']
