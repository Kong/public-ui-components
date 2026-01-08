<template>
  <div class="monaco-editor-ui-toolbar">
    <div class="monaco-editor-ui-toolbar-left">
      <!-- TODO -->
      <div
        v-for="group in 1"
        :key="group"
        class="monaco-editor-ui-toolbar-action-group"
      >
        <ToolbarActionButton
          v-for="item, index in commands"
          :key="item.id || index"
          :active="editor?.editorStates.editorStatus === 'ready'"
          :item="{
            ...item,
            action: typeof item.action === 'function'
              ? () => item.action(editor)
              : () => editor?.triggerKeyboardCommand(item.action as any),
          }"
          :placement="index === 0 ? 'bottom-start' : 'bottom'"
        />
      </div>
    </div>
    <div class="monaco-editor-ui-toolbar-centre" />
    <div class="monaco-editor-ui-toolbar-right">
      <div class="monaco-editor-ui-toolbar-action-group">
        <ToolbarActionButton
          :active="editor?.editorStates.editorStatus === 'ready'"
          :item="{
            id: 'search',
            icon: SearchIcon,
            label: i18n.t('editor.labels.action_search'),
            ariaLabel: i18n.t('editor.labels.action_search_label'),
            action: () => editor?.toggleSearchWidget(),
            keybindings: ['Command', 'F'],
          }"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import ToolbarActionButton from './ToolbarActionButton.vue'
import { SearchIcon } from '@kong/icons'
import useI18n from '../composables/useI18n'
import type { MonacoEditorActionButton, MonacoEditorToolbarOptions } from '../types'
import type { useMonacoEditor } from '../composables/useMonacoEditor'
import { computed } from 'vue'

const {
  editor = null,
  items = [],
  settings,
} = defineProps<{
  /**
   * The editor instance to trigger actions on.
   *
   * @default null
   */
  editor?: ReturnType<typeof useMonacoEditor> | null
  /**
   * The items to show in the toolbar.
   *
   * @default []
   */
  items?: MonacoEditorActionButton[][]
  //
  settings: boolean | MonacoEditorToolbarOptions
}>()

const { i18n } = useI18n()

const builtInCommands: Record<string, MonacoEditorActionButton> = {
  // we can extend these to format, full-screen and etc.
  search: {
    id: 'search',
    icon: SearchIcon,
    label: i18n.t('editor.labels.action_search'),
    action: (editor: ReturnType<typeof useMonacoEditor>) => editor.toggleSearchWidget(),
    keybindings: ['Command', 'F'],
  },
}

const commands = computed(() => {
  const result: MonacoEditorActionButton[] = []

  const userCommands = typeof settings === 'object' ? settings?.commands || {} : {}

  // Built-in
  for (const key in builtInCommands) {
    const userConfig = userCommands[key]
    if (userConfig === false) continue // disable

    const merged = {
      ...builtInCommands[key],
      ...(typeof userConfig === 'object' ? userConfig : {}),
    }

    result.push(merged)
  }

  // Custom user commands
  for (const key in userCommands) {
    if (key in builtInCommands) continue
    const cfg = userCommands[key]
    if (cfg === false) continue

    result.push({
      id: key,
      label: (cfg as any)?.label || key,
      icon: (cfg as any)?.icon,
      action: (cfg as any)?.action,
      // order: (cfg as any)?.order || 99,
    })
  }

  return result
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

  &.-left,
  &.-right {
    flex: 1 1 0%;
  }

  &-.right {
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
