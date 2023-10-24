<template>
  <SandboxLayout
    :links="links"
    title="Sandbox Layout"
  >
    <p>This is the page content.</p>

    <template #controls>
      <p>This is the control content.</p>
    </template>
  </SandboxLayout>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { SandboxLayout } from '../../src'
import type { SandboxNavigationItem } from '../../src'

const links = computed((): SandboxNavigationItem[] => ([
  {
    name: 'Home',
    to: { name: 'home' },
  },
  {
    name: 'About',
    to: { name: 'about' },
  },
]))
</script>
