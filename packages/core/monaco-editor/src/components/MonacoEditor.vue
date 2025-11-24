<template>
  <div
    class="monaco-editor-container"
    :class="[
      editorTheme,
      { 'loading': monacoEditor.editorStates.editorStatus === 'loading' },
    ]"
  >
    <div
      ref="editor"
      class="monaco-editor-target"
      :class="editorTheme"
    />
    <slot
      :is-loading="monacoEditor.editorStates.editorStatus === 'loading'"
      name="state-loading"
    >
      <Transition name="fade">
        <MonacoEditorEmptyState
          v-show="monacoEditor.editorStates.editorStatus === 'loading'"
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
        <MonacoEditorEmptyState
          v-if="isEditorEmpty"
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
import { useMonacoEditor } from '../index'
import useI18n from '../composables/useI18n'
import MonacoEditorEmptyState from './MonacoEditorEmptyState.vue'
import type { editor as monacoEditorType } from 'monaco-editor'
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
  options?: Partial<monacoEditorType.IStandaloneEditorConstructionOptions> | undefined
}>()

/**
 * The model content for the Monaco Editor.
 */
const model = defineModel({
  type: String,
  required: true,
})

const { i18n } = useI18n()

const editor = useTemplateRef('editor')

const editorTheme = computed<EditorThemes>(() => theme === 'dark' ? 'dark' : 'light')

/**
 * Computed property to determine if the editor is empty.
 * @returns {boolean}
 */
const isEditorEmpty = computed<boolean>(() => monacoEditor.editorStates.editorStatus === 'ready' && !monacoEditor.editorStates.hasContent)

const monacoEditor = useMonacoEditor(editor, {
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
  background: $kui-color-background;
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
  transition: all 0.3s ease-in-out;
  width: 100%;

  // Customize the editor's light theme
  &.light {
    :deep(.monaco-editor) {
      // Customize monaco editor styles via `--vscode-` variables
      /* stylelint-disable */
      // Editor
      --vscode-editor-background: #{$kui-color-background};
      --vscode-editorGutter-background: #{$kui-color-background};
      --vscode-editorLineNumber-activeForeground: #{$kui-color-text-primary};
      // Suggestions
      --vscode-editorSuggestWidget-background: #{$kui-color-background};
      --vscode-editorSuggestWidget-border: #{$kui-color-border};
      // Context menu
      --vscode-menu-background: #{$kui-color-background};
      --vscode-menu-border: #{$kui-color-border};
      --vscode-menu-separatorBackground: #{$kui-color-border};
      // Other
      --vscode-focusBorder: #{$kui-color-text-neutral};
      --vscode-input-background: #{$kui-color-background};
      --vscode-sash-hoverBorder: #{$kui-color-border-primary};
      /* stylelint-enable */

      // Modify the editor's search box styles
      .find-widget {
        background: $kui-color-background;
        border-bottom: $kui-border-width-10 solid $kui-color-border-neutral-weaker;

        // the pane to resize the search box
        .monaco-sash {
          background-color: $kui-color-background-neutral-weaker;
        }

        // Modify the search input
        .monaco-inputbox {
          background-color: $kui-color-background !important;
          border: $kui-border-width-10 solid $kui-color-border-neutral-weaker !important;
        }
      }
    }
  }

  // Customize the editor's dark theme
  &.dark {

    // TODO: for testing, gonna remove it
    :deep(.monaco-editor) {
      // Customize monaco editor styles via `--vscode-` variables
      /* stylelint-disable */
      // Editor
      --vscode-editor-background: #{$kui-color-background-inverse};
      --vscode-editorGutter-background: #{$kui-color-background-inverse};
      --vscode-editorLineNumber-activeForeground: #{$kui-color-text-primary};
      // Suggestions
      --vscode-editorSuggestWidget-background: #{$kui-color-background-inverse};
      --vscode-editorSuggestWidget-border: #{$kui-color-border-inverse};
      // Context menu
      // --vscode-menu-background: #{$kui-color-background-inverse};
      --vscode-menu-border: #{$kui-color-border-inverse};
      --vscode-menu-separatorBackground: #{$kui-color-border-inverse};
      // Other
      --vscode-focusBorder: #{$kui-color-text-neutral};
      // --vscode-input-background: #{$kui-color-background-inverse};
      --vscode-sash-hoverBorder: #{$kui-color-border-primary};
      /* stylelint-enable */

      // Modify the editor's search box styles
      .find-widget {
        background: $kui-color-background-inverse;
        border-bottom: $kui-border-width-10 solid $kui-color-border-neutral-weaker;

        // the pane to resize the search box
        .monaco-sash {
          background-color: $kui-color-background-neutral-weaker;
        }

        // Modify the search input
        .monaco-inputbox {
          background-color: $kui-color-background-inverse !important;
          border: $kui-border-width-10 solid $kui-color-border-neutral-weaker !important;
        }
      }
    }
  }

  /** !Important: Only put non-color related overrides in this block */
  :deep(.monaco-editor) {
    position: absolute;

    .sticky-widget {
      z-index: 2;
    }

    // Modify the editor's suggestion overlay styles
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
          background: $kui-color-background-neutral-weaker;

          .monaco-icon-label,
          .suggest-icon {
            color: $kui-color-text-neutral-strongest !important;
          }
        }

        &:first-child {
          &.focused {
            border-top-left-radius: $kui-border-radius-30;
          }
        }

        .suggest-icon {
          &:not(.codicon-symbol-property) {
            color: $kui-color-text-primary;
          }
        }

        .monaco-icon-label {
          color: $kui-color-text-neutral !important;
        }
      }
    }


    .codicon-suggest-more-info {
      transform: translateY(2px) !important;
    }

    // Modify the editor's search box styles
    .find-widget {
      border-radius: $kui-border-radius-0;
      right: 0px !important;

      // the pane to resize the search box
      .monaco-sash {
        width: 1px !important;
      }

      // TODO
      // The close (x) button
      // .codicon-widget-close {
      // }

      // Modify the search input
      .monaco-inputbox {
        border-radius: $kui-border-radius-30;
        padding: 0 $kui-space-10;
      }
    }
  }
}

// transitions
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease-in-out;
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
