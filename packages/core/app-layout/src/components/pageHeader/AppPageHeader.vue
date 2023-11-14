<template>
  <div class="kong-ui-app-page-header">
    <div
      v-if="hasBreadcrumbs"
      class="page-header-breadcrumbs"
      data-testid="page-header-breadcrumbs"
    >
      <KBreadcrumbs :items="breadcrumbs">
        <template #divider>
          <span class="page-header-breadcrumb-divider">/</span>
        </template>
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
        <div id="action-button" />
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
import { computed } from 'vue'
import type { BreadcrumbItem } from '@kong/kongponents'

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  breadcrumbs: {
    type: Array as PropType<BreadcrumbItem[]>,
    default: () => ([]),
  },
})

const hasBreadcrumbs = computed((): boolean => !!props.breadcrumbs?.length)
const getBreadcrumbKey = (item: BreadcrumbItem, idx: number): string => { return item.key || `breadcrumb-${idx}` }
const breadcrumbIconSlots = computed((): string[] => {
  return props.breadcrumbs.map((item, idx) => `icon-${getBreadcrumbKey(item, idx)}`) || []
})
</script>

<style lang="scss" scoped>
.kong-ui-app-page-header {
  margin-bottom: $kui-space-70;

  .page-header-breadcrumb-divider {
    color: $kui-color-text-neutral-weak;
  }

  .page-header-title-section {
    align-items: center;
    display: flex;
    flex-wrap: wrap;
    gap: $kui-space-80;
    justify-content: space-between;
    min-height: 44.5px; /** TODO: remove after new button style supported */

    .page-header-title-wrapper {
      align-items: baseline;
      display: flex;
      min-width: 0; /** this style is needed for truncation to work correctly with flex */

      .page-header-title-before {
        align-self: center;
        display: inline-flex;
        margin-right: $kui-space-40;
      }

      .page-header-title-after {
        align-self: center;
        display: inline-flex;
        margin-left: $kui-space-60;
      }

      .page-header-title {
        color: $kui-color-text;
        font-size: $kui-font-size-70;
        font-weight: $kui-font-weight-bold;
        line-height: $kui-line-height-60;
        margin: $kui-space-0;
        /** truncation */
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
  }

  .page-header-section-below {
    margin-top: $kui-space-40;
    width: 100%;
  }

  :deep(.k-breadcrumbs) {
    margin-bottom: $kui-space-0;
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
