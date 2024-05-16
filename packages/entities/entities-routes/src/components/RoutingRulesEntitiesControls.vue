<template>
  <div class="routing-rules-entities-controls-container">
    <KButton
      appearance="tertiary"
      class="remove-button"
      :data-testid="`remove-${routingRulesEntity}`"
      @click="$emit('remove')"
    >
      <TrashIcon />
    </KButton>
    <KButton
      appearance="tertiary"
      :data-testid="`add-${routingRulesEntity}`"
      :disabled="isAddDisabled"
      @click="$emit('add')"
    >
      <AddIcon />
    </KButton>
  </div>
</template>

<script setup lang="ts">
import { TrashIcon, AddIcon } from '@kong/icons'

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
        fill: $kui_color_border_neutral_weak !important;
      }

      &:hover {
        svg path {
          fill: $kui_color_border_danger_weak !important;
        }
      }
    }

    &[disabled] {
      pointer-events: none !important;

      .kong-icon {
        opacity: 0 !important;
      }
    }
  }
}
</style>
