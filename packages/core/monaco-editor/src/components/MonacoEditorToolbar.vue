<template>
  <div
    ref="toolbarEl"
    class="monaco-editor-ui-toolbar"
    data-testid="monaco-editor-toolbar"
  >
    <div
      ref="leftSlotEl"
      class="monaco-editor-ui-toolbar-left"
      :data-testid="`monaco-editor-toolbar-left`"
    >
      <div
        v-for="(group, groupIndex) in visibleLeftGroups"
        :key="groupIndex"
        class="monaco-editor-ui-toolbar-action-group"
      >
        <ToolbarActionButton
          v-for="item in group"
          :key="item.id"
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
      <div
        v-show="hiddenItems.length"
        class="monaco-editor-ui-toolbar-action-group"
        data-testid="toolbar-overflow-group"
      >
        <KDropdown
          :key="dropdownKey"
          :class="{ 'is-disabled': editor?.editorStates.editorStatus !== 'ready' }"
        >
          <template #items>
            <KDropdownItem
              v-for="item of hiddenItems"
              :key="item.id"
              :data-testid="`overflow-item-${item.id}`"
              :has-divider="item.hasDivider"
              @click="executeToolbarAction(item, editor)"
            >
              <component
                :is="item.icon"
                decorative
              />
              {{ item.label }}
            </KDropdownItem>
          </template>
          <ToolbarActionButton
            :active="editor?.editorStates.editorStatus === 'ready'"
            :item="{
              id: 'more',
              label: i18n.t('editor.labels.action_more'),
              icon: MoreIcon,
            }"
            placement="bottom"
          />
        </KDropdown>
      </div>
      <slot name="toolbar-left" />
    </div>
    <div
      ref="centerSlotEl"
      class="monaco-editor-ui-toolbar-center"
      :data-testid="`monaco-editor-toolbar-center`"
    >
      <div
        v-for="(group, groupIndex) in centerGroups"
        :key="groupIndex"
        class="monaco-editor-ui-toolbar-action-group"
      >
        <ToolbarActionButton
          v-for="item in group"
          :key="item.id"
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
      <slot name="toolbar-center" />
    </div>
    <div
      ref="rightSlotEl"
      class="monaco-editor-ui-toolbar-right"
      :data-testid="`monaco-editor-toolbar-right`"
    >
      <div
        v-for="(group, groupIndex) in rightGroups"
        :key="groupIndex"
        class="monaco-editor-ui-toolbar-action-group"
      >
        <ToolbarActionButton
          v-for="item in group"
          :key="item.id"
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
      <slot name="toolbar-right" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { watch, computed, shallowRef, onMounted, nextTick, ref, useTemplateRef } from 'vue'
import { useElementSize } from '@vueuse/core'
import { MoreIcon } from '@kong/icons'
import ToolbarActionButton from './ToolbarActionButton.vue'
import { useToolbarActions } from '../composables/useToolbarActions'
import { executeToolbarAction } from '../utils/commands'
import useI18n from '../composables/useI18n'
import type { MonacoEditorActionConfig, MonacoEditorToolbarOptions } from '../types'
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

const toolbarEl = useTemplateRef('toolbarEl')
const leftSlotEl = useTemplateRef('leftSlotEl')
const centerSlotEl = useTemplateRef('centerSlotEl')
const rightSlotEl = useTemplateRef('rightSlotEl')

const toolbarSize = useElementSize(toolbarEl)
const leftSlotSize = useElementSize(leftSlotEl)
const centerSlotSize = useElementSize(centerSlotEl)
const rightSlotSize = useElementSize(rightSlotEl)

// Track current language reactively from the editor composable's state
const currentLanguage = computed<string>(() => editor?.editorStates.currentLanguage ?? '')

const { commands, leftGroups, centerGroups, rightGroups } = useToolbarActions(settings, currentLanguage)

const visibleLeftGroups = shallowRef<MonacoEditorActionConfig[][]>([])

// Re-render key to close the dropdown when resizing
const dropdownKey = ref<number>(0)

// LIFO stack: stores the content width at each collapse point
const collapseBreakpoints: number[] = []

// Buffer to prevent oscillation between collapse/restore
const HYSTERESIS = 5

const hiddenItems = computed(() => {
  return leftGroups.value.slice(visibleLeftGroups.value.length).flatMap((group, index) =>
    group.map((item, itemIndex) => ({
      ...item,
      hasDivider: index > 0 && itemIndex === 0,
    })),
  )
})

// Sync visibleLeftGroups when leftGroups change (e.g. language switch)
watch(leftGroups, (groups) => {
  visibleLeftGroups.value = [...groups]
  collapseBreakpoints.length = 0
}, { immediate: true })

function updateOverflowMenu() {
  // Read DOM sizes directly for accurate, synchronous measurements.
  // This avoids stale values from useElementSize refs that rely on async ResizeObserver callbacks,
  // which can miss cascading changes (e.g. when collapsing a pane).
  const toolbarWidth = toolbarEl.value?.getBoundingClientRect().width ?? 0
  if (toolbarWidth === 0) return

  const leftWidth = leftSlotEl.value?.getBoundingClientRect().width ?? 0
  const centerWidth = centerSlotEl.value?.getBoundingClientRect().width ?? 0
  const rightWidth = rightSlotEl.value?.getBoundingClientRect().width ?? 0
  const contentWidth = leftWidth + centerWidth + rightWidth + 50

  if (toolbarWidth < contentWidth && visibleLeftGroups.value.length > 0) {
    // Collapse: store the content width, then remove the last visible group
    collapseBreakpoints.push(contentWidth)
    visibleLeftGroups.value = visibleLeftGroups.value.slice(0, -1)
    dropdownKey.value++
    // Re-check after DOM update to cascade collapse if still overflowing
    nextTick(updateOverflowMenu)
  } else if (
    collapseBreakpoints.length > 0 &&
    visibleLeftGroups.value.length < leftGroups.value.length &&
    toolbarWidth > collapseBreakpoints[collapseBreakpoints.length - 1]! + HYSTERESIS
  ) {
    // Restore: toolbar is now wider than the content was when we last collapsed (+ buffer)
    collapseBreakpoints.pop()
    visibleLeftGroups.value = [
      ...visibleLeftGroups.value,
      leftGroups.value[visibleLeftGroups.value.length]!,
    ]
    // Re-check after DOM update to cascade restore if more space is available
    nextTick(updateOverflowMenu)
  }
}

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

watch([toolbarSize.width, leftSlotSize.width, centerSlotSize.width, rightSlotSize.width], updateOverflowMenu)

onMounted(async () => await nextTick(updateOverflowMenu))
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
  overflow: hidden;
  padding-left: $kui-space-40;
  padding-right: $kui-space-40;
  position: sticky;
  top: 0;
  z-index: 3; // Keep over the sidebars


  &-left,
  &-right,
  &-center {
    align-items: center;
    display: flex;
    flex-shrink: 0;
    gap: $kui-space-40;
    height: 100%;
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
