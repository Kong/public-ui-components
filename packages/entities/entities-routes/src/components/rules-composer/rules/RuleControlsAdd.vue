<template>
  <KButton
    v-if="configType !== 'basic'"
    appearance="tertiary"
    class="routing-rule-add-item-button"
    :data-testid="`add-${routingRulesEntity}`"
    @click="emit('add')"
  >
    <AddIcon />
    <span>{{ addButtonText }}</span>
  </KButton>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue'
import { AddIcon } from '@kong/icons'
import composables from '../../../composables'

const props = defineProps<{
  routingRulesEntity: string
}>()

const emit = defineEmits(['add'])

const configType = inject('configType', 'basic')
const { i18n: { t } } = composables.useI18n()
const addButtonText = computed(() => {
  return t(`form.fields.${props.routingRulesEntity}.add` as keyof typeof t)
})
</script>

<style lang="scss" scoped>
.routing-rules-entities-controls-container {
  display: flex;
  gap: $kui-space-20;
}
</style>
