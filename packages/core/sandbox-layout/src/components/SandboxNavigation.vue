<template>
  <nav>
    <ul
      v-if="navLinks.length"
      class="kong-ui-sandbox-navigation"
    >
      <li
        v-for="link in navLinks"
        :key="link.name"
        class="sandbox-link"
      >
        <router-link
          :to="link.to"
          @click="emit('router-link-click', link)"
        >
          {{ link.name }}
        </router-link>
      </li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
import { inject } from 'vue'
import { KONG_UI_SANDBOX_LAYOUT_LINKS_INJECTION_KEY } from '../constants'
import type { SandboxNavigationItem } from '../types'
import type { RouteLocationRaw } from 'vue-router'

const emit = defineEmits<{
  (e: 'router-link-click', link: RouteLocationRaw): void
}>()

const navLinks: SandboxNavigationItem[] = inject(KONG_UI_SANDBOX_LAYOUT_LINKS_INJECTION_KEY, [])
</script>

<style lang="scss" scoped>
.kong-ui-sandbox-navigation {
  list-style: none;
  margin: var(--kui-space-0, $kui-space-0);
  padding: var(--kui-space-0, $kui-space-0);

  .sandbox-link {
    margin-bottom: var(--kui-space-40, $kui-space-40);

    &:last-of-type {
      margin-bottom: 0;
    }

    a {
      background: #eee;
      border-radius: var(--kui-border-radius-20, $kui-border-radius-20);
      color: var(--kui-color-text-primary, $kui-color-text-primary);
      display: block;
      font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
      overflow: hidden;
      padding: var(--kui-space-40, $kui-space-40) var(--kui-space-60, $kui-space-60);
      text-decoration: none;
      text-overflow: ellipsis;
      transition: all var(--kui-animation-duration-20, $kui-animation-duration-20) ease-in-out;
      white-space: nowrap;

      &:hover {
        background: #ccc;
        color: var(--kui-color-text-primary-stronger, $kui-color-text-primary-stronger);
      }

      &.router-link-exact-active,
      &.active {
        background: var(--kui-color-background-primary, $kui-color-background-primary);
        color: var(--kui-color-text-inverse, $kui-color-text-inverse);

        &:hover {
          background: var(--kui-color-background-primary, $kui-color-background-primary);
          color: var(--kui-color-text-inverse, $kui-color-text-inverse);
        }
      }
    }
  }
}
</style>

<style lang="scss">
// Unscoped to control page elements
html, body {
  margin: 0;
  padding: 0;
}
</style>
