<template>
  <div>
    <EntityBaseConfigCard
      :config="config"
      :config-card-doc="configCardDoc"
      :config-schema="configSchema"
      :fetch-url="fetchUrl"
      :hide-title="hideTitle"
      @copy:success="(entity: any) => $emit('copy:success', entity)"
      @fetch:error="(err: any) => $emit('fetch:error', err)"
      @fetch:success="(entity: any) => $emit('fetch:success', entity)"
      @loading="(val: boolean) => $emit('loading', val)"
    >
      <template #name-label-tooltip>
        <i18nT
          keypath="upstreams.form.fields.name.tooltip"
          scope="global"
        >
          <template #host>
            <code>{{ t('upstreams.form.fields.name.host') }}</code>
          </template>
        </i18nT>
      </template>
      <template #hash_on-label-tooltip="{ row }">
        <i18nT
          keypath="upstreams.form.fields.hash_on.tooltip"
          scope="global"
        >
          <template #result>
            <code>{{ row.value }}</code>
          </template>
        </i18nT>
      </template>
      <template #hash_on_header-label-tooltip>
        <i18nT
          keypath="upstreams.form.hash_tooltips.hash_on_header.text"
          scope="global"
        >
          <template #hash_on>
            <code>{{ t('upstreams.form.hash_tooltips.hash_on_header.hash_on') }}</code>
          </template>
          <template #header>
            <code>{{ t('upstreams.form.hash_tooltips.hash_on_header.header') }}</code>
          </template>
        </i18nT>
      </template>
      <template #hash_on_uri_capture-label-tooltip>
        <i18nT
          keypath="upstreams.form.hash_tooltips.hash_on_uri_capture.text"
          scope="global"
        >
          <template #hash_on>
            <code>{{ t('upstreams.form.hash_tooltips.hash_on_uri_capture.hash_on') }}</code>
          </template>
          <template #uri_capture>
            <code>{{ t('upstreams.form.hash_tooltips.hash_on_uri_capture.uri_capture') }}</code>
          </template>
        </i18nT>
      </template>
      <template #hash_on_query_arg-label-tooltip>
        <i18nT
          keypath="upstreams.form.hash_tooltips.hash_on_query_arg.text"
          scope="global"
        >
          <template #hash_on>
            <code>{{ t('upstreams.form.hash_tooltips.hash_on_query_arg.hash_on') }}</code>
          </template>
          <template #query_arg>
            <code>{{ t('upstreams.form.hash_tooltips.hash_on_query_arg.query_arg') }}</code>
          </template>
        </i18nT>
      </template>
      <template #hash_on_cookie-label-tooltip>
        <i18nT
          keypath="upstreams.form.hash_tooltips.hash_on_cookie.text"
          scope="global"
        >
          <template #hash_on>
            <code>{{ t('upstreams.form.hash_tooltips.hash_on_cookie.hash_on') }}</code>
          </template>
          <template #hash_fallback>
            <code>{{ t('upstreams.form.hash_tooltips.hash_on_cookie.hash_fallback') }}</code>
          </template>
          <template #cookie>
            <code>{{ t('upstreams.form.hash_tooltips.hash_on_cookie.cookie') }}</code>
          </template>
        </i18nT>
      </template>
      <template #hash_on_cookie_path-label-tooltip>
        <i18nT
          keypath="upstreams.form.hash_tooltips.hash_on_cookie_path.text"
          scope="global"
        >
          <template #hash_on>
            <code>{{ t('upstreams.form.hash_tooltips.hash_on_cookie_path.hash_on') }}</code>
          </template>
          <template #hash_fallback>
            <code>{{ t('upstreams.form.hash_tooltips.hash_on_cookie_path.hash_fallback') }}</code>
          </template>
          <template #cookie>
            <code>{{ t('upstreams.form.hash_tooltips.hash_on_cookie_path.cookie') }}</code>
          </template>
        </i18nT>
      </template>
      <template #slots-label-tooltip>
        <i18nT
          keypath="upstreams.form.hash_tooltips.slots.text"
          scope="global"
        >
          <template #algorithm>
            <code>{{ t('upstreams.form.hash_tooltips.slots.algorithm') }}</code>
          </template>
          <template #round_robin>
            <code>{{ t('upstreams.form.hash_tooltips.slots.round_robin') }}</code>
          </template>
          <template #consistent_hashing>
            <code>{{ t('upstreams.form.hash_tooltips.slots.consistent_hashing') }}</code>
          </template>
          <template #min>
            <code>10</code>
          </template>
          <template #max>
            <code>65536</code>
          </template>
        </i18nT>
      </template>
      <template #hash_fallback-label-tooltip>
        <i18nT
          keypath="upstreams.form.hash_tooltips.hash_fallback.text"
          scope="global"
        >
          <template #hash_on>
            <code>{{ t('upstreams.form.hash_tooltips.hash_fallback.hash_on') }}</code>
          </template>
          <template #cookie>
            <code>{{ t('upstreams.form.hash_tooltips.hash_fallback.cookie') }}</code>
          </template>
        </i18nT>
      </template>
      <template #hash_fallback_header-label-tooltip>
        <i18nT
          keypath="upstreams.form.hash_tooltips.hash_fallback_header.text"
          scope="global"
        >
          <template #hash_fallback>
            <code>{{ t('upstreams.form.hash_tooltips.hash_fallback_header.hash_fallback') }}</code>
          </template>
          <template #header>
            <code>{{ t('upstreams.form.hash_tooltips.hash_fallback_header.header') }}</code>
          </template>
        </i18nT>
      </template>
      <template #hash_fallback_query_arg-label-tooltip>
        <i18nT
          keypath="upstreams.form.hash_tooltips.hash_fallback_query_arg.text"
          scope="global"
        >
          <template #hash_fallback>
            <code>{{ t('upstreams.form.hash_tooltips.hash_fallback_query_arg.hash_fallback') }}</code>
          </template>
          <template #query_arg>
            <code>{{ t('upstreams.form.hash_tooltips.hash_fallback_query_arg.query_arg') }}</code>
          </template>
        </i18nT>
      </template>
      <template #hash_fallback_uri_capture-label-tooltip>
        <i18nT
          keypath="upstreams.form.hash_tooltips.hash_fallback_uri_capture.text"
          scope="global"
        >
          <template #hash_fallback>
            <code>{{ t('upstreams.form.hash_tooltips.hash_fallback_uri_capture.hash_fallback') }}</code>
          </template>
          <template #uri_capture>
            <code>{{ t('upstreams.form.hash_tooltips.hash_fallback_uri_capture.uri_capture') }}</code>
          </template>
        </i18nT>
      </template>
      <template #host_header-label-tooltip>
        <i18nT
          keypath="upstreams.form.hash_tooltips.host_header.text"
          scope="global"
        >
          <template #host>
            <code>{{ t('upstreams.form.hash_tooltips.host_header.host') }}</code>
          </template>
        </i18nT>
      </template>
      <template #client_certificate="slotProps">
        <div>
          <div data-testid="client_certificate-plain-text">
            <span>{{ getPropValue('rowValue', slotProps)?.id }}</span>
          </div>
        </div>
      </template>
    </EntityBaseConfigCard>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import { computed, ref } from 'vue'
import type { KongManagerUpstreamsEntityConfig, KonnectUpstreamsEntityConfig, UpstreamsConfigurationSchema } from '../types'
import { EntityBaseConfigCard, ConfigurationSchemaType, ConfigurationSchemaSection, useHelpers } from '@kong-ui-public/entities-shared'
import endpoints from '../upstreams-endpoints'
import composables from '../composables'
import '@kong-ui-public/entities-shared/dist/style.css'
import type { AxiosError } from 'axios'

const props = defineProps({
  /** The base konnect or kongManger config. Pass additional config props in the shared entity component as needed. */
  config: {
    type: Object as PropType<KonnectUpstreamsEntityConfig | KongManagerUpstreamsEntityConfig>,
    required: true,
    validator: (config: KonnectUpstreamsEntityConfig | KongManagerUpstreamsEntityConfig): boolean => {
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

defineEmits<{
  (e: 'loading', isLoading: boolean): void
  (e: 'fetch:error', error: AxiosError): void,
  (e: 'fetch:success', data: Record<string, any>): void,
  (e: 'copy:success', data: Record<string, any>): void,
}>()

const { i18n: { t }, i18nT } = composables.useI18n()
const { getPropValue } = useHelpers()
const fetchUrl = computed<string>(() => endpoints.form[props.config.app].edit)

const configSchema = ref<UpstreamsConfigurationSchema>({
  id: {},
  name: {},
  created_at: {},
  updated_at: {},
  algorithm: {
    order: 5,
    section: ConfigurationSchemaSection.Basic,
    tooltip: t('upstreams.form.fields.algorithm.tooltip'),
  },
  slots: {
    order: 6,
    section: ConfigurationSchemaSection.Basic,
  },
  hash_on: {
    order: 7,
    section: ConfigurationSchemaSection.Basic,
  },
  hash_on_header: {
    order: 8,
    section: ConfigurationSchemaSection.Basic,
  },
  hash_on_uri_capture: {
    order: 9,
    section: ConfigurationSchemaSection.Basic,
  },
  hash_on_query_arg: {
    order: 10,
    section: ConfigurationSchemaSection.Basic,
    label: `${t('upstreams.form.fields.hash_on.label')} ${t('upstreams.form.hash_labels.query_argument')}`,
  },
  hash_on_cookie: {
    order: 11,
    section: ConfigurationSchemaSection.Basic,
  },
  hash_on_cookie_path: {
    order: 12,
    section: ConfigurationSchemaSection.Basic,
  },
  healthchecks: {
    order: 13,
    section: ConfigurationSchemaSection.Basic,
    // TODO: change to JsonArray
    type: ConfigurationSchemaType.Json,
  },
  tags: {
    order: 14,
    tooltip: t('upstreams.form.hash_tooltips.tags'),
  },
  // Advanced section
  hash_fallback: {
    order: 1,
  },
  hash_fallback_header: {
    order: 2,
  },
  hash_fallback_query_arg: {
    order: 3,
    label: `${t('upstreams.form.fields.hash_fallback.label')} ${t('upstreams.form.hash_labels.query_argument')}`,
  },
  hash_fallback_uri_capture: {
    order: 4,
  },
  host_header: {
    order: 5,
  },
  use_srv_name: {
    order: 6,
  },
  client_certificate: {
    order: 7,
    tooltip: t('upstreams.form.hash_tooltips.client_certificate'),
  },
})
</script>
