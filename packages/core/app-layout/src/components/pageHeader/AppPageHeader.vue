<template>
  <div
    class="kong-ui-app-page-header"
    :class="{ 'konnect-navigation-next': konnectNavigationNext }"
  >
    <div
      v-if="hasBreadcrumbs && !konnectNavigationNext"
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
          v-if="$slots['title-before'] && !konnectNavigationNext"
          class="page-header-title-before"
          data-testid="page-header-title-before"
        >
          <slot name="title-before" />
        </div>
        <component
          :is="konnectNavigationNext ? 'h2' : 'h1'"
          class="page-header-title"
          data-testid="page-header-title"
          :title="title"
        >
          {{ title }}
        </component>
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
  /** Temporary prop for Konnect navigation next. This will be removed when the Konnect navigation next is fully implemented. */
  konnectNavigationNext: {
    type: Boolean,
    default: false,
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

  &.konnect-navigation-next {
    display: flex;
    flex-direction: column;
    min-height: 32px;

    .page-header-title-section {
      .page-header-title {
        font-size: var(--kui-font-size-40, $kui-font-size-40);
        font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
        line-height: var(--kui-line-height-30, $kui-line-height-30);
      }
    }

    .page-header-section-below {
      color: var(--kui-color-text-neutral, $kui-color-text-neutral);
      font-size: var(--kui-font-size-30, $kui-font-size-30);
      font-weight: var(--kui-font-weight-regular, $kui-font-weight-regular);
      line-height: var(--kui-line-height-30, $kui-line-height-30);
    }
  }
}
</style>
