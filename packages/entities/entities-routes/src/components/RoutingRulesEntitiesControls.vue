<template>
  <div class="routing-rules-entities-controls-container">
    <KButton
      appearance="tertiary"
      class="remove-button"
      :data-testid="`remove-${routingRulesEntity}`"
      @click="$emit('remove')"
    >
      <KIcon icon="trash" />
    </KButton>
    <KButton
      appearance="tertiary"
      :data-testid="`add-${routingRulesEntity}`"
      :disabled="isAddDisabled"
      @click="$emit('add')"
    >
      <KIcon
        :color="KUI_COLOR_TEXT_PRIMARY_STRONG"
        icon="plus"
        size="22"
      />
    </KButton>
  </div>
</template>

<script setup lang="ts">
import { KUI_COLOR_TEXT_PRIMARY_STRONG } from '@kong/design-tokens'

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
