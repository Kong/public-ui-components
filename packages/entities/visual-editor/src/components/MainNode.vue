<script setup lang="ts">
import { Position, Handle } from '@vue-flow/core'
</script>

<template>
  <div class="main-node">
    <img
      alt="apiruler-logo"
      height="80px"
      src="../assets/apiruler-logo.png"
      width="80px"
    >

    <Handle
      :position="Position.Bottom"
      type="source"
    />
  </div>
</template>

<style lang="css">
.main-node {
  align-items: center;
  border-radius: 50%;
  display: flex;
  height: 80px;
  justify-content: center;
  width: 80px;
}
</style>
