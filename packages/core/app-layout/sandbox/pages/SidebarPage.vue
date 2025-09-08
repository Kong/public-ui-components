<template>
  <AppNavbar>
    <template #mobile-sidebar-toggle>
      <SidebarToggle
        :active="mobileSidebarOpen"
        @toggle="sidebarToggled"
      />
    </template>
    <template #mobile-logo>
      <a
        class="navbar-logo-link"
        href="/"
      >
        <AppGruceLogo />
        <div class="logo-title">
          <AppLogo theme="dark" />
        </div>
      </a>
    </template>
    <template #left>
      <NavLinks />
    </template>
  </AppNavbar>
  <div class="sandbox-container">
    <AppSidebar
      :bottom-items="sidebarItemsBottom"
      :group-config="groupConfig"
      :header-height="60"
      mobile-enabled
      :mobile-header-visible="false"
      :mobile-top-offset="60"
      :open="mobileSidebarOpen"
      :top-items="sidebarItemsTop"
      :z-index="6"
      @click="sidebarItemClick"
      @toggle="sidebarToggled"
    >
      <template #header>
        <div class="kong-logo">
          <router-link
            class="kong-logo-link"
            to="/"
          >
            <AppGruceLogo />
            <div class="konnect-header-title">
              <AppLogo theme="dark" />
            </div>
          </router-link>
        </div>
      </template>
      <template #sidebar-icon-overview>
        <OverviewIcon :size="KUI_ICON_SIZE_40" />
      </template>
      <template #sidebar-icon-gateway-manager>
        <RuntimesIcon :size="KUI_ICON_SIZE_40" />
      </template>
      <template #sidebar-icon-servicehub>
        <ServiceHubIcon :size="KUI_ICON_SIZE_40" />
      </template>
      <template #sidebar-icon-dev-portal>
        <DevPortalIcon :size="KUI_ICON_SIZE_40" />
      </template>
      <template #sidebar-icon-analytics>
        <BarChartIcon :size="KUI_ICON_SIZE_40" />
      </template>
      <template #sidebar-icon-organization>
        <PeopleIcon :size="KUI_ICON_SIZE_40" />
      </template>
      <template #sidebar-icon-settings>
        <CogIcon :size="KUI_ICON_SIZE_40" />
      </template>
    </AppSidebar>
    <main>
      <p>This is the SIDEBAR page.</p>
      <br>
      <KButton>
        Focusable button
      </KButton>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { AppSidebar, AppNavbar, SidebarToggle } from '../../src'
import type { GroupConfigMap, SidebarPrimaryItem, SidebarSecondaryItem } from '../../src'
import { AppLogo, AppGruceLogo } from '../components/icons'
import '@kong/kongponents/dist/style.css'
// Sandbox only
import NavLinks from '../components/NavLinks.vue'
import { OverviewIcon, RuntimesIcon, ServiceHubIcon, DevPortalIcon, BarChartIcon, PeopleIcon, CogIcon } from '@kong/icons'
import { KUI_ICON_SIZE_40 } from '@kong/design-tokens'

const activeItem = ref<SidebarPrimaryItem | SidebarSecondaryItem>()

const sidebarItemClick = (item: SidebarPrimaryItem | SidebarSecondaryItem): void => {
  activeItem.value = item
  console.log('activeItem: %o', activeItem.value)
}

const groupConfig: GroupConfigMap = {
  connectivity: {
    label: 'Connectivity',
    collapsible: true,
    collapsed: false,
  },
  applications: {
    label: 'Applications',
    collapsible: true,
    collapsed: true,
  },
}

const sidebarItemsTop = computed((): SidebarPrimaryItem[] => {
  return [
    {
      name: 'Overview',
      to: '/sidebar/?overview',
      // external: true,
      newWindow: true,
      key: 'overview',
      // TODO: using this item as a default when `activeItem` is undefined
      active: !activeItem.value || (activeItem.value as SidebarPrimaryItem)?.key === 'overview',
    },
    {
      name: 'Gateway Manager',
      to: '/sidebar/?gateway-manager',
      label: 'retail-sandbox-rg', // runtime group name
      key: 'gateway-manager',
      group: 'connectivity',
      active: (activeItem.value as SidebarPrimaryItem)?.key === 'gateway-manager',
      // TODO: actually when you click on Runtime Manager it would not expand until the user picks a runtime group
      expanded: (activeItem.value as SidebarPrimaryItem)?.key === 'gateway-manager' || (activeItem.value as SidebarSecondaryItem)?.parentKey === 'gateway-manager',
      items: [
        {
          name: 'Runtime Instances',
          to: '/sidebar/?runtime-instances',
          active: activeItem.value?.name === 'Runtime Instances',
        },
        {
          name: 'Gateway Services',
          to: '/sidebar/?gateway-services',
          active: activeItem.value?.name === 'Gateway Services',
        },
        {
          name: 'Routes',
          to: '/sidebar/?routes',
          active: activeItem.value?.name === 'Routes',
        },
        {
          name: 'Consumers',
          to: '/sidebar/?consumers',
          active: activeItem.value?.name === 'Consumers',
        },
        {
          name: 'Plugins',
          to: '/sidebar/?plugins',
          active: activeItem.value?.name === 'Plugins',
        },
        {
          name: 'Upstreams',
          to: '/sidebar/?upstreams',
          active: activeItem.value?.name === 'Upstreams',
        },
        {
          name: 'Certificates',
          to: '/sidebar/?certificates',
          active: activeItem.value?.name === 'Certificates',
        },
        {
          name: 'SNIs',
          to: '/sidebar/?snis',
          active: activeItem.value?.name === 'SNIs',
        },
      ],
    },
    {
      name: 'Service Hub',
      key: 'servicehub',
      to: '/sidebar/?servicehub',
      label: 'Deloreans',
      group: 'applications',
      active: (activeItem.value as SidebarPrimaryItem)?.key === 'servicehub',
      // TODO: actually when you click on Service Hub it would not expand until the user picks a service
      expanded: (activeItem.value as SidebarPrimaryItem)?.key === 'servicehub' || (activeItem.value as SidebarSecondaryItem)?.parentKey === 'servicehub',
      items: [
        {
          name: 'Overview',
          to: '/sidebar/?service-overview',
          active: activeItem.value?.name === 'Overview',
        },
        {
          name: 'Versions',
          to: '/sidebar/?service-versions',
          active: activeItem.value?.name === 'Versions',
        },
      ],
    },
    {
      name: 'Dev Portal',
      key: 'dev-portal',
      to: '/sidebar/?dev-portal',
      active: (activeItem.value as SidebarPrimaryItem)?.key === 'dev-portal',
      group: 'applications',
      // This item can always show the subnav
      expanded: (activeItem.value as SidebarPrimaryItem)?.key === 'dev-portal' || (activeItem.value as SidebarSecondaryItem)?.parentKey === 'dev-portal',
      items: [
        {
          name: 'Published Services',
          to: '/sidebar/?published-services',
          active: activeItem.value?.name === 'Published Services',
        },
        {
          name: 'Appearance',
          to: '/sidebar/?appearance',
          active: activeItem.value?.name === 'Appearance',
        },
        {
          name: 'Access Requests',
          to: '/sidebar/?access-requests',
          active: activeItem.value?.name === 'Access Requests',
          badgeCount: 100,
        },
        {
          name: 'Developers',
          to: '/sidebar/?developers',
          active: activeItem.value?.name === 'Developers',
        },
        {
          name: 'Applications',
          to: '/sidebar/?applications',
          active: activeItem.value?.name === 'Applications',
        },
        {
          name: 'Settings',
          to: '/sidebar/?settings',
          active: activeItem.value?.name === 'Settings',
        },
      ],
    },
    {
      name: 'Analytics',
      key: 'analytics',
      to: '/sidebar/?analytics',
      active: (activeItem.value as SidebarPrimaryItem)?.key === 'analytics',
      group: 'applications',
      // This item can always show the subnav
      expanded: (activeItem.value as SidebarPrimaryItem)?.key === 'analytics' || (activeItem.value as SidebarSecondaryItem)?.parentKey === 'analytics',
      items: [
        {
          name: 'Overview',
          to: '/sidebar/?overview',
          active: activeItem.value?.name === 'Overview',
        },
        {
          name: 'Reports',
          to: '/sidebar/?reports',
          active: activeItem.value?.name === 'Reports',
        },
      ],
    },
  ]
})

const sidebarItemsBottom = computed((): SidebarPrimaryItem[] => {
  return [
    {
      name: 'Organization',
      key: 'organization',
      to: '/sidebar/?organization',
      active: (activeItem.value as SidebarPrimaryItem)?.key === 'organization',
      // This item can always show the subnav
      expanded: (activeItem.value as SidebarPrimaryItem)?.key === 'organization' || (activeItem.value as SidebarSecondaryItem)?.parentKey === 'organization',
      items: [
        {
          name: 'Teams',
          to: '/sidebar/?teams',
          active: activeItem.value?.name === 'Teams',
        },
        {
          name: 'Users',
          to: '/sidebar/?users',
          active: activeItem.value?.name === 'Users',
        },
      ],
    },
    {
      name: 'Settings',
      key: 'settings',
      to: '/sidebar/?settings',
      active: (activeItem.value as SidebarPrimaryItem)?.key === 'settings',
      // This item can always show the subnav
      expanded: (activeItem.value as SidebarPrimaryItem)?.key === 'settings' || (activeItem.value as SidebarSecondaryItem)?.parentKey === 'settings',
      items: [
        {
          name: 'Billing and Usage',
          to: '/sidebar/?billing-and-usage',
          active: activeItem.value?.name === 'Billing and Usage',
        },
      ],
    },
  ]
})

const mobileSidebarOpen = ref(false)
const sidebarToggled = (isOpen: boolean) => {
  mobileSidebarOpen.value = isOpen
}
</script>

<style lang="scss" scoped>
$navbar-height: 60px;

html,
body {
  font-family: "Inter", Helvetica, Arial, sans-serif;
  margin: 0;
  padding: 0;
}

.logo-link {
  color: #fff;
  text-decoration: none;
}

.sandbox-container {
  display: flex;
}

main {
  margin-top: $navbar-height;
  min-height: 2000px; // fake a height so the container scrolls
  padding: 16px 24px;

  @media (min-width: 1024px) {
    margin-left: 240px; // $sidebar-width
  }
}

.sidebar-container {
  height: calc(100vh - #{$navbar-height});
}

.navbar-logo-link {
  align-items: center;
  display: flex;

  @media (min-width: 1024px) { // $kui-breakpoint-tablet
    display: none;
  }
}

.logo-title {
  display: none;
  padding-left: 16px;

  @media (min-width: 640px) { // $kui-breakpoint-mobile
    display: flex;
  }
}

.kong-logo {
  display: flex;
  width: 100%;

  .kong-logo-link {
    align-items: center;
    display: flex;
    width: 100%;
  }
}

.konnect-header-title {
  display: flex;
  padding-left: 16px;
}

.desktop-logo {
  align-items: center;
  display: none;

  @media (min-width: 1024px) { // $kui-breakpoint-tablet
    display: none;
  }
}
</style>

<style lang="scss">
main {
  background: #fff;
  box-shadow: var(--kong-ui-app-layout-main-box-shadow, -30px 174px 250px #0023db);
  width: 100%;

  @media (min-width: 1024px) { // $kui-breakpoint-tablet
    border-top-left-radius: 16px;
  }
}

.k-button {
  float: right;
}

.desktop-logo {
  display: none;

  @media (min-width: 1024px) { // $kui-breakpoint-tablet
    display: flex;
  }
}

body {
  background: linear-gradient(180deg, #001740 0%, #073382 100%);
  margin: 0 !important;
}
</style>
