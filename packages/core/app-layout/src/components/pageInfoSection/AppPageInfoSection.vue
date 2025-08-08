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
  border: $kui-border-width-10 solid $kui-color-border;
  border-radius: $kui-border-radius-30;

  .app-page-info-section-header {
    align-items: center;
    display: flex;
    gap: $kui-space-20;
    justify-content: space-between;
    padding: $kui-space-70;

    .app-page-info-section-default-header {
      display: flex;
      flex-direction: column;
      gap: $kui-space-40;
      max-width: 700px;

      .app-page-info-section-title {
        color: $kui-color-text;
        font-size: $kui-font-size-40;
        font-weight: $kui-font-weight-bold;
        line-height: $kui-line-height-30;
        margin: $kui-space-0;
      }

      .app-page-info-section-description {
        color: $kui-color-text-neutral;
        font-size: $kui-font-size-30;
        line-height: $kui-line-height-30;
        margin: $kui-space-0;
      }
    }
  }

  .app-page-info-section-content {
    background: $kui-color-background-neutral-weakest;
    border-bottom-left-radius: $kui-border-radius-30;
    border-bottom-right-radius: $kui-border-radius-30;
    border-top: $kui-border-width-10 solid $kui-color-border;
    display: flex;
    flex-direction: column;
    gap: $kui-space-40;
    padding: $kui-space-70;

    :slotted(.k-table-view) {
      background-color: $kui-color-background-neutral-weakest;

      tr.is-scrolled {
        background-color: $kui-color-background-neutral-weakest;
      }

      td,
      th {
        &.sticky-column,
        &.actions-column {
          background-color: $kui-color-background-neutral-weakest !important;
        }
      }
    }

    :slotted(.k-empty-state) {
      background-color: $kui-color-background-neutral-weakest;
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
    box-shadow: $kui-shadow-focus;
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
      transition: transform $kui-animation-duration-20 ease;
    }
  }
}
</style>
