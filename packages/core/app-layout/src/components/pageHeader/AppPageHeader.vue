<template>
  <div class="kong-ui-app-page-header">
    <div
      v-if="hasBreadcrumbs"
      class="page-header-breadcrumbs"
      data-testid="page-header-breadcrumbs"
    >
      <KBreadcrumbs
        item-max-width="150"
        :items="breadcrumbs"
      >
        <template
          v-for="slotName in breadcrumbIconSlots"
          #[slotName]
        >
          <slot :name="slotName" />
        </template>
      </KBreadcrumbs>
    </div>

    <div class="page-header-title-section">
      <div class="page-header-title-wrapper">
        <div
          v-if="$slots['title-before']"
          class="page-header-title-before"
          data-testid="page-header-title-before"
        >
          <slot name="title-before" />
        </div>
        <h1
          class="page-header-title"
          data-testid="page-header-title"
          :title="title"
        >
          {{ title }}
        </h1>
        <div
          v-if="$slots['title-after']"
          class="page-header-title-after"
          data-testid="page-header-title-after"
        >
          <slot name="title-after" />
        </div>
      </div>

      <div
        v-if="$slots.actions"
        class="page-header-actions"
        data-testid="page-header-actions"
      >
        <slot name="actions" />
      </div>
    </div>

    <div
      v-if="$slots.below"
      class="page-header-section-below"
      data-testid="page-header-section-below"
    >
      <slot name="below" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import { computed, useSlots } from 'vue'
import type { BreadcrumbItem } from '@kong/kongponents'

const props = defineProps({
  title: {
    type: String,
    default: '', // Provide a fallback string to prevent the component unmounting from throwing an error
  },
  breadcrumbs: {
    type: Array as PropType<BreadcrumbItem[]>,
    default: () => ([]),
  },
})

const slots = useSlots()

const hasBreadcrumbs = computed((): boolean => !!props.breadcrumbs?.length)
const breadcrumbIconSlots = computed((): string[] => {
  // only return used icon slots
  return Object.keys(slots).filter((slotName) => slotName.startsWith('icon-'))
})
</script>

<style lang="scss" scoped>
.kong-ui-app-page-header {
  margin-bottom: var(--kui-space-70, $kui-space-70);

  .page-header-title-section {
    align-items: center;
    display: flex;
    flex-wrap: wrap;
    gap: var(--kui-space-80, $kui-space-80);
    justify-content: space-between;

    .page-header-title-wrapper {
      align-items: baseline;
      display: flex;
      min-width: 0; /** this style is needed for truncation to work correctly with flex */

      .page-header-title-before {
        align-self: center;
        display: inline-flex;
        margin-right: var(--kui-space-40, $kui-space-40);
      }

      .page-header-title-after {
        align-self: center;
        display: inline-flex;
        margin-left: var(--kui-space-60, $kui-space-60);
      }

      .page-header-title {
        color: var(--kui-color-text, $kui-color-text);
        font-size: var(--kui-font-size-70, $kui-font-size-70);
        font-weight: var(--kui-font-weight-bold, $kui-font-weight-bold);
        line-height: var(--kui-line-height-60, $kui-line-height-60);
        margin: var(--kui-space-0, $kui-space-0);
        /** truncation */
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
  }

  .page-header-section-below {
    margin-top: var(--kui-space-40, $kui-space-40);
    width: 100%;
  }

  :deep(.k-breadcrumbs) {
    margin-bottom: var(--kui-space-0, $kui-space-0);
  }

  @media (min-width: $kui-breakpoint-mobile) {
    .page-header-title-section {
      flex-wrap: nowrap;
    }

    .page-header-section-below {
      margin-top: unset;
    }
  }
}
</style>
