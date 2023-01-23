<template>
  <header class="navbar">
    <nav>
      <SidebarToggle
        :active="mobileSidebarOpen"
        @toggle="sidebarToggled"
      />
      <div>Dummy navbar</div>
      <NavLinks />
    </nav>
  </header>
  <div class="sandbox-container">
    <AppSidebar
      :bottom-items="sidebarItemsBottom"
      :header-height="60"
      mobile-enabled
      :mobile-header-visible="false"
      :mobile-top-offset="60"
      :open="mobileSidebarOpen"
      :profile-items="sidebarItemsProfile"
      profile-name="Marty McFly"
      :top-items="sidebarItemsTop"
      :z-index="6"
      @click="sidebarItemClick"
      @toggle="sidebarToggled"
    >
      <template #header>
        <div class="kong-logo d-flex w-100">
          <router-link
            class="d-flex align-items-center w-100"
            to="/"
          >
            <AppGruceLogo />
            <div class="d-flex pl-4 konnect-header-title">
              <AppLogo theme="dark" />
            </div>
          </router-link>
        </div>
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
import { AppSidebar, SidebarToggle, SidebarPrimaryItem, SidebarProfileItem, SidebarSecondaryItem } from '../../src'
import { AppLogo, AppGruceLogo } from '../components/icons'
import '@kong/kongponents/dist/style.css'
// Sandbox only
import NavLinks from '../components/NavLinks.vue'

const activeItem = ref<SidebarPrimaryItem | SidebarSecondaryItem | SidebarProfileItem>()

const sidebarItemClick = (item: SidebarPrimaryItem | SidebarSecondaryItem | SidebarProfileItem): void => {
  activeItem.value = item
  console.log('activeItem: %o', activeItem.value)
}

const sidebarItemsTop = computed((): SidebarPrimaryItem[] => {
  return [
    {
      name: 'Overview',
      to: '/sidebar/?overview',
      // external: true,
      newWindow: true,
      key: 'overview',
      icon: 'sharedConfig',
      // TODO: using this item as a default when `activeItem` is undefined
      active: !activeItem.value || (activeItem.value as SidebarPrimaryItem)?.key === 'overview',
    },
    {
      name: 'Runtime Manager',
      to: '/sidebar/?runtime-manager',
      label: 'retail-sandbox-rg', // runtime group name
      key: 'runtime-manager',
      active: (activeItem.value as SidebarPrimaryItem)?.key === 'runtime-manager',
      // TODO: actually when you click on Runtime Manager it would not expand until the user picks a runtime group
      expanded: (activeItem.value as SidebarPrimaryItem)?.key === 'runtime-manager' || (activeItem.value as SidebarSecondaryItem)?.parentKey === 'runtime-manager',
      icon: 'runtimes',
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
      active: (activeItem.value as SidebarPrimaryItem)?.key === 'servicehub',
      // TODO: actually when you click on Service Hub it would not expand until the user picks a service
      expanded: (activeItem.value as SidebarPrimaryItem)?.key === 'servicehub' || (activeItem.value as SidebarSecondaryItem)?.parentKey === 'servicehub',
      icon: 'serviceHub',
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
      // This item can always show the subnav
      expanded: (activeItem.value as SidebarPrimaryItem)?.key === 'dev-portal' || (activeItem.value as SidebarSecondaryItem)?.parentKey === 'dev-portal',
      icon: 'devPortal',
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
      // This item can always show the subnav
      expanded: (activeItem.value as SidebarPrimaryItem)?.key === 'analytics' || (activeItem.value as SidebarSecondaryItem)?.parentKey === 'analytics',
      icon: 'vitalsChart',
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
      icon: 'organizations',
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
      icon: 'cogwheel',
      items: [
        {
          name: 'Billing and Usage',
          to: '/sidebar/?billing-and-usage',
          active: activeItem.value?.name === 'Billing and Usage',
        },
        {
          name: 'Auth Settings',
          to: '/sidebar/?auth-settings',
          active: activeItem.value?.name === 'Auth Settings',
        },
      ],
    },
  ]
})

const sidebarItemsProfile = computed((): SidebarProfileItem[] => {
  return [
    {
      name: 'Personal access tokens',
      to: '/sidebar/?personal-access-tokens',
    },
    {
      name: 'External',
      to: 'https://google.com/',
      newWindow: true,
    },
    {
      name: 'Logout',
      to: '/sidebar/?logout',
      hasDivider: true,
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
  padding: 0;
  margin: 0;
  font-family: "Inter", Helvetica, Arial, sans-serif;
}

.logo-link {
  color: #fff;
  text-decoration: none;
}

.sandbox-container {
  display: flex;
}

main {
  min-height: 2000px; // fake a height so the container scrolls
  margin-top: $navbar-height;
  padding: 16px 24px;

  @media (min-width: 768px) {
    margin-left: 240px; // $sidebar-width
  }
}

.sidebar-container {
  height: calc(100vh - #{$navbar-height});
}

.navbar {
  position: fixed;
  top: 0;
  left: 0;
  display: flex;
  width: 100%;
  height: $navbar-height;
  background: #eee;

  @media (min-width: 768px) {
    width: calc(100% - 240px);
    left: 240px;
  }

  nav {
    display: flex;
    align-items: center;
    gap: 16px;
    color: var(--blue-500);
    width: 100%;
    max-width: 100%;
    padding: 0 24px;
    color: var(--black-500);
  }

  .mobile-logo {
    display: flex;
    align-items: center;

    @media (min-width: 768px) {
      display: none;
    }
  }
}
</style>

<style lang="scss">
main {
  width: 100%;
}

.k-button {
  float: right;
}
</style>
