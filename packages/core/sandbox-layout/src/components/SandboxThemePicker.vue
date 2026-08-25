<template>
  <div class="kong-ui-sandbox-theme-picker">
    <div class="theme-picker-row">
      <span class="theme-picker-label">Theme</span>
      <div
        aria-label="Theme"
        class="theme-picker-group"
        role="radiogroup"
      >
        <KTooltip
          v-for="option in KONG_UI_SANDBOX_THEME_MODE_OPTIONS"
          :key="option.value"
          placement="top"
          :text="option.label"
        >
          <label
            class="theme-picker-option"
            :class="{ active: option.value === mode }"
          >
            <input
              :aria-label="option.label"
              :checked="option.value === mode"
              class="theme-picker-input"
              name="sandbox-theme-mode"
              type="radio"
              :value="option.value"
              @change="mode = option.value"
            >
            <component
              :is="MODE_ICONS[option.value]"
              decorative
              :size="`var(--kui-icon-size-30, ${KUI_ICON_SIZE_30})`"
            />
          </label>
        </KTooltip>
      </div>
    </div>

    <div class="theme-picker-row">
      <span class="theme-picker-label">High contrast</span>
      <KInputSwitch
        v-model="highContrast"
        aria-label="High contrast"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import { DarkModeIcon, LightModeIcon } from '@kong/icons'
import { KUI_ICON_SIZE_30 } from '@kong/design-tokens'
import { KONG_UI_SANDBOX_THEME_MODE_OPTIONS } from '../constants'
import { useSandboxTheme } from '../composables/useSandboxTheme'
import type { SandboxThemeMode } from '../types'

const { mode, highContrast } = useSandboxTheme()

const MODE_ICONS: Record<SandboxThemeMode, Component> = {
  day: LightModeIcon,
  night: DarkModeIcon,
}
</script>

<style lang="scss" scoped>
// Hardcode the size of the theme picker option for consistency (icons
// differ in width/height so we can't rely on content size + padding)
$theme-picker-option-size: 28px;

.kong-ui-sandbox-theme-picker {
  display: flex;
  flex-direction: column;
  gap: var(--kui-space-60, $kui-space-60);
  width: 100%;

  .theme-picker-row {
    align-items: center;
    display: flex;
    justify-content: space-between;
  }

  .theme-picker-label {
    color: var(--kui-color-text, $kui-color-text);
    font-size: var(--kui-font-size-20, $kui-font-size-20);
    font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
  }

  .theme-picker-group {
    background-color: var(--kui-color-background-neutral-weaker, $kui-color-background-neutral-weaker);
    border: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);
    border-radius: var(--kui-border-radius-round, $kui-border-radius-round);
    display: flex;
    flex-direction: row;
  }

  .theme-picker-option {
    align-items: center;
    border-radius: var(--kui-border-radius-round, $kui-border-radius-round);
    color: var(--kui-color-text-neutral, $kui-color-text-neutral);
    cursor: pointer;
    display: flex;
    height: $theme-picker-option-size;
    justify-content: center;
    margin: var(--kui-space-0, $kui-space-0);
    outline: none;
    position: relative;
    transition: background-color var(--kui-animation-duration-20, $kui-animation-duration-20) ease-in, color var(--kui-animation-duration-20, $kui-animation-duration-20) ease-in, border var(--kui-animation-duration-20, $kui-animation-duration-20) ease-in;
    width: $theme-picker-option-size;

    &:hover {
      background-color: var(--kui-color-background-neutral-weak, $kui-color-background-neutral-weak);
    }

    /* Mirror the native radio's focus ring onto the visible label */
    &:has(.theme-picker-input:focus-visible) {
      box-shadow: var(--kui-shadow-focus, $kui-shadow-focus);
      z-index: 1;
    }

    .theme-picker-input {
      /* Visually hide the radio but keep it in the accessibility tree and
         keyboard-focusable, so the radiogroup semantics and native arrow-key
         navigation remain intact */
      border: var(--kui-border-width-0, $kui-border-width-0);
      clip-path: inset(50%);
      height: 1px;
      margin: -1px;
      overflow: hidden;
      padding: var(--kui-space-0, $kui-space-0);
      position: absolute;
      white-space: nowrap;
      width: 1px;
    }

    &.active {
      background-color: var(--kui-color-background, $kui-color-background);
      border: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border-neutral-weak, $kui-color-border-neutral-weak);
      color: var(--kui-color-text-neutral-strongest, $kui-color-text-neutral-strongest);
    }
  }
}
</style>
