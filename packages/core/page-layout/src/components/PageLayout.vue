<template>
  <div class="kong-ui-public-page-layout">
    <div
      v-if="!hasNestedPageLayout"
      class="page-header-container"
    >
      <div class="header-breadcrumbs-container">
        <KBreadcrumbs
          v-if="breadcrumbs && breadcrumbs.length"
          class="header-breadcrumbs"
          data-testid="page-layout-breadcrumbs"
          :items="breadcrumbs"
        />
        <h1
          v-if="title"
          class="page-layout-title"
          data-testid="page-layout-title"
        >
          {{ title }}
        </h1>
      </div>
      <PageLayoutTabs
        v-if="hasTabs"
        :tabs="tabs"
      />
    </div>

    <div
      class="page-content-wrapper"
      :class="{ 'has-nested-page-layout': hasNestedPageLayout }"
    >
      <router-view v-if="hasTabs" />
      <slot
        v-else
        name="default"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, provide, inject } from 'vue'
import type { PageLayoutProps, PageLayoutSlots } from '../types'
import PageLayoutTabs from './PageLayoutTabs.vue'
import { nestedPageLayoutInjectionKey } from '../symbols'

const {
  breadcrumbs = [],
  title,
  tabs = [],
} = defineProps<PageLayoutProps>()

defineSlots<PageLayoutSlots>()

const hasTabs = computed((): boolean => !!(tabs && tabs.length))

/**
 * PageLayout supports nesting: when a child PageLayout is rendered inside a parent,
 * the parent hides its own header/tabs and acts as a transparent wrapper so only
 * the child's header is shown. This is achieved via provide/inject:
 *
 * 1. Every PageLayout provides a registration callback under this key.
 * 2. On mount, each PageLayout tries to inject the callback from its nearest ancestor.
 *    If found, it calls it — telling the parent "I exist, hide your header."
 */
const hasNestedPageLayout = ref<boolean>(false)
provide(nestedPageLayoutInjectionKey, (): void => {
  // Set the local ref to true when the callback is called
  hasNestedPageLayout.value = true
})

// If this instance is itself nested inside another PageLayout, notify the parent.
const setHasNestedPageLayout = inject<() => void>(nestedPageLayoutInjectionKey)
if (setHasNestedPageLayout && typeof setHasNestedPageLayout === 'function') {
  setHasNestedPageLayout()
}
</script>

<style lang="scss" scoped>
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
        &:deep(.breadcrumbs-item-container) {
          // Override first breadcrumb padding left
          &:first-child {
            .breadcrumbs-item {
              padding-left: var(--kui-space-0, $kui-space-0);
            }
          }

          // Override active (last) breadcrumb color
          .breadcrumbs-item.active .breadcrumbs-text {
            color: var(--kui-color-text-neutral, $kui-color-text-neutral);
          }
        }
      }

      .page-layout-title {
        color: var(--kui-color-text, $kui-color-text);
        font-size: var(--kui-font-size-50, $kui-font-size-50);
        font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
        line-height: var(--kui-line-height-40, $kui-line-height-40);
        margin: var(--kui-space-0, $kui-space-0);
      }
    }

    // When there are no tabs, add a border and padding to the bottom of the breadcrumbs container
    &:not(:has(.page-layout-tabs)) {
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

    &.has-nested-page-layout {
      padding: var(--kui-space-0, $kui-space-0);
    }
  }
}
</style>
