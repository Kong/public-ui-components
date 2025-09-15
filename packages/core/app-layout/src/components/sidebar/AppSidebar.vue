<template>
  <div
    v-if="(mobileSidebarOpen && mobileOverlay && mobileEnabled)"
    class="kong-ui-app-sidebar-overlay"
    @click="closeSidebarFromOverlay"
  />
  <FocusTrap
    ref="focusTrap"
    :active="false"
    allow-outside-click
    fallback-focus=".kong-ui-app-sidebar"
  >
    <aside
      class="kong-ui-app-sidebar"
      :class="{
        'sidebar-open': mobileSidebarOpen,
        'no-sidebar-header': !hasHeader,
        'mobile-header-hidden': mobileEnabled && (!hasHeader || !mobileHeaderVisible),
        'mobile-disabled': !mobileEnabled,
        'disable-transitions': transitionsDisabled,
      }"
      tabindex="-1"
    >
      <div
        v-if="hasHeader"
        class="sidebar-header"
      >
        <slot name="header" />
      </div>

      <div class="sidebar-content-container">
        <div
          v-if="hasTopContent"
          class="sidebar-top"
        >
          <slot name="top" />
        </div>
        <nav aria-label="Main menu">
          <template v-if="topNavGroups.size > 0">
            <template
              v-for="[groupName, groupItems] in topNavGroups"
              :key="groupName"
            >
              <KCollapse
                class="level-primary-group-collapse"
                :class="{
                  'not-collapsible': !isGroupCollapsible(groupName),
                  'ungrouped': groupName === UNGROUPED_NAME,
                }"
                :data-testid="groupName === UNGROUPED_NAME ? 'level-primary-group-collapse-ungrouped' : `level-primary-group-collapse-${groupName}`"
                :model-value="isGroupCollapsible(groupName) ? isGroupCollapsed(groupName) || false : false"
              >
                <template #trigger="{ isCollapsed, toggle }">
                  <component
                    :is="isGroupCollapsible(groupName) ? KButton : 'div'"
                    :appearance="isGroupCollapsible(groupName) ? 'none' : undefined"
                    class="level-primary-group-collapse-trigger"
                    @click="isGroupCollapsible(groupName) ? handleCollapseToggle(groupName, isCollapsed, toggle) : undefined"
                  >
                    <div
                      v-if="groupName !== UNGROUPED_NAME"
                      :id="`level-primary-group-${getPrimaryGroupId(groupName)}`"
                      class="level-primary-group-name"
                      data-testid="level-primary-group-name"
                      role="presentation"
                    >
                      {{ getGroupConfig(groupName)?.label || groupName }}
                    </div>

                    <component
                      :is="isCollapsed ? ChevronRightIcon : ChevronDownIcon"
                      v-if="isGroupCollapsible(groupName)"
                      class="level-primary-group-collapse-icon"
                      :color="KUI_NAVIGATION_COLOR_TEXT"
                      data-testid="level-primary-group-collapse-icon"
                      :size="KUI_ICON_SIZE_30"
                    />
                  </component>
                </template>

                <ul
                  :aria-labelledby="groupName !== UNGROUPED_NAME ? `level-primary-group-${getPrimaryGroupId(groupName)}` : undefined"
                  class="level-primary top-items"
                >
                  <SidebarItem
                    v-for="item in groupItems"
                    :key="item.name"
                    :item="item"
                    @click="itemClick"
                  >
                    <template #[`sidebar-icon-${item.key}`]>
                      <slot :name="`sidebar-icon-${(item as SidebarPrimaryItem).key}`" />
                    </template>
                  </SidebarItem>
                </ul>
              </KCollapse>
            </template>
          </template>

          <div
            v-if="topNavGroups.size > 0 && bottomNavItems.length"
            class="sidebar-level-divider"
            role="separator"
          />

          <ul
            v-if="bottomNavItems.length"
            class="level-primary bottom-items"
          >
            <SidebarItem
              v-for="item in bottomNavItems"
              :key="item.name"
              :item="item"
              @click="itemClick"
            >
              <template #[`sidebar-icon-${item.key}`]>
                <slot :name="`sidebar-icon-${(item as SidebarPrimaryItem).key}`" />
              </template>
            </SidebarItem>
          </ul>
        </nav>
      </div>

      <div class="sidebar-footer">
        <slot name="footer" />
      </div>
    </aside>
  </FocusTrap>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import { ref, computed, watch, useSlots, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useMediaQuery } from '@vueuse/core'
import { ChevronDownIcon, ChevronRightIcon } from '@kong/icons'
import { KUI_NAVIGATION_COLOR_TEXT, KUI_ICON_SIZE_30, KUI_BREAKPOINT_MOBILE } from '@kong/design-tokens'
import type { SidebarPrimaryItem, GroupConfig, GroupConfigMap } from '../../types'
import SidebarItem from '../sidebar/SidebarItem.vue'
import { FocusTrap } from 'focus-trap-vue'
import { useDebounce } from '../../composables'
import clonedeep from 'lodash.clonedeep'
// explicit import for `component` `is` usage
import { KButton } from '@kong/kongponents'

const emit = defineEmits(['click', 'toggle', 'toggle-collapse'])

/** Prevent adding the `group` property to bottom sidebar items. */
type BottomPrimaryItem = Omit<SidebarPrimaryItem, 'group'>

const props = defineProps({
  topItems: {
    type: Array as PropType<SidebarPrimaryItem[]>,
    default: () => ([]),
  },
  bottomItems: {
    type: Array as PropType<BottomPrimaryItem[]>,
    default: () => ([]),
  },
  groupConfig: {
    type: Object as PropType<GroupConfigMap>,
    default: () => ({}),
  },
  headerHeight: {
    type: Number,
    default: 60,
  },
  topOffset: {
    type: Number,
    default: 0,
  },
  zIndex: {
    type: Number,
    default: 3,
  },
  // Props that only impact mobile
  open: {
    type: Boolean,
    default: false,
  },
  mobileEnabled: {
    type: Boolean,
    default: false,
  },
  mobileTopOffset: {
    type: Number,
    default: 0,
  },
  mobileHeaderVisible: {
    type: Boolean,
    default: false,
  },
  mobileCloseDelay: {
    type: Number,
    default: 350,
  },
  mobileOverlay: {
    type: Boolean,
    default: true,
  },
  mobileOverlayZIndex: {
    type: Number,
    default: null,
  },
  mobileOverlayCloseOnClick: {
    type: Boolean,
    default: true,
  },
})

const slots = useSlots()
const hasHeader = computed(() => !!slots.header)
const hasTopContent = computed(() => !!slots.top)

const sidebarContainerStyles = computed(() => ({
  mobileTop: props.mobileTopOffset && props.mobileEnabled ? `${props.mobileTopOffset}px` : props.topOffset ? `${props.topOffset}px` : '0',
  top: props.topOffset ? `${props.topOffset}px` : '0',
  mobileHeight: props.mobileTopOffset && props.mobileEnabled ? `calc(100% - ${props.mobileTopOffset}px)` : '100%',
  height: props.topOffset ? `calc(100% - ${props.topOffset}px)` : '100%',
}))

const headerContainerStyles = computed(() => ({
  display: !props.mobileHeaderVisible && props.mobileEnabled ? 'none' : 'flex',
  minHeight: `${props.headerHeight}px`,
}))

const sidebarNavStyles = computed(() => ({
  marginTop: hasHeader.value ? `${props.headerHeight}px` : '0',
}))

const sidebarOverlayStyles = computed(() => ({
  top: props.mobileTopOffset && props.mobileEnabled ? `${props.mobileTopOffset}px` : '0',
  zIndex: props.mobileOverlayZIndex !== null ? props.mobileOverlayZIndex : (props.zIndex > 1 ? props.zIndex - 1 : 1),
}))

const prepareNavItems = (items: SidebarPrimaryItem[]): SidebarPrimaryItem[] => {
  // Create a deep copy of `items` to manipulate
  const clonedItems = clonedeep(items)

  return clonedItems.map((item: SidebarPrimaryItem) => {
    if (item) {
      // If `item.key` is not provided, generate a key from the `item.name`
      if (!item.key || !item.key?.trim()) {
        item.key = String(item.name || '').trim().toLowerCase().replace(/[^[a-z]/gi, '-')
      }

      // If `item.testId` is not provided, generate a testId from the `item.name`
      if (!item.testId || !item.testId?.trim()) {
        item.testId = String(item.name || '').trim().toLowerCase().replace(/[^[a-z]/gi, '-')
      }

      // Loop through all secondary nav items and add the `parentKey` property set to the item.key value
      for (const childItem of item.items || []) {
        childItem.parentKey = item.key

        // If `childItem.testId` is not provided, generate a testId from the `item.name`
        if (!childItem.testId || !childItem.testId?.trim()) {
          childItem.testId = String(childItem.name || '').trim().toLowerCase().replace(/[^[a-z]/gi, '-')
        }
      }
    }

    return item
  })
}

const topNavItems = computed(() => props.topItems.length ? prepareNavItems(props.topItems) : [])
const bottomNavItems = computed(() => props.bottomItems.length ? prepareNavItems(props.bottomItems) : [])

const UNGROUPED_NAME = '_ungrouped'
const getPrimaryGroupId = (group: string = '') => group.trim().replace(' ', '').replace(/[^a-z0-9]+/gi, '-').toLowerCase()
const topNavGroups = computed((): Map<string, SidebarPrimaryItem[]> => {
  // Create a Map to store grouped items, ensuring insertion order is preserved.
  const groups = new Map<string, SidebarPrimaryItem[]>()

  // Initialize the "_ungrouped" group first to ensure it appears first when iterating through the groups.
  // (Meaning ungrouped L1 navigation items will appear first in the sidebar).
  groups.set(UNGROUPED_NAME, [])

  // Loop through all top nav items and organize them by group
  for (const item of topNavItems.value) {
    const groupName = item.group || UNGROUPED_NAME

    // Initialize the group array if it doesn't exist
    if (!groups.has(groupName)) {
      groups.set(groupName, [])
    }

    // Add the item to its group
    groups.get(groupName)?.push(item)
  }

  return groups
})

const getGroupConfig = (groupName: string = ''): GroupConfig | null => {
  if (groupName === UNGROUPED_NAME || !groupName.trim()) {
    return null
  }

  const defaultItem: GroupConfig = {
    label: groupName,
    collapsible: false,
    collapsed: false,
  }

  // Remove spaces and lowercase the first character
  let groupNameKey = groupName.trim().replace(' ', '')
  groupNameKey = groupNameKey.charAt(0).toLowerCase() + groupNameKey.slice(1)

  const configExists = groupName && props.groupConfig && (props.groupConfig[groupName] || props.groupConfig[groupNameKey])
  return configExists ? props.groupConfig[groupName] || props.groupConfig[groupNameKey] : defaultItem
}

const isGroupCollapsible = (groupName: string): boolean => {
  return !!getGroupConfig(groupName)?.collapsible
}

const isGroupCollapsed = (groupName: string): boolean => {
  return !!getGroupConfig(groupName)?.collapsed
}

const handleCollapseToggle = (groupName: string, isCollapsed: boolean, toggle: () => void): void => {
  const groupConfig = getGroupConfig(groupName)
  if (groupConfig) {
    groupConfig.collapsed = !isCollapsed
  }

  toggle()

  emit('toggle-collapse', groupName, groupConfig)
}

// Do not manually set the value of `mobileSidebarOpen`; always call `toggleSidebar(true/false)`
const mobileSidebarOpen = ref<boolean>(props.open)
const toggleSidebar = (isOpen: boolean) => {
  if (mobileSidebarOpen.value !== isOpen) {
    mobileSidebarOpen.value = isOpen
    emit('toggle', isOpen)
  }

  // Add or remove a class from the `body` tag when the sidebar is opened/closed
  // This allows for the consuming app to add CSS to prevent overflow-y while the sidebar is open

  if (isOpen) {
    document?.body?.classList.add('kong-ui-app-sidebar-open')
  } else {
    document?.body?.classList.remove('kong-ui-app-sidebar-open')
  }

  // Always reset to false
  sidebarTogglePending.value = false
}

const closeSidebarFromOverlay = (): void => {
  if (props.mobileOverlayCloseOnClick) {
    toggleSidebar(false)
  }
}

// Store a boolean to indicate if a sidebar toggle has already been requested
const sidebarTogglePending = ref<boolean>(false)

const itemClick = (item: SidebarPrimaryItem): void => {
  // Set the pending toggle value to true so that the `route.path` watcher does not auto-close
  sidebarTogglePending.value = true

  emit('click', item)

  // Automatically close the sidebar when an item is clicked
  // Since we navigate on every item click, it should be fine to auto-close the mobile sidebar
  setTimeout(() => {
    toggleSidebar(false)
  }, props.mobileCloseDelay)
}

// Toggle the sidebar when `props.open` is updated
watch(() => props.open, (isOpen: boolean) => {
  toggleSidebar(isOpen)
})

// Automatically close the sidebar if the window is resized
const { debounce } = useDebounce()
const debouncedResizeHandler = debounce(() => {
  // Only trigger toggle if the sidebar is open, and if the windowWidth changes
  if (mobileSidebarOpen.value && (windowWidth.value !== window?.innerWidth || 0)) {
    windowWidth.value = window?.innerWidth
    toggleSidebar(false)
  }
}, 200)

// Disable mobile sidebar transitions when the window is resized
const windowWidth = ref<number>()
const transitionsDisabled = ref(false)
const resizeTimer = ref()
const disableTransitions = () => {
  if (transitionsDisabled.value) {
    return
  }

  transitionsDisabled.value = true
  clearTimeout(resizeTimer.value)
  resizeTimer.value = setTimeout(() => (transitionsDisabled.value = false), 1300)
}

// Initialize a focus trap when the mobile sidebar is visible for a11y
const focusTrap = ref<InstanceType<typeof FocusTrap> | null>(null)
const focusTrapEnabled = computed((): boolean => mobileSidebarOpen.value && props.mobileEnabled)
// Enable/disable the focus trap
const toggleFocusTrap = async (isActive: boolean): Promise<void> => {
  if (isActive) {
    await nextTick()
    // Delay ensures that the focused element doesn't capture the event
    // that caused the focus trap activation.
    // We're waiting 300ms to ensure the enter transition has completed
    await new Promise((resolve) => setTimeout(resolve, 300))
    focusTrap.value?.activate()
  } else {
    focusTrap.value?.deactivate()
  }
}

watch(focusTrapEnabled, async (enabled: boolean) => {
  if (enabled) {
    await toggleFocusTrap(true)
  } else {
    await toggleFocusTrap(false)
  }
}, { immediate: true })

// If the user is on a Mac, we may need to add extra padding to the sidebar scroll container
const scrollbarExtraPadding = ref<string>('0px')

/**
 * Determine the width of the user's scrollbar, if on a Mac, based on the `Appearance > Show scroll bars` setting.
 * If the width equals zero, add 8px of extra padding to the .sidebar-content-container.
 * This isn't great and I hate it, but it works ¯\_(ツ)_/¯
 */
const getScrollbarWidth = (): void => {
  // @ts-ignore Determine if the user is on MacOS
  const isMac = /Mac|iPhone|iPod|iPad/i.test(navigator?.platform) || /macOS|Mac|iPhone|iPod|iPad/i.test(navigator?.userAgentData?.platform)

  if (!isMac) {
    return
  }

  const outerElement = document.createElement('div')
  outerElement.style.visibility = 'hidden'
  outerElement.style.width = '100px'
  document.body.appendChild(outerElement)

  const widthNoScroll = outerElement.offsetWidth
  // force scrollbar
  outerElement.style.overflow = 'scroll'

  // add inner element
  const innerElement = document.createElement('div')
  innerElement.style.width = '100%'
  outerElement.appendChild(innerElement)

  const widthWithScroll = innerElement.offsetWidth

  // remove inner elements

  if (outerElement.parentNode) {
    outerElement.parentNode.removeChild(outerElement)
  }

  const scrollbarWidth = widthNoScroll - widthWithScroll

  if (scrollbarWidth === 0) {
    scrollbarExtraPadding.value = '8px'
  }
}

onMounted(async () => {
  // Set the window width once the component mounts
  windowWidth.value = window?.innerWidth
  // Automatically close the sidebar if the window is resized
  window.addEventListener('resize', debouncedResizeHandler)
  // Disable mobile sidebar transitions when the window is resized
  window.addEventListener('resize', disableTransitions)

  if (props.groupConfig) {
    for (const groupName in props.groupConfig) {
      // auto-expand all groups if the user is on mobile
      if (useMediaQuery(`(max-width: ${KUI_BREAKPOINT_MOBILE})`)) {
        const group = props.groupConfig[groupName]
        group.collapsed = false
      }
    }
  }

  await nextTick()
  // Adjust the sidebar padding
  getScrollbarWidth()
})

onBeforeUnmount(() => {
  // Cleanup event listener(s)
  window.removeEventListener('resize', debouncedResizeHandler)
  window.removeEventListener('resize', disableTransitions)
})
</script>

<style lang="scss" scoped>
@use "../../styles/variables" as *;

.kong-ui-app-sidebar {
  background: $kui-color-background-inverse;
  display: flex;
  flex-direction: column;
  height: v-bind('sidebarContainerStyles.mobileHeight');
  left: -100%;
  position: fixed;
  top: v-bind('sidebarContainerStyles.mobileTop');
  transition: left 0.2s ease-in-out;
  width: 100%;
  z-index: v-bind(zIndex);

  // Restrict the sidebar from going full-width on larger screens
  @media (min-width: $kui-breakpoint-mobile) {
    max-width: $sidebar-width;
    width: $sidebar-width;
  }

  @media (min-width: $kui-breakpoint-tablet) {
    height: v-bind('sidebarContainerStyles.height');
    left: 0;
    top: v-bind('sidebarContainerStyles.top');
  }

  &.sidebar-open,
  &.mobile-disabled {
    left: 0;
  }

  &.mobile-disabled {
    width: $sidebar-width;
  }

  // Disable all transitions/animations on window.resize when this class is applied
  &.disable-transitions {
    animation: none !important;
    transition: none !important;
  }

  .sidebar-content-container {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    height: 100%;
    margin-top: v-bind('sidebarNavStyles.marginTop');
    overflow-x: hidden;
    // Must use `scroll` so that the scrollbar width is always accounted for. Cannot use `overlay` here as it breaks in Firefox.
    overflow-y: scroll;
    padding-right: v-bind('scrollbarExtraPadding');
    padding-top: $sidebar-header-spacing;
    position: relative;
    width: 100%;
    // Only some browsers support `overflow: overlay`, it's deprecated
    @supports(overflow: overlay) {
      overflow-y: overlay;
    }
    @include scrollbarBase;

    // Only show scrollbar when hovering over nav
    &:hover {
      @include scrollbarVisible;
    }

    nav {
      box-sizing: border-box;
      width: 100%;
    }
  }

  .sidebar-footer {
    align-items: center;
    color: $kui-color-text-neutral-weak;
    display: flex;
    font-weight: $kui-font-weight-medium;
    position: relative;
    width: 100%;

    &:before {
      background-image: linear-gradient(transparent, $kui-color-background-inverse);
      content: '';
      display: block;
      height: $sidebar-header-spacing;
      left: 50%;
      margin-top: -$sidebar-header-spacing;
      position: absolute;
      top: 0;
      transform: translateX(-50%); // center
      width: calc(100% - 16px);
      z-index: 1;
    }
  }

  :deep(.k-dropdown-item) {
    font-size: $sidebar-item-font-size;
    line-height: $kui-line-height-30;
  }
}

// Remove the top margin if `props.mobileHeaderVisible` is false, or if no header slot is present
.mobile-header-hidden .sidebar-content-container,
.no-sidebar-header .sidebar-content-container {
  @media (max-width: ($kui-breakpoint-tablet - 1px)) {
    margin-top: $kui-space-0 !important;
  }
}

.sidebar-level-divider {
  /* stylelint-disable-next-line @kong/design-tokens/use-proper-token */
  background-color: $kui-navigation-color-border-divider;
  height: 1px;
  margin: $kui-space-80 auto;
  min-height: 1px; // required for when scrollbar is present
  width: calc(100% - 32px);
}

.sidebar-header {
  align-items: center;
  background: var(--kong-ui-app-sidebar-header-background, $kui-color-background-transparent);
  color: $kui-color-text-inverse;
  display: v-bind('headerContainerStyles.display');
  left: 0;
  min-height: v-bind('headerContainerStyles.minHeight');
  padding: $kui-space-0 $kui-space-60 $kui-space-0 $kui-space-90; // should match the padding of `.header-content` in the navbar
  position: absolute;
  right: 0;
  top: 0;
  -webkit-user-select: none;
  user-select: none;
  z-index: 1;

  @media (min-width: $kui-breakpoint-tablet) {
    display: flex;
  }

  // Force the immediate child to be display flex
  :deep(>) {
    * {
      display: flex;
    }

    a {
      text-decoration: none;

      &:focus-visible {
        border-radius: $sidebar-item-border-radius;
        outline: 1px solid #afb7c5;
      }
    }
  }

  &:after {
    background-image: linear-gradient($kui-color-background-inverse, transparent);
    bottom: 0;
    content: '';
    display: block;
    height: $sidebar-header-spacing;
    left: 50%;
    margin-bottom: -$sidebar-header-spacing;
    position: absolute;
    transform: translateX(-50%); // center
    width: calc(100% - 16px);
    z-index: 1;
  }
}

.sidebar-top {
  align-items: center;
  color: $kui-color-text-inverse;
  display: flex;
  margin: $kui-space-0 $kui-space-0 $kui-space-60;
  padding: $kui-space-0 $kui-space-40;
  user-select: none;
}

.sidebar-item-external-link {
  align-items: center;
  display: flex;
  font-size: $kui-font-size-30;
  justify-content: space-between;
  line-height: $kui-line-height-30;
  text-decoration: none;

  &:focus-visible {
    outline: 1px solid #afb7c5 !important;
  }

  :deep(.kui-icon) {
    display: inline-flex;
    margin-bottom: -7px;
  }
}

.kong-ui-app-sidebar-overlay {
  background-color: rgba(11, 23, 45, .6); // Same as KModal backdrop color
  bottom: 0;
  left: 0;
  position: fixed;
  right: 0;
  top: v-bind('sidebarOverlayStyles.top');
  z-index: v-bind('sidebarOverlayStyles.zIndex');

  @media (min-width: $kui-breakpoint-tablet) {
    display: none !important;
  }
}
</style>

<style lang="scss">
@use "../../styles/variables" as *;

// Scope with wrapper class intead of using `scoped` so these styles will apply to child components
.kong-ui-app-sidebar {
  // Shared styles for the primary and secondary elements
  .level-primary,
  .level-secondary {
    list-style: none;
    margin: $kui-space-0;
    padding: $kui-space-0;
  }

  .level-primary {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    margin-bottom: $kui-space-80;
    padding: $kui-space-0 $kui-space-10 $kui-space-0 $kui-space-50; // if changed, ensure you test in ALL browsers
    width: 100%;
    // Adjust padding for Safari-only
    @supports (background: -webkit-named-image(i)) {
      padding: $kui-space-0 $kui-space-40;
    }
  }

  .level-primary-group-name {
    color: $kui-navigation-color-text;
    font-size: $kui-font-size-20;
    font-weight: $kui-font-weight-medium;
    line-height: $kui-line-height-40;
    text-transform: uppercase;
    user-select: none;
  }

  // KCollapse overrides
  .level-primary-group-collapse.k-collapse {
    &:not(:last-of-type) {
      margin-bottom: $kui-space-60;
    }

    .collapse-heading {
      margin-bottom: $kui-space-0;
    }

    .collapse-hidden-content {
      margin-top: $kui-space-0;
    }

    // overrides for collapsible KCollapse
    &:not(.not-collapsible) {
      .collapse-heading.has-trailing-trigger {
        margin-bottom: $kui-space-40;
      }
    }

    // overrides for non-collapsible KCollapse
    &.not-collapsible {
      .collapse-trigger {
        cursor: default;
      }

      &.ungrouped {
        .collapse-heading.has-trailing-trigger {
          display: none;
        }
      }
    }
  }

  .level-primary-group-collapse-trigger.k-button,
  div.level-primary-group-collapse-trigger {
    margin-bottom: $kui-space-0;
    margin-left: $kui-space-50;
    padding: $kui-space-0 calc($kui-space-50 + $kui-space-40) $kui-space-0 $kui-space-40;

    &:focus-visible {
      border-radius: $sidebar-item-border-radius;
      box-shadow: $kui-navigation-shadow-focus;
    }
  }

  .level-primary-group-collapse-icon {
    margin-left: $kui-space-30;
  }
}

body.kong-ui-app-sidebar-open {
  overflow: hidden;

  @media (min-width: $kui-breakpoint-tablet) {
    overflow: auto;
  }
}
</style>
