<template>
  <component
    :is="collapsible ? 'details' : 'div'"
    class="page-info-section"
    data-testid="page-info-section"
  >
    <component
      :is="collapsible ? 'summary' : 'div'"
      class="page-info-section-header"
      data-testid="page-info-section-header"
    >
      <slot name="header">
        <div class="page-info-section-default-header">
          <component
            :is="titleTag"
            v-if="title"
            class="page-info-section-title"
            data-testid="page-info-section-title"
          >
            {{ title }}
          </component>
          <div
            v-if="description"
            class="page-info-section-description"
            data-testid="page-info-section-description"
          >
            {{ description }}
          </div>
        </div>
      </slot>

      <ChevronRightIcon
        v-if="collapsible"
        class="page-info-section-chevron-icon"
        decorative
      />
      <slot
        v-else-if="$slots.actions"
        name="actions"
      />
    </component>

    <div
      v-if="$slots.default"
      class="page-info-section-content"
      data-testid="page-info-section-content"
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
.page-info-section {
  border: $kui-border-width-10 solid $kui-color-border;
  border-radius: $kui-border-radius-30;

  .page-info-section-header {
    align-items: center;
    display: flex;
    gap: $kui-space-20;
    justify-content: space-between;
    padding: $kui-space-70;

    .page-info-section-default-header {
      display: flex;
      flex-direction: column;
      gap: $kui-space-40;
      max-width: 700px;

      .page-info-section-title {
        color: $kui-color-text;
        font-size: $kui-font-size-40;
        font-weight: $kui-font-weight-bold;
        line-height: $kui-line-height-30;
        margin: $kui-space-0;
      }

      .page-info-section-description {
        color: $kui-color-text-neutral;
        font-size: $kui-font-size-30;
        line-height: $kui-line-height-30;
        margin: $kui-space-0;
      }
    }
  }

  .page-info-section-content {
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

details.page-info-section {
  overflow: auto;

  &[open] {
    .page-info-section-chevron-icon {
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

  .page-info-section-header {
    cursor: pointer;

    .page-info-section-chevron-icon {
      flex-shrink: 0;
      pointer-events: none;
      transition: transform $kui-animation-duration-20 ease;
    }
  }
}
</style>
