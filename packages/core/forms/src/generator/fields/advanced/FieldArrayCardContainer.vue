<template>
  <div class="array-card-container">
    <KCard class="card">
      <template #body>
        <slot />
      </template>
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

<script>
import { TrashIcon } from '@kong/icons'
export default {
  name: 'FieldArrayCardContainer',

  components: { TrashIcon },

  props: {
    model: {
      type: Object,
      default: null,
    },
    schema: {
      type: Object,
      default: null,
    },
  },

  emits: ['remove-item'],
}
</script>

<style lang='scss'>
.array-card-container-wrapper {
  width: 100%;

  .kong-card {
    width: 50%;
  }
}
</style>

<style lang="scss" scoped>
.array-card-container {
  align-items: center;
  display: flex;

  .card {
    margin-bottom: 8px;
  }

  .array-card-remove-button {
    margin-left: 12px;
  }
}
</style>
