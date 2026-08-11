<template>
  <div class="page-layout-sandbox-wrapper">
    <PageLayout
      back-to="/"
      :breadcrumbs="breadcrumbs"
      :page-shortcut-data="pageShortcutData"
      :tabs="tabs"
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
      <template #title-after>
        <KBadge>Info</KBadge>
      </template>
      <template #tab-gateway-services="{ tab }">
        {{ tab.label }}

        <KBadge size="small">
          2
        </KBadge>
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
    </PageLayout>
  </div>
</template>

<script setup lang="ts">
import { provide, reactive } from 'vue'
import { PageLayout } from '../../src'
import type { PageLayoutTab, PageShortcutData } from '../../src'
import { MoreIcon } from '@kong/icons'

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

const pageShortcutData: PageShortcutData = {
  label: 'Home',
  path: '/',
  entityType: 'sandbox',
}
</script>

<style lang="scss" scoped>
.page-layout-sandbox-wrapper {
  overflow-x: auto;
  resize: horizontal;
  width: 90%;
}
</style>
