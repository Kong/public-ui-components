<template>
  <div class="array-card-container">
    <KCard class="card">
      <template #body>
        <slot />
      </template>
    </KCard>

    <KButton
      @click="$emit('remove-item')"
    >
      <template #icon>
        <KIcon
          icon="trash"
          size="18"
        />
      </template>
    </KButton>
  </div>
</template>

<script>
export default {
  name: 'FieldArrayCardContainer',

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
  display: flex;

  .card {
    margin-bottom: 8px;
  }
}
</style>
