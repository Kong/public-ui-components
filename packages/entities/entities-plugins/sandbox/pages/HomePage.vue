<template>
  <SandboxLayout
    :links="appLinks"
    title="Entities Plugins"
  >
    <ul>
      <li>
        <router-link :to="{ name: 'list-plugin' }">
          PluginList
        </router-link>
      </li>
      <li>
        <router-link :to="{ name: 'plugin-form-playground' }">
          PluginForm Playground
        </router-link>
      </li>
      <li>
        <router-link :to="{ name: 'free-form' }">
          Free Form (Mocking Schema)
        </router-link>
      </li>
      <li>
        <router-link :to="{ name: 'create-custom-plugin' }">
          Custom Plugin Form
        </router-link>
      </li>
      <li>
        <router-link :to="{ name: 'plugin-catalog' }">
          Plugin catalog
        </router-link>
      </li>
      <li>
        <router-link :to="{ name: 'auth-plugin-onboarding-card' }">
          Auth plugin onboarding card
        </router-link>
      </li>
    </ul>
  </SandboxLayout>
</template>

<script setup lang="ts">
import { inject } from 'vue'
import type { SandboxNavigationItem } from '@kong-ui-public/sandbox-layout'

// Inject the app-links from the entry file
const appLinks: SandboxNavigationItem[] = inject('app-links', [])
</script>
