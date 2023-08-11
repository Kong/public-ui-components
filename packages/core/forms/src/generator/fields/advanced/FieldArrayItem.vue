<template>
  <div class="array-item">
    <slot />
    <KButton
      appearance="btn-link"
      class="delete"
      type="button"
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
  name: 'FieldArrayItem',
  props: {
    model: {
      type: String,
      default: null,
    },
  },
  emits: ['remove-item'],

  data() {
    return {
      contentVisible: false,
    }
  },
}
</script>

<style lang="scss">
.vue-form-generator .field-wrap button.delete {
  &, &:hover {
    background: none;
    border: none;
  }
}
</style>

<style lang="scss" scoped>
.array-item {
  display: flex;
  width: 100%;

  .delete {
    height: 100%;
    margin-left: 20px;
  }
}
</style>
