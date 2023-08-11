<template>
  <div class="multi-item-wrapper">
    <slot />
    <KButton
      appearance="danger"
      class="delete"
      type="input"
      @click="$emit('remove-item')"
    >
      - Remove Field
    </KButton>
    <hr>
  </div>
</template>

<script>
export default {
  name: 'FieldArrayMultiItem',
  emits: ['remove-item'],
  data() {
    return {
      contentVisible: false,
    }
  },
}
</script>

<style lang="scss" scoped>
.vue-form-generator .field-wrap button.delete {
  &, &:hover {
    background: $kui-color-background-danger;
    border: none;
  }
}
.multi-item-wrapper {
  width: 100%;
}
.label-hint {
  font-weight: 300;
  padding: 8px;
  text-align: center;
}
</style>
