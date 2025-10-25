<template>
  <div class="monaco-editor-ui-toolbar">
    <div class="monaco-editor-ui-toolbar-left">
      <div
        v-for="group, groupIndex in ActionGroups"
        :key="groupIndex"
        class="monaco-editor-ui-toolbar-action-group"
      >
        <ToolbarActionButton
          v-for="item, index in group"
          :key="index"
          :item="{
            ...item,
            action: typeof item.action === 'function' ? item.action : () => editor?.triggerKeyboardCommand(item.action as any),
          }"
          :placement="index === 0 ? 'bottom-start' : 'bottom'"
        />
      </div>
    </div>
    <div class="monaco-editor-ui-toolbar-centre" />
    <div class="monaco-editor-ui-toolbar-right">
      <div class="monaco-editor-ui-toolbar-action-group">
        <ToolbarActionButton
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
import { CleaningIcon, FullscreenIcon, SearchIcon } from '@kong/icons'
import composables from '../composables'
import type { MonacoEditorActionButton } from 'src/types'
import type useMonacoEditor from 'src/composables/useMonacoEditor'
// import { MonacoEditorDefaultActions } from 'src/utils/actions'

const {
  editor = null,
  active = false,
  items = [],
  showSearch = true,
  showFormat = true,
} = defineProps<{
  /**
   * The editor instance to trigger actions on.
   *
   * @default null
   */
  editor?: ReturnType<typeof useMonacoEditor> | null
  /**
   * Whether the toolbar buttons is active or not (disabled).
   *
   * @default false
   */
  active?: boolean
  /**
   * Whether to show the search button or not.
   *
   * @default true
   */
  showSearch?: boolean
  /**
   * Whether to show the format button or not.
   *
   * @default true
   */
  showFormat?: boolean
  /**
   * The items to show in the toolbar.
   *
   * @default []
   */
  items?: MonacoEditorActionButton[][]
}>()

const { i18n } = composables.useI18n()

const ActionGroups: MonacoEditorActionButton[][] = [
  [
    {
      id: 'format',
      icon: CleaningIcon,
      keybindings: [],
      label: i18n.t('editor.labels.action_format'),
      // ariaLabel: i18n.t('editor.labels.action_format_label'),
      action: () => {
        editor?.formatDocument()
      },
    },
    {
      id: 'full-screen',
      icon: FullscreenIcon,
      keybindings: [],
      label: i18n.t('editor.labels.action_full_screen'),
      // ariaLabel: i18n.t('editor.labels.action_format_label'),
      action: 'actions:full-screen',
    },
  ],
]
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
