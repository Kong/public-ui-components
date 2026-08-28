<template>
  <!-- A disabled Teleport can cache a null target when both mount in the same tree. -->
  <Teleport
    v-if="hasTarget"
    :to="to"
  >
    <slot />
  </Teleport>
  <slot v-else />
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'

const { to } = defineProps<{
  to: string
}>()

const hasTarget = ref(false)

onMounted(() => {
  hasTarget.value = !!document.querySelector(to)
})
</script>
