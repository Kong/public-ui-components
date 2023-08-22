<template>
  <div class="kong-ui-vault-entity-config-card">
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
import { EntityBaseConfigCard, ConfigurationSchemaSection, ConfigurationSchemaType } from '@kong-ui-public/entities-shared'
import type { AxiosError } from 'axios'
import type { PropType } from 'vue'
import { computed, ref } from 'vue'
import endpoints from '../vaults-endpoints'
import '@kong-ui-public/entities-shared/dist/style.css'
import type { KongManagerVaultEntityConfig, KonnectVaultEntityConfig, VaultConfigurationSchema } from '../types'
import composables from '../composables'

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
    type: Object as PropType<KonnectVaultEntityConfig | KongManagerVaultEntityConfig>,
    required: true,
    validator: (config: KonnectVaultEntityConfig | KongManagerVaultEntityConfig): boolean => {
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

const fetchUrl = computed((): string => endpoints.form[props.config?.app]?.edit)

const { i18n: { t } } = composables.useI18n()

const configSchema = ref<VaultConfigurationSchema>({
  id: {},
  name: {
    label: t('labels.vault_type'),
  },
  updated_at: {},
  created_at: {},
  prefix: {
    order: 5,
    section: ConfigurationSchemaSection.Basic,
  },
  description: {
    order: 6,
    section: ConfigurationSchemaSection.Basic,
  },
  tags: {
    order: 7,
  },
  config: {
    order: 8,
    type: ConfigurationSchemaType.Json,
  },
})
</script>
