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
import { provide } from 'vue'
import { TrashIcon } from '@kong/icons'

const props = defineProps({
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
  (e: 'remove-item'): void
}>()

provide('vfg-array-item-index', props.index)
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
    margin-bottom: var(--kui-space-40, $kui-space-40);
  }

  .array-card-remove-button {
    margin-left: var(--kui-space-50, $kui-space-50);
  }
}
</style>
