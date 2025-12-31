<script setup lang="ts">
import { Position, Handle } from '@vue-flow/core'
</script>

<template>
  <div class="main-node">
    <img src="../assets/apiruler-logo.png" height="80px" width="80px" alt="apiruler-logo">

    <Handle type="source" :position="Position.Bottom" />
  </div>
</template>

<style lang="css">
.main-node {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
