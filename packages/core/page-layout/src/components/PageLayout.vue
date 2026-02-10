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
  </div>
</template>

<script setup lang="ts">
import { KBreadcrumbs } from '@kong/kongponents'
import type { BreadcrumbItem } from '@kong/kongponents'
import { computed, useSlots } from 'vue'
import type { PageLayoutNavbarTabs } from '../types'
import TabsNavbar from './TabsNavbar.vue'

interface PageLayoutProps {
  /** Boolean to determine if the page should use the new Konnect layout */
  konnectLayoutNext?: boolean
  /** Page title */
  title: string
  /** Breadcrumb items */
  breadcrumbs?: BreadcrumbItem[]
  /** Tabs */
  tabs?: PageLayoutNavbarTabs
}

const {
  konnectLayoutNext,
  title,
  breadcrumbs = [],
} = defineProps<PageLayoutProps>()

const slots = useSlots()

const breadcrumbIconSlots = computed((): string[] => (Object.keys(slots).filter((slotName) => slotName.startsWith('icon-'))))
</script>

<style lang="scss" scoped>
.kong-ui-public-page-layout {
  font-family: $kui-font-family-text;
  margin-bottom: $kui-space-40;

  .page-header-container {
    display: flex;
    flex-direction: column;
    gap: $kui-space-40;

    .header-breadcrumbs-container {
      padding: $kui-space-60 $kui-space-60 $kui-space-0 $kui-space-60;

      .header-breadcrumbs {
        // Override active (last) breadcrumb color
        &:deep(.breadcrumbs-item.active .breadcrumbs-text) {
          color: $kui-color-text-neutral;
        }
      }

      .header-title {
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
}
</style>
