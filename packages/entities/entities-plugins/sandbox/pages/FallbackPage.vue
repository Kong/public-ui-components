<template>
  <SandboxPage title="Fallback">
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
  </SandboxPage>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import SandboxPage from '../SandboxPage.vue'

const route = useRoute()
</script>
