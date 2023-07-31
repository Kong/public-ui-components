<template>
  <AppLayout
    :sidebar-hidden="sidebarIsHidden"
    :sidebar-top-items="sidebarItemsTop"
    @sidebar-click="sidebarItemClick"
  >
    <!-- <template #notification>
      <KAlert
        alert-message="I'm an alert from the host app"
        appearance="warning"
        dismiss-type="icon"
        :is-showing="showAlert"
        @closed="handleCloseAlert"
      />
    </template> -->
    <template #navbar-mobile-logo>
      <router-link
        class="navbar-logo-link"
        to="/"
      >
        <AppGruceLogo />
        <div class="logo-title">
          <AppLogo theme="dark" />
        </div>
      </router-link>
    </template>
    <template #navbar-logo>
      <router-link
        class="navbar-logo-link"
        to="/"
      >
        <AppGruceLogo />
        <div class="logo-title">
          <AppLogo theme="dark" />
        </div>
      </router-link>
    </template>
    <template #navbar-left>
      <div class="app-navbar-links">
        <a
          class="active"
          href="#"
        >
          Workspaces
        </a>
        <a href="#">
          Dev Portal
        </a>
        <a href="#">
          Vitals
        </a>
        <a href="#">
          Teams
        </a>
      </div>
    </template>
    <template #navbar-right>
      <KButton
        href="#"
        size="small"
        @click="toggleSidebar"
      >
        {{ sidebarIsHidden ? 'Show' : 'Hide' }} sidebar (demo)
      </KButton>
      <div class="app-navbar-links">
        <a href="#">
          Docs / Support
        </a>
      </div>
      <KDropdownMenu
        button-appearance="btn-link"
        class="admin-menu"
        :items="[
          { label: 'AppLayout', to: '/' },
          { label: 'AppNavbar', to: '/navbar' },
          { label: 'AppSidebar', to: '/sidebar' },
          { label: 'KM Example', to: '/kong-manager-example' },
        ]"
        label="super-admin"
        show-caret
      />
    </template>
    <template #sidebar-header>
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
    <template #sidebar-top>
      <div class="sidebar-top-slot-content">
        <div>
          <KSelect
            appearance="select"
            :enable-filtering="true"
            :items="workspaceItems"
          />
        </div>
        <div>
          <hr>
        </div>
      </div>
    </template>

    <!-- Default slot content -->

    <p>This is the top.</p>

    <p
      v-for="index in 10"
      :key="index"
    >
      Lorem ipsum dolor sit amet consectetur adipisicing elit. Id quidem aperiam similique vitae beatae. Repellat quam voluptas vitae, maxime consequuntur praesentium suscipit. Numquam aliquid nulla vel esse accusantium reiciendis error?
    </p>

    <p>This is the bottom.</p>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
// Sandbox only
import { SidebarPrimaryItem, SidebarSecondaryItem } from '../../src'
import AppGruceLogo from '../components/icons/AppGruceLogo.vue'
import AppLogo from '../components/icons/AppLogo.vue'

const sidebarIsHidden = ref<boolean>(false)
const toggleSidebar = (): void => {
  sidebarIsHidden.value = !sidebarIsHidden.value
}

const workspaceItems = [
  {
    label: 'Default',
    value: 'default',
    selected: true,
  },
  {
    label: 'Another workspace',
    value: 'another-workspace',
  },
  {
    label: 'Custom workspace',
    value: 'custom-workspace',
  },
]

const activeItem = ref<SidebarPrimaryItem | SidebarSecondaryItem>()

const sidebarItemClick = (item: SidebarPrimaryItem | SidebarSecondaryItem): void => {
  activeItem.value = item
  console.log('activeItem: %o', activeItem.value)
}

const sidebarItemsTop = computed((): SidebarPrimaryItem[] => {
  return [
    {
      name: 'API Gateway',
      to: '/kong-manager-example?runtime-manager',
      key: 'api-gateway',
      active: !activeItem.value || (activeItem.value as SidebarPrimaryItem)?.key === 'api-gateway',
      // TODO: actually when you click on API Gateway it would not expand until the user picks a runtime group
      expanded: !activeItem.value || (activeItem.value as SidebarPrimaryItem)?.key === 'api-gateway' || (activeItem.value as SidebarSecondaryItem)?.parentKey === 'api-gateway',
      icon: 'runtimes',
      items: [
        {
          name: 'Runtime Instances',
          to: '/kong-manager-example?runtime-instances',
          active: activeItem.value?.name === 'Runtime Instances',
        },
        {
          name: 'Gateway Services',
          to: '/kong-manager-example?gateway-services',
          active: activeItem.value?.name === 'Gateway Services',
        },
        {
          name: 'Routes',
          to: '/kong-manager-example?routes',
          active: activeItem.value?.name === 'Routes',
        },
        {
          name: 'Consumers',
          to: '/kong-manager-example?consumers',
          active: activeItem.value?.name === 'Consumers',
        },
        {
          name: 'Plugins',
          to: '/kong-manager-example?plugins',
          active: activeItem.value?.name === 'Plugins',
        },
        {
          name: 'Upstreams',
          to: '/kong-manager-example?upstreams',
          active: activeItem.value?.name === 'Upstreams',
        },
        {
          name: 'Certificates',
          to: '/kong-manager-example?certificates',
          active: activeItem.value?.name === 'Certificates',
        },
        {
          name: 'SNIs',
          to: '/kong-manager-example?snis',
          active: activeItem.value?.name === 'SNIs',
        },
      ],
    },
    {
      name: 'Dev Portal',
      key: 'dev-portal',
      to: '/kong-manager-example?dev-portal',
      active: (activeItem.value as SidebarPrimaryItem)?.key === 'dev-portal',
      // This item can always show the subnav
      expanded: (activeItem.value as SidebarPrimaryItem)?.key === 'dev-portal' || (activeItem.value as SidebarSecondaryItem)?.parentKey === 'dev-portal',
      icon: 'devPortal',
      items: [
        {
          name: 'Published Services',
          to: '/kong-manager-example?published-services',
          active: activeItem.value?.name === 'Published Services',
        },
        {
          name: 'Appearance',
          to: '/kong-manager-example?appearance',
          active: activeItem.value?.name === 'Appearance',
        },
        {
          name: 'Access Requests',
          to: '/kong-manager-example?access-requests',
          active: activeItem.value?.name === 'Access Requests',
          badgeCount: 100,
        },
        {
          name: 'Developers',
          to: '/kong-manager-example?developers',
          active: activeItem.value?.name === 'Developers',
        },
        {
          name: 'Applications',
          to: '/kong-manager-example?applications',
          active: activeItem.value?.name === 'Applications',
        },
        {
          name: 'Settings',
          to: '/kong-manager-example?settings',
          active: activeItem.value?.name === 'Settings',
        },
      ],
    },
    {
      name: 'Analytics',
      key: 'analytics',
      to: '/kong-manager-example?analytics',
      active: (activeItem.value as SidebarPrimaryItem)?.key === 'analytics',
      // This item can always show the subnav
      expanded: (activeItem.value as SidebarPrimaryItem)?.key === 'analytics' || (activeItem.value as SidebarSecondaryItem)?.parentKey === 'analytics',
      icon: 'vitalsChart',
      items: [
        {
          name: 'Overview',
          to: '/kong-manager-example?overview',
          active: activeItem.value?.name === 'Overview',
        },
        {
          name: 'Reports',
          to: '/kong-manager-example?reports',
          active: activeItem.value?.name === 'Reports',
        },
      ],
    },
  ]
})
</script>

<style lang="scss" scoped>
.sidebar-top-slot-content {
  align-content: center;
  display: flex;
  justify-content: center;
  width: 100%;
}

.navbar-logo-link {
  align-items: center;
  display: flex;
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

.admin-menu {
  --KButtonBtnLink: #fff;
  --KButtonLink: #fff;

  // Ensure button is aligned center
  :deep(.k-dropdown-trigger) {
    > div {
      align-items: center;
      display: flex;
    }
  }

  // Normalize font weights and hover state
  :deep(.k-button.k-dropdown-btn) {
    font-weight: 500;

    &:hover,
    &:focus {
      text-decoration: none;
    }
  }

  // Align the dropdown to the bottom of the navbar
  :deep(.k-dropdown-popover) {
    position: relative;
    top: 16px !important;
  }
}
</style>
