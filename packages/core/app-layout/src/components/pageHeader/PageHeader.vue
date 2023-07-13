<template>
  <div class="kong-ui-page-header">
    <div
      v-if="hasBreadcrumbs"
      class="page-breadcrumbs"
      data-testid="page-breadcrumbs"
    >
      <slot name="breadcrumbs">
        <KBreadcrumbs :items="breadcrumbs">
          <template #divider>
            /
          </template>
        </KBreadcrumbs>
      </slot>
    </div>

    <div
      class="page-title-section"
      :data-testid="dataTestId"
    >
      <div class="page-title-wrapper">
        <div
          v-if="$slots['title-icon']"
          class="page-title-icon"
          data-testid="page-title-icon"
        >
          <slot name="title-icon" />
        </div>
        <h1
          class="truncate"
          data-testid="page-title-text"
          :title="title"
        >
          <slot>
            {{ title }}
          </slot>
        </h1>
        <div
          v-if="$slots['title-badge']"
          class="page-title-badge"
          data-testid="page-title-badge"
        >
          <slot name="title-badge" />
        </div>
      </div>

      <div
        v-if="$slots.actions"
        class="page-actions"
        data-testid="page-actions"
      >
        <slot name="actions" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, useSlots, PropType } from 'vue'
import type { BreadcrumbItem } from '@kong/kongponents'

const props = defineProps({
  title: {
    type: String,
    default: '',
  },
  breadcrumbs: {
    type: Array as PropType<BreadcrumbItem[]>,
    default: () => ([]),
  },
})

const slots = useSlots()

const hasBreadcrumbs = computed((): boolean => !!(props.breadcrumbs.length || slots.breadcrumbs))
const dataTestId = computed((): string => props.title ? `page-title-${props.title.toLowerCase().replace(/\s/g, '-')}` : 'page-title')
</script>

<style lang="scss" scoped>
.kong-ui-page-header {

  .page-title-section {
    display: flex;
    justify-content: space-between;

    .page-title-wrapper {
      display: flex;
      align-items: baseline;

      .page-title-icon {
        margin-right: var(--spacing-xs, 4px);
      }

      .page-title-badge {
        align-self: center;
        margin-left: var(--spacing-sm, 8px);
      }

      h1 {
        color: var(--black-500, #0B172D);
        font-size: 24px;
        margin: var(--spacing-md, 16px) 0;
      }
    }
  }

  .truncate {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
