<template>
  <PageLayout
    :breadcrumbs="breadcrumbs"
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
import type { PageLayoutTab } from '../../src'
import { ChevronDownIcon } from '@kong/icons'
import { BookIcon } from '@kong/icons'

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
</script>
