<template>
  <h2>Change Log Level Modal</h2>
  <KButton @click="visible = true">
    Open
  </KButton>
  <ChangeLogLevelModal
    v-model:visible="visible"
    :config="config"
    :get-node-detail-route="getNodeDetailRoute"
    :nodes="nodes"
    @close="visible = false"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ChangeLogLevelModal, type ChangeLogLevelConfig } from '../../src'

const visible = ref<boolean>(false)

const config: ChangeLogLevelConfig = {
  app: 'konnect',
  apiBaseUrl: '',
  controlPlaneId: 'demo-cp-id',
}

const nodes = [
  { id: '1', hostname: 'localhost-1' },
  { id: '2', hostname: 'localhost-2' },
]

const getNodeDetailRoute = (nodeId: string): string => `${window.location.origin}/data-plane-nodes/${nodeId}`
</script>
