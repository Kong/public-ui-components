import { onActivated, onBeforeUnmount, onMounted, onWatcherCleanup, reactive, ref, shallowRef, toValue, watch } from 'vue'
import { DEFAULT_MONACO_OPTIONS } from '../constants'
import { unrefElement, useDebounceFn } from '@vueuse/core'

import * as monaco from 'monaco-editor'
import { shikiToMonaco } from '@shikijs/monaco'
import { getSingletonHighlighter, bundledLanguages, bundledThemes } from 'shiki'
import * as lifecycle from '../singletons/lifecycle'

import type { MaybeComputedElementRef, MaybeElement } from '@vueuse/core'
import type { MonacoEditorStates, UseMonacoEditorOptions } from '../types'
import type { editor as Editor } from 'monaco-editor'

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
   * @default undefined
  */
  const editor = shallowRef<Editor.IStandaloneCodeEditor>()

  /** The Monaco text model associated with the editor. */
  let model: monaco.editor.ITextModel | undefined

  // Internal flag to prevent multiple setups
  let _isSetup = false

  // Flag to prevent feedback loops when updating editor from external Vue state
  // without triggering the editor → Vue onChanged callback
  let _isApplyingExternalUpdate = false

  /** Reactive state for the Monaco editor instance. */
  const editorStates = reactive<MonacoEditorStates>({
    editorStatus: 'loading',
    searchBoxIsRevealed: false,
    hasContent: false,
    theme: options.theme || 'light',
  })

  /** Replace the editor content. */
  const setContent = (content: string): void => {
    if (!_isSetup || !editor.value) return
    // TODO: update this so we can preserve undo/redo stack
    editor.value.setValue(content)
  }

  /** Toggle read-only mode. */
  const setReadOnly = (readOnly: boolean): void => editor.value?.updateOptions({ readOnly })

  /** Focus the editor programmatically. */
  const focus = (): void => editor.value?.focus()

  /**
   * Triggers a keyboard command in the Monaco editor.
   *
   * @param {string} id - The unique identifier of the editor command to trigger.
   */
  const triggerKeyboardCommand = (id: string): void => {
    try {
      if (!editor.value || !id) return
      editor.value.focus()
      editor.value.trigger('keyboard', id, null)
    } catch (error) {
      console.error(`useMonacoEditor: Failed to trigger command: ${id}`, error)
    }
  }

  /** Toggle the status of findController widget */
  const toggleSearchWidget = (): void => {
    try {
      if (!editor.value) return

      // close the widget
      if (editorStates.searchBoxIsRevealed) {
        // @ts-ignore - property exists
        return editor.value.getContribution('editor.contrib.findController')?.closeFindWidget()
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

    // `toValue()` safely unwraps refs, getters, or plain elements
    watch([isMonacoLoaded, () => toValue(target)], ([_isLoaded, _target], [, previousTarget]) => {

      // This ensures we skip setup if it's null, undefined, or an SVG element (as unrefElement can return SVGElement)
      const el = unrefElement(_target)
      const previousEl = unrefElement(previousTarget)
      if (!(el instanceof HTMLElement) || !_isLoaded) {
        _isSetup = false
        return
      }

      // Only set up when not already set up or target element changed
      if (_isSetup && previousEl === el) return

      if (!model) {
        // we want to create our model before creating the editor so we don't end up with multiple models for the same editor (v-if toggles, etc.)
        const uri = monaco.Uri.parse(`inmemory://model/${options.language}-${crypto.randomUUID()}`)
        model = monaco.editor.createModel(options.code.value, options.language, uri)
      }

      editor.value = monaco.editor.create(el, {
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
      editorStates.hasContent = !!options.code.value

      // Watch content changes and trigger callbacks efficiently
      lifecycle.trackForEditor(editor.value,
        editor.value.onDidChangeModelContent(() => {
          if (_isApplyingExternalUpdate) return
          const content = editor.value!.getValue()
          editorStates.hasContent = !!content.length
          options.code.value = content
        }),
      )

      // TODO: register editor actions

      options.onCreated?.()

      // we need to remeasure fonts after the editor is created to ensure proper layout and rendering
      remeasureFonts()


      try {
        // Access the internal "FindController" contribution
        const findController = editor.value.getContribution('editor.contrib.findController')

        // Get the state object from the FindController
        // @ts-ignore - getState exists
        const state = findController?.getState()

        // Listen for changes to the state of the "find" panel
        lifecycle.trackForEditor(editor.value,
          state?.onFindReplaceStateChange(() => {
            editorStates.searchBoxIsRevealed = state.isRevealed
          }), // This returns a disposable
        )
      } catch (error) {
        console.error('useMonacoEditor: Failed to get the state of findController', error)
      }

      // Dispose the editor if any
      onWatcherCleanup(() => {
        editor.value?.dispose()
      })
    }, {
      immediate: true,
      flush: 'post',
    })
  }

  // Start the initialization process
  init()

  // Watch for external code changes to update the editor content
  watch(() => options.code.value, (newValue) => {
    if (!editor.value || !model || !_isSetup) return

    const current = model.getValue()

    // skip if the value hasn't changed
    if (newValue === current) return

    // Temporarily prevent editor → Vue updates to avoid infinite loops
    _isApplyingExternalUpdate = true

    // Update the Monaco model with the new value from Vue
    // Using executeEdits preserves undo/redo stack better than setValue
    editor.value.executeEdits('external', [
      {
        range: model.getFullModelRange(),
        text: newValue,
      },
    ])

    editor.value.pushUndoStop()

    // Update internal state
    editorStates.hasContent = !!newValue.length

    // Re-enable editor → Vue updates
    _isApplyingExternalUpdate = false
  })

  // Lifecycle hooks
  onMounted(remeasureFonts)

  onActivated(remeasureFonts)

  onBeforeUnmount(() => {
    if (!editor.value) return

    const model = editor.value.getModel()
    editor.value.dispose()
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
