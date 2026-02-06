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
      :key="String(sidebar.hidden)"
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
      <template
        v-if="slotContent.navbarLogo"
        #logo
      >
        <div
          v-if="sidebar.hidden"
          class="navbar-logo"
        >
          <slot name="navbar-logo" />
        </div>
      </template>
      <template
        v-if="slotContent.navbarLeft"
        #left
      >
        <slot name="navbar-left" />
      </template>
      <template
        v-if="slotContent.navbarCenter"
        #center
      >
        <slot name="navbar-center" />
      </template>
      <template
        v-if="slotContent.navbarRight"
        #right
      >
        <slot name="navbar-right" />
      </template>
    </AppNavbar>

    <AppSidebar
      v-if="!sidebar.hidden"
      :bottom-items="sidebar.bottomItems"
      :group-config="groupConfig"
      :header-height="navbarHeight"
      mobile-enabled
      :mobile-header-visible="false"
      :mobile-top-offset="sidebarMobileTopOffset"
      :open="mobileSidebarOpen"
      :top-items="sidebar.topItems"
      :top-offset="notificationHeight"
      @click="sidebarItemClicked"
      @toggle="sidebarToggled"
      @toggle-collapse="(groupName, groupConfig) => emit('toggle-collapse', groupName, groupConfig)"
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
      <template
        v-if="slotContent.sidebarFooter"
        #footer
      >
        <slot name="sidebar-footer" />
      </template>
      <template
        v-for="item in [...(sidebar.topItems || []), ...(sidebar.bottomItems || [])]"
        :key="item.key"
        #[`sidebar-icon-${item.key}`]
      >
        <slot :name="`sidebar-icon-${(item as SidebarPrimaryItem).key}`" />
      </template>
      <template
        v-for="item in [...(sidebar.topItems || []), ...(sidebar.bottomItems || [])]"
        :key="`${item.key}-after`"
        #[`sidebar-after-${item.key}`]
      >
        <slot :name="`sidebar-after-${(item as SidebarPrimaryItem).key}`" />
      </template>
    </AppSidebar>

    <main
      class="kong-ui-app-layout-main"
      data-testid="kong-ui-app-layout-main"
    >
      <div class="kong-ui-app-layout-content">
        <div class="kong-ui-app-layout-content-inner">
          <!-- Default host app teleport container -->
          <div id="kong-ui-app-layout-teleport-default-slot" />
          <slot name="app-error" />
          <slot
            v-if="!defaultSlotIsHidden"
            name="default"
          />
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import { ref, reactive, computed, watchEffect, onMounted, onBeforeUnmount, toRef, useSlots, watch } from 'vue'
import AppNavbar from './navbar/AppNavbar.vue'
import AppSidebar from './sidebar/AppSidebar.vue'
import SidebarToggle from './sidebar/SidebarToggle.vue'
import type { GroupConfig, GroupConfigMap, SidebarPrimaryItem, SidebarSecondaryItem } from '../types'
import { useDebounce } from '../composables'
import { KUI_BORDER_RADIUS_0, KUI_BORDER_RADIUS_20, KUI_COLOR_BACKGROUND, KUI_COLOR_BACKGROUND_INVERSE, KUI_COLOR_TEXT, KUI_COLOR_TEXT_INVERSE } from '@kong/design-tokens'

interface AppSidebarProperties {
  topItems?: SidebarPrimaryItem[]
  bottomItems?: SidebarPrimaryItem[]
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
  groupConfig: {
    type: Object as PropType<GroupConfigMap>,
    default: () => ({}),
  },
  theme: {
    type: String as PropType<'light' | 'dark'>,
    default: 'light',
    validator: (theme: 'light' | 'dark'): boolean => ['light', 'dark'].includes(theme),
  },
})

const emit = defineEmits<{
  (e: 'sidebar-click', item: SidebarPrimaryItem | SidebarSecondaryItem): void
  (e: 'update:topOffset', offset: number): void
  (e: 'toggle-collapse', groupName: string, groupConfig: GroupConfig): void
}>()

const slots = useSlots()
const slotContent = reactive({
  navbarLeft: computed((): boolean => !!slots['navbar-left']),
  navbarCenter: computed((): boolean => !!slots['navbar-center']),
  navbarRight: computed((): boolean => !!slots['navbar-right']),
  navbarLogo: computed((): boolean => !!slots['navbar-logo']),
  navbarMobileLogo: computed((): boolean => !!slots['navbar-mobile-logo']),
  sidebarHeader: computed((): boolean => !!slots['sidebar-header']),
  sidebarTop: computed((): boolean => !!slots['sidebar-top']),
  sidebarFooter: computed((): boolean => !!slots['sidebar-footer']),
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
  open: computed(() => props.sidebarOpen),
  hidden: computed(() => props.sidebarHidden),
})

const sidebarItemClicked = (item: SidebarPrimaryItem | SidebarSecondaryItem) => {
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
const layoutMainColor = computed((): string => props.theme === 'light' ? KUI_COLOR_TEXT : KUI_COLOR_TEXT_INVERSE)
const layoutMainBackgroundColor = computed((): string => props.theme === 'light' ? KUI_COLOR_BACKGROUND : KUI_COLOR_BACKGROUND_INVERSE)
const layoutMainBoxShadow = computed((): string => props.theme === 'light' ? 'var(--kong-ui-app-layout-main-box-shadow, -30px 174px 250px #0023db)' : 'none')
const layoutMainMarginTop = computed((): string => `${sidebarMobileTopOffset.value}px`)
const layoutMainTopLeftBorderRadius = computed((): string => sidebar.hidden || navbar.hidden ? KUI_BORDER_RADIUS_0 : KUI_BORDER_RADIUS_20)

const { debounce } = useDebounce()
const debouncedSetNotificationHeight = debounce((force = false): void => {
  // Only update the notificationHeight if the windowWidth changes
  if (force || (windowWidth.value !== window?.innerWidth || 0)) {
    windowWidth.value = window?.innerWidth
    const notificationContainer: HTMLElement | null = document?.querySelector('.kong-ui-app-layout #kong-ui-app-layout-notification')
    if (notificationContainer) {
      notificationHeight.value = notificationContainer.offsetHeight
    }
  }
}, 200)

// Add a ResizeObserver to determine when the navbar element content changes
const resizeObserver = ref<ResizeObserver>()

watch(notificationHeight, (offset) => {
  emit('update:topOffset', offset || 0)
}, { immediate: true })

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
      // Wrapper 'window.requestAnimationFrame' is needed for disabling "ResizeObserver loop limit exceeded" error in DD
      window.requestAnimationFrame(() => {
        if (!Array.isArray(entries) || !entries.length) {
          return
        }
        // Actual code
        for (const entry of entries) {
          const height = entry.contentRect.height
          if (notificationHeight.value !== height) {
            notificationHeight.value = height
          }
        }
      })
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
@use "../styles/app-layout";
</style>

<style lang="scss" scoped>
/* stylelint-disable @kong/design-tokens/token-var-usage */
@use "../styles/variables" as *;

.kong-ui-app-layout {
  background: $kui-color-background-inverse;
  bottom: 0;
  display: flex;
  flex-direction: column;
  font-family: $kui-font-family-text;
  height: 100%;
  left: 0;
  overflow: hidden;
  position: fixed;
  right: 0;
  top: 0;
  width: 100%;

  :deep(.kong-ui-app-navbar) {
    .mobile-logo {
      align-items: center;
      display: flex;

      @media (min-width: $kui-breakpoint-tablet) {
        display: none;
      }

      > * {
        align-items: center;
        display: flex;
      }

      a {
        text-decoration: none;
      }
    }

    .navbar-logo {
      display: none;

      @media (min-width: $kui-breakpoint-tablet) {
        display: block;
      }
    }
  }

  .kong-ui-app-layout-main {
    align-items: stretch;
    background-color: v-bind('layoutMainBackgroundColor');
    box-shadow: v-bind('layoutMainBoxShadow');
    color: v-bind('layoutMainColor');
    display: flex;
    flex-grow: 1;
    height: 100%;
    margin-top: v-bind('layoutMainMarginTop');
    overflow: auto;
    position: relative;
    width: 100%;

    @media (min-width: $kui-breakpoint-tablet) {
      border-top-left-radius: v-bind('layoutMainTopLeftBorderRadius');
      margin-left: $sidebar-width;
      width: calc(100% - #{$sidebar-width});
    }

    &.full-width {
      margin-left: $kui-space-0;
    }

    .kong-ui-app-layout-content {
      position: relative;
      width: 100%;

      // Apply the padding to the inner element
      &-inner {
        padding: var(--kong-ui-app-layout-content-padding-top, $kui-space-70) var(--kong-ui-app-layout-content-padding-x, $kui-space-70) var(--kong-ui-app-layout-content-padding-bottom, $kui-space-130);
      }
    }
  }

  // Style overrides if AppNavbar is hidden
  &.navbar-hidden {
    .kong-ui-app-layout-main {
      margin-top: $kui-space-0;
    }
  }

  // Style overrides if AppSidebar is hidden
  &.sidebar-hidden {
    .kong-ui-app-layout-main {
      margin-left: $kui-space-0;
      width: 100%;
    }
  }

  // Must keep this as an `id` because we are utilizing as a <Teleport /> container
  #kong-ui-app-layout-notification {
    left: 0;
    position: fixed;
    right: 0;
    top: 0;
    z-index: 1;

    // Modify KAlert styles
    :deep(.k-alert) {
      border-radius: $kui-border-radius-0 !important;
    }
  }
}
</style>
