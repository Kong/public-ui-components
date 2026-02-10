<template>
  <div class="kong-ui-public-page-layout">
    <div
      v-if="konnectLayoutNext"
      class="page-header-container"
    >
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
      <TabsNavbar
        v-if="tabs && Object.keys(tabs).length"
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

      <slot name="default" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { KBreadcrumbs } from '@kong/kongponents'
import { computed } from 'vue'
import type { PageLayoutProps, PageLayoutSlots, PageLayoutBreadcrumbIconSlotName } from '../types'
import TabsNavbar from './TabsNavbar.vue'

const {
  konnectLayoutNext,
  title,
  breadcrumbs = [],
  pageTitle = '',
} = defineProps<PageLayoutProps>()

const slots = defineSlots<PageLayoutSlots>()

const breadcrumbIconSlots = computed(() => Object.keys(slots).filter((slotName): slotName is PageLayoutBreadcrumbIconSlotName => slotName.startsWith('icon-')))
</script>

<style lang="scss" scoped>
@mixin truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.kong-ui-public-page-layout {
  font-family: $kui-font-family-text;

  .page-header-container {
    display: flex;
    flex-direction: column;
    gap: $kui-space-40;

    .header-breadcrumbs-container {
      padding: $kui-space-60 $kui-space-60 $kui-space-0 $kui-space-60;

      .header-breadcrumbs {
        &:deep(.breadcrumbs-item) {
          // Override first breadcrumb padding left
          &:first-child {
            padding-left: $kui-space-0;
          }
          // Override active (last) breadcrumb color
          &.active .breadcrumbs-text {
            color: $kui-color-text-neutral;
          }
        }
      }

      .header-title {
        @include truncate;

        color: $kui-color-text;
        font-size: $kui-font-size-50;
        font-weight: $kui-font-weight-semibold;
        line-height: $kui-line-height-60;
        margin: $kui-space-0;
      }
    }

    // When there are no tabs, add a border and padding to the bottom of the breadcrumbs container
    &:not(:has(.kong-ui-public-tabs-navbar)) {
      .header-breadcrumbs-container {
        border-bottom: $kui-border-width-10 solid $kui-color-border;
        padding: $kui-space-60;
      }
    }
  }

  .page-content-wrapper {
    display: flex;
    flex-direction: column;
    gap: $kui-space-50;
    padding: $kui-space-60;

    .page-title-container {
      align-items: center;
      display: flex;
      gap: $kui-space-50;
      justify-content: space-between;

      .page-title {
        @include truncate;

        color: $kui-color-text;
        font-size: $kui-font-size-50;
        font-weight: $kui-font-weight-bold;
        letter-spacing: $kui-letter-spacing-minus-30;
        line-height: $kui-line-height-60;
        margin: $kui-space-0;
      }

      .page-title-actions-container {
        align-items: center;
        display: flex;
        gap: $kui-space-50;
      }
    }
  }
}
</style>
