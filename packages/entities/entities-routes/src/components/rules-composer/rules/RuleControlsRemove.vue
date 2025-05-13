<template>
  <KButton
    v-if="configType !== 'basic'"
    appearance="tertiary"
    :data-testid="`remove-${routingRulesEntity}`"
    :disabled="disabled"
    icon
    @click="emit('remove')"
  >
    <CloseIcon
      :color="disabled ? KUI_COLOR_TEXT_DISABLED : KUI_COLOR_TEXT_PRIMARY"
    />
  </KButton>
</template>

<script setup lang="ts">
import { inject } from 'vue'
import { KUI_COLOR_TEXT_DISABLED, KUI_COLOR_TEXT_PRIMARY } from '@kong/design-tokens'
import { CloseIcon } from '@kong/icons'

defineProps<{
  disabled: boolean
  routingRulesEntity: string
}>()

const emit = defineEmits(['remove'])

const configType = inject('configType', 'basic')
</script>
