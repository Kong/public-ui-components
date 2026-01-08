<template>
  <div
    class="monaco-editor-container"
    :class="[
      editorTheme,
      { 'loading': isLoading },
    ]"
    data-testid="monaco-editor-container"
  >
    <div
      ref="editorRef"
      class="monaco-editor-target"
      data-testid="monaco-editor-target"
    />
    <slot
      :is-loading="isLoading"
      name="state-loading"
    >
      <Transition name="fade">
        <!-- TODO: use https://github.com/antfu/v-lazy-show -->
        <MonacoEditorStatusOverlay
          v-if="isLoading"
          data-testid="monaco-editor-status-overlay-loading"
          :icon="ProgressIcon"
          :message="i18n.t('editor.messages.loading_message', { type: language })"
          :title="i18n.t('editor.messages.loading_title', { type: language })"
        />
      </Transition>
    </slot>
    <slot
      :is-empty="isEditorEmpty"
      name="state-empty"
    >
      <Transition name="fade">
        <MonacoEditorStatusOverlay
          v-if="isEditorEmpty && !isLoading"
          data-testid="monaco-editor-status-overlay-empty"
          :icon="CodeblockIcon"
          :message="i18n.t('editor.messages.empty_message')"
          :title="i18n.t('editor.messages.empty_title')"
        />
      </Transition>
    </slot>
  </div>
</template>

<script setup lang="ts">
import { watch, computed, useTemplateRef } from 'vue'
import { CodeblockIcon, ProgressIcon } from '@kong/icons'
import { useMonacoEditor } from '../composables/useMonacoEditor'
import useI18n from '../composables/useI18n'
import MonacoEditorStatusOverlay from './MonacoEditorStatusOverlay.vue'
import type { editor } from 'monaco-editor'
import type { EditorThemes } from '../types'

const {
  theme = 'light',
  language = 'markdown',
  options = undefined,
  loading = false,
} = defineProps<{
  /**
   * The theme of the Monaco Editor instance.
   * @default 'light'
   */
  theme?: EditorThemes
  /**
   * The programming language for syntax highlighting.
   * @default 'markdown'
   */
  language?: string
  /**
   * Whether the editor is in a loading state.
   * @default false
   */
  loading?: boolean
  /**
   * Additional Monaco Editor options to customize the editor further.
   * @default undefined
  */
  options?: Partial<editor.IStandaloneEditorConstructionOptions> | undefined
}>()

/**
 * The model content for the Monaco Editor.
 */
const model = defineModel({
  type: String,
  required: true,
})

const { i18n } = useI18n()

const editorRef = useTemplateRef('editorRef')

const editorTheme = computed<EditorThemes>(() => theme === 'dark' ? 'dark' : 'light')

const isLoading = computed<boolean>(() => monacoEditor.editorStates.editorStatus === 'loading' || loading)

/**
 * Computed property to determine if the editor is empty.
 * @returns {boolean}
 */
const isEditorEmpty = computed<boolean>(() => monacoEditor.editorStates.editorStatus === 'ready' && !monacoEditor.editorStates.hasContent)

const monacoEditor = useMonacoEditor(editorRef, {
  language,
  code: model,
  theme: editorTheme.value,
  monacoOptions: options,
})

// update the editor language when the prop changes so the highlighting updates
watch(() => language, (newLang) => {
  monacoEditor.setLanguage(newLang)
})
</script>

<style lang="scss" scoped>
.monaco-editor-container {
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

    .monaco-editor-target {
      filter: blur(2px);
      opacity: 0;
      pointer-events: none;
      user-select: none;
    }

  }

}

.monaco-editor-target {
  height: 100%;
  overflow: hidden;
  position: relative;
  transition: all var(--kui-animation-duration-20, $kui-animation-duration-20) ease-in-out;
  width: 100%;

  // Customize the editor's light theme
  :deep(.monaco-editor) {
    position: absolute;

    // Customize monaco editor colours via `--vscode-` variables
    /* stylelint-disable */
    // Editor
    --vscode-editor-background: var(--kui-color-background, #{$kui-color-background});
    --vscode-editorGutter-background: var(--kui-color-background, #{$kui-color-background});
    --vscode-editorLineNumber-activeForeground: var(--kui-color-text-primary, #{$kui-color-text-primary});
    // Suggestions
    --vscode-editorSuggestWidget-background: var(--kui-color-background, #{$kui-color-background});
    --vscode-editorSuggestWidget-border: var(--kui-color-border, #{$kui-color-border});
    --vscode-editorSuggestWidget-highlightForeground: var(--kui-color-text-decorative-purple, #{$kui-color-text-decorative-purple});
    --vscode-editorSuggestWidget-focusHighlightForeground: var(--kui-color-text-decorative-purple, #{$kui-color-text-decorative-purple});
    // Context menu
    --vscode-menu-background: var(--kui-color-background, #{$kui-color-background});
    --vscode-menu-border: var(--kui-color-border, #{$kui-color-border});
    --vscode-menu-separatorBackground: var(--kui-color-border, #{$kui-color-border});
    // Other
    --vscode-focusBorder: var(--kui-color-text-neutral, #{$kui-color-text-neutral});
    --vscode-input-background: var(--kui-color-background, #{$kui-color-background});
    --vscode-sash-hoverBorder: var(--kui-color-border-primary, #{$kui-color-border-primary});
    /* stylelint-enable */

    .sticky-widget {
      z-index: 2;
    }

    // Editor's suggestion overlay styles
    .suggest-details-container {
      border-radius: var(--kui-border-radius-50, $kui-border-radius-50) !important;

      .suggest-details {
        border-radius: var(--kui-border-radius-50, $kui-border-radius-50) !important;
        overflow-x: hidden;
        overflow-y: auto;

        .type {
          overflow-wrap: break-word !important;
        }
      }
    }

    // Editor's suggestion widget
    .suggest-widget {
      border-radius: var(--kui-border-radius-50, $kui-border-radius-50) !important;
      min-height: 30px !important;

      &.shows-details {
        border-radius: var(--kui-border-radius-50, $kui-border-radius-50) !important;
        min-height: 30px !important;
        overflow-x: hidden;
        overflow-y: auto;
        scrollbar-width: thin;
      }

      .tree,
      .monaco-scrollable-element,
      .monaco-list,
      .monaco-list-rows {
        border-radius: var(--kui-border-radius-40, $kui-border-radius-40) !important;
      }

      .monaco-list-rows {
        overflow-x: hidden;
        overflow-y: auto;
      }

      .monaco-list-row {
        padding: var(--kui-space-0, $kui-space-0) var(--kui-space-30, $kui-space-30);

        &.focused {
          background: var(--kui-color-background-neutral-weaker, $kui-color-background-neutral-weaker);

          .monaco-icon-label,
          .suggest-icon {
            color: var(--kui-color-text-neutral-strongest, $kui-color-text-neutral-strongest) !important;
          }

          // The label showing additional details about the suggestion
          .details-label {
            color: var(--kui-color-text-neutral-strongest, $kui-color-text-neutral-strongest);
          }
        }

        // The matching part of the suggestion
        .highlight {
          font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
        }

        &:first-child {
          &.focused {
            border-top-left-radius: var(--kui-border-radius-30, $kui-border-radius-30);
          }
        }

        // The colour of the icons in the suggestion list
        .suggest-icon {
          &:not(.codicon-symbol-property) {
            color: var(--kui-color-text-primary, $kui-color-text-primary);
          }
        }

        .monaco-icon-label {
          color: var(--kui-color-text-neutral, $kui-color-text-neutral) !important;
        }
      }
    }

    .codicon-suggest-more-info {
      transform: translateY(2px) !important;
    }

    // Editor's search box styles
    .find-widget {
      background: var(--kui-color-background, $kui-color-background);
      border-bottom: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border-neutral-weaker, $kui-color-border-neutral-weaker);
      border-radius: var(--kui-border-radius-0, $kui-border-radius-0);
      right: 0px !important;

      // The pane to resize the search box
      .monaco-sash {
        background-color: var(--kui-color-background-neutral-weaker, $kui-color-background-neutral-weaker);
        width: 1px !important;
      }

      // Search input
      .monaco-inputbox {
        background-color: var(--kui-color-background, $kui-color-background) !important;
        border: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border-neutral-weaker, $kui-color-border-neutral-weaker) !important;
        border-radius: var(--kui-border-radius-30, $kui-border-radius-30);
        padding: var(--kui-space-0, $kui-space-0) var(--kui-space-10, $kui-space-10);
      }
    }
  }

  // TODO: add dark theme once the tokens are ready
  // Customize the editor in dark theme
  // &.dark {
  // }
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
