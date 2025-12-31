import { onActivated, onBeforeUnmount, onMounted, reactive, toValue, watch, ref } from 'vue'
import { DEFAULT_MONACO_OPTIONS } from '../constants'
import { unrefElement, useDebounceFn } from '@vueuse/core'

import * as monaco from 'monaco-editor'
import { shikiToMonaco } from '@shikijs/monaco'
import { getSingletonHighlighter, bundledLanguages, bundledThemes } from 'shiki'

import type { MaybeComputedElementRef, MaybeElement } from '@vueuse/core'
import type { MonacoEditorStates, UseMonacoEditorOptions } from '../types'

// Flag if monaco loaded
const isMonacoLoaded = ref(false)
let initPromise: Promise<void> | null = null

async function loadMonaco() {
  if (initPromise) {
    return initPromise
  }

  initPromise = (async () => {
    try {
      // @ts-ignore jsonDefaults location varies across Monaco Editor versions
      // v0.55.0 introduced breaking changes and issues; Konnect still uses v0.52.x.
      const jsonDefaults = monaco.json?.jsonDefaults || monaco.languages.json?.jsonDefaults
      // Disable JSON token provider to prevent conflicts with @shikijs/monaco
      // https://github.com/shikijs/shiki/issues/865#issuecomment-3689158990
      jsonDefaults?.setModeConfiguration({ tokens: false })

      const highlighter = await getSingletonHighlighter(
        {
          themes: Object.values(bundledThemes),
          langs: Object.values(bundledLanguages),
        },
      )
      highlighter.getLoadedLanguages().forEach(lang => {
        monaco.languages.register({ id: lang })
      })
      shikiToMonaco(highlighter, monaco)
      isMonacoLoaded.value = true
    } catch (error) {
      initPromise = null
      throw error
    }
  })()

  return initPromise
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
  let editor: monaco.editor.IStandaloneCodeEditor | undefined

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
  const remeasureFonts = useDebounceFn(() => monaco.editor.remeasureFonts(), 200)


  const init = (): void => {
    loadMonaco()

    let model: monaco.editor.ITextModel | undefined

    // `toValue()` safely unwraps refs, getters, or plain elements
    watch([isMonacoLoaded, () => toValue(target)], ([_isLoaded, _target]) => {

      // This ensures we skip setup if it's null, undefined, or an SVG element (as unrefElement can return SVGElement)
      const el = unrefElement(_target)
      if (!(el instanceof HTMLElement) || !_isLoaded) {
        _isSetup = false
        return
      }

      // prevent multiple setups
      if (_isSetup) return

      if (!model) {
        // we want to create our model before creating the editor so we don't end up with multiple models for the same editor (v-if toggles, etc.)
        const uri = monaco.Uri.parse(`inmemory://model/${options.language}-${crypto.randomUUID()}`)
        model = monaco.editor.createModel(options.code, options.language, uri)
      }

      editor = monaco.editor.create(el, {
        ...DEFAULT_MONACO_OPTIONS,
        readOnly: options.readOnly || false,
        language: options.language,
        theme: editorStates.theme === 'light' ? 'catppuccin-latte' : 'catppuccin-mocha',
        model,
        editContext: false,
        ...options.monacoOptions,
      })

      _isSetup = true
      editorStates.editorStatus = 'ready'
      editorStates.hasContent = !!options.code

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
