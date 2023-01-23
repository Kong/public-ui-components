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

      <SidebarFooter
        v-if="profileName || profileItems.length"
        class="sidebar-profile-menu"
        :item-count="profileItems.length"
        :name="profileName"
      >
        <KDropdownItem
          v-for="item in profileItems"
          :key="item.name"
          :class="[{ 'has-divider': item.hasDivider },{ 'external-profile-dropdown-link': (item.external || item.newWindow) && typeof item.to === 'string' }]"
          :has-divider="item.hasDivider"
          :item="(item.external || item.newWindow) && typeof item.to === 'string' ? undefined : { label: item.name, to: item.to }"
          @click="itemClick(item)"
        >
          <a
            v-if="(item.external || item.newWindow) && typeof item.to === 'string'"
            class="sidebar-item-external-link"
            :href="item.to"
            :target="item.newWindow ? '_blank' : undefined"
          >
            {{ item.name }}
            <KIcon
              v-if="item.newWindow"
              color="var(--black-70, rgba(0,0,0,0.7))"
              icon="externalLink"
              size="20"
              viewBox="0 0 20 20"
            />
          </a>
        </KDropdownItem>
      </SidebarFooter>
    </aside>
  </FocusTrap>
</template>

<script setup lang="ts">
import { ref, computed, watch, useSlots, PropType, onMounted, onBeforeUnmount, nextTick } from 'vue'
import type { SidebarPrimaryItem, SidebarProfileItem } from '../../types'
import SidebarItem from '../sidebar/SidebarItem.vue'
import SidebarFooter from './SidebarFooter.vue'
import { KDropdownItem, KIcon } from '@kong/kongponents'
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
  profileItems: {
    type: Array as PropType<SidebarProfileItem[]>,
    default: () => ([]),
  },
  profileName: {
    type: String,
    default: '',
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

const itemClick = (item: SidebarPrimaryItem | SidebarProfileItem): void => {
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
  position: fixed;
  top: v-bind('sidebarContainerStyles.mobileTop');
  display: flex;
  flex-direction: column;
  width: 100%;
  height: v-bind('sidebarContainerStyles.mobileHeight');
  background: $sidebar-background;
  left: -100%;
  z-index: v-bind(zIndex);
  transition: left 0.2s ease-in-out;

  // Restrict the sidebar from going full-width on larger screens
  @media (min-width: $viewport-sm) {
    width: $sidebar-width;
    max-width: $sidebar-width;
  }

  @media (min-width: $viewport-md) {
    height: v-bind('sidebarContainerStyles.height');
    top: v-bind('sidebarContainerStyles.top');
    left: 0;
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
    padding-top: $sidebar-header-spacing;
    overflow-x: hidden;
    // Must use `scroll` so that the scrollbar width is always accounted for. Cannot use `overlay` here as it breaks in Firefox.
    overflow-y: scroll;
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

  :deep(.k-dropdown-item) {
    font-size: $sidebar-item-font-size;
    line-height: 1.3;
  }
}

// Remove the top margin if `props.mobileHeaderVisible` is false, or if no header slot is present
.mobile-header-hidden .sidebar-content-container,
.no-sidebar-header .sidebar-content-container {
  @media (max-width: ($viewport-md - 1px)) {
    margin-top: 0 !important;
  }
}

.sidebar-level-divider {
  width: calc(100% - 32px);
  height: 1px;
  min-height: 1px; // required for when scrollbar is present
  margin: 24px auto;
  background-color: rgba(#fff, 0.5);
}

.sidebar-header {
  position: absolute;
  display: v-bind('headerContainerStyles.display');
  min-height: v-bind('headerContainerStyles.minHeight');
  top: 0;
  left: 0;
  right: 0;
  z-index: 1;
  align-items: center;
  padding: 0 20px;
  color: #fff;
  background: linear-gradient(180deg, #003694 70.83%, rgba(0, 54, 148, 0) 100%);
  -webkit-user-select: none;
  user-select: none;

  @media (min-width: $viewport-md) {
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
        outline: 1px solid var(--steel-300, #A3B6D9);
        border-radius: $sidebar-item-border-radius
      }
    }
  }

  &:after{
    content: '';
    display: block;
    background-image: linear-gradient(#003496, #78785400);
    height: $sidebar-header-spacing;
    margin-bottom: -$sidebar-header-spacing;
    position: absolute;
    bottom: 0;
    left: 0;
    z-index: 1;
    width: 100%;
  }
}

.sidebar-top {
  display: flex;
  align-items: center;
  margin: 0 0 16px;
  padding: 0 8px;
  color: #fff;
  user-select: none;
}

.external-profile-dropdown-link {
  // Override padding on `button` element to apply to `.sidebar-item-external-link` instead
  :deep(button.k-dropdown-item-trigger) {
    padding: 0 !important;

    &:focus-visible {
      outline: none;
    }
  }
}

.sidebar-item-external-link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  line-height: 1.3;
  text-decoration: none;

  &:focus-visible {
    outline: 1px solid var(--steel-300, #A3B6D9) !important;
  }

  .external-profile-dropdown-link & {
    padding: var(--spacing-md) var(--spacing-lg);
  }

  :deep(.kong-icon) {
    display: inline-flex;
    margin-bottom: -7px;
  }
}

.kong-ui-app-sidebar-overlay {
  position: fixed;
  top: v-bind('sidebarOverlayStyles.top');
  bottom: 0;
  left: 0;
  right: 0;
  background-color: rgba(11, 23, 45, .6); // Same as KModal backdrop color
  z-index: v-bind('sidebarOverlayStyles.zIndex');

  @media (min-width: $viewport-md) {
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
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .level-primary {
    display: flex;
    flex-direction: column;
    padding: 0 8px; // if changed, ensure you test in ALL browsers

    &:last-of-type {
      margin-bottom: $sidebar-header-spacing * 2;
    }
  }
}

body.kong-ui-app-sidebar-open {
  overflow: hidden;

  @media (min-width: $viewport-md) {
    overflow: auto;
  }
}
</style>
