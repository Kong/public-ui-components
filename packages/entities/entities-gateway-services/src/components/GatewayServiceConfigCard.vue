<template>
  <div class="kong-ui-gateway-service-entity-config-card">
    <EntityBaseConfigCard
      :config="config"
      :config-card-doc="configCardDoc"
      :config-schema="configSchema"
      :entity-type="SupportedEntityType.GatewayService"
      :fetch-url="fetchUrl"
      :hide-title="hideTitle"
      @fetch:error="(err: any) => $emit('fetch:error', err)"
      @fetch:success="(entity: any) => $emit('fetch:success', entity)"
      @loading="(val: boolean) => $emit('loading', val)"
    >
      <template #enabled-label-tooltip>
        <i18nT
          keypath="gateway_services.form.fields.enabled.tooltip"
          scope="global"
        >
          <template #false>
            <code>{{ t('gateway_services.form.fields.enabled.false') }}</code>
          </template>
          <template #true>
            <code>{{ t('gateway_services.form.fields.enabled.true') }}</code>
          </template>
        </i18nT>
      </template>

      <template #ca_certificates-label-tooltip>
        <i18nT
          keypath="gateway_services.form.fields.ca_certificates.tooltip"
          scope="global"
        >
          <template #code1>
            <code>{{ t('gateway_services.form.fields.ca_certificates.code1') }}</code>
          </template>
          <template #code2>
            <code>{{ t('gateway_services.form.fields.ca_certificates.code2') }}</code>
          </template>
        </i18nT>
      </template>

      <template #tls_verify-label-tooltip>
        <i18nT
          keypath="gateway_services.form.fields.tls_verify_enabled.tooltip"
          scope="global"
        >
          <template #code1>
            <code>{{ t('gateway_services.form.fields.tls_verify_enabled.code1') }}</code>
          </template>
        </i18nT>
      </template>

      <template #tls_verify="slotProps">
        {{
          typeof getPropValue('rowValue', slotProps) === 'boolean'
            ? getTlsVerifyOption('rowValue', slotProps)
            : t('gateway_services.form.fields.tls_verify_option.unset.display')
        }}
      </template>

      <template #client_certificate="slotProps">
        {{ getPropValue('rowValue', slotProps) ? getPropValue('rowValue', slotProps).id : '–' }}
      </template>
    </EntityBaseConfigCard>
  </div>
</template>

<script setup lang="ts">
import { createConfigCardSchema } from './config-card-schema'
import type { PropType } from 'vue'
import { computed } from 'vue'
import type { AxiosError } from 'axios'
import type { KongManagerGatewayServiceEntityConfig, KonnectGatewayServiceEntityConfig } from '../types'
import {
  EntityBaseConfigCard,
  SupportedEntityType,
  useHelpers,
} from '@kong-ui-public/entities-shared'
import endpoints from '../gateway-services-endpoints'
import composables from '../composables'
import '@kong-ui-public/entities-shared/dist/style.css'

defineEmits<{
  (e: 'loading', isLoading: boolean): void
  (e: 'fetch:error', error: AxiosError): void
  (e: 'fetch:success', data: Record<string, any>): void
}>()

// Component props - This structure must exist in ALL entity components, with the exclusion of unneeded action props (e.g. if you don't need `canDelete`, just exclude it)
const props = defineProps({
  /** The base konnect or kongManger config. Pass additional config props in the shared entity component as needed. */
  config: {
    type: Object as PropType<KonnectGatewayServiceEntityConfig | KongManagerGatewayServiceEntityConfig>,
    required: true,
    validator: (config: KonnectGatewayServiceEntityConfig | KongManagerGatewayServiceEntityConfig): boolean => {
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
const fetchUrl = computed<string>(() => endpoints.form[props.config.app].edit)
const { getPropValue } = useHelpers()

const getTlsVerifyOption = (propName: string, slotProps?: Record<string, any>) => {
  if (getPropValue(propName, slotProps) === true) {
    return t('gateway_services.form.fields.tls_verify_option.true.display')
  }

  return t('gateway_services.form.fields.tls_verify_option.false.display')
}

const configSchema = createConfigCardSchema(t)
</script>
