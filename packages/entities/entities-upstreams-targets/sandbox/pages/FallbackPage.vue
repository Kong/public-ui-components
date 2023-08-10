<template>
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
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
const route = useRoute()
</script>
