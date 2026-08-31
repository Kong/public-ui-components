<template>
  <div class="sandbox-container">
    <SecretInput
      v-model.trim="value"
      label="Secret"
    />
    <pre>modelValue: {{ value }}</pre>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { SecretInput } from '../../src'

const value = ref('super-secret')
</script>

<style lang="scss" scoped>
.sandbox-container {
  max-width: 600px;
}
</style>
