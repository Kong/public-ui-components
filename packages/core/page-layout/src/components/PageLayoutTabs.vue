<template>
  <nav
    ref="page-layout-tabs"
    class="page-layout-tabs"
    data-testid="page-layout-tabs"
  >
    <ul
      ref="page-layout-tabs-list"
      :class="{ 'layout-computing': !displayedTabsLayoutComputed }"
    >
      <li
        v-for="tab in tabs.slice(0, displayedTabsCount)"
        :key="`${tab.key}-tab`"
      >
        <component
          :is="typeof tab.to === 'string' ? 'a' : 'router-link'"
          class="tab-link"
          :class="{ 'active': tab.active }"
          :data-testid="tab.dataTestId ? tab.dataTestId : `${tab.key}-tab-link`"
          :href="typeof tab.to === 'string' ? tab.to : undefined"
          :to="typeof tab.to === 'string' ? undefined : tab.to"
          @click="(event: Event) => onTabClick(event, tab)"
        >
          {{ tab.label }}
        </component>
      </li>
      <!-- Overflowing items dropdown -->
      <li v-if="tabs.length > displayedTabsCount">
        <KDropdown
          :kpop-attributes="{
            placement: 'bottom-end',
            popoverElementAttributes: { 'data-testid': 'tabs-overflow-dropdown-popover' } }"
        >
          <button
            class="tab-link overflow-dropdown-trigger"
            data-testid="tabs-overflow-dropdown-button"
          >
            {{ t('tabs_navbar.more') }}

            <span class="overflowing-items-count">
              {{ tabs.length - displayedTabsCount }}
            </span>
          </button>

          <template #items>
            <KDropdownItem
              v-for="overflowingTab in tabs.slice(displayedTabsCount)"
              :key="`${overflowingTab.key}-dropdown-item`"
              :data-testid="overflowingTab.dataTestId ? overflowingTab.dataTestId : `${overflowingTab.key}-tab-link`"
              :item="{ label: overflowingTab.label, value: overflowingTab.key, to: overflowingTab.to }"
              :selected="overflowingTab.active"
            />
          </template>
        </KDropdown>
      </li>
    </ul>
    <!-- Layout loader -->
    <div
      v-if="!displayedTabsLayoutComputed"
      class="layout-loader-container"
    >
      <KSkeletonBox
        v-for="i in 3"
        :key="`layout-loader-${i}`"
        height="1"
        width="5"
      />
    </div>
  </nav>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue'
import { KDropdown, KDropdownItem, KSkeletonBox } from '@kong/kongponents'
import type { PageLayoutTabsProps, PageLayoutTab } from '../types'
import composables from '../composables'
import { KUI_SPACE_60 } from '@kong/design-tokens'
import { useEventListener } from '@vueuse/core'
import { inject } from 'vue'

const {
  tabs = [],
} = defineProps<PageLayoutTabsProps>()

const { i18n: { t } } = composables.useI18n()

const navigateTo = inject<(to: string) => Promise<void>>('app:navigateTo')

const onTabClick = (event: Event, tab: PageLayoutTab) => {
  if (typeof tab.to !== 'string' || !navigateTo || typeof navigateTo !== 'function') {
    return
  }

  event.preventDefault()
  navigateTo(tab.to)
}

const TABS_HORIZONTAL_PADDING = KUI_SPACE_60

const pageLayoutTabsRef = useTemplateRef('page-layout-tabs')
const pageLayoutTabsListRef = useTemplateRef('page-layout-tabs-list')

const displayedTabsCount = ref<number>(tabs.length)
const displayedTabsLayoutComputed = ref<boolean>(false)

/**
 * Computes the layout of the tabs navbar and updates the displayed tabs count
 */
const computeLayout = async (): Promise<void> => {
  if (!pageLayoutTabsRef.value || !pageLayoutTabsListRef.value) {
    return
  }

  displayedTabsLayoutComputed.value = false
  displayedTabsCount.value = tabs.length

  // Wait for initial render
  await nextTick()

  const containerWidth = pageLayoutTabsRef.value?.getBoundingClientRect().width - (parseInt(TABS_HORIZONTAL_PADDING) * 2)
  let listWidth = pageLayoutTabsListRef.value?.getBoundingClientRect().width

  if (!containerWidth || !listWidth) {
    displayedTabsLayoutComputed.value = true
    return
  }

  const TABS_LIST_END_PADDING = 50 // Extra padding to the right of the list to make sure the items don't go up to the edge of the container
  // Keep reducing displayed tabs until they fit or we're down to 1 tab
  while ((listWidth + TABS_LIST_END_PADDING) > containerWidth && displayedTabsCount.value > 1) {
    displayedTabsCount.value--

    // Wait for Vue to re-render with the new count
    await nextTick()

    // Recalculate the list width after re-render
    listWidth = pageLayoutTabsListRef.value?.getBoundingClientRect().width || 0
  }

  displayedTabsLayoutComputed.value = true
}

// Debounced resize handler to avoid excessive recalculations
let resizeTimeout: ReturnType<typeof setTimeout> | null = null
const handleResize = () => {
  if (resizeTimeout) {
    clearTimeout(resizeTimeout)
  }

  resizeTimeout = setTimeout(() => {
    computeLayout()
  }, 150)
}

onMounted(() => {
  computeLayout()
  useEventListener(window, 'resize', handleResize)
})

onBeforeUnmount(() => {
  if (resizeTimeout) {
    clearTimeout(resizeTimeout)
  }
})
</script>

<style lang="scss" scoped>
.page-layout-tabs {
  $tabs-navbar-height: 34px;

  align-items: flex-end;
  border-bottom: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);
  box-sizing: border-box;
  display: flex;
  height: $tabs-navbar-height;
  overflow: hidden;
  padding: var(--kui-space-0, $kui-space-0) v-bind('TABS_HORIZONTAL_PADDING');
  position: relative;
  width: 100%;

  // Reset default anchor and button styles
  a, button {
    background-color: var(--kui-color-background-transparent, $kui-color-background-transparent);
    border: none;
    color: inherit;
    cursor: pointer;
    outline: none;
    padding: var(--kui-space-0, $kui-space-0);
    text-decoration: none;
  }

  ul {
    display: flex;
    gap: var(--kui-space-70, $kui-space-70);
    list-style: none;
    margin: var(--kui-space-0, $kui-space-0);
    /* stylelint-disable-next-line @kong/design-tokens/use-proper-token */
    margin-bottom: calc(-1 * var(--kui-border-width-10, $kui-border-width-10)); // Make sure the border of the active (or hovered) tab overlaps the border of the tabs navbar
    max-width: 100%;
    padding: var(--kui-space-0, $kui-space-0);

    // Hide the list when the layout is computing
    &.layout-computing {
      height: 0;
      visibility: hidden;
    }

    li {
      display: flex;

      .tab-link {
        align-items: center;
        border-bottom: var(--kui-border-width-20, $kui-border-width-20) solid var(--kui-color-border-transparent, $kui-color-border-transparent);
        border-radius: var(--kui-border-radius-20, $kui-border-radius-20) var(--kui-border-radius-20, $kui-border-radius-20) var(--kui-border-radius-0, $kui-border-radius-0) var(--kui-border-radius-0, $kui-border-radius-0);
        color: var(--kui-color-text-neutral-strong, $kui-color-text-neutral-strong);
        cursor: pointer;
        display: flex;
        font-size: var(--kui-font-size-20, $kui-font-size-20);
        font-weight: var(--kui-font-weight-medium, $kui-font-weight-medium);
        gap: var(--kui-space-30, $kui-space-30);
        line-height: var(--kui-line-height-30, $kui-line-height-30);
        padding: var(--kui-space-30, $kui-space-30) var(--kui-space-0, $kui-space-0);
        white-space: nowrap;

        &:hover {
          border-bottom: var(--kui-border-width-20, $kui-border-width-20) solid var(--kui-color-border-neutral-weak, $kui-color-border-neutral-weak);
          color: var(--kui-color-text, $kui-color-text);
        }

        &:focus-visible {
          box-shadow: var(--kui-shadow-focus, $kui-shadow-focus);
        }

        &.active {
          border-bottom: var(--kui-border-width-20, $kui-border-width-20) solid var(--kui-color-border-primary, $kui-color-border-primary);
          color: var(--kui-color-text-primary, $kui-color-text-primary);
        }

        &.overflow-dropdown-trigger {
          color: var(--kui-color-text, $kui-color-text);

          .overflowing-items-count {
            background-color: var(--kui-color-background-neutral-weaker, $kui-color-background-neutral-weaker);
            border-radius: var(--kui-border-radius-round, $kui-border-radius-round);
            color: var(--kui-color-text-neutral-strong, $kui-color-text-neutral-strong);
            font-size: var(--kui-font-size-20, $kui-font-size-20);
            font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
            line-height: var(--kui-line-height-30, $kui-line-height-30);
            padding: var(--kui-space-10, $kui-space-10) var(--kui-space-30, $kui-space-30);
          }
        }
      }
    }
  }

  .layout-loader-container {
    align-items: center;
    display: flex;
    gap: var(--kui-space-70, $kui-space-70);
    height: $tabs-navbar-height;
    inset: 0;
    left: v-bind('TABS_HORIZONTAL_PADDING');
    position: absolute;
  }
}
</style>
