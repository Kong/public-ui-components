import { onActivated, onBeforeUnmount, onMounted, onWatcherCleanup, reactive, shallowRef, toValue, watch } from 'vue'
import { DEFAULT_MONACO_DIFF_OPTIONS } from '../constants'
import { useDebounceFn } from '@vueuse/core'
import { isMonacoLoaded, loadMonaco } from '../singletons/monaco-loader'
import { trackDisposableForModel } from '../singletons/lifecycle'

import * as monaco from 'monaco-editor'

import type { MaybeRefOrGetter } from 'vue'
import type { editor as Editor } from 'monaco-editor'
import type { MonacoEditorStates, UseMonacoDiffEditorOptions } from '../types'

/**
 * Composable for integrating a read-only, inline monaco diff editor into Vue components.
 * @param {MaybeRefOrGetter<HTMLElement | null>} target - The target DOM element/ref/getter where the diff editor will be mounted.
 * @param {UseMonacoDiffEditorOptions} options - Configuration options for the Monaco diff editor.
 * @returns {object} An object containing the diff editor instance and utility methods.
*/
export function useMonacoDiffEditor<T extends HTMLElement>(
  target: MaybeRefOrGetter<T | null>,
  options: UseMonacoDiffEditorOptions,
) {
  /**
   * The Monaco diff editor instance.
   * @default undefined
   */
  const diffEditor = shallowRef<Editor.IStandaloneDiffEditor>()

  /** The Monaco text model for the original content. */
  let originalModel: monaco.editor.ITextModel | undefined

  /** The Monaco text model for the modified content. */
  let modifiedModel: monaco.editor.ITextModel | undefined

  // Internal flag to prevent multiple setups
  let _isSetup = false

  /** Reactive state for the Monaco diff editor instance. */
  const editorStates = reactive<MonacoEditorStates>({
    editorStatus: 'loading',
    searchBoxIsRevealed: false,
    hasContent: false,
    theme: options.theme || 'light',
    currentLanguage: options.language || '',
  })

  /** Update the language of both the original and modified models. */
  const setLanguage = (language: string): void => {
    for (const model of [originalModel, modifiedModel]) {
      if (model) {
        monaco.editor.setModelLanguage(model, language)
      }
    }
  }

  /** Remeasure fonts in the diff editor with debouncing to optimize performance */
  const remeasureFonts = useDebounceFn(() => monaco.editor.remeasureFonts(), 200)

  const init = (): void => {
    loadMonaco()

    // `toValue()` safely unwraps refs, getters, or plain elements
    watch([isMonacoLoaded, () => toValue(target)], ([_isLoaded, _target], [, previousTarget]) => {

      // Ensure the target is specifically a non-null HTMLElement and that Monaco is loaded before setting up
      const el = toValue(_target)
      const previousEl = toValue(previousTarget)
      if (!(el instanceof HTMLElement) || !_isLoaded) {
        _isSetup = false
        return
      }

      // Only set up when not already set up or target element changed
      if (_isSetup && previousEl === el) return

      // We want to create our models before creating the diff editor so we don't end
      // up with multiple models for the same editor (v-if toggles, etc.)
      if (!originalModel) {
        const uri = monaco.Uri.parse(`inmemory://model/diff-original/${options.language}-${crypto.randomUUID()}`)
        originalModel = monaco.editor.createModel(toValue(options.original), options.language, uri)
      } else {
        originalModel.setValue(toValue(options.original))
      }

      if (!modifiedModel) {
        const uri = monaco.Uri.parse(`inmemory://model/diff-modified/${options.language}-${crypto.randomUUID()}`)
        modifiedModel = monaco.editor.createModel(toValue(options.modified), options.language, uri)
      } else {
        modifiedModel.setValue(toValue(options.modified))
      }

      const themeName = editorStates.theme === 'light' ? 'catppuccin-latte' : 'material-theme-darker'

      // @shikijs/monaco patches `monaco.editor.create` to resync Shiki's tokenizer
      // when `theme` is passed in the construction options, but it does NOT patch
      // `createDiffEditor` - and `StandaloneDiffEditor2`'s constructor sets the theme
      // directly via the theme service, bypassing that patch. Without this explicit
      // call, tokenization resolves against whatever theme was last set.
      monaco.editor.setTheme(themeName)

      diffEditor.value = monaco.editor.createDiffEditor(el, {
        ...DEFAULT_MONACO_DIFF_OPTIONS,
        theme: themeName,
        editContext: false,
        ...options.monacoOptions,
      })

      diffEditor.value.setModel({ original: originalModel, modified: modifiedModel })

      _isSetup = true
      editorStates.editorStatus = 'ready'
      editorStates.hasContent = !!toValue(options.modified)
      editorStates.currentLanguage = modifiedModel.getLanguageId()

      // Track language changes on the modified model
      trackDisposableForModel(modifiedModel, modifiedModel.onDidChangeLanguage((e) => {
        editorStates.currentLanguage = e.newLanguage
      }))

      options.onReady?.(diffEditor.value)

      // we need to remeasure fonts after the editor is created to ensure proper layout and rendering
      remeasureFonts()

      // Release the models from the diff editor before disposing it. Disposing a
      // model while it is still attached to a live diff editor triggers Monaco's own
      // `BugIndicatingError('TextModel got disposed before DiffEditorWidget model got reset')`.
      // Models are intentionally kept (not disposed) here so they can be reused if
      // this watcher re-runs (e.g. a `v-if` toggle) - only `onBeforeUnmount` disposes them.
      onWatcherCleanup(() => {
        diffEditor.value?.setModel(null)
        diffEditor.value?.dispose()
      })
    }, {
      immediate: true,
      flush: 'post',
    })
  }

  // Start the initialization process
  init()

  // Watch for external `original` changes and apply them to the original model.
  watch(() => toValue(options.original), (newValue) => {
    if (!originalModel || !_isSetup) return
    if (newValue === originalModel.getValue()) return
    originalModel.setValue(newValue)
  })

  // Watch for external `modified` changes and apply them to the modified model.
  watch(() => toValue(options.modified), (newValue) => {
    if (!modifiedModel || !_isSetup) return
    if (newValue === modifiedModel.getValue()) return
    modifiedModel.setValue(newValue)
    editorStates.hasContent = !!newValue.length
  })

  // Lifecycle hooks
  onMounted(remeasureFonts)

  onActivated(remeasureFonts)

  onBeforeUnmount(() => {
    diffEditor.value?.setModel(null)
    diffEditor.value?.dispose()
    originalModel?.dispose()
    modifiedModel?.dispose()
    originalModel = undefined
    modifiedModel = undefined
  })

  return {
    diffEditor,
    editorStates,
    setLanguage,
    remeasureFonts,
  }
}
