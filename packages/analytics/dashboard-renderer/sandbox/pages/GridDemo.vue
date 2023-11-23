<template>
  <SandboxLayout
    :links="appLinks"
    title="Grid Demo"
  >
    <GridLayout
      :grid-size="{ cols: 6, rows: 9 }"
      :tile-height="150"
      :tile-width="150"
      :tiles="tiles"
    >
      <template #tile="{ tile }">
        <div class="tile-content">
          {{ tile.id }}
        </div>
      </template>
    </GridLayout>
  </SandboxLayout>
</template>

<script setup lang="ts">
import { GridLayout } from '../../src'
import type { SandboxNavigationItem } from '@kong-ui-public/sandbox-layout'
import { SandboxLayout } from '@kong-ui-public/sandbox-layout'
import { inject } from 'vue'

const appLinks: SandboxNavigationItem[] = inject('app-links', [])

const tiles = [
  { id: 'Metrics1', position: { col: 1, row: 1 }, size: { cols: 2, rows: 1 } },
  { id: 'Metrics2', position: { col: 3, row: 1 }, size: { cols: 2, rows: 1 } },
  { id: 'Metrics3', position: { col: 5, row: 1 }, size: { cols: 2, rows: 1 } },
  { id: 'Chart1', position: { col: 1, row: 2 }, size: { cols: 3, rows: 2 } },
  { id: 'Chart2', position: { col: 4, row: 2 }, size: { cols: 3, rows: 2 } },
  { id: 'Chart3', position: { col: 1, row: 4 }, size: { cols: 6, rows: 2 } },
  { id: 'Chart4', position: { col: 1, row: 6 }, size: { cols: 3, rows: 2 } },
  { id: 'Chart5', position: { col: 4, row: 6 }, size: { cols: 3, rows: 2 } },
]
</script>

<style lang="scss" scoped>
  .tile-content {
    border: 1px solid lightgray;
    width: 100%;
    height: 100%;
  }
</style>
