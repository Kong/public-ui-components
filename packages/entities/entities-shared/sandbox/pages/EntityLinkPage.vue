<template>
  <div class="sandbox-container">
    <main>
      <EntityLink
        :entity-link-data="(record as EntityLinkData)"
        :external-link="generateEntityUrl(routeParams)"
      />
    </main>
  </div>
</template>

<script setup lang="ts">
import { EntityLink } from '../../src'
import type { EntityLinkData } from '../../src/types'
import composables from '../../src/composables'

const record = {
  id: 'd5ac5d88-efed-4e10-9dfe-0b0a6646c219:2a3e9d21-804b-4b3b-ab7e-c6f002dadbf4',
  name: 'record-name',
  label: 'dp-mock-msg-per-sec-us-dev',
  deleted: false,
}

const routeParams = [
  'gateway-manager',
  'd5ac5d88-efed-4e10-9dfe-0b0a6646c219',
  'routes',
  '2a3e9d21-804b-4b3b-ab7e-c6f002dadbf4',
]

const generateEntityUrl = (routeParams: string[]) => composables.useExternalLinkCreator(routeParams)
</script>
