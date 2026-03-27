<template>
  <div
    class="kong-ui-public-page-layout"
    data-testid="kong-ui-public-page-layout"
  >
    <div
      v-if="!hasNestedPageLayout"
      class="page-layout-header"
      data-testid="page-layout-header"
    >
      <div class="page-header-container">
        <div class="page-header-start">
          <KBreadcrumbs
            v-if="breadcrumbs && breadcrumbs.length"
            class="header-breadcrumbs"
            data-testid="page-layout-breadcrumbs"
            :items="breadcrumbs"
          />
          <div class="title-container">
            <component
              :is="isBackToString ? 'a' : 'router-link'"
              v-if="backTo"
              class="navigate-back"
              data-testid="page-layout-navigate-back"
              :href="isBackToString ? backTo : undefined"
              tabindex="0"
              :to="isBackToString ? undefined : backTo"
              @click.prevent="navigateBack()"
              @keydown.enter.prevent="navigateBack()"
              @keydown.space.prevent="navigateBack()"
            >
              <ArrowTopLeftIcon :size="KUI_ICON_SIZE_30" />
            </component>
            <h1
              v-if="title"
              class="page-layout-title"
              data-testid="page-layout-title"
            >
              {{ title }}
            </h1>
          </div>
        </div>

        <div
          v-if="!!$slots.actions"
          class="page-header-actions-container"
        >
          <slot name="actions" />
        </div>
      </div>
      <PageLayoutTabs
        v-if="hasTabs"
        :tabs="tabs"
      />
    </div>

    <div
      class="page-layout-content"
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
import { computed, ref, provide, inject, onUnmounted } from 'vue'
import type { PageLayoutProps, PageLayoutSlots } from '../types'
import PageLayoutTabs from './PageLayoutTabs.vue'
import { nestedPageLayoutInjectionKey } from '../symbols'
import { ArrowTopLeftIcon } from '@kong/icons'
import { KUI_ICON_SIZE_30 } from '@kong/design-tokens'
import { useRouter } from 'vue-router'

const {
  breadcrumbs = [],
  title,
  backTo,
  tabs = [],
} = defineProps<PageLayoutProps>()

defineSlots<PageLayoutSlots>()

const navigateTo = inject<((to: string) => Promise<void>) | null>('app:navigateTo', null)

const router = useRouter()

const hasTabs = computed((): boolean => !!(tabs && tabs.length))

const isBackToString = computed((): boolean => typeof backTo === 'string')

/** Handle navigation back via the backTo prop */
const navigateBack = async () => {
  // If not a string (a RouteLocationRaw)
  if (!isBackToString.value) {
    router.push(backTo!)
    return
  }

  // If navigateTo is undefined
  if (typeof navigateTo !== 'function') {
    window.location.href = backTo as string
    return
  }

  await navigateTo(backTo as string)
}

/**
 * PageLayout supports nesting: when a child PageLayout is rendered inside a parent,
 * the parent hides its own header/tabs and acts as a transparent wrapper so only
 * the child's header is shown. This is achieved via provide/inject:
 *
 * 1. Every PageLayout provides a registration callback under this key.
 * 2. On mount, each PageLayout tries to inject the callback from its nearest ancestor.
 *    If found, it calls it — telling the parent "I exist, hide your header."
 * 3. The registration callback returns an unregister function. On unmount, the child
 *    calls it so the parent restores its own header (e.g. when navigating back via
 *    router-view and the child PageLayout is destroyed). A ref-counted approach
 *    (nestedCount) is used so the parent only restores its header when all nested
 *    children have unmounted, not just the first one.
 */
const nestedCount = ref(0)
const hasNestedPageLayout = computed(() => nestedCount.value > 0)
provide(nestedPageLayoutInjectionKey, (): (() => void) => {
  nestedCount.value++

  // Unregister function returned on callback to be called on unmount
  return () => {
    nestedCount.value--
  }
})

// If this instance is itself nested inside another PageLayout, notify the parent.
const registerNestedPageLayout = inject<(() => (() => void)) | null>(nestedPageLayoutInjectionKey, null)
const unregisterNestedPageLayout = ref<(() => void) | null>(null)
if (typeof registerNestedPageLayout === 'function') {
  unregisterNestedPageLayout.value = registerNestedPageLayout()
}

onUnmounted(() => {
  unregisterNestedPageLayout.value?.()
})
</script>

<style lang="scss" scoped>
.kong-ui-public-page-layout {
  box-sizing: border-box;
  font-family: var(--kui-font-family-text, $kui-font-family-text);

  .page-layout-header {
    display: flex;
    flex-direction: column;
    gap: var(--kui-space-40, $kui-space-40);

    .page-header-container {
      align-items: flex-end;
      display: flex;
      gap: var(--kui-space-30, $kui-space-30);
      justify-content: space-between;
      padding: var(--kui-space-60, $kui-space-60) var(--kui-space-60, $kui-space-60) var(--kui-space-0, $kui-space-0) var(--kui-space-60, $kui-space-60);

      .page-header-start {
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

        .title-container {
          align-items: center;
          display: flex;
          gap: var(--kui-space-20, $kui-space-20);

          .navigate-back {
            background-color: var(--kui-color-background-transparent, $kui-color-background-transparent);
            border: none;
            border-radius: var(--kui-border-radius-20, $kui-border-radius-20);
            color: var(--kui-color-text-neutral, $kui-color-text-neutral);
            cursor: pointer;
            outline: none;
            padding: var(--kui-space-20, $kui-space-20);
            transition: background-color 0.2s ease-in, color 0.2s ease-in;

            &:hover {
              color: var(--kui-color-text, $kui-color-text);
            }

            &:focus-visible {
              box-shadow: var(--kui-shadow-focus, $kui-shadow-focus);
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
      }

      .page-header-actions-container {
        align-items: flex-end;
        display: flex;
        gap: var(--kui-space-30, $kui-space-30);
        justify-content: flex-end;
      }
    }

    // When there are no tabs, add a border and padding to the bottom of the breadcrumbs container
    &:not(:has(.page-layout-tabs)) {
      .page-header-container {
        border-bottom: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);
        padding: var(--kui-space-60, $kui-space-60);
      }
    }
  }

  .page-layout-content {
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
