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
    color: var(--kui-color-text-neutral-weak, $kui-color-text-neutral-weak);
  }

  .page-header-title-section {
    align-items: center;
    display: flex;
    gap: var(--kui-space-40, $kui-space-40);
    justify-content: space-between;

    .page-header-title-wrapper {
      align-items: baseline;
      display: flex;
      min-width: 0;

      .page-header-title-before {
        margin-right: var(--kui-space-40, $kui-space-40);
      }

      .page-header-title-after {
        align-self: center;
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
    width: 100%;
  }

  :deep(.k-breadcrumbs) {
    margin-bottom: var(--kui-space-0, $kui-space-0);
  }
}
</style>
