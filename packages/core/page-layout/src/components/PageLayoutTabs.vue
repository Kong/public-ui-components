<template>
  <nav
    ref="tabs-navbar-wrapper"
    class="kong-ui-public-tabs-navbar"
    data-testid="kong-ui-public-tabs-navbar"
  >
    <ul
      ref="tabs-navbar-list"
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
        >
          {{ tab.label }}
        </component>
      </li>
      <!-- Overflowing items dropdown -->
      <li v-if="tabs.length > displayedTabsCount">
        <KDropdown :kpop-attributes="{ placement: 'bottom-end' }">
          <button
            class="tab-link more-dropdown-trigger"
            data-testid="tabs-navbar-more-dropdown-button"
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
              :data-testid="overflowingTab.dataTestId ? `${overflowingTab.dataTestId}-tab-dropdown-item` : `${overflowingTab.key}-tab-dropdown-item`"
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
import type { PageLayoutTabsProps } from '../types'
import composables from '../composables'
import { KUI_SPACE_60 } from '@kong/design-tokens'
import { useEventListener } from '@vueuse/core'

const {
  tabs = [],
} = defineProps<PageLayoutTabsProps>()

const { i18n: { t } } = composables.useI18n()

const TABS_NAVBAR_HORIZONTAL_PADDING = KUI_SPACE_60

const tabsNavbarWrapperRef = useTemplateRef('tabs-navbar-wrapper')
const tabsNavbarListRef = useTemplateRef('tabs-navbar-list')

const displayedTabsCount = ref<number>(tabs.length)
const displayedTabsLayoutComputed = ref<boolean>(false)

/**
 * Computes the layout of the tabs navbar and updates the displayed tabs count
 */
const computeLayout = async (): Promise<void> => {
  if (!tabsNavbarWrapperRef.value || !tabsNavbarListRef.value) {
    return
  }

  displayedTabsLayoutComputed.value = false
  displayedTabsCount.value = tabs.length

  // Wait for initial render
  await nextTick()

  const containerWidth = tabsNavbarWrapperRef.value?.getBoundingClientRect().width - (parseInt(TABS_NAVBAR_HORIZONTAL_PADDING) * 2)
  let listWidth = tabsNavbarListRef.value?.getBoundingClientRect().width

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
    listWidth = tabsNavbarListRef.value?.getBoundingClientRect().width || 0
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
.kong-ui-public-tabs-navbar {
  $tabs-navbar-height: 34px;

  align-items: flex-end;
  border-bottom: $kui-border-width-10 solid $kui-color-border;
  box-sizing: border-box;
  display: flex;
  height: $tabs-navbar-height;
  overflow: hidden;
  padding: $kui-space-0 v-bind('TABS_NAVBAR_HORIZONTAL_PADDING');
  position: relative;
  width: 100%;

  // Reset default anchor and button styles
  a, button {
    background-color: $kui-color-background-transparent;
    border: none;
    color: inherit;
    cursor: pointer;
    outline: none;
    padding: $kui-space-0;
    text-decoration: none;
  }

  ul {
    display: flex;
    gap: $kui-space-70;
    list-style: none;
    margin: $kui-space-0;
    /* stylelint-disable-next-line @kong/design-tokens/use-proper-token */
    margin-bottom: calc(-1 * $kui-border-width-10); // Make sure the border of the active (or hovered) tab overlaps the border of the tabs navbar
    max-width: 100%;
    padding: $kui-space-0;

    // Hide the list when the layout is computing
    &.layout-computing {
      height: 0;
      visibility: hidden;
    }

    li {
      display: flex;

      .tab-link {
        align-items: center;
        border-bottom: $kui-border-width-20 solid $kui-color-border-transparent;
        border-radius: $kui-border-radius-20 $kui-border-radius-20 $kui-border-radius-0 $kui-border-radius-0;
        color: $kui-color-text-neutral-strong;
        cursor: pointer;
        display: flex;
        font-size: $kui-font-size-20;
        font-weight: $kui-font-weight-medium;
        gap: $kui-space-30;
        line-height: $kui-line-height-30;
        padding: $kui-space-30 $kui-space-0;
        white-space: nowrap;

        &:hover {
          border-bottom: $kui-border-width-20 solid $kui-color-border-neutral-weak;
          color: $kui-color-text;
        }

        &:focus-visible {
          box-shadow: $kui-shadow-focus;
        }

        &.active {
          border-bottom: $kui-border-width-20 solid $kui-color-border-primary;
          color: $kui-color-text-primary;
        }

        &.more-dropdown-trigger {
          color: $kui-color-text;

          .overflowing-items-count {
            background-color: $kui-color-background-neutral-weaker;
            border-radius: $kui-border-radius-round;
            color: $kui-color-text-neutral-strong;
            font-size: $kui-font-size-20;
            font-weight: $kui-font-weight-semibold;
            line-height: $kui-line-height-30;
            padding: $kui-space-10 $kui-space-30;
          }
        }
      }
    }
  }

  .layout-loader-container {
    align-items: center;
    display: flex;
    gap: $kui-space-70;
    height: $tabs-navbar-height;
    inset: 0;
    left: v-bind('TABS_NAVBAR_HORIZONTAL_PADDING');
    position: absolute;
  }
}
</style>
