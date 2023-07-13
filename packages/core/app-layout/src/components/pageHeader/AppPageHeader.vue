<template>
  <div class="kong-ui-app-page-header">
    <div
      v-if="hasBreadcrumbs"
      class="page-header-breadcrumbs"
      data-testid="page-header-breadcrumbs"
    >
      <KBreadcrumbs :items="breadcrumbs">
        <template #divider>
          /
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
    default: '',
    required: true,
  },
  breadcrumbs: {
    type: Array as PropType<BreadcrumbItem[]>,
    default: () => ([]),
  },
})

const hasBreadcrumbs = computed((): boolean => !!props.breadcrumbs.length)
</script>

<style lang="scss" scoped>
.kong-ui-app-page-header {
  .page-header-title-section {
    display: flex;
    justify-content: space-between;

    .page-header-title-wrapper {
      align-items: baseline;
      display: flex;

      .page-header-title-icon {
        margin-right: $kui-space-20;
      }

      .page-header-title-badge {
        align-self: center;
        margin-left: $kui-space-40;
      }

      .page-header-title {
        color: #0B172D;  /** black-500 */
        font-size: $kui-font-size-70;
        margin: $kui-space-60 $kui-space-0;
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
}
</style>
