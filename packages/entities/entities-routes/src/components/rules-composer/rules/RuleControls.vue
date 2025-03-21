<template>
  <div class="routing-rules-entities-controls-container">
    <KButton
      appearance="tertiary"
      class="remove-button"
      :data-testid="`remove-${routingRulesEntity}`"
      icon
      @click="$emit('remove')"
    >
      <TrashIcon :color="KUI_COLOR_TEXT_DANGER" />
    </KButton>
    <KButton
      appearance="tertiary"
      :data-testid="`add-${routingRulesEntity}`"
      :disabled="isAddDisabled"
      icon
      @click="$emit('add')"
    >
      <AddIcon />
    </KButton>
  </div>
</template>

<script setup lang="ts">
import { KUI_COLOR_TEXT_DANGER } from '@kong/design-tokens'
import { TrashIcon, AddIcon } from '@kong/icons'

defineProps<{
  routingRulesEntity: string
  isAddDisabled?: boolean
}>()

defineEmits(['remove', 'add'])
</script>

<style lang="scss" scoped>
.routing-rules-entities-controls-container {
  display: flex;
  gap: $kui-space-20;
}
</style>
