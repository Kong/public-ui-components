<template>
  <SandboxLayout
    :links="appLinks"
    title="Empty Dashboard"
  >
    <DashboardEmptyState
      :ghost-tiles="ghostTiles"
      message="This is my custom message"
      @add-tile="handleAddTile"
    />
  </SandboxLayout>
</template>

<script setup lang="ts">
import { inject, ref } from 'vue'
import type { SandboxNavigationItem } from '@kong-ui-public/sandbox-layout'
import { SandboxLayout } from '@kong-ui-public/sandbox-layout'
import DashboardEmptyState from '../../src/components/DashboardEmptyState.vue'

const appLinks: SandboxNavigationItem[] = inject('app-links', [])

const ghostTiles = ref(2)

const handleAddTile = () => {
  console.log('@add-tile')
  ghostTiles.value += 1
}
</script>
