<template>
  <SandboxLayout
    :links="appLinks"
    title="Fallback"
  >
    <p>
      <span>Path: </span>
      <code>{{ route.path }}</code>
    </p>
    <p>
      <span>Name: </span>
      <code>{{ route.name }}</code>
    </p>
    <p>
      <span>Params: </span>
      <code>{{ route.params }}</code>
    </p>
  </SandboxLayout>
</template>

<script setup lang="ts">
import { inject } from 'vue'
import { useRoute } from 'vue-router'
import type { SandboxNavigationItem } from '@kong-ui-public/sandbox-layout'

const route = useRoute()

// Inject the app-links from the entry file
const appLinks: SandboxNavigationItem[] = inject('app-links', [])
</script>
