<template>
  <div class="ff-collapsible-section">
    <header class="ff-collapsible-section-header">
      <div class="ff-collapsible-section-header-toggle">
        <button
          class="ff-collapsible-section-toggle-btn"
          type="button"
          @click.prevent.stop="expanded = !expanded"
        >
          <ChevronRightIcon
            class="ff-collapsible-section-toggle-btn-trigger-icon"
            :class="{ 'collapse-expanded': expanded }"
            decorative
            :size="KUI_ICON_SIZE_30"
          />
        </button>
        <KLabel class="ff-collapsible-section-label">
          {{ label }}
        </KLabel>
      </div>
    </header>

    <SlideTransition>
      <div
        v-if="expanded"
        class="ff-collapsible-section-content"
      >
        <slot />
      </div>
    </SlideTransition>

    <div
      v-if="expanded"
      class="ff-collapsible-section-indent-guide"
    />
  </div>
</template>

<script setup lang="ts">
import { KLabel } from '@kong/kongponents'
import { ChevronRightIcon } from '@kong/icons'
import { KUI_ICON_SIZE_30 } from '@kong/design-tokens'
import SlideTransition from './SlideTransition.vue'

defineProps<{
  label: string
}>()

const expanded = defineModel<boolean>('expanded', { default: true })
</script>

<style lang="scss" scoped>
$indent-guide-width: 6px;
$indent-guide-left-offset: -10px;
$indent-guide-top-offset: 20px;

.ff-collapsible-section {
  position: relative;

  &-indent-guide {
    bottom: 0;
    left: $indent-guide-left-offset;
    position: absolute;
    top: $indent-guide-top-offset;
    transform: translateX(-50%);
    width: $indent-guide-width;

    &::before {
      border-left: 1px solid var(--kui-color-border-neutral-weaker, $kui-color-border-neutral-weaker);
      bottom: 0;
      content: '';
      left: 50%;
      position: absolute;
      top: 0;
      transform: translateX(-50%);
      width: 0;
    }

    &:hover::before {
      border-left-color: var(--kui-color-border-neutral-weak, $kui-color-border-neutral-weak);
    }
  }

  &-header {
    display: flex;
    flex-direction: column;
    gap: var(--kui-space-40, $kui-space-40);

    &-toggle {
      align-items: center;
      display: flex;
    }
  }

  &-label.k-label {
    margin-bottom: 0;
    margin-top: 0;
  }

  &-toggle-btn {
    align-items: center;
    background-color: var(--kui-color-background-transparent, $kui-color-background-transparent);
    border: none;
    border-radius: var(--kui-border-radius-20, $kui-border-radius-20);
    color: var(--kui-color-text-neutral-weak, $kui-color-text-neutral-weak);
    cursor: pointer;
    display: flex;
    font-size: var(--kui-font-size-30, $kui-font-size-30);
    font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
    gap: var(--kui-space-20, $kui-space-20);
    line-height: var(--kui-line-height-30, $kui-line-height-30);
    margin-left: calc(-1 * var(--kui-space-70, $kui-space-70));
    outline: none;
    padding: var(--kui-space-10, $kui-space-10);

    &:hover:not(:focus, :active, :disabled) {
      color: var(--kui-color-text-neutral, $kui-color-text-neutral);
    }

    &:focus-visible {
      box-shadow: var(--kui-shadow-focus, $kui-shadow-focus);
    }

    &-trigger-icon {
      transition: transform var(--kui-animation-duration-20, $kui-animation-duration-20) ease-in-out;

      &.collapse-expanded {
        transform: rotate(90deg);
      }
    }
  }

  &-content {
    display: flex;
    flex-direction: column;
    gap: var(--kui-space-80, $kui-space-80);
    margin-top: var(--kui-space-20, $kui-space-20);
    padding: var(--kui-space-60, $kui-space-60) 0 var(--kui-space-20, $kui-space-20) var(--kui-space-70, $kui-space-70);
  }
}
</style>
