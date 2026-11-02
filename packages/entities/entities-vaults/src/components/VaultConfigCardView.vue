<template>
  <div class="kong-ui-vault-entity-config-card">
    <EntityConfigCardView
      :code-block-record-formatter="codeBlockRecordFormatter"
      :config="config"
      :config-card-doc="configCardDoc"
      :config-schema="configSchema"
      :entity-type="SupportedEntityType.Vault"
      :formats-to-hide="config.apiType === 'aiGateway' ? ['terraform', 'deck'] : []"
      :hide-title="hideTitle"
      :record="displayRecord"
    >
      <template #config="{ rowValue }">
        <ConfigCardItem
          v-for="propKey in Object.keys(rowValue).sort()"
          :key="propKey"
          :item="{
            key: propKey,
            value: SENSITIVE_KEYS.includes(propKey) ? SENSITIVE_MASK : getPropValue(propKey, rowValue),
            label: getMetadataLabel(propKey),
          }"
        />
      </template>
      <template
        v-for="slotKey in Object.keys($slots)"
        :key="slotKey"
        #[slotKey]="slotProps"
      >
        <slot
          :name="slotKey"
          v-bind="slotProps"
        />
      </template>
    </EntityConfigCardView>
  </div>
</template>

<script setup lang="ts">
import { EntityConfigCardView, ConfigurationSchemaSection, ConfigurationSchemaType, ConfigCardItem, SupportedEntityType, useStringHelpers, useHelpers } from '@kong-ui-public/entities-shared'
import type { EntityConfigCardViewConfig } from '@kong-ui-public/entities-shared'
import type { PropType } from 'vue'
import { computed } from 'vue'
import { fromAiGatewayVault } from '../ai-gateway-mappers'
import '@kong-ui-public/entities-shared/dist/style.css'
import type { VaultConfigurationSchema } from '../types'
import composables from '../composables'


const props = defineProps({
  record: { type: Object as PropType<Record<string, any>>, required: true },
  config: {
    type: Object as PropType<EntityConfigCardViewConfig & { apiType?: 'aiGateway' | 'gateway' }>,
    default: () => ({}),
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

// Keys masked in the displayed config. The record is reverse-mapped to gateway field
// names (via recordResolver) before rendering, so gateway names cover AI Gateway too.
const SENSITIVE_KEYS = ['key', 'client_secret', 'secret_id', 'secret_access_key', 'access_key_id', 'nonce', 'token', 'approle_secret_id', 'api_key', 'aws_access_key_id', 'aws_secret_access_key', 'aws_auth_nonce', 'cert_auth_cert_key', 'oauth2_client_secret']
const SENSITIVE_MASK = '************'

const isAiGateway = computed((): boolean => props.config.apiType === 'aiGateway')
// AI Gateway returns a different vault shape; reshape it to the gateway-named record the
// schema and config slot expect.
const recordResolver = (data: Record<string, any>) => isAiGateway.value ? fromAiGatewayVault(data) : data

const { i18n: { t } } = composables.useI18n()
const { convertKeyToTitle } = useStringHelpers()
const { getPropValue } = useHelpers()

const configSchema = computed<Partial<VaultConfigurationSchema>>(() => ({
  id: {},
  name: {
    label: t(isAiGateway.value ? 'labels.vault_type_ai_gateway' : 'labels.vault_type'),
  },
  updated_at: {},
  created_at: {},
  prefix: {
    order: 5,
    section: ConfigurationSchemaSection.Basic,
    label: isAiGateway.value ? t('labels.vault_name_ai_gateway') : undefined,
  },
  description: {
    order: 6,
    section: ConfigurationSchemaSection.Basic,
  },
  ...(isAiGateway.value ? {} : {
    tags: {
      order: 7,
    },
  }),
  config: {
    order: 8,
    type: ConfigurationSchemaType.Json,
  },
}))

const codeBlockRecordFormatter = (record: Record<string, any>) => {
  const maskedConfig = { ...record.config }
  SENSITIVE_KEYS.forEach(key => {
    if (key in maskedConfig) {
      maskedConfig[key] = SENSITIVE_MASK
    }
  })
  const masked: Record<string, any> = { ...record, config: maskedConfig }
  if (isAiGateway.value) {
    // Restore AI Gateway field names so the code view matches the actual API response.
    const result: Record<string, any> = { ...masked, type: masked.name, name: masked.prefix }
    delete result.prefix
    return result
  }
  return masked
}

const getMetadataLabel = (propKey: string) => {
  return configSchema.value?.[propKey as keyof typeof configSchema.value]?.label || convertKeyToTitle(propKey)
}
const displayRecord = computed(() => recordResolver(props.record))
</script>
