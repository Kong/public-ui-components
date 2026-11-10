<template>
  <div class="kong-ui-vault-entity-config-card">
    <EntityBaseConfigCard
      :code-block-record-formatter="codeBlockRecordFormatter"
      :config="config"
      :config-card-doc="configCardDoc"
      :config-schema="configSchema"
      :entity-type="SupportedEntityType.Vault"
      :fetch-url="fetchUrl"
      :formats-to-hide="config.apiType === 'aiGateway' ? ['terraform', 'deck'] : []"
      :hide-title="hideTitle"
      :record-resolver="recordResolver"
      @fetch:error="(err: any) => $emit('fetch:error', err)"
      @fetch:success="(entity: any) => $emit('fetch:success', entity)"
      @loading="(val: boolean) => $emit('loading', val)"
    >
      <template #config="{ rowValue }">
        <ConfigCardItem
          v-for="item in configItems(rowValue)"
          :key="item.key"
          :item="item"
        />
      </template>
    </EntityBaseConfigCard>
  </div>
</template>

<script setup lang="ts">
import {
  EntityBaseConfigCard,
  ConfigCardItem,
  SupportedEntityType,
} from '@kong-ui-public/entities-shared'
import type { AxiosError } from 'axios'
import type { PropType } from 'vue'
import { computed } from 'vue'
import endpoints from '../vaults-endpoints'
import { fromAiGatewayVault } from '../ai-gateway-mappers'
import '@kong-ui-public/entities-shared/dist/style.css'
import type { KongManagerVaultEntityConfig, KonnectVaultEntityConfig } from '../types'
import useVaultConfigCardPresentation from '../composables/useVaultConfigCardPresentation'

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
      if (config.app === 'konnect' && config.apiType !== 'aiGateway' && !config.controlPlaneId) return false
      if (config.app === 'kongManager' && typeof config.workspace !== 'string') return false
      if (config.apiType === 'aiGateway' && !config.aiGatewayId) return false
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

const isAiGateway = computed((): boolean => props.config.apiType === 'aiGateway')
const fetchUrl = computed((): string => {
  const url = isAiGateway.value ? endpoints.form.aiGateway?.edit : endpoints.form[props.config?.app]?.edit
  return url?.replace(/{aiGatewayId}/gi, props.config.aiGatewayId || '')
})

// AI Gateway returns a different vault shape; reshape it to the gateway-named record the
// schema and config slot expect.
const recordResolver = (data: Record<string, any>) => isAiGateway.value ? fromAiGatewayVault(data) : data

const { configSchema, codeBlockRecordFormatter, configItems } = useVaultConfigCardPresentation(isAiGateway)
</script>
