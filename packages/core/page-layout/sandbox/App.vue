<template>
  <div class="sandbox-container">
    <main>
      <PageLayout
        :breadcrumbs="breadcrumbs"
        konnect-layout-next
        :tabs="tabs"
        title="Umbrella R&D Dev"
      />
    </main>
  </div>
</template>

<script setup lang="ts">
import { PageLayout } from '../src'
import type { PageLayoutNavbarTabs } from '../src'

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
