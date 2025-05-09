<template>
  <KButton
    v-if="configType !== 'basic'"
    appearance="tertiary"
    :data-testid="`remove-${routingRulesEntity}`"
    :disabled="disabled"
    icon
    @click="emit('remove')"
  >
    <CloseIcon :color="KUI_COLOR_TEXT_DISABLED" />
  </KButton>
</template>

<script setup lang="ts">
import { inject } from 'vue'
import { KUI_COLOR_TEXT_DISABLED } from '@kong/design-tokens'
import { CloseIcon } from '@kong/icons'

defineProps<{
  disabled: boolean
  routingRulesEntity: string
}>()

const emit = defineEmits(['remove'])

const configType = inject('configType', 'basic')
</script>
