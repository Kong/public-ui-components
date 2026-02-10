<template>
  <KTooltip
    :data-testid="`editor-toolbar-mdc-action-${item.id}-tooltip`"
    :placement="placement"
  >
    <template
      v-if="item.label"
      #content
    >
      <div
        class="shortcut-text"
        :class="{ 'has-keys': hasKeys }"
      >
        {{ item.label }}
      </div>
      <div
        v-if="hasKeys"
        class="keys"
      >
        <kbd
          v-for="key in item.keybindings"
          :key="key"
          :aria-label="i18n.t('editor.labels.key', { key: normalizeKey(key) })"
          :class="[
            { mac: isMac },
            getKeyClass(key),
          ]"
          :data-testid="`editor-toolbar-mdc-${isSpecialKey(key) ? getKeyClass(key) : `${key.toLowerCase()}-key`}`"
          v-text="isSpecialKey(key) ? '' : key"
        />
      </div>
    </template>
    <KButton
      appearance="none"
      :aria-label="item.ariaLabel || item.label"
      class="toolbar-action-button"
      :data-testid="`editor-toolbar-mdc-action-${item.id}-button`"
      :disabled="!active"
      icon
      @click="item.action"
    >
      <component
        :is="item.icon"
        decorative
      />
    </KButton>
  </KTooltip>
</template>

<script setup lang="ts">
import type { MonacoEditorActionButton } from '../types'
import type { TooltipProps } from '@kong/kongponents'
import { onMounted, ref, computed } from 'vue'
import useI18n from '../composables/useI18n'

const {
  placement = 'bottom-end',
  active = true,
  item,
} = defineProps<{
  item: Omit<MonacoEditorActionButton, 'action'> & {
    ariaLabel?: string
    action?: () => void
  }
  /**
   * Whether the button is active (clickable) or not.
   *
   * @default true
   */
  active?: boolean
  /**
   * Placement of the tooltip.
   *
   * @default 'bottom-end'
   */
  placement?: TooltipProps['placement']
}>()

const { i18n } = useI18n()

// check if the item has any shortcut keys defined
const hasKeys = computed((): boolean => !!item.keybindings?.length)

// `isMac` detects if the user is on a Mac device to adjust shortcut key labels (Cmd vs Ctrl)
const isMac = ref<boolean>(false)


// normalizeKey name for accessibility and display
const normalizeKey = (key: string): string => {
  const normalized = key.toLowerCase()
  const map: Record<string, string> = {
    command: isMac.value ? 'Command' : 'Ctrl',
    cmd: isMac.value ? 'Command' : 'Ctrl',
    ctrl: 'Ctrl',
    control: 'Ctrl',
    shift: 'Shift',
    option: isMac.value ? 'Option' : 'Alt',
    opt: isMac.value ? 'Option' : 'Alt',
    alt: 'Alt',
  }
  return map[normalized] || key.toUpperCase()
}

// check if the key is a special key (Command, Ctrl, Shift, Option/Alt)
const isSpecialKey = (key: string): boolean => ['command', 'cmd', 'ctrl', 'control', 'shift', 'option', 'opt', 'alt'].includes(key.toLowerCase())

// get css class name for special keys
const getKeyClass = (key: string): string => {
  const normalized = key.toLowerCase()
  if (['command', 'cmd', 'ctrl', 'control'].includes(normalized)) return 'meta-key'
  if (normalized === 'shift') return 'shift-key'
  if (['option', 'opt', 'alt'].includes(normalized)) return 'option-key'
  return ''
}

onMounted(() => {
  // Set `isMac` to true if on Mac (for shortcut icons)
  // @ts-ignore - property exists
  isMac.value = /Mac|iPhone|iPod|iPad/i.test(navigator?.platform) || /macOS|Mac|iPhone|iPod|iPad/i.test(navigator?.userAgentData?.platform)
})
</script>


<style lang="scss" scoped>
.shortcut-text {
  text-align: center;

  &.has-keys {
    margin-bottom: $kui-space-20;
  }
}

.keys {
  align-items: center;
  display: flex;
  font-family: $kui-font-family-code;
  gap: $kui-space-30;
  justify-content: center;
  min-width: auto;
  text-align: center;
  text-transform: capitalize;
  white-space: nowrap;

  kbd {
    border: $kui-border-width-10 solid $kui-color-border-neutral-weak;
    border-radius: $kui-border-radius-20;
    display: block;
    padding: $kui-space-0 $kui-space-30;
    user-select: none;
  }

  .meta-key {

    // windows/linux
    &:after {
      content: 'Ctrl';
    }

    // macos
    &.mac:after {
      content: '\2318';
      font-size: $kui-font-size-40;
      line-height: 0;
      position: relative;
      top: 2px;
    }
  }

  .option-key {

    // windows/linux
    &:after {
      content: 'Alt';
    }

    // macos
    &.mac:after {
      content: '\2325';
      font-size: $kui-font-size-40;
      line-height: 0;
      position: relative;
      top: 2px;
    }
  }

  .shift-key {
    &:after {
      content: '\21E7';
      font-size: $kui-font-size-60;
      line-height: 0;
      position: relative;
      top: 2px;
    }
  }
}


.toolbar-action-button {
  color: $kui-color-text-neutral;

  &:hover {
    color: $kui-color-text-neutral-strongest;
  }

  &:disabled {
    color: $kui-color-text-neutral-weak;
  }
}
</style>
