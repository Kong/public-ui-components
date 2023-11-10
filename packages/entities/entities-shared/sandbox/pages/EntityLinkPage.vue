<template>
  <div class="sandbox-container">
    <main>
      <EntityLink
        :entity-link-data="record"
        route-name="show-gateway-service"
        :route-params="routeParams"
      />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { EntityLink } from '../../src'

const visible = ref(false)
const loading = ref(false)

const record = {
  id: 'd5ac5d88-efed-4e10-9dfe-0b0a6646c219:2a3e9d21-804b-4b3b-ab7e-c6f002dadbf4',
  name: 'record-name',
  label: 'dp-mock-msg-per-sec-us-dev',
  deleted: false,
}

const routeParams = {
  control_plane_id: 'd5ac5d88-efed-4e10-9dfe-0b0a6646c219',
  route: '2a3e9d21-804b-4b3b-ab7e-c6f002dadbf4',
}
</script>
