<template>
  <div class="routing-rules-entities-controls-container">
    <KButton
      appearance="btn-link"
      class="remove-button"
      :data-testid="`remove-${routingRulesEntity}`"
      @click="$emit('remove')"
    >
      <template #icon>
        <KIcon icon="trash" />
      </template>
    </KButton>
    <KButton
      appearance="btn-link"
      :data-testid="`add-${routingRulesEntity}`"
      :disabled="isAddDisabled"
      @click="$emit('add')"
    >
      <template #icon>
        <KIcon
          color="var(--blue-500)"
          icon="plus"
          size="22"
        />
      </template>
    </KButton>
  </div>
</template>

<script setup lang="ts">
defineProps({
  routingRulesEntity: {
    type: String,
    required: true,
  },
  isAddDisabled: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['remove', 'add'])
</script>

<style lang="scss" scoped>
.routing-rules-entities-controls-container {
  display: flex;

  :deep(.k-button) {
    &.remove-button {
      svg path {
        fill: var(--grey-400, #b6b6bd) !important;
      }

      &:hover {
        svg path {
          fill: var(--red-500, #d44324) !important;
        }
      }
    }

    &[disabled] {
      pointer-events: none !important;

      .kong-icon {
        opacity: 0 !important;
      }
    }

    &:not(:first-of-type) {
      margin-left: var(--spacing-sm, 12px) !important;
    }
  }
}
</style>
