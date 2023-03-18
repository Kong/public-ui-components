<template>
  <AppLayout
    :sidebar-bottom-items="sidebarItemsBottom"
    :sidebar-hidden="sidebarIsHidden"
    :sidebar-profile-items="sidebarItemsProfile"
    sidebar-profile-name="Adam"
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
      <NavLinks />
    </template>
    <template #navbar-right>
      <KButton
        href="#"
        size="small"
        @click="toggleSidebar"
      >
        {{ sidebarIsHidden ? 'Show' : 'Hide' }} sidebar
      </KButton>
      <AccountDropdown
        :options="[
          { label: 'Jackie Jiang', to: '/' },
          { label: 'jackie.jiang@konghq.com', to: '/' },
          { label: 'My Account', to: '/', hasDivider: true },
          { label: 'Personal Account Tokens', to: '/' },
          { label: 'Log Out', to: '/', hasDivider: true },
        ]"
        user-initials="AB"
      />
    </template>
    <template #sidebar-header>
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
    <template #sidebar-top>
      <div class="sidebar-top-slot-content">
        <div>Top Slot Content</div>
      </div>
    </template>
    <template #sidebar-footer>
      <div class="sidebar-footer-slot-content">
        <div>Footer Slot Content</div>
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
import { AccountDropdown, SidebarPrimaryItem, SidebarProfileItem, SidebarSecondaryItem } from '../../src'
import NavLinks from '../components/NavLinks.vue'
import AppGruceLogo from '../components/icons/AppGruceLogo.vue'
import AppLogo from '../components/icons/AppLogo.vue'

const sidebarIsHidden = ref<boolean>(false)
const toggleSidebar = (): void => {
  sidebarIsHidden.value = !sidebarIsHidden.value
}

const activeItem = ref<SidebarPrimaryItem | SidebarSecondaryItem | SidebarProfileItem>()

const sidebarItemClick = (item: SidebarPrimaryItem | SidebarSecondaryItem | SidebarProfileItem): void => {
  activeItem.value = item
  console.log('activeItem: %o', activeItem.value)
}

const sidebarItemsTop = computed((): SidebarPrimaryItem[] => {
  return [
    {
      name: 'Overview',
      to: '/?overview',
      key: 'overview',
      icon: 'sharedConfig',
      // TODO: using this item as a default when `activeItem` is undefined
      active: !activeItem.value || (activeItem.value as SidebarPrimaryItem)?.key === 'overview',
    },
    {
      name: 'Runtime Manager',
      to: '/?runtime-manager',
      label: 'retail-sandbox-rg', // runtime group name
      key: 'runtime-manager',
      active: (activeItem.value as SidebarPrimaryItem)?.key === 'runtime-manager',
      // TODO: actually when you click on Runtime Manager it would not expand until the user picks a runtime group
      expanded: (activeItem.value as SidebarPrimaryItem)?.key === 'runtime-manager' || (activeItem.value as SidebarSecondaryItem)?.parentKey === 'runtime-manager',
      icon: 'runtimes',
      items: [
        {
          name: 'Runtime Instances',
          to: '/?runtime-instances',
          active: activeItem.value?.name === 'Runtime Instances',
        },
        {
          name: 'Gateway Services',
          to: '/?gateway-services',
          active: activeItem.value?.name === 'Gateway Services',
        },
        {
          name: 'Routes',
          to: '/?routes',
          active: activeItem.value?.name === 'Routes',
        },
        {
          name: 'Consumers',
          to: '/?consumers',
          active: activeItem.value?.name === 'Consumers',
        },
        {
          name: 'Plugins',
          to: '/?plugins',
          active: activeItem.value?.name === 'Plugins',
        },
        {
          name: 'Upstreams',
          to: '/?upstreams',
          active: activeItem.value?.name === 'Upstreams',
        },
        {
          name: 'Certificates',
          to: '/?certificates',
          active: activeItem.value?.name === 'Certificates',
        },
        {
          name: 'SNIs',
          to: '/?snis',
          active: activeItem.value?.name === 'SNIs',
        },
      ],
    },
    {
      name: 'Service Hub',
      key: 'servicehub',
      to: '/?servicehub',
      label: 'Deloreans',
      active: (activeItem.value as SidebarPrimaryItem)?.key === 'servicehub',
      // TODO: actually when you click on Service Hub it would not expand until the user picks a service
      expanded: (activeItem.value as SidebarPrimaryItem)?.key === 'servicehub' || (activeItem.value as SidebarSecondaryItem)?.parentKey === 'servicehub',
      icon: 'serviceHub',
      items: [
        {
          name: 'Overview',
          to: '/?service-overview',
          active: activeItem.value?.name === 'Overview',
        },
        {
          name: 'Versions',
          to: '/?service-versions',
          active: activeItem.value?.name === 'Versions',
        },
      ],
    },
    {
      name: 'Mesh Manager',
      to: '/?mesh-manager',
      key: 'mesh-manager',
      icon: 'brain',
      // TODO: using this item as a default when `activeItem` is undefined
      active: (activeItem.value as SidebarPrimaryItem)?.key === 'mesh-manager',
    },
    {
      name: 'Dev Portal',
      key: 'dev-portal',
      to: '/?dev-portal',
      active: (activeItem.value as SidebarPrimaryItem)?.key === 'dev-portal',
      // This item can always show the subnav
      expanded: (activeItem.value as SidebarPrimaryItem)?.key === 'dev-portal' || (activeItem.value as SidebarSecondaryItem)?.parentKey === 'dev-portal',
      icon: 'devPortal',
      items: [
        {
          name: 'Published Services',
          to: '/?published-services',
          active: activeItem.value?.name === 'Published Services',
        },
        {
          name: 'Appearance',
          to: '/?appearance',
          active: activeItem.value?.name === 'Appearance',
        },
        {
          name: 'Access Requests',
          to: '/?access-requests',
          active: activeItem.value?.name === 'Access Requests',
          badgeCount: 100,
        },
        {
          name: 'Developers',
          to: '/?developers',
          active: activeItem.value?.name === 'Developers',
        },
        {
          name: 'Applications',
          to: '/?applications',
          active: activeItem.value?.name === 'Applications',
        },
        {
          name: 'Settings',
          to: '/?settings',
          active: activeItem.value?.name === 'Settings',
        },
      ],
    },
    {
      name: 'Analytics',
      key: 'analytics',
      to: '/?analytics',
      active: (activeItem.value as SidebarPrimaryItem)?.key === 'analytics',
      // This item can always show the subnav
      expanded: (activeItem.value as SidebarPrimaryItem)?.key === 'analytics' || (activeItem.value as SidebarSecondaryItem)?.parentKey === 'analytics',
      icon: 'vitalsChart',
      items: [
        {
          name: 'Overview',
          to: '/?overview',
          active: activeItem.value?.name === 'Overview',
        },
        {
          name: 'Reports',
          to: '/?reports',
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
      to: '/?organization',
      active: (activeItem.value as SidebarPrimaryItem)?.key === 'organization',
      // This item can always show the subnav
      expanded: (activeItem.value as SidebarPrimaryItem)?.key === 'organization' || (activeItem.value as SidebarSecondaryItem)?.parentKey === 'organization',
      icon: 'organizations',
      items: [
        {
          name: 'Teams',
          to: '/?teams',
          active: activeItem.value?.name === 'Teams',
        },
        {
          name: 'Users',
          to: '/?users',
          active: activeItem.value?.name === 'Users',
        },
      ],
    },
    {
      name: 'Settings',
      key: 'settings',
      to: '/?settings',
      active: (activeItem.value as SidebarPrimaryItem)?.key === 'settings',
      // This item can always show the subnav
      expanded: (activeItem.value as SidebarPrimaryItem)?.key === 'settings' || (activeItem.value as SidebarSecondaryItem)?.parentKey === 'settings',
      icon: 'cogwheel',
      items: [
        {
          name: 'Billing and Usage',
          to: '/?billing-and-usage',
          active: activeItem.value?.name === 'Billing and Usage',
        },
        {
          name: 'Auth Settings',
          to: '/?auth-settings',
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
      to: '/?personal-access-tokens',
    },
    {
      name: 'External',
      to: 'https://google.com/',
      newWindow: true,
    },
    {
      name: 'Logout',
      to: '/?logout',
      hasDivider: true,
    },
  ]
})

// const showAlert = ref(true)
// const handleCloseAlert = (): void => {
//   showAlert.value = false
// }
</script>

<style lang="scss" scoped>
.sidebar-top-slot-content {
  align-content: center;
  display: flex;
  justify-content: center;
  width: 100%;
}

.navbar-logo-link {
  display: flex;
  align-items: center;
}

.logo-title {
  display: none;
  padding-left: 16px;

  @media (min-width: 640px) { // $viewport-sm
    display: flex;
  }
}
</style>
