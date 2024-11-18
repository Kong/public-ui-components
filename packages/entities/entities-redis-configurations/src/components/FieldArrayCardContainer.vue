<template>
  <div class="array-card-container">
    <KCard class="card">
      <slot />
    </KCard>

    <KButton
      appearance="tertiary"
      class="array-card-remove-button"
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
    type: Object,
    default: () => null,
  },
  schema: {
    type: Object,
    default: () => null,
  },
  index: {
    type: Number,
    default: undefined,
  },
})

defineEmits<{
  (e: 'remove-item'): void,
}>()

</script>

<style lang='scss'>
.array-card-container-wrapper {
  width: 100%;
}
</style>

<style lang="scss" scoped>
.array-card-container {
  align-items: center;
  display: flex;

  .card {
    margin-bottom: $kui-space-40;
  }

  .array-card-remove-button {
    margin-left: $kui-space-50;
  }
}
</style>
