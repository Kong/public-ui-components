<template>
  <div class="kong-ui-public-page-layout">
    <div class="page-header-container">
      <div class="header-breadcrumbs-container">
        <KBreadcrumbs
          v-if="breadcrumbs && breadcrumbs.length"
          class="header-breadcrumbs"
          data-testid="kong-ui-public-page-layout-breadcrumbs"
          :items="breadcrumbs"
        >
          <template
            v-for="breadcrumbIconSlot in breadcrumbIconSlots"
            #[breadcrumbIconSlot]
          >
            <slot :name="breadcrumbIconSlot" />
          </template>
        </KBreadcrumbs>
        <h1 class="header-title">
          {{ title }}
        </h1>
      </div>
      <PageLayoutTabs
        v-if="hasTabs"
        :tabs="tabs"
      />
    </div>

    <div class="page-content-wrapper">
      <div
        v-if="pageTitle"
        class="page-title-container"
      >
        <h2 class="page-title">
          {{ pageTitle }}
        </h2>

        <div
          v-if="$slots.actions"
          class="page-title-actions-container"
        >
          <slot name="actions" />
        </div>
      </div>

      <router-view v-if="hasTabs" />
      <slot
        v-else
        name="default"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { KBreadcrumbs } from '@kong/kongponents'
import { computed } from 'vue'
import type { PageLayoutProps, PageLayoutSlots, PageLayoutBreadcrumbIconSlotName } from '../types'
import PageLayoutTabs from './PageLayoutTabs.vue'

const {
  breadcrumbs = [],
  title,
  tabs = [],
  pageTitle = '',
} = defineProps<PageLayoutProps>()

const slots = defineSlots<PageLayoutSlots>()

const breadcrumbIconSlots = computed(() => Object.keys(slots).filter((slotName): slotName is PageLayoutBreadcrumbIconSlotName => slotName.startsWith('icon-')))

const hasTabs = computed((): boolean => !!(tabs && tabs.length))
</script>

<style lang="scss" scoped>
@mixin truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.kong-ui-public-page-layout {
  box-sizing: border-box;
  font-family: var(--kui-font-family-text, $kui-font-family-text);

  .page-header-container {
    display: flex;
    flex-direction: column;
    gap: var(--kui-space-40, $kui-space-40);

    .header-breadcrumbs-container {
      padding: var(--kui-space-60, $kui-space-60) var(--kui-space-60, $kui-space-60) var(--kui-space-0, $kui-space-0) var(--kui-space-60, $kui-space-60);

      .header-breadcrumbs {
        &:deep(.breadcrumbs-item) {
          // Override first breadcrumb padding left
          &:first-child {
            padding-left: var(--kui-space-0, $kui-space-0);
          }
          // Override active (last) breadcrumb color
          &.active .breadcrumbs-text {
            color: var(--kui-color-text-neutral, $kui-color-text-neutral);
          }
        }
      }

      .header-title {
        @include truncate;

        color: var(--kui-color-text, $kui-color-text);
        font-size: var(--kui-font-size-50, $kui-font-size-50);
        font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
        line-height: var(--kui-line-height-60, $kui-line-height-60);
        margin: var(--kui-space-0, $kui-space-0);
      }
    }

    // When there are no tabs, add a border and padding to the bottom of the breadcrumbs container
    &:not(:has(.kong-ui-public-tabs-navbar)) {
      .header-breadcrumbs-container {
        border-bottom: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);
        padding: var(--kui-space-60, $kui-space-60);
      }
    }
  }

  .page-content-wrapper {
    display: flex;
    flex-direction: column;
    gap: var(--kui-space-50, $kui-space-50);
    padding: var(--kui-space-60, $kui-space-60);

    .page-title-container {
      align-items: center;
      display: flex;
      gap: var(--kui-space-50, $kui-space-50);
      justify-content: space-between;

      .page-title {
        @include truncate;

        color: var(--kui-color-text, $kui-color-text);
        font-size: var(--kui-font-size-50, $kui-font-size-50);
        font-weight: var(--kui-font-weight-bold, $kui-font-weight-bold);
        letter-spacing: var(--kui-letter-spacing-minus-30, $kui-letter-spacing-minus-30);
        line-height: var(--kui-line-height-60, $kui-line-height-60);
        margin: var(--kui-space-0, $kui-space-0);
      }

      .page-title-actions-container {
        align-items: center;
        display: flex;
        gap: var(--kui-space-50, $kui-space-50);
      }
    }
  }
}
</style>
