<template>
  <div class="sandbox-container">
    <h2>Konnect API</h2>
    <EntityBaseConfigCard
      :config="konnectConfig"
      :config-schema="configSchema"
      enable-terraform
      :entity-type="entityType"
      :fetch-url="konnectFetchUrl"
      @fetch:error="handleError"
      @fetch:success="handleSuccess"
      @loading="handleLoading"
    >
      <template #name-label>
        <b>Name (bolded)</b>
      </template>
      <template #name="{ rowValue }">
        <b>{{ rowValue }}</b>
      </template>
      <template #healthchecks="{ rowValue }">
        <ConfigCardItem
          v-for="propKey in ['active', 'passive']"
          :key="propKey"
          :item="{
            key: propKey,
            value: [{
              name: propKey,
              ...rowValue[propKey],
            }],
            type: ConfigurationSchemaType.JsonArray,
          }"
        />
        <ConfigCardItem
          :item="{
            key: 'threshold',
            value: rowValue.threshold,
            label: convertKeyToTitle('threshold'),
          }"
        />
      </template>
    </EntityBaseConfigCard>

    <h2>Kong Manager API</h2>
    <EntityBaseConfigCard
      :config="kongManagerConfig"
      :config-schema="configSchema"
      enable-terraform
      :entity-type="entityType"
      :fetch-url="kmFetchUrl"
      @fetch:error="handleError"
      @fetch:success="handleSuccess"
      @loading="handleLoading"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { ConfigurationSchema, KonnectBaseEntityConfig, KongManagerBaseEntityConfig } from '../../src'
import {
  EntityBaseConfigCard,
  ConfigurationSchemaType,
  ConfigCardItem,
  SupportedEntityType,
} from '../../src'
import composables from '../../src/composables'

const controlPlaneId = import.meta.env.VITE_KONNECT_CONTROL_PLANE_ID || ''
// replace with your own endpoint
const konnectFetchUrl = ref('/v2/control-planes/{controlPlaneId}/core-entities/upstreams/{id}')
const kmFetchUrl = ref('/{workspace}/upstreams/{id}')
// replace with you own ID
const entityType = SupportedEntityType.Upstream
const entityId = '1b8099a8-743a-4b1a-bed5-15689af430fd'
// const entityId = 'a8859647-45fd-4604-bb72-fea7eeae3618'

const { convertKeyToTitle } = composables.useStringHelpers()

const konnectConfig = ref<KonnectBaseEntityConfig>({
  app: 'konnect',
  apiBaseUrl: '/us/kong-api', // `/{geo}/kong-api`, with leading slash and no trailing slash; Consuming app would pass in something like `https://us.api.konghq.com`
  // Set the root `.env.development.local` variable to a control plane your PAT can access
  controlPlaneId,
  entityId,
  enableDeckConfig: true,
  formatPreferenceKey: 'konnect-entities-base-config-card-format-sandbox',
})
const kongManagerConfig = ref<KongManagerBaseEntityConfig>({
  app: 'kongManager',
  workspace: 'default',
  apiBaseUrl: '/kong-manager', // For local dev server proxy
  entityId,
  formatPreferenceKey: 'kong-manager-entities-base-config-card-format-sandbox',
})

const configSchema = ref<ConfigurationSchema>({
  id: {
    type: ConfigurationSchemaType.Redacted,
    tooltip: 'This ID has a custom tooltip',
  },
  methods: {
    type: ConfigurationSchemaType.BadgeMethod,
  },
  healthchecks: {
    type: ConfigurationSchemaType.Json,
  },
})

const handleError = (err: any) => {
  console.log(`Error: ${err}`)
}

const handleSuccess = (entity: any) => {
  console.log(`Fetched: ${entity}`)
}

const handleLoading = (val: boolean) => {
  console.log(`Loading: ${val}`)
}
</script>

<style lang="scss" scoped>
.sandbox-container {
  padding: 40px;
}
</style>
