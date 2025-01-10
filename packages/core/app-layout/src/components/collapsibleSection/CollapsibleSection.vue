<template>
  <component
    :is="collapsible ? 'details' : 'div'"
    class="collapsible-section"
    data-testid="collapsible-section"
  >
    <component
      :is="collapsible ? 'summary' : 'div'"
      class="collapsible-section-header"
      data-testid="collapsible-section-header"
    >
      <slot name="header">
        <div class="collapsible-section-default-header">
          <component
            :is="titleTag"
            v-if="title"
            class="collapsible-section-title"
          >
            {{ title }}
          </component>
          <div
            v-if="description"
            class="collapsible-section-description"
          >
            {{ description }}
          </div>
        </div>
      </slot>

      <ChevronRightIcon
        v-if="collapsible"
        class="collapsible-section-chevron-icon"
        decorative
      />
      <slot
        v-else-if="$slots.actions"
        name="actions"
      />
    </component>

    <div
      v-if="$slots.default"
      class="collapsible-section-content"
      data-testid="collapsible-section-content"
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
.collapsible-section {
  border: $kui-border-width-10 solid $kui-color-border;
  border-radius: $kui-border-radius-30;

  .collapsible-section-header {
    align-items: center;
    display: flex;
    gap: $kui-space-20;
    justify-content: space-between;
    padding: $kui-space-70;

    .collapsible-section-default-header {
      display: flex;
      flex-direction: column;
      gap: $kui-space-40;
      max-width: 700px;

      .collapsible-section-title {
        color: $kui-color-text;
        font-size: $kui-font-size-40;
        font-weight: $kui-font-weight-bold;
        line-height: $kui-line-height-30;
        margin: $kui-space-0;
      }

      .collapsible-section-description {
        color: $kui-color-text-neutral;
        font-size: $kui-font-size-30;
        line-height: $kui-line-height-30;
        margin: $kui-space-0;
      }
    }
  }

  .collapsible-section-content {
    background: $kui-color-background-neutral-weakest;
    border-top: $kui-border-width-10 solid $kui-color-border;
    display: flex;
    flex-direction: column;
    gap: $kui-space-40;
    padding: $kui-space-70;

    :deep(.k-table-view) {
      background-color: var(--kui-color-background-neutral-weakest, $kui-color-background-neutral-weakest);

      tr.is-scrolled {
        background-color: var(
          --kui-color-background-neutral-weakest,
          $kui-color-background-neutral-weakest
        );
      }
    }

    :deep(.k-empty-state) {
      background-color: $kui-color-background-neutral-weakest;
    }
  }
}

details.collapsible-section {
  &[open] {
    .collapsible-section-chevron-icon {
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

  .collapsible-section-header {
    cursor: pointer;

    .collapsible-section-chevron-icon {
      flex-shrink: 0;
      pointer-events: none;
      transition: transform $kui-animation-duration-20 ease;
    }
  }
}
</style>
