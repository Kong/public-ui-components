<template>
  <div
    class="monaco-editor-container"
    :class="[
      editorTheme,
      { 'loading': monacoEditor.editorStates.editorStatus === 'loading' },
    ]"
    data-testid="monaco-editor-container"
  >
    <div
      ref="editorRef"
      class="monaco-editor-target"
      :class="editorTheme"
      data-testid="monaco-editor-target"
    />
    <slot
      :is-loading="monacoEditor.editorStates.editorStatus === 'loading'"
      name="state-loading"
    >
      <Transition name="fade">
        <!-- TODO: use https://github.com/antfu/v-lazy-show -->
        <MonacoEditorStatusOverlay
          v-if="monacoEditor.editorStates.editorStatus === 'loading'"
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
          v-if="isEditorEmpty"
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
import { computed, useTemplateRef } from 'vue'
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
  onChanged: (content: string): void => {
    model.value = content
  },
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
  transition: all $kui-animation-duration-20 ease-in-out;
  width: 100%;

  // Customize the editor's light theme
  &.light {
    :deep(.monaco-editor) {
      // Customize monaco editor styles via `--vscode-` variables
      /* stylelint-disable */
      // Editor
      --vscode-editor-background: var(--kui-color-background, #{$kui-color-background});
      --vscode-editorGutter-background: var(--kui-color-background, #{$kui-color-background});
      --vscode-editorLineNumber-activeForeground: var(--kui-color-text-primary, #{$kui-color-text-primary});
      // Suggestions
      --vscode-editorSuggestWidget-background: var(--kui-color-background, #{$kui-color-background});
      --vscode-editorSuggestWidget-border: var(--kui-color-border, #{$kui-color-border});
      // Context menu
      --vscode-menu-background: #{var(--kui-color-background, $kui-color-background)};
      --vscode-menu-border: #{var(--kui-color-border, $kui-color-border)};
      --vscode-menu-separatorBackground: #{var(--kui-color-border, $kui-color-border)};
      // Other
      --vscode-focusBorder: #{var(--kui-color-text-neutral, $kui-color-text-neutral)};
      --vscode-input-background: #{var(--kui-color-background, $kui-color-background)};
      --vscode-sash-hoverBorder: #{var(--kui-color-border-primary, $kui-color-border-primary)};
      /* stylelint-enable */

      // Editor's search box styles
      .find-widget {
        background: var(--kui-color-background, #{$kui-color-background});
        border-bottom: $kui-border-width-10 solid var(--kui-color-border-neutral-weaker, #{$kui-color-border-neutral-weaker});

        // The pane to resize the search box
        .monaco-sash {
          background-color: var(--kui-color-background-neutral-weaker, #{$kui-color-background-neutral-weaker});
        }

        // Search input
        .monaco-inputbox {
          background-color: var(--kui-color-background, #{$kui-color-background}) !important;
          border: $kui-border-width-10 solid var(--kui-color-border-neutral-weaker, #{$kui-color-border-neutral-weaker}) !important;
        }
      }
    }
  }

  // TODO: add dark theme once the tokens are ready
  // Customize the editor's dark theme
  // &.dark {
  // }

  /** !Important: Try to only put non-color related overrides in this block and use CSS variables for colors */
  :deep(.monaco-editor) {
    position: absolute;

    .sticky-widget {
      z-index: 2;
    }

    // Editor's suggestion overlay styles
    .suggest-details-container {
      border-radius: $kui-border-radius-50 !important;

      .suggest-details {
        border-radius: $kui-border-radius-50 !important;
        overflow-x: hidden;
        overflow-y: auto;

        .type {
          word-break: break-word !important;
        }
      }
    }

    // Editor's suggestion widget
    .suggest-widget {
      border-radius: $kui-border-radius-50 !important;
      min-height: 30px !important;

      &.shows-details {
        border-radius: $kui-border-radius-50 !important;
        min-height: 30px !important;
        overflow-x: hidden;
        overflow-y: auto;
        scrollbar-width: thin;
      }

      .tree,
      .monaco-scrollable-element,
      .monaco-list,
      .monaco-list-rows {
        border-radius: $kui-border-radius-40 !important;
      }

      .monaco-list-rows {
        overflow-x: hidden;
        overflow-y: auto;
      }

      .monaco-list-row {
        padding: $kui-space-0 $kui-space-30;

        &.focused {
          background: var(--kui-color-background-neutral-weaker, #{$kui-color-background-neutral-weaker});

          .monaco-icon-label,
          .suggest-icon {
            color: var(--kui-color-text-neutral-strongest, #{$kui-color-text-neutral-strongest}) !important;
          }
        }

        &:first-child {
          &.focused {
            border-top-left-radius: $kui-border-radius-30;
          }
        }

        // The colour of the icons in the suggestion list
        .suggest-icon {
          &:not(.codicon-symbol-property) {
            color: var(--kui-color-text-primary, #{$kui-color-text-primary});
          }
        }

        .monaco-icon-label {
          color: var(--kui-color-text-neutral, #{$kui-color-text-neutral}) !important;
        }
      }
    }


    .codicon-suggest-more-info {
      transform: translateY(2px) !important;
    }

    // Editor's search box styles
    .find-widget {
      border-radius: $kui-border-radius-0;
      right: 0px !important;

      // The pane to resize the search box
      .monaco-sash {
        width: 1px !important;
      }

      // Search input
      .monaco-inputbox {
        border-radius: $kui-border-radius-30;
        padding: $kui-space-0 $kui-space-10;
      }
    }
  }
}

// Transitions
.fade-enter-active,
.fade-leave-active {
  transition: opacity $kui-animation-duration-20 ease;
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
