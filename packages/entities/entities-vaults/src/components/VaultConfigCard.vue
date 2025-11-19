<template>
  <div class="kong-ui-vault-entity-config-card">
    <EntityBaseConfigCard
      :config="config"
      :config-card-doc="configCardDoc"
      :config-schema="configSchema"
      :entity-type="SupportedEntityType.Vault"
      :fetch-url="fetchUrl"
      :hide-title="hideTitle"
      @fetch:error="(err: any) => $emit('fetch:error', err)"
      @fetch:success="(entity: any) => $emit('fetch:success', entity)"
      @loading="(val: boolean) => $emit('loading', val)"
    >
      <template #config="{ rowValue }">
        <ConfigCardItem
          v-for="propKey in Object.keys(rowValue).sort()"
          :key="propKey"
          :item="{
            key: propKey,
            value: getPropValue(propKey, rowValue),
            label: getMetadataLabel(propKey),
            type: SENSITIVE_KEYS.includes(propKey) ? ConfigurationSchemaType.Redacted : ConfigurationSchemaType.Text,
          }"
        />
      </template>
    </EntityBaseConfigCard>
  </div>
</template>

<script setup lang="ts">
import {
  EntityBaseConfigCard,
  ConfigurationSchemaSection,
  ConfigurationSchemaType,
  ConfigCardItem,
  SupportedEntityType,
  useStringHelpers,
  useHelpers,
} from '@kong-ui-public/entities-shared'
import type { AxiosError } from 'axios'
import type { PropType } from 'vue'
import { computed, ref } from 'vue'
import endpoints from '../vaults-endpoints'
import '@kong-ui-public/entities-shared/dist/style.css'
import type { KongManagerVaultEntityConfig, KonnectVaultEntityConfig, VaultConfigurationSchema } from '../types'
import composables from '../composables'

defineEmits<{
  (e: 'loading', isLoading: boolean): void
  (e: 'fetch:error', error: AxiosError): void
  (e: 'fetch:success', data: Record<string, any>): void
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

const SENSITIVE_KEYS = ['token', 'approle_secret_id', 'api_key']
const fetchUrl = computed((): string => endpoints.form[props.config?.app]?.edit)

const { i18n: { t } } = composables.useI18n()
const { convertKeyToTitle } = useStringHelpers()
const { getPropValue } = useHelpers()

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

const getMetadataLabel = (propKey: string) => {
  return configSchema.value?.[propKey as keyof typeof configSchema.value]?.label || convertKeyToTitle(propKey)
}
</script>
