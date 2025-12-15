import { onActivated, onBeforeUnmount, onMounted, reactive, toValue, watch } from 'vue'
import { unrefElement, useDebounceFn } from '@vueuse/core'
import { shikiToMonaco } from '@shikijs/monaco'
import { createHighlighter } from 'shiki'

import { DEFAULT_MONACO_OPTIONS, DEFAULT_SHIKI_LANGS, SHIKI_THEMES } from '../constants'

// TODO: this will be replaced in the future so we only import the needed modules and features
import * as monaco from 'monaco-editor'

// Monaco Editor Workers
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import CssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import HtmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import TsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'

import type * as monacoType from 'monaco-editor'
import type { MaybeComputedElementRef, MaybeElement } from '@vueuse/core'
import type { HighlighterGeneric, BundledLanguage, BundledTheme } from 'shiki'
import type { MonacoEditorStates, UseMonacoEditorOptions } from '../types'

// singletons
/** The Monaco instance once loaded */
let monacoInstance: typeof monacoType | undefined = undefined
/** The Shiki highlighter instance */
let shikiHighlighter: HighlighterGeneric<BundledLanguage, BundledTheme> | undefined = undefined

// cache
const langCache = new Map<string, boolean>()

/**
 * Lazily load Monaco and configure workers only once.
 */
function loadMonaco(language?: string): typeof monacoType {
  if (!monacoInstance) {
    monacoInstance = monaco

    // Set workers once
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
  }

  // TODO: register more languages as needed

  // register language once
  if (language && !langCache.get(language)) {
    langCache.set(language, true)

    if (!monaco.languages.getLanguages().some(lang => lang.id === language)) {
      monaco.languages.register({ id: language })
    }
  }

  return monacoInstance
}

async function loadShiki() {
  if (shikiHighlighter) return shikiHighlighter

  shikiHighlighter = await createHighlighter({
    themes: Object.values(SHIKI_THEMES),
    langs: DEFAULT_SHIKI_LANGS,
  })

  if (monacoInstance) {
    // TODO: figure out why it doesn't work without a timeout
    setTimeout(() => {
      shikiToMonaco(shikiHighlighter!, monacoInstance)
    }, 250)
  }

  return shikiHighlighter
}

/**
 * Composable for integrating the Monaco Editor into Vue components.
 * @param {MaybeComputedElementRef} target - The target DOM element or Vue component ref where the editor will be mounted.
 * @param {UseMonacoEditorOptions} options - Configuration options for the Monaco editor.
 * @returns {object} An object containing the editor instance and utility methods.
*/
export function useMonacoEditor<T extends MaybeElement>(
  target: MaybeComputedElementRef<T>,
  options: UseMonacoEditorOptions,
) {
  /**
   * The Monaco editor instance.
   * @type {monaco.editor.IStandaloneCodeEditor | undefined}
   * @default undefined
  */
  let editor: monacoType.editor.IStandaloneCodeEditor | undefined

  // Internal flag to prevent multiple setups
  let _isSetup = false

  /** Reactive state for the Monaco editor instance. */
  const editorStates = reactive<MonacoEditorStates>({
    editorStatus: 'loading',
    searchBoxIsRevealed: false,
    hasContent: false,
    theme: options.theme || 'light',
  })

  /** Replace the editor content. */
  const setContent = (content: string): void => {
    if (!_isSetup || !editor) return
    // TODO: update this so we can preserve undo/redo stack
    editor.setValue(content)
  }

  /** Toggle read-only mode. */
  const setReadOnly = (readOnly: boolean): void => editor?.updateOptions({ readOnly })

  /** Focus the editor programmatically. */
  const focus = (): void => editor?.focus()

  /**
   * Triggers a keyboard command in the Monaco editor.
   *
   * @param {string} id - The unique identifier of the editor command to trigger.
   */
  const triggerKeyboardCommand = (id: string): void => {
    try {
      if (!editor || !id) return
      editor.focus()
      editor.trigger('keyboard', id, null)
    } catch (error) {
      console.error(`useMonacoEditor: Failed to trigger command: ${id}`, error)
    }
  }

  /** Toggle the status of findController widget */
  const toggleSearchWidget = (): void => {
    try {
      if (!editor) return

      // close the widget
      if (editorStates.searchBoxIsRevealed) {
        // @ts-ignore - property exists
        return editor!.getContribution('editor.contrib.findController')?.closeFindWidget()
      }

      triggerKeyboardCommand('actions.find')
    } catch (error) {
      console.error('useMonacoEditor: Failed to close findController.', error)
    }
  }

  /** Remeasure fonts in the editor with debouncing to optimize performance */
  const remeasureFonts = useDebounceFn(() => monacoInstance?.editor.remeasureFonts(), 200)


  const init = (): void => {
    const monaco = loadMonaco(options.language)

    loadShiki()

    // we want to create our model before creating the editor so we don't end up with multiple models for the same editor (v-if toggles, etc.)
    const uri = monaco.Uri.parse(`inmemory://model/${options.language}-${crypto.randomUUID()}`)
    const model = monaco.editor.createModel(options.code.value, options.language, uri)

    // `toValue()` safely unwraps refs, getters, or plain elements
    watch(() => toValue(target), (_target) => {

      // This ensures we skip setup if it's null, undefined, or an SVG element (as unrefElement can return SVGElement)
      const el = unrefElement(_target)
      if (!(el instanceof HTMLElement)) {
        _isSetup = false
        return
      }

      // prevent multiple setups
      if (_isSetup) return

      editor = monaco.editor.create(el, {
        ...DEFAULT_MONACO_OPTIONS,
        readOnly: options.readOnly || false,
        language: options.language,
        theme: editorStates.theme,
        model,
        ...options.monacoOptions,
      })

      _isSetup = true
      editorStates.editorStatus = 'ready'
      editorStates.hasContent = !!options.code.value

      // Watch content changes and trigger callbacks efficiently
      editor.onDidChangeModelContent(() => {
        const content = editor!.getValue()
        editorStates.hasContent = !!content.length
        options.onChanged?.(content)
      })

      // TODO: register editor actions

      options.onCreated?.()

      // we need to remeasure fonts after the editor is created to ensure proper layout and rendering
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
            editorStates.searchBoxIsRevealed = findState.isRevealed
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

  // Start the initialization process
  init()

  // Lifecycle hooks
  onMounted(remeasureFonts)

  onActivated(remeasureFonts)

  onBeforeUnmount(() => {
    if (!editor) return

    const model = editor.getModel()
    editor.dispose()
    if (model) {
      model.dispose()
    }
  })

  return {
    editor,
    editorStates,
    setContent,
    setReadOnly,
    focus,
    remeasureFonts,
    toggleSearchWidget,
    triggerKeyboardCommand,
  }
}
