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
      </KBreadcrumbs>
    </div>

    <div class="page-header-title-section">
      <div class="page-header-title-wrapper">
        <div
          v-if="$slots.icon"
          class="page-header-title-icon"
          data-testid="page-header-title-icon"
        >
          <slot name="icon" />
        </div>
        <h1
          class="page-header-title"
          data-testid="page-header-title"
          :title="title"
        >
          {{ title }}
        </h1>
        <div
          v-if="$slots.badge"
          class="page-header-title-badge"
          data-testid="page-header-title-badge"
        >
          <slot name="badge" />
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
import { computed, PropType } from 'vue'
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
</script>

<style lang="scss" scoped>
.kong-ui-app-page-header {
  .page-header-breadcrumb-divider {
    color: $kui-color-text-neutral-weak;
  }

  .page-header-title-section {
    align-items: center;
    display: flex;
    justify-content: space-between;

    .page-header-title-wrapper {
      align-items: baseline;
      display: flex;

      .page-header-title-icon {
        margin-right: $kui-space-40;
      }

      .page-header-title-badge {
        align-self: center;
        margin-left: $kui-space-40;
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
    width: 100%;
  }

  :deep(.k-breadcrumbs) {
    margin-bottom: $kui-space-0;
  }
}
</style>
