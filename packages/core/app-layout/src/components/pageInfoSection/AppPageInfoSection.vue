<template>
  <component
    :is="collapsible ? 'details' : 'div'"
    class="app-page-info-section"
    data-testid="app-page-info-section"
  >
    <component
      :is="collapsible ? 'summary' : 'div'"
      class="app-page-info-section-header"
      data-testid="app-page-info-section-header"
    >
      <slot name="header">
        <div class="app-page-info-section-default-header">
          <component
            :is="titleTag"
            v-if="title"
            class="app-page-info-section-title"
            data-testid="app-page-info-section-title"
          >
            {{ title }}
          </component>
          <div
            v-if="description"
            class="app-page-info-section-description"
            data-testid="app-page-info-section-description"
          >
            {{ description }}
          </div>
        </div>
      </slot>

      <ChevronRightIcon
        v-if="collapsible"
        class="app-page-info-section-chevron-icon"
        decorative
      />
      <slot
        v-else-if="$slots.actions"
        name="actions"
      />
    </component>

    <div
      v-if="$slots.default"
      class="app-page-info-section-content"
      data-testid="app-page-info-section-content"
    >
      <slot name="default" />
    </div>
  </component>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import { ChevronRightIcon } from '@kong/icons'
import type { HeaderTag } from '@kong/kongponents'
import { HeaderTags } from '@kong/kongponents'

defineProps({
  collapsible: {
    type: Boolean,
    default: true,
  },
  title: {
    type: String,
    default: '',
  },
  description: {
    type: String,
    default: '',
  },
  titleTag: {
    type: String as PropType<HeaderTag>,
    default: 'div',
    validator: (value: HeaderTag): boolean => HeaderTags.includes(value),
  },
})
</script>

<style lang="scss" scoped>
.app-page-info-section {
  border: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);
  border-radius: var(--kui-border-radius-30, $kui-border-radius-30);

  .app-page-info-section-header {
    align-items: center;
    display: flex;
    gap: var(--kui-space-20, $kui-space-20);
    justify-content: space-between;
    padding: var(--kui-space-70, $kui-space-70);

    .app-page-info-section-default-header {
      display: flex;
      flex-direction: column;
      gap: var(--kui-space-40, $kui-space-40);
      max-width: 700px;

      .app-page-info-section-title {
        color: var(--kui-color-text, $kui-color-text);
        font-size: var(--kui-font-size-40, $kui-font-size-40);
        font-weight: var(--kui-font-weight-bold, $kui-font-weight-bold);
        line-height: var(--kui-line-height-30, $kui-line-height-30);
        margin: var(--kui-space-0, $kui-space-0);
      }

      .app-page-info-section-description {
        color: var(--kui-color-text-neutral, $kui-color-text-neutral);
        font-size: var(--kui-font-size-30, $kui-font-size-30);
        line-height: var(--kui-line-height-30, $kui-line-height-30);
        margin: var(--kui-space-0, $kui-space-0);
      }
    }
  }

  .app-page-info-section-content {
    background: var(--kui-color-background-neutral-weakest, $kui-color-background-neutral-weakest);
    border-bottom-left-radius: var(--kui-border-radius-30, $kui-border-radius-30);
    border-bottom-right-radius: var(--kui-border-radius-30, $kui-border-radius-30);
    border-top: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);
    display: flex;
    flex-direction: column;
    gap: var(--kui-space-40, $kui-space-40);
    padding: var(--kui-space-70, $kui-space-70);

    :slotted(.k-table-view) {
      background-color: var(--kui-color-background-neutral-weakest, $kui-color-background-neutral-weakest);

      tr.is-scrolled {
        background-color: var(--kui-color-background-neutral-weakest, $kui-color-background-neutral-weakest);
      }

      td,
      th {
        &.sticky-column,
        &.actions-column {
          background-color: var(--kui-color-background-neutral-weakest, $kui-color-background-neutral-weakest) !important;
        }
      }
    }

    :slotted(.k-empty-state) {
      background-color: var(--kui-color-background-neutral-weakest, $kui-color-background-neutral-weakest);
    }
  }
}

details.app-page-info-section {
  overflow: auto;

  &[open] {
    .app-page-info-section-chevron-icon {
      transform: rotate(90deg);
    }
  }

  &:has(>summary:focus-visible) {
    box-shadow: var(--kui-shadow-focus, $kui-shadow-focus);
  }

  summary {
    outline: none;

    &::-webkit-details-marker, &::marker {
      display: none;
    }
  }

  .app-page-info-section-header {
    cursor: pointer;

    .app-page-info-section-chevron-icon {
      flex-shrink: 0;
      pointer-events: none;
      transition: transform var(--kui-animation-duration-20, $kui-animation-duration-20) ease;
    }
  }
}
</style>
