<template>
  <SandboxLayout
    :links="APP_LINKS"
    :title="title"
  >
    <template
      v-if="$slots.controls"
      #controls
    >
      <slot name="controls" />
    </template>

    <slot />
  </SandboxLayout>
</template>

<script setup lang="ts">
import { SandboxLayout } from '@kong-ui-public/sandbox-layout'
import type { SandboxNavigationItem } from '@kong-ui-public/sandbox-layout'

defineProps<{
  title?: string
}>()

// The sandbox's nav links, shared by every page through this wrapper —
// no provide/inject indirection needed since there's only one sandbox app.
const APP_LINKS: SandboxNavigationItem[] = [
  {
    name: 'PluginList',
    to: { name: 'list-plugin' },
  },
  {
    name: 'PluginForm Playground',
    to: { name: 'plugin-form-playground' },
  },
  {
    name: 'Free Form (Mocking Schema)',
    to: { name: 'free-form' },
  },
  {
    name: 'Custom Plugin Form',
    to: { name: 'create-custom-plugin' },
  },
  {
    name: 'Plugin catalog',
    to: { name: 'plugin-catalog' },
  },
  {
    name: 'Auth plugin onboarding card',
    to: { name: 'auth-plugin-onboarding-card' },
  },
]
</script>
