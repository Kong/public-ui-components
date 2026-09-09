<template>
  <div
    class="monaco-diff-editor-container"
    :class="[
      appearance,
      editorTheme,
      { 'loading': isLoadingVisible },
    ]"
    data-testid="monaco-diff-editor-container"
  >
    <div
      ref="editorRef"
      class="monaco-diff-editor-target"
      data-testid="monaco-diff-editor-target"
    />
    <slot
      v-if="showLoadingState"
      :is-loading="isLoadingVisible"
      name="state-loading"
    >
      <Transition name="fade">
        <MonacoEditorStatusOverlay
          v-if="isLoadingVisible"
          data-testid="monaco-diff-editor-status-overlay-loading"
          :icon="ProgressIcon"
          :message="i18n.t('editor.messages.loading_message', { type: language })"
          :title="i18n.t('editor.messages.loading_title', { type: language })"
        />
      </Transition>
    </slot>
  </div>
</template>

<script setup lang="ts">
import { watch, computed, useTemplateRef } from 'vue'
import { KUI_SPACE_40 } from '@kong/design-tokens'
import { ProgressIcon } from '@kong/icons'
import { useMonacoDiffEditor } from '../composables/useMonacoDiffEditor'
import useI18n from '../composables/useI18n'
import MonacoEditorStatusOverlay from './MonacoEditorStatusOverlay.vue'
import { DEFAULT_MONACO_OPTIONS } from '../constants'
import type { editor } from 'monaco-editor'
import type { EditorThemes } from '../types'

const PADDING_Y = parseInt(KUI_SPACE_40, 10)

const {
  original,
  modified,
  appearance = 'embedded',
  theme = 'light',
  language = 'markdown',
  options = undefined,
  loading = false,
  showLoadingState = true,
} = defineProps<{
  /**
   * The original content.
   */
  original: string
  /**
   * The modified content.
   */
  modified: string
  /**
   * The appearance style of the Monaco Diff Editor.
   * @default 'embedded'
   */
  appearance?: 'embedded' | 'standalone'
  /**
   * The theme of the Monaco Diff Editor instance.
   * @default 'light'
   */
  theme?: EditorThemes
  /**
   * The programming language for syntax highlighting.
   * @default 'markdown'
   */
  language?: string
  /**
   * Additional Monaco Diff Editor options to customize the editor further.
   * @default undefined
   */
  options?: Partial<editor.IStandaloneDiffEditorConstructionOptions> | undefined
  /**
   * Whether the diff editor is in a loading state.
   * @default false
   */
  loading?: boolean
  /**
   * Whether to show the loading state overlay.
   * @default true
   */
  showLoadingState?: boolean
}>()

const emit = defineEmits<{
  /**
   * Emitted when the Monaco diff editor instance is ready.
   * @param diffEditor The Monaco diff editor instance
   */
  (e: 'ready', diffEditor: editor.IStandaloneDiffEditor): void
}>()

defineSlots<{
  /**
   * Slot for custom content to display when the diff editor is in a loading state.
   * The slot props include `isLoading` which indicates if the loading overlay is visible.
   */
  'state-loading'?: (props: { isLoading: boolean }) => any
}>()

const { i18n } = useI18n()

const editorRef = useTemplateRef('editorRef')

const editorTheme = computed<EditorThemes>(() => theme === 'dark' ? 'dark' : 'light')

const realMonacoOptions = computed(() => {
  if (appearance === 'standalone') {
    // A diff sizes its line-number column for whichever side has more lines.
    const originalLines = original.split('\n').length
    const modifiedLines = modified.split('\n').length
    const lineCountDigits = String(Math.max(originalLines, modifiedLines)).length

    return {
      ...options,
      // Standalone uses fixed layout values so user overrides are intentionally ignored.
      // Monaco editor only supports vertical paddings.
      padding: { top: PADDING_Y, bottom: PADDING_Y },
      // Horizontal padding is not supported, so we increase the minimum chars for line numbers
      // to create some space on the left when standalone.
      lineNumbersMinChars: Math.max(DEFAULT_MONACO_OPTIONS.lineNumbersMinChars, lineCountDigits) + 2,
    }
  }

  return {
    // Ensure standalone padding is cleared when switching back to embedded.
    padding: { ...DEFAULT_MONACO_OPTIONS.padding },
    lineNumbersMinChars: DEFAULT_MONACO_OPTIONS.lineNumbersMinChars,
    // Embedded allows user overrides.
    ...options,
  }
})

const monacoDiffEditor = useMonacoDiffEditor(editorRef, {
  language,
  original: () => original,
  modified: () => modified,
  theme: editorTheme.value,
  monacoOptions: realMonacoOptions.value,
  onReady: (diffEditor) => {
    emit('ready', diffEditor)
  },
})

/**
 * Computed property to determine if the loading overlay should be visible.
 * @returns {boolean}
 */
const isLoadingVisible = computed<boolean>(() => loading || monacoDiffEditor.editorStates.editorStatus === 'loading')

defineExpose({
  monacoDiffEditor,
})

// update the diff editor language when the prop changes so the highlighting updates
watch(() => language, (newLang, oldLang) => {
  if (newLang === oldLang) return
  monacoDiffEditor.setLanguage(newLang)
})

// update the diff editor options when the prop changes
watch([monacoDiffEditor.diffEditor, realMonacoOptions], ([diffEditor, options]) => {
  if (diffEditor && options) {
    diffEditor.updateOptions(options)
  }
}, {
  deep: true,
})
</script>

<style lang="scss" scoped>
.monaco-diff-editor-container {
  background: var(--kui-color-background, $kui-color-background);
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  position: relative;
  width: 100%;

  &.loading {
    pointer-events: none;
    user-select: none;

    .monaco-diff-editor-target {
      opacity: 0;
      pointer-events: none;
      user-select: none;
    }

  }

  &.standalone {
    border: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);
    border-radius: var(--kui-border-radius-30, $kui-border-radius-30);
    transition: border-color var(--kui-animation-duration-20, .2s) ease-in-out, box-shadow var(--kui-animation-duration-20, .2s) ease-in-out;

    &:hover {
      border-color: var(--kui-color-border-primary-weak, $kui-color-border-primary-weak);
    }

    &:focus-within {
      border-color: var(--kui-color-border-primary, $kui-color-border-primary);
      box-shadow: var(--kui-shadow-focus, $kui-shadow-focus);
    }
  }
}

.monaco-diff-editor-target {
  height: 100%;
  overflow: hidden;
  position: relative;
  transition: all var(--kui-animation-duration-20, $kui-animation-duration-20) ease-in-out;
  width: 100%;

  // The diff widget's inner original/modified panes are `.monaco-editor` instances,
  // and the widget root itself is `.monaco-diff-editor` - Monaco's theme service
  // declares every `--vscode-*` variable on both selectors directly (not just the
  // root), so a variable declared only on one is shadowed by that global declaration
  // on the other. Declare shared vars on both.
  :deep(.monaco-editor),
  :deep(.monaco-diff-editor) {
    position: absolute;

    // Customize monaco editor colours via `--vscode-` variables
    /* stylelint-disable */
    // Base editor colours, matching MonacoEditor's overrides
    --vscode-editor-background: var(--kui-color-background, #{$kui-color-background});
    --vscode-editorGutter-background: var(--kui-color-background, #{$kui-color-background});
    --vscode-editorLineNumber-activeForeground: var(--kui-color-text-primary, #{$kui-color-text-primary});

    // Diff colours - inserted (green). Backgrounds must stay translucent so they
    // don't hide the syntax tokens underneath (Monaco's own colours are ~20% alpha).
    --vscode-diffEditor-insertedLineBackground: var(--kui-color-background-success-weakest, #{$kui-color-background-success-weakest});
    --vscode-diffEditor-insertedTextBackground: var(--kui-color-background-success-weaker, #{$kui-color-background-success-weaker});
    --vscode-diffEditor-insertedTextBorder: transparent;
    --vscode-diffEditorGutter-insertedLineBackground: var(--kui-color-background-success-weakest, #{$kui-color-background-success-weakest});

    // Diff colours - removed (red)
    --vscode-diffEditor-removedLineBackground: var(--kui-color-background-danger-weakest, #{$kui-color-background-danger-weakest});
    --vscode-diffEditor-removedTextBackground: var(--kui-color-background-danger-weaker, #{$kui-color-background-danger-weaker});
    --vscode-diffEditor-removedTextBorder: transparent;
    --vscode-diffEditorGutter-removedLineBackground: var(--kui-color-background-danger-weakest, #{$kui-color-background-danger-weakest});
    /* stylelint-enable */
  }
}

// Transitions
.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--kui-animation-duration-20, $kui-animation-duration-20) ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-to,
.fade-leave-from {
  opacity: 1;
}
</style>
