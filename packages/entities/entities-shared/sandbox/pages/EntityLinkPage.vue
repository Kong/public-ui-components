<template>
  <div class="sandbox-container">
    <main>
      <h3>Resolved entity w/ External link and Copy ID button</h3>
      <EntityLink
        :entity-link-data="(record as EntityLinkData)"
        :external-link="generateEntityUrl(routeParams)"
      />

      <h3>Resolved entity with local link</h3>
      <EntityLink
        :allow-copy="false"
        :entity-link-data="(record as EntityLinkData)"
        :external-link="generateEntityUrl(routeParams)"
        :new-window="false"
      />

      <h3>Resolved entity with Copy ID button</h3>
      <EntityLink
        allow-copy
        :entity-link-data="(record as EntityLinkData)"
        :external-link="generateEntityUrl(routeParams)"
        :new-window="false"
      />

      <h3>Deleted entity</h3>
      <EntityLink
        :entity-link-data="(deletedRecord as EntityLinkData)"
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
  id: 'e662e086-84b2-11ee-b962-0242ac120002:ece8ecac-84b2-11ee-b962-0242ac120002',
  name: 'record-name',
  label: 'dp-mock-msg-per-sec-us-dev',
  deleted: false,
}

const deletedRecord = {
  ...record,
  deleted: true,
}

const routeParams = [
  'gateway-manager',
  record?.id.toString().split(':')[0],
  'routes',
  record?.id.toString().split(':')[1],
]

const generateEntityUrl = (routeParams: string[]) => composables.useExternalLinkCreator(routeParams)
</script>
