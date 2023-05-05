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
        'disable-transitions': transitionsDisabled
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
          <ul
            v-if="topNavItems.length"
            class="level-primary top-items"
          >
            <SidebarItem
              v-for="item in topNavItems"
              :key="item.name"
              :item="item"
              @click="itemClick"
            />
          </ul>

          <div
            v-if="topNavItems.length && bottomNavItems.length"
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
            />
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
import { ref, computed, watch, useSlots, PropType, onMounted, onBeforeUnmount, nextTick } from 'vue'
import type { SidebarPrimaryItem } from '../../types'
import SidebarItem from '../sidebar/SidebarItem.vue'
import { FocusTrap } from 'focus-trap-vue'
import { useDebounce } from '../../composables'
import clonedeep from 'lodash.clonedeep'

const emit = defineEmits(['click', 'toggle'])

const props = defineProps({
  topItems: {
    type: Array as PropType<SidebarPrimaryItem[]>,
    default: () => ([]),
  },
  bottomItems: {
    type: Array as PropType<SidebarPrimaryItem[]>,
    default: () => ([]),
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
    default: 2,
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

// Do not manually set the value of `mobileSidebarOpen`; always call `toggleSidebar(true/false)`
const mobileSidebarOpen = ref<boolean>(props.open)
const toggleSidebar = (isOpen: boolean) => {
  if (mobileSidebarOpen.value !== isOpen) {
    mobileSidebarOpen.value = isOpen
    emit('toggle', isOpen)
  }

  // Add or remove a class from the `body` tag when the sidebar is opened/closed
  // This allows for the consuming app to add CSS to prevent overflow-y while the sidebar is open
  isOpen ? document?.body?.classList.add('kong-ui-app-sidebar-open') : document?.body?.classList.remove('kong-ui-app-sidebar-open')

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

onMounted(() => {
  // Set the window width once the component mounts
  windowWidth.value = window?.innerWidth
  // Automatically close the sidebar if the window is resized
  window.addEventListener('resize', debouncedResizeHandler)
  // Disable mobile sidebar transitions when the window is resized
  window.addEventListener('resize', disableTransitions)
})

onBeforeUnmount(() => {
  // Cleanup event listener(s)
  window.removeEventListener('resize', debouncedResizeHandler)
  window.removeEventListener('resize', disableTransitions)
})
</script>

<style lang="scss" scoped>
@import "../../styles/variables";

.kong-ui-app-sidebar {
  background: $app-layout-background;
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
  @media (min-width: $viewport-sm) {
    max-width: $sidebar-width;
    width: $sidebar-width;
  }

  @media (min-width: $viewport-lg) {
    background: var(--kong-ui-app-sidebar-background, transparent);
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
    display: flex;
    flex-direction: column;
    height: 100%;
    margin-top: v-bind('sidebarNavStyles.marginTop');
    overflow-x: hidden;
    // Must use `scroll` so that the scrollbar width is always accounted for. Cannot use `overlay` here as it breaks in Firefox.
    overflow-y: scroll;
    padding-top: $sidebar-header-spacing;
    // Only some browsers support `overflow: overlay`, it's deprecated
    @supports(overflow: overlay) {
      overflow-y: overlay;
    }
    @include scrollbarBase;

    // Only show scrollbar when hovering over nav
    &:hover {
      @include scrollbarVisible;
    }
  }

  .sidebar-footer {
    align-items: center;
    color: var(--steel-300, #A3B6D9);
    display: flex;
    font-weight: 500;
    width: 100%;
  }

  :deep(.k-dropdown-item) {
    font-size: $sidebar-item-font-size;
    line-height: 1.3;
  }
}

// Remove the top margin if `props.mobileHeaderVisible` is false, or if no header slot is present
.mobile-header-hidden .sidebar-content-container,
.no-sidebar-header .sidebar-content-container {
  @media (max-width: ($viewport-lg - 1px)) {
    margin-top: 0 !important;
  }
}

.sidebar-level-divider {
  background-color: rgba(#fff, 0.5);
  height: 1px;
  margin: 24px auto;
  min-height: 1px; // required for when scrollbar is present
  width: calc(100% - 32px);
}

.sidebar-header {
  align-items: center;
  background: var(--kong-ui-app-sidebar-header-background, transparent);
  color: #fff;
  display: v-bind('headerContainerStyles.display');
  left: 0;
  min-height: v-bind('headerContainerStyles.minHeight');
  padding: 0 16px; // should match the padding of `.header-content` in the navbar
  position: absolute;
  right: 0;
  top: 0;
  -webkit-user-select: none;
  user-select: none;
  z-index: 1;

  @media (min-width: $viewport-lg) {
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
        outline: 1px solid var(--steel-300, #A3B6D9)
      }
    }
  }

  &:after{
    background-image: linear-gradient(#001740, #78785400);
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
  color: #fff;
  display: flex;
  margin: 0 0 16px;
  padding: 0 8px;
  user-select: none;
}

.sidebar-item-external-link {
  align-items: center;
  display: flex;
  font-size: 14px;
  justify-content: space-between;
  line-height: 1.3;
  text-decoration: none;

  &:focus-visible {
    outline: 1px solid var(--steel-300, #A3B6D9) !important;
  }

  :deep(.kong-icon) {
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

  @media (min-width: $viewport-lg) {
    display: none !important;
  }
}
</style>

<style lang="scss">
@import "../../styles/variables";

// Scope with wrapper class intead of using `scoped` so these styles will apply to child components
.kong-ui-app-sidebar {
  // Shared styles for the primary and secondary elements
  .level-primary,
  .level-secondary {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .level-primary {
    display: flex;
    flex-direction: column;
    padding: 0 8px; // if changed, ensure you test in ALL browsers

    &:last-of-type {
      margin-bottom: $sidebar-header-spacing * 4;
    }
  }
}

body.kong-ui-app-sidebar-open {
  overflow: hidden;

  @media (min-width: $viewport-lg) {
    overflow: auto;
  }
}
</style>
