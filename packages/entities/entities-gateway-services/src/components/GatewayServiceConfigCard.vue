<template>
  <div class="kong-ui-gateway-service-entity-config-card">
    <EntityBaseConfigCard
      :config="config"
      :config-schema="configSchema"
      :fetch-url="fetchUrl"
      :hide-title="hideTitle"
      @copy:success="(entity: any) => $emit('copy:success', entity)"
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

      <template #tls_verify="{ rowValue }">
        {{
          typeof rowValue === "boolean"
            ? t(`gateway_services.form.fields.tls_verify_option.${rowValue}.display`)
            : t('gateway_services.form.fields.tls_verify_option.unset.display')
        }}
      </template>

      <template #client_certificate="{ rowValue }">
        {{ rowValue ? rowValue.id : '–' }}
      </template>
    </EntityBaseConfigCard>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, PropType } from 'vue'
import type { AxiosError } from 'axios'
import type { KongManagerGatewayServiceEntityConfig, KonnectGatewayServiceEntityConfig, GatewayServiceConfigurationSchema } from '../types'
import { EntityBaseConfigCard, ConfigurationSchemaSection, ConfigurationSchemaType } from '@kong-ui-public/entities-shared'
import endpoints from '../gateway-services-endpoints'
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
   * Control visibility of card title content
   */
  hideTitle: {
    type: Boolean,
    default: false,
  },
})

const { i18n: { t }, i18nT } = composables.useI18n()
const fetchUrl = computed<string>(() => endpoints.form[props.config.app].edit)

const configSchema = ref<GatewayServiceConfigurationSchema>({
  id: {},
  name: {
    tooltip: t('gateway_services.form.fields.name.tooltip'),
  },
  enabled: {},
  updated_at: {},
  created_at: {},
  protocol: {
    section: ConfigurationSchemaSection.Basic,
    tooltip: t('gateway_services.form.fields.protocol.tooltip'),
  },
  host: {
    section: ConfigurationSchemaSection.Basic,
    tooltip: t('gateway_services.form.fields.host.tooltip'),
  },
  path: {
    section: ConfigurationSchemaSection.Basic,
    tooltip: t('gateway_services.form.fields.path.tooltip'),
  },
  port: {
    section: ConfigurationSchemaSection.Basic,
    tooltip: t('gateway_services.form.fields.port.tooltip'),
  },
  tags: {
    tooltip: t('gateway_services.form.fields.tags.tooltip'),
  },
  // advanced fields
  retries: {
    order: 1,
    tooltip: t('gateway_services.form.fields.retries.tooltip'),
  },
  connect_timeout: {
    order: 2,
    tooltip: t('gateway_services.form.fields.connect_timeout.tooltip'),
  },
  write_timeout: {
    order: 3,
    tooltip: t('gateway_services.form.fields.write_timeout.tooltip'),
  },
  read_timeout: {
    order: 4,
    tooltip: t('gateway_services.form.fields.read_timeout.tooltip'),
  },
  client_certificate: {
    order: 5,
    tooltip: t('gateway_services.form.fields.client_certificate.tooltip'),
  },
  ca_certificates: {
    type: ConfigurationSchemaType.BadgeTag,
    label: t('gateway_services.form.fields.ca_certificates.label'),
    order: 6,
  },
  tls_verify: {
    label: t('gateway_services.form.fields.tls_verify_enabled.label'),
  },
  tls_verify_depth: {
    hidden: true,
  },
})
</script>
