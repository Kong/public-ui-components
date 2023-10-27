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
  margin: $kui-space-0;
  padding: $kui-space-0;

  .sandbox-link {
    margin-bottom: $kui-space-40;

    &:last-of-type {
      margin-bottom: 0;
    }

    a {
      background: #eee;
      border-radius: $kui-border-radius-20;
      color: $kui-color-text-primary;
      display: block;
      font-weight: $kui-font-weight-semibold;
      overflow: hidden;
      padding: $kui-space-40 $kui-space-60;
      text-decoration: none;
      text-overflow: ellipsis;
      transition: all $kui-animation-duration-20 ease-in-out;
      white-space: nowrap;

      &:hover {
        background: #ccc;
        color: $kui-color-text-primary-stronger;
      }

      &.router-link-exact-active,
      &.active {
        background: $kui-color-background-primary;
        color: $kui-color-text-inverse;

        &:hover {
          background: $kui-color-background-primary;
          color: $kui-color-text-inverse;
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
