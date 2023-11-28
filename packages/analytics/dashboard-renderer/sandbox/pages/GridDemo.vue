<template>
  <SandboxLayout
    :links="appLinks"
    title="Grid Demo"
  >
    <GridLayout
      :grid-size="{ cols: 6, rows: 9 }"
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
  { id: 'Metrics1', layout: { position: { col: 0, row: 0 }, size: { cols: 2, rows: 1 } } },
  { id: 'Metrics2', layout: { position: { col: 2, row: 0 }, size: { cols: 2, rows: 1 } } },
  { id: 'Metrics3', layout: { position: { col: 4, row: 0 }, size: { cols: 2, rows: 1 } } },
  { id: 'Chart1', layout: { position: { col: 0, row: 1 }, size: { cols: 3, rows: 2 } } },
  { id: 'Chart2', layout: { position: { col: 3, row: 1 }, size: { cols: 3, rows: 2 } } },
  { id: 'Chart3', layout: { position: { col: 0, row: 3 }, size: { cols: 6, rows: 2 } } },
  { id: 'Chart4', layout: { position: { col: 0, row: 5 }, size: { cols: 3, rows: 2 } } },
  { id: 'Chart5', layout: { position: { col: 3, row: 5 }, size: { cols: 3, rows: 2 } } },
]
</script>

<style lang="scss" scoped>
  .tile-content {
    border: 1px solid lightgray;
    width: 100%;
    height: 100%;
  }
</style>
