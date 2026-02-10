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
        v-for="tabKey in Object.keys(tabs).slice(0, displayedTabsCount)"
        :key="`${tabKey}-tab`"
      >
        <component
          :is="typeof tabs[tabKey].to === 'string' ? 'a' : 'router-link'"
          class="tab-link"
          :class="{ 'active': tabs[tabKey].active }"
          :data-testid="tabs[tabKey].testId ? tabs[tabKey].testId : `${getKeyTestIdString(tabKey)}-tab-link`"
          :href="typeof tabs[tabKey].to === 'string' ? tabs[tabKey].to : undefined"
          :to="typeof tabs[tabKey].to === 'string' ? undefined : tabs[tabKey].to"
        >
          {{ tabs[tabKey].name }}
        </component>
      </li>
      <!-- Overflowing items dropdown -->
      <li v-if="Object.keys(tabs).length > displayedTabsCount">
        <KDropdown :kpop-attributes="{ placement: 'bottom-end' }">
          <button
            appearance="none"
            class="tab-link more-dropdown-trigger"
            data-testid="tabs-navbar-more-dropdown-button"
          >
            {{ t('tabs_navbar.more') }}

            <span class="overflowing-items-count">
              {{ Object.keys(tabs).length - displayedTabsCount }}
            </span>
          </button>

          <template #items>
            <KDropdownItem
              v-for="overflowingTabKey in Object.keys(tabs).slice(displayedTabsCount)"
              :key="`${overflowingTabKey}-dropdown-item`"
              :data-testid="tabs[overflowingTabKey].testId ? `${tabs[overflowingTabKey].testId}-tab-dropdown-item` : `${getKeyTestIdString(overflowingTabKey)}-tab-dropdown-item`"
              :item="{ label: tabs[overflowingTabKey].name, value: overflowingTabKey, to: tabs[overflowingTabKey].to }"
              :selected="tabs[overflowingTabKey].active"
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
import { KDropdown, KDropdownItem, KSkeletonBox } from '@kong/kongponents'
import type { PageLayoutTabsNavbarProps } from '../types'
import composables from '../composables'
import { useElementSize } from '@vueuse/core'
import { ref, useTemplateRef, watch } from 'vue'
import getKeyTestIdString from '../helpers/getKeyTestIdString'

const { i18n: { t } } = composables.useI18n()

const {
  tabs = {},
} = defineProps<PageLayoutTabsNavbarProps>()

const tabsNavbarWrapperRef = useTemplateRef('tabs-navbar-wrapper')
const tabsNavbarListRef = useTemplateRef('tabs-navbar-list')

const { width: tabsNavbarWrapperWidth } = useElementSize(tabsNavbarWrapperRef)
const { width: tabsNavbarListWidth } = useElementSize(tabsNavbarListRef)

const displayedTabsCount = ref<number>(Object.keys(tabs).length)
const displayedTabsLayoutComputed = ref<boolean>(false)

/**
 * If the list is wider than the wrapper, decrement the displayed tabs count (minimum of 1).
 * While the layout is computing, the list is hidden and the loader is displayed (on screens >= tablet we skip the loader as most likely all tabs will fit).
 */
watch([tabsNavbarWrapperWidth, tabsNavbarListWidth], ([wrapperWidth, listWidth]) => {
  if (wrapperWidth && listWidth) {
    if (listWidth >= wrapperWidth && displayedTabsCount.value > 1) {
      displayedTabsCount.value --
    } else {
      displayedTabsLayoutComputed.value = true
    }
  }
})
</script>

<style lang="scss" scoped>
.kong-ui-public-tabs-navbar {
  $tabs-navbar-height: 38px;
  $tabs-navbar-horizontal-padding: $kui-space-60;

  align-items: flex-end;
  border-bottom: $kui-border-width-10 solid $kui-color-border;
  display: flex;
  height: $tabs-navbar-height;
  padding: $kui-space-0 $tabs-navbar-horizontal-padding;
  position: relative;

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
    padding: $kui-space-0;
    width: fit-content;

    // Hide the list when the layout is computing (on screens < tablet)
    &.layout-computing {
      height: 0;
      visibility: hidden;

      @media (min-width: $kui-breakpoint-tablet) {
        height: auto;
        visibility: visible;
      }
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
    left: $tabs-navbar-horizontal-padding;
    position: absolute;

    // Skip the loader on screens >= tablet (most likely all tabs will fit)
    @media (min-width: $kui-breakpoint-tablet) {
      display: none;
    }
  }
}
</style>
