<template>
  <div class="d-flex w-100">
    <slot />
    <KButton
      appearance="btn-link"
      class="delete h-100 ml-5"
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
