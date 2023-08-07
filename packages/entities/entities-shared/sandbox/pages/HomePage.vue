<template>
  <ul>
    <li
      v-for="link in links"
      :key="link.path"
    >
      <router-link :to="link.path">
        {{ link.label }}
      </router-link>
    </li>
  </ul>
</template>

<script setup lang="ts">
import { routes } from '../routes'

const links = routes.filter(route => route.name !== 'home')
</script>
