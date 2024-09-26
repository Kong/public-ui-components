<template>
  <Teleport
    v-if="teleportTarget"
    :to="teleportTarget"
  >
    <slot />
  </Teleport>
  <div v-else>
    <slot />
  </div>
</template>

<script setup lang="ts">
defineProps({
  teleportTarget: {
    type: String,
    default: '',
  },
})
</script>
