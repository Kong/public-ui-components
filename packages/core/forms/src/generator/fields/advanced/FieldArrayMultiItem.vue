<template>
  <div class="multi-item-wrapper">
    <slot />
    <KButton
      appearance="danger"
      class="delete"
      @click="$emit('remove-item')"
    >
      - Remove Field
    </KButton>
    <hr>
  </div>
</template>

<script lang="ts" setup>
defineEmits<{
  (event: 'remove-item'): void,
}>()
</script>

<style lang="scss" scoped>
.multi-item-wrapper {
  width: 100%;
}
</style>
