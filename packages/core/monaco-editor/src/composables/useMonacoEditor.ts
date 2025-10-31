import { onActivated, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { DEFAULT_MONACO_OPTIONS } from '../constants'
import { useDebounceFn } from '@vueuse/core'

import type { Ref } from 'vue'
import type * as monacoType from 'monaco-editor'
import type { MonacoEditorStates, UseMonacoEditorOptions } from '../types'

// singletons
/** The Monaco instance once loaded */
let monacoInstance: typeof monacoType | undefined
/** Promise that resolves when Monaco is initialized */
let monacoInitPromise: Promise<typeof monacoType> | null = null

// cache
const modelCache = new Map<string, monacoType.editor.ITextModel>()

/**
 * Lazily load Monaco and configure workers only once.
 */
async function loadMonaco(language?: string): Promise<typeof monacoType> {
  if (monacoInstance) return monacoInstance
  if (monacoInitPromise) return monacoInitPromise

  // If Monaco isn't initialized yet, create a new Promise that loads and configures it
  monacoInitPromise = (async () => {
    // Dynamically import the Monaco Editor core API
    const monaco = await import('monaco-editor/esm/vs/editor/editor.api')

    // Configure Monaco Workers
    // TODO: maybe only import workers as needed based on languages used
    const [
      EditorWorker,
      JsonWorker,
      CssWorker,
      HtmlWorker,
      TsWorker,
    ] = await Promise.all([
      import('monaco-editor/esm/vs/editor/editor.worker?worker'),
      import('monaco-editor/esm/vs/language/json/json.worker?worker'),
      import('monaco-editor/esm/vs/language/css/css.worker?worker'),
      import('monaco-editor/esm/vs/language/html/html.worker?worker'),
      import('monaco-editor/esm/vs/language/typescript/ts.worker?worker'),
    ]).then(mods => mods.map(m => m.default))

    // Define a global Monaco environment to tell Monaco which worker to use for each language
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

    // Optionally register a custom language if it's not already known to Monaco
    if (language && !monaco.languages.getLanguages().some(lang => lang.id === language)) {
      monaco.languages.register({ id: language })
    }

    monacoInstance = monaco

    // TODO: register more languages as needed

    return monaco
  })()

  return monacoInitPromise
}

/**
 * Retrieve a cached Monaco model or create one if needed.
 */
function getOrCreateModel(monaco: typeof monacoType, code: string, language: string): monacoType.editor.ITextModel {
  const uri = monaco.Uri.parse(`inmemory://model/${language}`)

  if (modelCache.has(language)) {
    return modelCache.get(language)!
  }

  const model = monaco.editor.createModel(code, language, uri)
  modelCache.set(language, model)
  return model
}

/**
 * Composable for integrating the Monaco Editor into Vue components.
 * @param {Ref} target - The target DOM element or Vue component ref where the editor will be mounted.
 * @param {UseMonacoEditorOptions} options - Configuration options for the Monaco editor.
 * @returns {object} An object containing the editor instance and utility methods.
*/
export function useMonacoEditor(target: Ref, options: UseMonacoEditorOptions) {
  /**
   * The Monaco editor instance.
   * @type {monaco.editor.IStandaloneCodeEditor | undefined}
   * @default undefined
  */
  let editor: monacoType.editor.IStandaloneCodeEditor | undefined

  /** Reactive state for the Monaco editor instance. */
  const editorStates = reactive<MonacoEditorStates>({
    editorStatus: 'loading',
    searchBoxIsRevealed: false,
    hasContent: false,
    theme: options.theme || 'light',
  })

  // Internal flag to prevent multiple setups
  const _isSetup = ref(false)

  /** Replace the editor content. */
  const setContent = (content: string): void => {
    if (!_isSetup.value || !editor) return
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

  const remeasureFonts = useDebounceFn(() => monacoInstance?.editor.remeasureFonts(), 200)


  const init = async (): Promise<void> => {
    const monaco = await loadMonaco(options.language)

    watch(target, async (_target) => {
      // prevent multiple setups
      if (_isSetup.value) return

      const el = _target.$el || _target
      if (!el) return

      const model = getOrCreateModel(monaco, options.code.value, options.language)

      editor = monaco.editor.create(el, {
        ...DEFAULT_MONACO_OPTIONS,
        readOnly: options.readOnly || false,
        language: options.language,
        theme: editorStates.theme,
        model,
        ...options.monacoOptions,
      })

      _isSetup.value = true
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

  // Lifecycle hooks
  onMounted(() => {
    init().catch(error => console.error('useMonacoEditor: Failed to init:', error))
    remeasureFonts()
  })
  onActivated(remeasureFonts)
  onBeforeUnmount(() => {
    if (!editor) return

    const model = editor.getModel()
    editor.dispose()

    if (model && !modelCache.has(model.uri.toString())) {
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
