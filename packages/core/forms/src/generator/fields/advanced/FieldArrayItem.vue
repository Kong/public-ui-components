<template>
  <div class="array-item">
    <slot />
    <KButton
      appearance="tertiary"
      class="delete"
      @click="$emit('remove-item')"
    >
      <TrashIcon />
    </KButton>
  </div>
</template>

<script lang="ts" setup>
import { TrashIcon } from '@kong/icons'

defineProps({
  model: {
    type: String,
    default: '',
  },
})

defineEmits<{
  (event: 'remove-item'): void,
}>()
</script>

<style lang="scss" scoped>
.array-item {
  display: flex;
  width: 100%;

  :deep(.k-button) {
    &.delete {
      align-self: center;
      height: 100%;
      margin-left: $kui-space-70;
    }
  }
}
</style>
