<template>
  <h2>Kong Manager API</h2>
  <KButton @click="visible = true">
    Open
  </KButton>
  <ChangeLogLevelModal
    v-model:visible="visible"
    :instance-list="[]"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ChangeLogLevelModal } from '../../src'

const visible = ref<boolean>(false)
</script>

<style lang="scss" scoped>
</style>
