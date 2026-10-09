<template>
  <div class="sandbox-container">
    <h2>Format: Structured</h2>
    <KCheckbox
      v-model="sensitiveFieldsShown"
      label="Show sensitive fields"
    />

    <SchemaProvider
      :schema="pluginConfigSchema"
      :show-sensitive-fields="sensitiveFieldsShown"
    >
      <ConfigCardDisplay
        :entity-type="SupportedEntityType.Plugin"
        format="structured"
        :prop-list-types="propListType"
        :property-collections="item"
      />
    </SchemaProvider>

    <h2>Format: JSON</h2>
    <ConfigCardDisplay
      :config="konnectConfig"
      :entity-type="SupportedEntityType.Route"
      :fetcher-url="`${konnectConfig?.apiBaseUrl}${konnectFetchUrl}`"
      format="json"
      :record="record"
    />

    <h2>Format: YAML</h2>
    <ConfigCardDisplay
      :entity-type="SupportedEntityType.Route"
      format="yaml"
      :record="record"
    />
  </div>
</template>

<script setup lang="ts">
import { defineComponent, provide, ref, toRef } from 'vue'
import { CONFIG_CARD_SHOW_SENSITIVE_FIELDS, ConfigCardDisplay, ConfigurationSchemaSection, ConfigurationSchemaType, SupportedEntityType, useSchemaProvider } from '../../src'

import type { KonnectBaseEntityConfig, RecordItem } from '../../src'

// Mirrors what `PluginConfigCard` and `EntityBaseConfigCard` provide to the structured view
const SchemaProvider = defineComponent({
  props: {
    schema: {
      type: Object,
      required: true,
    },
    showSensitiveFields: {
      type: Boolean,
      default: false,
    },
  },
  setup(props, { slots }) {
    useSchemaProvider(toRef(props, 'schema'))
    provide(CONFIG_CARD_SHOW_SENSITIVE_FIELDS, toRef(props, 'showSensitiveFields'))
    return () => slots.default?.()
  },
})

const sensitiveFieldsShown = ref(false)

const authSchema = {
  type: 'record',
  fields: [
    { header_name: { type: 'string' } },
    { header_value: { type: 'string', encrypted: true } },
  ],
}
const modelSchema = {
  type: 'record',
  fields: [
    { name: { type: 'string' } },
    { provider: { type: 'string' } },
  ],
}
// Trimmed ai-proxy-advanced `config` schema
const pluginConfigSchema = {
  type: 'record',
  fields: [
    { api_key: { type: 'string', encrypted: true } },
    {
      targets: {
        type: 'array',
        elements: {
          type: 'record',
          fields: [{ auth: authSchema }, { model: modelSchema }],
        },
      },
    },
    {
      embeddings: {
        type: 'record',
        fields: [{ auth: authSchema }, { model: modelSchema }],
      },
    },
  ],
}

const controlPlaneId = import.meta.env.VITE_KONNECT_CONTROL_PLANE_ID || ''
const entityId = 'ce83dd74-6455-40a9-b944-0f393c7ee22c'
const konnectFetchUrl = ref(`/v2/control-planes/${controlPlaneId}/core-entities/services/${entityId}`)

const konnectConfig = ref<KonnectBaseEntityConfig>({
  app: 'konnect',
  apiBaseUrl: '/us/kong-api', // `/{geo}/kong-api`, with leading slash and no trailing slash; Consuming app would pass in something like `https://us.api.konghq.com`
  // Set the root `.env.development.local` variable to a control plane your PAT can access
  controlPlaneId,
  entityId,
})

const item: Record<'basic' | 'advanced' | 'plugin', RecordItem[]> = {
  basic:
  [
    {
      key: 'id',
      value: '15dea234-1725-4f5e-9564-ecb097a8f448',
      hidden: false,
      type: ConfigurationSchemaType.ID,
      label: 'ID',
      section: ConfigurationSchemaSection.Basic,
    },
    {
      key: 'name',
      value: 'onboarding-ok-1682959038143',
      hidden: false,
      type: ConfigurationSchemaType.Text,
      label: 'Name',
      tooltip: "The name of the Route. Route names must be unique, and they are case sensitive. For example, there can be two different Routes named 'test' and 'Test'.",
      section: ConfigurationSchemaSection.Basic,
    },
    {
      key: 'updated_at',
      value: 1687965229,
      hidden: false,
      type: ConfigurationSchemaType.Date,
      label: 'Last Updated',
      section: ConfigurationSchemaSection.Basic,
    },
    {
      key: 'created_at',
      value: 1682959038,
      hidden: false,
      type: ConfigurationSchemaType.Date,
      label: 'Created',
      section: ConfigurationSchemaSection.Basic,
    },
    {
      key: 'service',
      value: { id: 'b32e7e90-a3fb-450e-be12-454fc0f1925e' },
      hidden: false,
      type: ConfigurationSchemaType.Text,
      label: 'Gateway Service',
      tooltip: 'The Service this Route is associated to. This is where the Route proxies traffic to.',
      section: ConfigurationSchemaSection.Basic,
    },
  ],
  advanced: [
    {
      key: 'https_redirect_status_code',
      value: 426,
      hidden: false,
      type: ConfigurationSchemaType.Text,
      label: 'Https Redirect Status Code',
      section: ConfigurationSchemaSection.Advanced,
    },
    {
      key: 'regex_priority',
      value: 0,
      hidden: false,
      type: ConfigurationSchemaType.Text,
      label: 'Regex Priority',
      tooltip: 'A number used to choose which route resolves a given request when several routes match it using regexes simultaneously. When two routes match the path and have the same {code1}, the older one (lowest {code2}) is used. Note that the priority for non-regex routes is different (longer non-regex routes are matched before shorter ones).',
      section: ConfigurationSchemaSection.Advanced,
    },
  ],
  plugin: [
    {
      key: 'api_key',
      value: 'sk-top-level-secret',
      hidden: false,
      type: ConfigurationSchemaType.Redacted,
      label: 'API Key',
      section: ConfigurationSchemaSection.Plugin,
    },
    {
      key: 'targets',
      value: [
        {
          auth: { header_name: 'Authorization', header_value: 'Bearer sk-target-secret' },
          model: { name: 'gpt-4o', provider: 'openai' },
        },
      ],
      hidden: false,
      type: ConfigurationSchemaType.Json,
      label: 'Targets',
      section: ConfigurationSchemaSection.Plugin,
    },
    {
      key: 'embeddings',
      value: {
        auth: { header_name: 'api-key', header_value: 'sk-embeddings-secret' },
        model: { name: 'text-embedding-3-small', provider: 'openai' },
      },
      hidden: false,
      type: ConfigurationSchemaType.Json,
      label: 'Embeddings',
      section: ConfigurationSchemaSection.Plugin,
    },
  ],
}

const record =
  {
    created_at: 1682959038,
    destinations: [
      {
        ip: '255.255.255.255',
        port: 123,
      },
    ],
    https_redirect_status_code: 426,
    id: '15dea234-1725-4f5e-9564-ecb097a8f448',
    name: 'onboarding-ok-1682959038143',
    path_handling: 'v0',
    preserve_host: false,
    protocols: [
      'tcp',
    ],
    regex_priority: 0,
    request_buffering: true,
    response_buffering: true,
    service: {
      id: 'b32e7e90-a3fb-450e-be12-454fc0f1925e',
    },
    sources: [
      {
        ip: '255.255.255.255',
        port: 345,
      },
    ],
    strip_path: true,
    tags: [
      'dev',
      'prod',
    ],
    updated_at: 1687965229,
  }

const propListType = ['basic', 'advanced', 'plugin']
</script>

<style lang="scss" scoped>
.sandbox-container {
  padding: var(--kui-space-100, $kui-space-100);
}
</style>
