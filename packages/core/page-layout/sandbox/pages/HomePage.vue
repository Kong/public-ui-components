<template>
  <div class="page-layout-sandbox-wrapper">
    <PageLayout
      back-to="/"
      :breadcrumbs="breadcrumbs"
      :page-shortcut-data="showFavoriteButton ? pageShortcutData : undefined"
      :tabs="showTabs ? tabs : []"
    >
      <template #title>
        <h1>Umbrella R&D Dev</h1>
      </template>
      <template #actions>
        <KButton
          appearance="secondary"
          icon
        >
          <MoreIcon />
        </KButton>
      </template>
      <template
        v-if="showTitleAfter"
        #title-after
      >
        <KBadge>Info</KBadge>
      </template>
      <template #tab-gateway-services="{ tab }">
        {{ tab.label }}

        <KBadge size="small">
          2
        </KBadge>
      </template>
      <template #default>
        <NestedPage />
      </template>
      <template #tab-keys="{ tab }">
        {{ tab.label }}

        <KBadge
          appearance="decorative"
          size="small"
        >
          New
        </KBadge>
      </template>
      <template
        v-if="showAside"
        #aside
      >
        <KCard title="Summary">
          Aside content. Drag the handle at the bottom right of the sandbox to narrow the
          layout: the aside drops above the page content once the layout (not the window)
          is narrower than the tablet breakpoint.
        </KCard>
      </template>
    </PageLayout>

    <!-- Teleported from "outside" PageLayout, the way the app shell owns the Ask Kai button.
         `pageLayoutMounted` stands in for that: the target only exists once PageLayout has rendered. -->
    <Teleport
      v-if="pageLayoutMounted && showAskKaiButton"
      to="[data-teleport-target='ask-kai']"
    >
      <KButton appearance="secondary">
        Ask Kai
      </KButton>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { onMounted, provide, reactive, ref } from 'vue'
import { NEW_APPEARANCE_INJECTION_KEY, PageLayout } from '../../src'
import type { PageLayoutTab, PageShortcutData } from '../../src'
import { MoreIcon } from '@kong/icons'
import NestedPage from './NestedPage.vue'
import { useSandboxControls } from '../composables/useSandboxControls'

const { newAppearance, showTabs, showFavoriteButton, showTitleAfter, showAside, showAskKaiButton } = useSandboxControls()

const pageLayoutMounted = ref<boolean>(false)

onMounted(() => {
  pageLayoutMounted.value = true
})

const breadcrumbs = [{
  key: 'api-gateway',
  text: 'API Gateway',
  to: '/',
},
{
  key: 'gateways',
  text: 'Gateways',
  to: '/',
}]

const tabs: PageLayoutTab[] = [
  {
    key: 'overview',
    label: 'Overview',
    to: '/',
    active: true,
  },
  {
    key: 'gateway-services',
    label: 'Gateway services',
    to: { path: '/gateway-services' },
  },
  {
    key: 'routes',
    label: 'Routes',
    to: '/routes',
  },
  {
    key: 'plugins',
    label: 'Plugins',
    to: '/plugins',
  },
  {
    key: 'redis-configurations',
    label: 'Redis configurations',
    to: '/redis-configurations',
  },
  {
    key: 'upstreams',
    label: 'Upstreams',
    to: '/upstreams',
  },
  {
    key: 'certificates',
    label: 'Certificates',
    to: '/certificates',
  },
  {
    key: 'snis',
    label: 'SNIs',
    to: '/snis',
  },
  {
    key: 'vaults',
    label: 'Vaults',
    to: '/vaults',
  },
  {
    key: 'keys',
    label: 'Keys',
    to: '/keys',
  },
]

const pageShortcutsContext = reactive({
  isFavorite: false,
  onFavoriteToggle: () => {
    pageShortcutsContext.isFavorite = !pageShortcutsContext.isFavorite
  },
  onEntityPageVisit: () => {
    console.log('onEntityPageVisit')
  },
})

provide('app:pageShortcutsContext', pageShortcutsContext)

// The host app owns the appearance: PageLayout reads it through inject. Providing the
// ref itself keeps it reactive to the sandbox toggle.
provide(NEW_APPEARANCE_INJECTION_KEY, newAppearance)

const pageShortcutData: PageShortcutData = {
  label: 'Home',
  path: '/',
  entityType: 'sandbox',
}
</script>

<style lang="scss" scoped>
.page-layout-sandbox-wrapper {
  // `overflow-x: auto` computes `overflow-y` to `auto` too, which makes this element the
  // nearest scroll container for the sticky header inside it. Bounding the height gives it
  // something to actually scroll, so the sticky behaviour is demonstrable here.
  max-height: 80vh;
  overflow: auto;
  resize: horizontal;
  width: 90%;
}
</style>
