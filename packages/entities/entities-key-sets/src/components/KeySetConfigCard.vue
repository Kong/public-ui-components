<template>
  <div class="kong-ui-entities-keys-entity-config-card">
    <EntityBaseConfigCard
      :config="config"
      :config-schema="configSchema"
      :fetch-url="fetchUrl"
      :hide-title="hideTitle"
      @copy:success="(entity: any) => $emit('copy:success', entity)"
      @fetch:error="(err: any) => $emit('fetch:error', err)"
      @fetch:success="(entity: any) => $emit('fetch:success', entity)"
      @loading="(val: boolean) => $emit('loading', val)"
    />
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import { computed, ref } from 'vue'
import type { AxiosError } from 'axios'
import { EntityBaseConfigCard } from '@kong-ui-public/entities-shared'

import type {
  KongManagerKeySetEntityConfig, KonnectKeySetEntityConfig, KeySetConfigurationSchema,
} from '../types'
import endpoints from '../key-sets-endpoints'
import composables from '../composables'

import '@kong-ui-public/entities-shared/dist/style.css'

defineEmits<{
  (e: 'loading', isLoading: boolean): void
  (e: 'fetch:error', error: AxiosError): void,
  (e: 'fetch:success', data: Record<string, any>): void,
  (e: 'copy:success', data: Record<string, any>): void,
}>()

// Component props - This structure must exist in ALL entity components, with the exclusion of unneeded action props (e.g. if you don't need `canDelete`, just exclude it)
const props = defineProps({
  /** The base konnect or kongManger config. Pass additional config props in the shared entity component as needed. */
  config: {
    type: Object as PropType<KonnectKeySetEntityConfig | KongManagerKeySetEntityConfig>,
    required: true,
    validator: (config: KonnectKeySetEntityConfig | KongManagerKeySetEntityConfig): boolean => {
      if (!config || !['konnect', 'kongManager'].includes(config?.app)) return false
      if (config.app === 'konnect' && !config.controlPlaneId) return false
      if (config.app === 'kongManager' && typeof config.workspace !== 'string') return false
      if (!config.entityId) return false
      return true
    },
  },
  /**
   * Control visibility of card title content
   */
  hideTitle: {
    type: Boolean,
    default: false,
  },
})

const { i18n: { t } } = composables.useI18n()
const fetchUrl = computed<string>(() => endpoints.form[props.config.app].edit)

const configSchema = ref<KeySetConfigurationSchema>({
  id: {},
  name: {},
  last_updated: {},
  created: {},
  tags: {
    tooltip: t('keySets.form.fields.tags.tooltip'),
  },
})
</script>
