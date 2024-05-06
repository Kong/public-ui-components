<template>
  <Teleport
    v-if="isMounted"
    :to="to"
  >
    <slot />
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
defineProps({
  to: {
    type: String,
    required: true,
  },
})

const isMounted = ref(false)
onMounted(() => {
  isMounted.value = true
})
</script>

<style scoped>

</style>
