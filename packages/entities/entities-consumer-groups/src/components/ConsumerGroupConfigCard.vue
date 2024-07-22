<template>
  <div class="kong-ui-consumer-group-entity-config-card">
    <EntityBaseConfigCard
      :config="config"
      :config-card-doc="configCardDoc"
      :config-schema="configSchema"
      data-key="consumer_group"
      :fetch-url="fetchUrl"
      :hide-title="hideTitle"
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
import type { KongManagerConsumerGroupEntityConfig, KonnectConsumerGroupEntityConfig, ConsumerGroupConfigurationSchema } from '../types'
import { EntityBaseConfigCard } from '@kong-ui-public/entities-shared'
import endpoints from '../consumer-groups-endpoints'
import composables from '../composables'
import '@kong-ui-public/entities-shared/dist/style.css'

defineEmits<{
  (e: 'loading', isLoading: boolean): void
  (e: 'fetch:error', error: AxiosError): void,
  (e: 'fetch:success', data: Record<string, any>): void,
}>()

// Component props - This structure must exist in ALL entity components, with the exclusion of unneeded action props (e.g. if you don't need `canDelete`, just exclude it)
const props = defineProps({
  /** The base konnect or kongManger config. Pass additional config props in the shared entity component as needed. */
  config: {
    type: Object as PropType<KonnectConsumerGroupEntityConfig | KongManagerConsumerGroupEntityConfig>,
    required: true,
    validator: (config: KonnectConsumerGroupEntityConfig | KongManagerConsumerGroupEntityConfig): boolean => {
      if (!config || !['konnect', 'kongManager'].includes(config?.app)) return false
      if (config.app === 'konnect' && !config.controlPlaneId) return false
      if (config.app === 'kongManager' && typeof config.workspace !== 'string') return false
      if (!config.entityId) return false
      return true
    },
  },
  /**
   * External link for documentation that determines visibility of Documentation button
   */
  configCardDoc: {
    type: String,
    default: '',
    required: false,
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
const fetchUrl = computed((): string => endpoints.form[props.config.app].edit)

const configSchema = ref<ConsumerGroupConfigurationSchema>({
  id: {},
  name: {},
  created_at: {},
  updated_at: {},
  tags: {
    tooltip: t('consumer_groups.form.fields.tags.tooltip'),
  },
})
</script>
