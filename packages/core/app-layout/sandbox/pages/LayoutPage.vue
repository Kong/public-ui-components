<template>
  <AppLayout
    :sidebar-bottom-items="sidebarItemsBottom"
    :sidebar-hidden="sidebarIsHidden"
    :sidebar-top-items="sidebarItemsTop"
    @sidebar-click="sidebarItemClick"
  >
    <template #notification>
      <KAlert
        v-if="showAlert"
        appearance="warning"
        message="I'm an alert from the host app"
        @dismiss="handleCloseAlert"
      />
    </template>
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
          { label: userNameAndEmail, to: '/' },
          { label: 'My Account', to: '/', hasDivider: true },
          { label: 'Personal Account Tokens', to: '/' },
          { label: 'Log Out', to: '/', hasDivider: true },
        ]"
        user-initials="JJ"
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
        <div>Top Slot Content</div>
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
    <template #sidebar-icon-mesh-manager>
      <MeshIcon :size="KUI_ICON_SIZE_40" />
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
    <template #sidebar-footer>
      <div class="sidebar-footer-slot-content">
        <div>Footer Slot Content</div>
      </div>
    </template>

    <!-- Default slot content -->

    <p>This is the top.</p>

    <div class="collapsible-sections-container">
      <AppPageInfoSection
        description="This is a collapsible section that's rendered collapsed by default. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
        title="Collapsible section"
      >
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Id quidem aperiam similique vitae beatae. Repellat quam voluptas vitae, maxime consequuntur praesentium et suscipit. Numquam aliquid nulla vel esse accusantium reiciendis error?
      </AppPageInfoSection>

      <AppPageInfoSection
        description="This is a collapsible section that's rendered open by default. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
        open
        title="Collapsible section"
        title-tag="h2"
      >
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Id quidem aperiam similique vitae beatae. Repellat quam voluptas vitae, maxime consequuntur praesentium et suscipit. Numquam aliquid nulla vel esse accusantium reiciendis error?
      </AppPageInfoSection>

      <KComponent
        v-slot="{ data }"
        :data="{ toggleModel: true }"
      >
        <AppPageInfoSection
          :collapsible="false"
          description="This is a non-collapsible section with a toggle in the header. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
          title="Non-collapsible section"
        >
          <template #actions>
            <KInputSwitch v-model="data.toggleModel" />
          </template>

          Lorem ipsum dolor sit amet consectetur adipisicing elit. Id quidem aperiam similique vitae beatae. Repellat quam voluptas vitae, maxime consequuntur praesentium et suscipit. Numquam aliquid nulla vel esse accusantium reiciendis error?
        </AppPageInfoSection>
      </KComponent>
    </div>

    <p
      v-for="index in 3"
      :key="index"
    >
      Lorem ipsum dolor sit amet consectetur adipisicing elit. Id quidem aperiam similique vitae beatae. Repellat quam voluptas vitae, maxime consequuntur praesentium et suscipit. Numquam aliquid nulla vel esse accusantium reiciendis error?
    </p>

    <p>This is the bottom.</p>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
// Sandbox only
import type { SidebarPrimaryItem, SidebarSecondaryItem } from '../../src'
import { AccountDropdown } from '../../src'
import NavLinks from '../components/NavLinks.vue'
import AppGruceLogo from '../components/icons/AppGruceLogo.vue'
import AppLogo from '../components/icons/AppLogo.vue'
import { OverviewIcon, RuntimesIcon, ServiceHubIcon, MeshIcon, DevPortalIcon, BarChartIcon, PeopleIcon, CogIcon } from '@kong/icons'
import { KUI_ICON_SIZE_40 } from '@kong/design-tokens'
import AppPageInfoSection from '../../src/components/pageInfoSection/AppPageInfoSection.vue'

const userNameAndEmail = ref<string>('Jackie Jiang\njackie.jiang@konghq.com')

const sidebarIsHidden = ref<boolean>(false)
const toggleSidebar = (): void => {
  sidebarIsHidden.value = !sidebarIsHidden.value
}

const activeItem = ref<SidebarPrimaryItem | SidebarSecondaryItem>()

const sidebarItemClick = (item: SidebarPrimaryItem | SidebarSecondaryItem): void => {
  activeItem.value = item
  console.log('activeItem: %o', activeItem.value)
}

const sidebarItemsTop = computed((): SidebarPrimaryItem[] => {
  return [
    {
      name: 'Overview',
      to: '/?overview',
      key: 'overview',
      // TODO: using this item as a default when `activeItem` is undefined
      active: !activeItem.value || (activeItem.value as SidebarPrimaryItem)?.key === 'overview',
    },
    {
      name: 'Gateway Manager',
      to: '/?runtime-manager',
      label: 'retail-sandbox-rg', // runtime group name
      key: 'gateway-manager',
      active: (activeItem.value as SidebarPrimaryItem)?.key === 'gateway-manager',
      // TODO: actually when you click on Runtime Manager it would not expand until the user picks a runtime group
      expanded: (activeItem.value as SidebarPrimaryItem)?.key === 'gateway-manager' || (activeItem.value as SidebarSecondaryItem)?.parentKey === 'gateway-manager',
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
          name: 'Access And Approvals',
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

const showAlert = ref(true)
const handleCloseAlert = (): void => {
  showAlert.value = false
}
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

.collapsible-sections-container {
  display: flex;
  flex-direction: column;
  gap: $kui-space-50;
}
</style>
