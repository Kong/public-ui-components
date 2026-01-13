<template>
  <main class="sandbox-container">
    <SplitPaneLayout>
      <template #left-pane>
        left pane for navigation items
      </template>
      <template #middle-pane>
        middle pane for editor
      </template>
      <template #right-pane>
        right pane for preview
      </template>
    </SplitPaneLayout>
  </main>
</template>

<script setup lang="ts">
import { SplitPaneLayout } from '../src'
</script>
