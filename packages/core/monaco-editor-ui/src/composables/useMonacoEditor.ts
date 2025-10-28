import { computed, nextTick, onActivated, onBeforeMount, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { shikiToMonaco } from '@shikijs/monaco'
import { createHighlighter } from 'shiki'
import { DEFAULT_MONACO_OPTIONS } from '../constants'

import { type Ref } from 'vue'
import type * as monacoType from 'monaco-editor'
import type { EditorThemes, UseMonacoEditorOptions } from '../types'
import type { HighlighterGeneric, BundledLanguage, BundledTheme } from 'shiki'
import { MonacoEditorDefaultActions, type MarkdownActionIds } from '../utils/actions'

import prettier from 'prettier/standalone'
import parserMarkdown from 'prettier/plugins/markdown'
import parserPostCSS from 'prettier/plugins/postcss.js'

// ─────────────────────────────────────────────
// SINGLETONS
// ─────────────────────────────────────────────
let monacoInstance: typeof monacoType | undefined
let shikiHighlighter: HighlighterGeneric<BundledLanguage, BundledTheme>
let monacoInitPromise: Promise<typeof monacoType> | null = null


const DEFAULT_SHIKI_LANGS = ['javascript', 'typescript', 'json', 'css', 'html', 'yaml', 'markdown']
const SHIKI_THEMES: Record<EditorThemes, BundledTheme> = {
  light: 'catppuccin-latte',
  dark: 'catppuccin-mocha',
}

// ─────────────────────────────────────────────
// MONACO LOADER (single shared load)
// ─────────────────────────────────────────────
async function loadMonaco(language?: string): Promise<typeof monacoType> {
  if (monacoInstance) return monacoInstance
  if (monacoInitPromise) return monacoInitPromise

  monacoInitPromise = (async () => {
    const monaco = await import('monaco-editor')

    // Configure Monaco Workers
    const EditorWorker = (await import('monaco-editor/esm/vs/editor/editor.worker?worker')).default
    const JsonWorker = (await import('monaco-editor/esm/vs/language/json/json.worker?worker')).default
    const CssWorker = (await import('monaco-editor/esm/vs/language/css/css.worker?worker')).default
    const HtmlWorker = (await import('monaco-editor/esm/vs/language/html/html.worker?worker')).default
    const TsWorker = (await import('monaco-editor/esm/vs/language/typescript/ts.worker?worker')).default

    // Only set environment once
    if (!window.MonacoEnvironment) {
      window.MonacoEnvironment = {
        getWorker(_: unknown, label: string) {
          switch (label) {
            case 'json': return new JsonWorker()
            case 'css':
            case 'scss':
            case 'less': return new CssWorker()
            case 'html':
            case 'handlebars':
            case 'razor': return new HtmlWorker()
            case 'typescript':
            case 'javascript': return new TsWorker()
            default: return new EditorWorker()
          }
        },
      }
    }

    if (language) {
      monaco.languages.register({ id: language })
    }

    // Initialize Shiki highlighter once
    if (!shikiHighlighter) {
      shikiHighlighter = await createHighlighter({
        themes: Object.values(SHIKI_THEMES),
        langs: DEFAULT_SHIKI_LANGS,
      })
      // TODO: figure out why the timeout is needed here to avoid issues with Monaco initialization
      setTimeout(() => {
        shikiToMonaco(shikiHighlighter, monaco)
      }, 150)
    }


    monacoInstance = monaco

    // markdown
    monaco.languages.registerDocumentFormattingEditProvider('markdown', {
      async provideDocumentFormattingEdits(model) {
        const text = model.getValue()

        const formatted = await prettier.format(text, {
          parser: 'markdown',
          plugins: [parserMarkdown],
          proseWrap: 'always',
        })

        return [
          {
            range: model.getFullModelRange(),
            text: formatted,
          },
        ]
      },
    })

    // css
    monaco.languages.registerDocumentFormattingEditProvider('css', {
      async provideDocumentFormattingEdits(model) {
        const text = model.getValue()

        const formatted = await prettier.format(text, {
          parser: 'css',
          plugins: [parserPostCSS],
        })

        return [
          {
            range: model.getFullModelRange(),
            text: formatted,
          },
        ]
      },
    })



    return monaco
  })()

  return monacoInitPromise
}



// ─────────────────────────────────────────────
// COMPOSABLE
// ─────────────────────────────────────────────
export default function useMonacoEditor(target: Ref, options: UseMonacoEditorOptions) {
  let editor: monacoType.editor.IStandaloneCodeEditor | undefined

  const isSetup = ref(false)

  const _theme = ref<EditorThemes>(options.theme || 'light')
  const cursorPosition = reactive({ lineNumber: 1, column: 1 })

  const editorTheme = computed(() => _theme.value)

  /** The current states of editor widgets */
  const editorStates = reactive({
    searchBoxIsRevealed: false,
    editorStatus: 'loading' as 'loading' | 'ready',
    hasContent: false,
  })

  const setContent = (content: string) => {
    if (!isSetup.value || !editor) return
    editor.setValue(content)
  }

  const setReadOnly = (readOnly: boolean) => editor?.updateOptions({ readOnly })

  const formatDocument = async () => {
    try {
      if (!isSetup.value || !editor) {
        return
      }

      await editor.getAction('editor.action.formatDocument')?.run()
      console.log('useMonacoEditor: Document formatted successfully.')
    } catch (error: any) {
      console.error('useMonacoEditor: Failed to format monaco-editor content.', error)
    }
  }

  const focus = () => editor?.focus()

  /**
   * Triggers a keyboard command in the Monaco editor.
   *
   * @param {string} id - The unique identifier of the editor command to trigger.
   */
  const triggerKeyboardCommand = (id: MarkdownActionIds) => {
    try {
      if (!editor || !id) return
      editor.focus()
      editor.trigger('keyboard', id, null)
    } catch (error) {
      console.error(`useMonacoEditor: Failed to trigger command: ${id}`, error)
    }
  }

  /** Toggle the status of findController widget */
  const toggleSearchWidget = () => {
    try {
      if (!editor) return

      // close the widget
      if (editorStates.searchBoxIsRevealed) {
        // @ts-ignore - property exists
        return editor!.getContribution('editor.contrib.findController')?.closeFindWidget()
      }

      triggerKeyboardCommand('actions.find')
    } catch (error: any) {
      console.error('useMonacoEditor: Failed to close findController.', error)
    }
  }

  const remeasureFonts = () => monacoInstance?.editor.remeasureFonts()

  /**
  * Initialize the editor actions after checking if the action supports the current editor language.
  *
  * We iterate over the list of editor action groups and add the group's commands to the editor
  * if the language is supported for that group.
  * @param {string} lang language currently set on the editor, used to determine which commands to add
  */
  const applyEditorActions = (lang: string): void => {
    if (!isSetup.value || !editor) {
      return
    }

    for (const editorActionGroup of MonacoEditorDefaultActions) {
      // TODO: fix type
      if (editorActionGroup.supportedLanguages.includes(lang as any)) {
        for (const action of editorActionGroup.actionList) {
          editor.addAction({
            id: action.id,
            // the label that'll shown up in the context menu
            label: action.label,
            // the keybindings for the action
            keybindings: action.keybindings,
            // the position of the action in the context menu
            contextMenuOrder: action.contextMenuOrder,
            // the id of the context menu group under which the action will show up
            contextMenuGroupId: editorActionGroup.contextMenuGroupId,
            // the function that'll be executed when the action is triggered
            run: () => editor && action.run(editor),
          })
        }
      }
    }
  }

  const init = async () => {
    // we measure load time for debugging/shiki loading issues
    const startTime = performance.now()
    const monaco = await loadMonaco(options.language)

    watch(target, async (_target) => {
      const el = (_target as any)?.$el || _target
      if (!el) return

      const model = monaco.editor.createModel(
        options.code.value,
        options.language,
        monaco.Uri.parse(`inmemory://model/${crypto.randomUUID()}.${options.language}`),
      )

      editor = monaco.editor.create(el, {
        ...DEFAULT_MONACO_OPTIONS,
        readOnly: options.readOnly || false,
        language: options.language,
        theme: _theme.value,
        model,
        ...options.monacoOptions,
      })

      // we ensure at least 400ms loading time to avoid UI flickering for shiki
      const elapsed = performance.now() - startTime
      const remaining = Math.max(0, 400 - elapsed)
      // Wait only if Monaco loaded too fast
      await new Promise((resolve) => setTimeout(resolve, remaining))

      isSetup.value = true
      editorStates.editorStatus = 'ready'
      editorStates.hasContent = !!options.code.value

      editor.onDidChangeModelContent(() => {
        const content = editor!.getValue()
        editorStates.hasContent = !!content.length
        if (typeof options.onChanged === 'function') {
          options.onChanged?.(content)
        }
      })

      editor.onDidBlurEditorText(() => {
        const position = editor?.getPosition()
        if (position) {
          cursorPosition.lineNumber = position.lineNumber
          cursorPosition.column = position.column
        }
      })

      applyEditorActions(options.language)


      options.onCreated?.()
      await nextTick()
      remeasureFonts()


      try {
        // Access the internal "FindController" contribution
        const findController = editor.getContribution('editor.contrib.findController')

        if (findController) {
          // Get the state object from the FindController
          // @ts-ignore - getState exists
          const findState = findController.getState()

          // Listen for changes to the state of the "find" panel
          findState.onFindReplaceStateChange(() => {
            if (findState.isRevealed) {
              editorStates.searchBoxIsRevealed = true
            } else {
              editorStates.searchBoxIsRevealed = false
            }
          })
        }
      } catch (error) {
        console.error('useMonacoEditor: Failed to get the state of findController', error)
      }

    }, {
      immediate: true,
      flush: 'post',
    })
  }

  // ─────────────────────────────────────────────
  // LIFECYCLE HOOKS
  // ─────────────────────────────────────────────
  onBeforeMount(init)
  onMounted(remeasureFonts)
  onActivated(remeasureFonts)
  onBeforeUnmount(() => {
    if (!editor) return
    const model = editor.getModel()
    editor.dispose()
    model?.dispose()
  })

  return {
    editor,
    editorTheme,
    editorStates,
    setContent,
    setReadOnly,
    focus,
    formatDocument,
    remeasureFonts,
    toggleSearchWidget,
    triggerKeyboardCommand,

  }
}


/**
 * Helper to register custom languages
 */
export async function registerLanguage(id: string, tokensProvider: any) {
  const monaco = await loadMonaco()
  monaco.languages.register({ id })
  monaco.languages.setMonarchTokensProvider(id, tokensProvider)
}
