<template>
  <div class="monaco-editor-ui-toolbar">
    <div
      v-if="leftGroups.length > 0"
      class="monaco-editor-ui-toolbar-left"
    >
      <div
        v-for="(group, groupIndex) in leftGroups"
        :key="groupIndex"
        class="monaco-editor-ui-toolbar-action-group"
      >
        <ToolbarActionButton
          v-for="item in group"
          :key="item.id!"
          :active="editor?.editorStates.editorStatus === 'ready'"
          :item="{
            id: item.id!,
            label: item.label,
            icon: item.icon!,
            keybindings: item.keybindings,
            action: () => executeToolbarAction(item, editor),
          }"
          :placement="groupIndex === 0 ? 'bottom-start' : 'bottom'"
        />
      </div>
    </div>
    <div
      v-if="centerGroups.length > 0"
      class="monaco-editor-ui-toolbar-centre"
    >
      <div
        v-for="(group, groupIndex) in centerGroups"
        :key="groupIndex"
        class="monaco-editor-ui-toolbar-action-group"
      >
        <ToolbarActionButton
          v-for="item in group"
          :key="item.id!"
          :active="editor?.editorStates.editorStatus === 'ready'"
          :item="{
            id: item.id!,
            label: item.label,
            icon: item.icon!,
            keybindings: item.keybindings,
            action: () => executeToolbarAction(item, editor),
          }"
          placement="bottom"
        />
      </div>
    </div>
    <div
      v-if="rightGroups.length > 0"
      class="monaco-editor-ui-toolbar-right"
    >
      <div
        v-for="(group, groupIndex) in rightGroups"
        :key="groupIndex"
        class="monaco-editor-ui-toolbar-action-group"
      >
        <ToolbarActionButton
          v-for="item in group"
          :key="item.id!"
          :active="editor?.editorStates.editorStatus === 'ready'"
          :item="{
            id: item.id!,
            label: item.label,
            icon: item.icon!,
            keybindings: item.keybindings,
            action: () => executeToolbarAction(item, editor),
          }"
          :placement="groupIndex === rightGroups.length - 1 ? 'bottom-end' : 'bottom'"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { watch } from 'vue'
import ToolbarActionButton from './ToolbarActionButton.vue'
import useI18n from '../composables/useI18n'
import { useToolbarActions } from '../composables/useToolbarActions'
import { executeToolbarAction } from '../utils/commands'
import type { MonacoEditorToolbarOptions } from '../types'
import type { useMonacoEditor } from '../composables/useMonacoEditor'

const {
  editor = null,
  settings,
} = defineProps<{
  /**
   * The editor instance to trigger actions on.
   *
   * @default null
   */
  editor?: ReturnType<typeof useMonacoEditor> | null
  /**
   * Toolbar configuration settings
   */
  settings: boolean | MonacoEditorToolbarOptions
}>()

const { i18n } = useI18n()

const { commands, leftGroups, centerGroups, rightGroups } = useToolbarActions(
  settings,
  (key: string) => i18n.t(key as any) as string,
)

/**
 * Register actions with Monaco editor when the editor becomes ready
 */
watch(() => editor?.editorStates.editorStatus, (status) => {
  if (status === 'ready' && editor && commands.value.length > 0) {
    // Register all commands as Monaco actions
    editor.registerActions(commands.value)
  }
}, {
  immediate: true,
})
</script>

<style lang="scss" scoped>
$defaultHeight: 44px;

.monaco-editor-ui-toolbar {
  align-items: center;
  background: $kui-color-background;
  border-bottom: $kui-border-width-10 solid $kui-color-border;
  display: flex;
  flex: 0 0 $defaultHeight;
  justify-content: space-between;
  min-height: $defaultHeight;
  overflow-x: auto;
  overflow-y: hidden;
  padding-left: $kui-space-40;
  padding-right: $kui-space-40;
  position: sticky;
  scrollbar-width: thin;
  top: 0;
  z-index: 3; // Keep over the sidebars


  &-left,
  &-right,
  &-centre {
    align-items: center;
    display: flex;
    gap: $kui-space-40;
    height: 100%;
  }

  &-left,
  &-right {
    flex: 1 1 0%;
  }

  &-right {
    justify-content: flex-end;
  }

  &-action-group {
    display: flex;
    gap: $kui-space-20;
    margin-right: $kui-space-30;
    position: relative;

    // Adds a border to right between action groups, except the first one.
    &:not(:first-child) {
      &::after {
        background: $kui-color-background-neutral-weaker;
        content: '';
        height: 75%;
        left: -5px;
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        width: 1px;
      }
    }

    :deep(.popover-content) {
      font-weight: $kui-font-weight-semibold !important;
    }

    // Update dropdown styles
    :deep(.dropdown-item-trigger) {
      .dropdown-item-trigger-label {
        color: $kui-color-text-neutral;
      }

      &:hover,
      &:focus-visible {
        .dropdown-item-trigger-label {
          color: $kui-color-text-neutral-strongest;
        }
      }
    }
  }
}
</style>
