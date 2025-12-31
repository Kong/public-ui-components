<script lang="ts" setup>
import { Background } from '@vue-flow/background'
</script>

<template>
  <div class="dropzone-background">
    <Background
      :gap="20"
      pattern-color="#BDBDBD"
      :size="2"
    />

    <div class="overlay">
      <slot />
    </div>
  </div>
</template>
