<template>
  <div class="kong-ui-consumer-entity-config-card">
    <EntityBaseConfigCard
      :config="config"
      :config-card-doc="configCardDoc"
      :config-schema="configSchema"
      :fetch-url="fetchUrl"
      :hide-title="hideTitle"
      @fetch:error="(err: any) => $emit('fetch:error', err)"
      @fetch:success="(entity: any) => $emit('fetch:success', entity)"
      @loading="(val: boolean) => $emit('loading', val)"
    >
      <template #username-label-tooltip>
        <i18nT
          keypath="consumers.fields.username.tooltip"
          scope="global"
        >
          <template #custom_id>
            <code>{{ t('consumers.fields.username.custom_id') }}</code>
          </template>
        </i18nT>
      </template>

      <template #custom_id-label-tooltip>
        <i18nT
          keypath="consumers.fields.custom_id.tooltip"
          scope="global"
        >
          <template #username>
            <code>{{ t('consumers.fields.custom_id.username') }}</code>
          </template>
        </i18nT>
      </template>
    </EntityBaseConfigCard>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import { computed, ref } from 'vue'
import type { AxiosError } from 'axios'
import type { KongManagerConsumerEntityConfig, KonnectConsumerEntityConfig, ConsumerConfigurationSchema } from '../types'
import { EntityBaseConfigCard, ConfigurationSchemaSection } from '@kong-ui-public/entities-shared'
import endpoints from '../consumers-endpoints'
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
    type: Object as PropType<KonnectConsumerEntityConfig | KongManagerConsumerEntityConfig>,
    required: true,
    validator: (config: KonnectConsumerEntityConfig | KongManagerConsumerEntityConfig): boolean => {
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

const { i18n: { t }, i18nT } = composables.useI18n()
const fetchUrl = computed((): string => endpoints.form[props.config.app].edit)

const configSchema = ref<ConsumerConfigurationSchema>({
  id: {},
  username: {
    section: ConfigurationSchemaSection.Basic,
    tooltip: t('consumers.fields.username.tooltip'),
    order: 1,
  },
  custom_id: {
    section: ConfigurationSchemaSection.Basic,
    tooltip: t('consumers.fields.custom_id.tooltip'),
    label: t('consumers.fields.custom_id.label'),
    order: 2,
  },
  updated_at: {},
  created_at: {},
  tags: {
    tooltip: t('consumers.fields.tags.tooltip'),
  },
  username_lower: {
    hidden: true,
  },
  type: {
    hidden: true,
  },
})
</script>
