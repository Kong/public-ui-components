<template>
  <h2>Change Log Level Modal</h2>
  <KButton @click="visible = true">
    Open
  </KButton>
  <ChangeLogLevelModal
    v-model:visible="visible"
    :config="config"
    :nodes="nodes"
    @success="visible = false"
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
</script>
