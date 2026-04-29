<template>
  <div class="sandbox-container">
    <div class="sandbox-controls">
      <KInputSwitch
        v-model="enableDeckConfigCustomization"
        label="Enable decK configuration customization"
      />

      <KInputSwitch
        v-model="enableDeckCallout"
        label="Show decK config callout above YAML config"
      />
    </div>

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
import { computed, ref } from 'vue'
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
const konnectFetchUrl = ref('/v2/control-planes/{controlPlaneId}/core-entities/services/{id}')
const kmFetchUrl = ref('/{workspace}/services/{id}')
// replace with you own ID
const entityType = SupportedEntityType.GatewayService
const entityId = '34a20e3c-38e3-49ce-920b-0f176ad720e6'
// const entityId = 'a8859647-45fd-4604-bb72-fea7eeae3618'

const { convertKeyToTitle } = composables.useStringHelpers()

const enableDeckConfigCustomization = ref(false)
const enableDeckCallout = ref(false)

const konnectConfig = computed<KonnectBaseEntityConfig>(() => ({
  app: 'konnect',
  apiBaseUrl: '/us/kong-api', // `/{geo}/kong-api`, with leading slash and no trailing slash; Consuming app would pass in something like `https://us.api.konghq.com`
  // Set the root `.env.development.local` variable to a control plane your PAT can access
  controlPlaneId,
  entityId,
  enableDeckConfig: {
    ...enableDeckConfigCustomization.value && {
      customization: {
        generateKonnectPat: async () => {
          await new Promise(resolve => setTimeout(resolve, 1000))
          return 'kpat_test'
        },
      },
    },
    calloutPreferenceKey: enableDeckCallout.value ? 'konnect-entities-base-config-card-deck-callout-sandbox' : undefined,
  },
  formatPreferenceKey: 'konnect-entities-base-config-card-format-sandbox',
}))

const kongManagerConfig = ref<KongManagerBaseEntityConfig>({
  app: 'kongManager',
  workspace: 'default',
  apiBaseUrl: '/kong-manager', // For local dev server proxy
  entityId,
  formatPreferenceKey: 'kong-manager-entities-base-config-card-format-sandbox',
  deckCalloutPreferenceKey: enableDeckCallout.value ? 'kong-manager-entities-base-config-card-deck-callout-sandbox' : undefined,
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

  .sandbox-controls {
    display: flex;
    flex-direction: row;
    gap: 20px;
    margin-bottom: 20px;
  }
}
</style>
