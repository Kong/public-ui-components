<template>
  <PageLayout
    :breadcrumbs="breadcrumbs"
    konnect-layout-next
    page-title="Overview"
    :tabs="tabs"
    title="Umbrella R&D Dev"
  >
    <template #actions>
      <KButton
        appearance="secondary"
        icon
      >
        <BookIcon />
      </KButton>
      <KButton>
        Create
        <ChevronDownIcon />
      </KButton>
    </template>
  </PageLayout>
</template>

<script setup lang="ts">
import { PageLayout } from '../../src'
import type { PageLayoutNavbarTabs } from '../../src'
import { KButton } from '@kong/kongponents'
import { ChevronDownIcon } from '@kong/icons'
import { BookIcon } from '@kong/icons'

import '@kong/kongponents/dist/style.css'

const breadcrumbs = [{
  key: 'api-gateway',
  text: 'API Gateway',
},
{
  key: 'gateways',
  text: 'Gateways',
}]

const tabs: PageLayoutNavbarTabs = {
  overview: {
    name: 'Overview',
    to: '/',
    active: true,
  },
  gatewayServices: {
    name: 'Gateway services',
    to: '/gateway-services',
  },
  routes: {
    name: 'Routes',
    to: '/routes',
  },
  plugins: {
    name: 'Plugins',
    to: '/plugins',
  },
  redisConfigurations: {
    name: 'Redis configurations',
    to: '/redis-configurations',
  },
  upstreams: {
    name: 'Upstreams',
    to: '/upstreams',
  },
  certificates: {
    name: 'Certificates',
    to: '/certificates',
  },
  snis: {
    name: 'SNIs',
    to: '/snis',
  },
  vaults: {
    name: 'Vaults',
    to: '/vaults',
  },
  keys: {
    name: 'Keys',
    to: '/keys',
  },
}
</script>
