<template>
  <DeckCodeBlockInternal
    v-if="props.entityRecord"
    v-bind="$attrs"
    :app="props.app"
    :control-plane-name="props.app === 'konnect' ? props.controlPlaneName : undefined"
    :entity-record="props.entityRecord"
    :entity-type="(props.entityType as SupportedEntityDeck)"
    :geo-api-server-url="props.app === 'konnect' ? props.geoApiServerUrl : undefined"
    :kong-admin-api-url="props.app === 'kongManager' ? props.kongAdminApiUrl : undefined"
    :workspace="props.app === 'kongManager' ? props.workspace : undefined"
  />

  <KModal
    v-if="props.entityRecord"
    action-button-appearance="tertiary"
    :action-button-text="t('baseConfigCard.actions.deck_customize_cancel')"
    hide-cancel-button
    max-width="640px"
    :title="t('deckCodeBlock.customization.title')"
    :visible="props.isCustomizationModalVisible"
    @cancel="$emit('customization-close')"
    @proceed="$emit('customization-close')"
  >
    <DeckCodeBlockInternal
      :app="props.app"
      :control-plane-name="props.app === 'konnect' ? props.controlPlaneName : undefined"
      :entity-record="props.entityRecord"
      :entity-type="(props.entityType as SupportedEntityDeck)"
      :generate-konnect-pat="generateKonnectPat"
      :geo-api-server-url="props.app === 'konnect' ? props.geoApiServerUrl : undefined"
      is-customizing
      :kong-admin-api-url="props.app === 'kongManager' ? props.kongAdminApiUrl : undefined"
      :workspace="props.app === 'kongManager' ? props.workspace : undefined"
    />
  </KModal>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import composables from '../../composables'
import DeckCodeBlockInternal from './DeckCodeBlockInternal.vue'

import type { DeckCodeBlockProps, DeckCustomizationOptions, SupportedEntityDeck } from '../../types'

defineOptions({ inheritAttrs: false })

const props = defineProps<DeckCodeBlockProps & {
  customizationOptions?: boolean | DeckCustomizationOptions
  isCustomizationModalVisible?: boolean
}>()

defineEmits<{
  'customization-close': []
}>()

const { i18n: { t } } = composables.useI18n()

const generateKonnectPat = computed(() => {
  if (props.app === 'konnect' && props.customizationOptions && typeof props.customizationOptions !== 'boolean') {
    return props.customizationOptions.generateKonnectPat
  }
  return undefined
})
</script>
