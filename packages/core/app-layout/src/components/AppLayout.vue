<template>
  <div
    class="kong-ui-app-layout"
    :class="[
      { 'navbar-hidden': navbar.hidden },
      { 'sidebar-hidden': sidebar.hidden },
    ]"
  >
    <div id="kong-ui-app-layout-notification">
      <slot name="notification" />
    </div>
    <AppNavbar
      v-if="!navbar.hidden"
      :left-offset="sidebar.hidden ? 0 : undefined"
      :top-offset="notificationHeight"
    >
      <template #mobile-sidebar-toggle>
        <SidebarToggle
          v-if="!sidebar.hidden"
          :active="mobileSidebarOpen"
          @toggle="sidebarToggled"
        />
      </template>
      <template
        v-if="slotContent.navbarMobileLogo"
        #mobile-logo
      >
        <div class="mobile-logo">
          <slot name="navbar-mobile-logo" />
        </div>
      </template>
      <slot name="navbar" />
    </AppNavbar>

    <AppSidebar
      v-if="!sidebar.hidden"
      :bottom-items="sidebar.bottomItems"
      :header-height="navbarHeight"
      mobile-enabled
      :mobile-header-visible="false"
      :mobile-top-offset="sidebarMobileTopOffset"
      :open="mobileSidebarOpen"
      :profile-items="sidebar.profileItems"
      :profile-name="sidebar.profileName"
      :top-items="sidebar.topItems"
      :top-offset="notificationHeight"
      @click="sidebarItemClicked"
      @toggle="sidebarToggled"
    >
      <template
        v-if="slotContent.sidebarHeader"
        #header
      >
        <slot name="sidebar-header" />
      </template>
      <template
        v-if="slotContent.sidebarTop"
        #top
      >
        <slot name="sidebar-top" />
      </template>
    </AppSidebar>

    <main class="kong-ui-app-layout-main">
      <div class="kong-ui-app-layout-content">
        <div id="kong-ui-app-layout-teleport-default-slot" />
        <slot name="app-error" />
        <slot
          v-if="!defaultSlotIsHidden"
          name="default"
        />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watchEffect, onMounted, onBeforeUnmount, PropType, toRef, useSlots } from 'vue'
import AppNavbar from './navbar/AppNavbar.vue'
import AppSidebar from './sidebar/AppSidebar.vue'
import SidebarToggle from './sidebar/SidebarToggle.vue'
import type { SidebarPrimaryItem, SidebarProfileItem, SidebarSecondaryItem } from '../types'
import { useDebounce } from '../composables'

interface AppSidebarProperties {
  topItems?: SidebarPrimaryItem[]
  bottomItems?: SidebarPrimaryItem[]
  profileItems?: SidebarProfileItem[]
  profileName?: string
  open?: boolean
  hidden?: boolean
}

const props = defineProps({
  hideDefaultSlot: {
    type: Boolean,
    default: false,
  },
  // Navbar props
  navbarHidden: {
    type: Boolean,
    default: false,
  },
  // Sidebar props
  sidebarHidden: {
    type: Boolean,
    default: false,
  },
  sidebarOpen: {
    type: Boolean,
    default: false,
  },
  sidebarTopItems: {
    type: Array as PropType<SidebarPrimaryItem[]>,
    default: () => ([]),
  },
  sidebarBottomItems: {
    type: Array as PropType<SidebarPrimaryItem[]>,
    default: () => ([]),
  },
  sidebarProfileItems: {
    type: Array as PropType<SidebarProfileItem[]>,
    default: () => ([]),
  },
  sidebarProfileName: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['sidebar-click'])

const slots = useSlots()
const slotContent = reactive({
  navbarMobileLogo: computed((): boolean => !!slots['navbar-mobile-logo']),
  sidebarHeader: computed((): boolean => !!slots['sidebar-header']),
  sidebarTop: computed((): boolean => !!slots['sidebar-top']),
})

// Evaluate variables from injected symbols; fallback to prop values.
// Must wrap the prop values in a computed so that they remain reactive.
const defaultSlotIsHidden = computed(() => props.hideDefaultSlot)
const navbar = reactive({
  hidden: computed(() => props.navbarHidden),
})
const sidebar: AppSidebarProperties = reactive({
  topItems: computed(() => props.sidebarTopItems),
  bottomItems: computed(() => props.sidebarBottomItems),
  profileItems: computed(() => props.sidebarProfileItems),
  profileName: computed(() => props.sidebarProfileName),
  open: computed(() => props.sidebarOpen),
  hidden: computed(() => props.sidebarHidden),
})

const sidebarItemClicked = (item: SidebarPrimaryItem | SidebarSecondaryItem | SidebarProfileItem) => {
  emit('sidebar-click', item)
}

const mobileSidebarOpen = ref<boolean>(false)
const sidebarToggled = (isOpen: boolean): void => {
  mobileSidebarOpen.value = isOpen
}

// Update the state of the sidebar if the prop value changes
watchEffect(() => {
  mobileSidebarOpen.value = toRef(sidebar, 'open').value || false
})

const windowWidth = ref<number>(0)
const navbarHeight = ref<number>(60) // set to value of $navbar-height
const notificationHeight = ref<number>(0) // initialize as zero
const sidebarMobileTopOffset = computed((): number => {
  if (navbar.hidden) {
    return notificationHeight.value
  }

  return navbarHeight.value + notificationHeight.value
})
const layoutMainMarginTop = computed((): string => `${sidebarMobileTopOffset.value}px`)

const { debounce } = useDebounce()
const debouncedSetNotificationHeight = debounce((force = false): void => {
  // Only update the notificationHeight if the windowWidth changes
  if (force || (windowWidth.value !== window?.innerWidth || 0)) {
    const notificationContainer: HTMLElement | null = document?.querySelector('.kong-ui-app-layout #kong-ui-app-layout-notification')
    if (notificationContainer) {
      notificationHeight.value = notificationContainer.offsetHeight
    }
  }
}, 200)

// Add a ResizeObserver to determine when the navbar element content changes
const resizeObserver = ref<ResizeObserver>()

onMounted(() => {
  // Add classes to the `html` and `body` elements to scope styles
  document?.body?.classList.add('kong-ui-app-layout-body')
  document?.documentElement?.classList.add('kong-ui-app-layout-html')

  // Set the window width once the component mounts
  windowWidth.value = window?.innerWidth

  // Initially set the navbar offset, pass `true` to force it to ignore the initial width
  debouncedSetNotificationHeight(true)

  // Attach a ResizeObserver to automatically update the navbarHeight when the navbar is resized
  const notificationContainer = document?.querySelector('.kong-ui-app-layout #kong-ui-app-layout-notification')
  if (notificationContainer) {
    resizeObserver.value = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const height = entry.contentRect.height
        if (notificationHeight.value !== height) {
          notificationHeight.value = height
        }
      }
    })
    resizeObserver.value.observe(notificationContainer)
  }

  // Adjust the navbar offset when the window is resized (do not pass true)
  window.addEventListener('resize', debouncedSetNotificationHeight)
})

onBeforeUnmount(() => {
  // Cleanup event listener(s)
  if (resizeObserver.value) {
    resizeObserver.value.disconnect()
  }
  window.removeEventListener('resize', debouncedSetNotificationHeight)
})
</script>

<style lang="scss">
// Leave unscoped
// Importing all styles just for this entry component.
// Any other component in this package should only import the `_variables.scss` file.
@import "../styles/app-layout";
</style>

<style lang="scss" scoped>
@import "../styles/variables";

.kong-ui-app-layout {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  position: relative;
  font-family: $font-family-base;
  background-color: $sidebar-background-gradient-start;
  overflow: hidden;

  :deep(.kong-ui-app-navbar) {
    .mobile-logo {
      display: flex;
      align-items: center;

      @media (min-width: $viewport-md) {
        display: none;
      }

      > * {
        display: flex;
        align-items: center;
      }

      a {
        text-decoration: none;
      }
    }
  }

  .kong-ui-app-layout-main {
    display: flex;
    align-items: flex-start;
    flex-grow: 1;
    width: 100%;
    height: 100%;
    margin-top: v-bind('layoutMainMarginTop');
    background-color: var(--grey-100, #f8f8fa);
    // border-top-left-radius: 16px; // TODO: Enable when Neon layout is enabled
    overflow: auto;

    @media (min-width: $viewport-md) {
      width: calc(100% - #{$sidebar-width});
      margin-left: $sidebar-width;
    }

    &.full-width {
      margin-left: 0;
    }

    .kong-ui-app-layout-content {
      position: relative;
      width: 100%;
      padding: 16px;
    }
  }

  // Style overrides if AppNavbar is hidden
  &.navbar-hidden {
    .kong-ui-app-layout-main {
      margin-top: 0;
    }
  }

  // Style overrides if AppSidebar is hidden
  &.sidebar-hidden {
    .kong-ui-app-layout-main {
      width: 100%;
      margin-left: 0;
    }
  }

  // Must keep this as an `id` because we are utilizing as a <Teleport /> container
  #kong-ui-app-layout-notification {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 1;

    // Modify KAlert styles
    :deep(.k-alert) {
      border-radius: 0 !important;
    }
  }
}
</style>
