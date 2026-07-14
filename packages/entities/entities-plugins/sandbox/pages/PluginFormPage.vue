<template>
  <div class="plugin-form-sandbox">
    <div class="sandbox-controls">
      <KInputSwitch
        v-model="enableDeckConfigCustomization"
        label="Enable decK configuration customization"
      />

      <KInputSwitch
        v-model="enableDeckCallout"
        label="Show decK config callout above YAML config"
      />

      <!-- One switch per feature flag — choose which to open/close; any change remounts the forms. -->
      <KCollapse
        class="feature-flags-collapse"
        trigger-label="Feature flags"
      >
        <div class="feature-flags-list">
          <KInputSwitch
            v-for="flagKey in Object.keys(featureFlags)"
            :key="flagKey"
            v-model="featureFlags[flagKey]"
            :label="flagKey"
          />
        </div>
      </KCollapse>
    </div>

    <div
      id="plugin-form-page-actions"
      class="actions"
    />

    <!-- Keyed on the whole flag map so flipping any switch remounts the forms and re-runs `provide`. -->
    <FeatureFlagProvider
      :key="JSON.stringify(featureFlags)"
      :flags="featureFlags"
    >
      <h2>Konnect API</h2>
      <PluginForm
        :config="konnectConfig"
        enable-redis-partial
        enable-vault-secret-picker
        :engine="pluginFormEngine"
        :plugin-id="id"
        :plugin-type="plugin"
        use-custom-names-for-plugin
        @global-action="handleGlobalAction"
        @update="onUpdate"
      />

      <h2>Kong Manager API</h2>
      <PluginForm
        :config="kongManagerConfig"
        enable-redis-partial
        enable-vault-secret-picker
        :engine="pluginFormEngine"
        :plugin-id="id"
        :plugin-type="plugin"
        @global-action="handleGlobalAction"
        @update="onUpdate"
      />
    </FeatureFlagProvider>
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, provide, ref, type PropType } from 'vue'
import { useRouter } from 'vue-router'

import { PluginForm, TOASTER_PROVIDER, useProvideExperimentalFreeForms } from '../../src'
import { FEATURE_FLAGS } from '../../src/constants'

import { ToastManager } from '@kong/kongponents'
import { provideDeckCommandEditor } from '@kong-ui-public/entities-shared/deck-editor'

import type { KongManagerPluginFormConfig, KonnectPluginFormConfig } from '../../src'
import type { GlobalAction } from '../../src/components/free-form/shared/types'

const toaster = new ToastManager()

provide(TOASTER_PROVIDER, toaster.open.bind(toaster))

defineProps({
  /** Grab the plugin id and type from the route params */
  id: {
    type: String,
    default: '',
  },
  plugin: {
    type: String,
    required: true,
  },
})

const router = useRouter()
const controlPlaneId = import.meta.env.VITE_KONNECT_CONTROL_PLANE_ID || ''
const pluginFormEngine = import.meta.env.VITE_FORCE_PLUGIN_FORM_ENGINE || undefined
// All feature flags provided to the plugin forms, editable at runtime via the sandbox switches.
// `provide` captures a plain value once, so to flip any flag live we re-provide on change: the
// generic FeatureFlagProvider re-runs `provide` in its setup whenever it remounts, and we force
// that remount by keying it on the whole flag map — so toggling any flag updates the forms.
const featureFlags = ref<Record<string, boolean>>({
  [FEATURE_FLAGS.KM_2262_CODE_MODE]: true,
  [FEATURE_FLAGS.KM_2306_CONDITION_FIELD_314]: true,
  [FEATURE_FLAGS.KM_2446_DATAKIT_JWT_NODES]: true,
  [FEATURE_FLAGS.KM_2503_CUSTOM_PLUGIN_FREEFORM]: true,
  [FEATURE_FLAGS.KM_2485_CLONED_PLUGINS]: true,
  [FEATURE_FLAGS.KHCP_20393_IDENTITY_PRINCIPALS_UI]: true,
})

const FeatureFlagProvider = defineComponent({
  name: 'FeatureFlagProvider',
  props: {
    flags: { type: Object as PropType<Record<string, boolean>>, default: () => ({}) },
  },
  setup(props, { slots }) {
    for (const [key, value] of Object.entries(props.flags)) {
      provide(key, value)
    }
    return () => slots.default?.()
  },
})

provideDeckCommandEditor()

useProvideExperimentalFreeForms([
  'ace',
  'acl',
  'acme',
  'ai-prompt-decorator',
  'ai-prompt-guard',
  'ai-prompt-template',
  'ai-proxy-advanced',
  'ai-proxy',
  'ai-rate-limiting-advanced',
  'ai-request-transformer',
  'ai-response-transformer',
  'ai-semantic-cache',
  'ai-semantic-prompt-guard',
  'app-dynamics',
  'aws-lambda',
  'basic-auth',
  'bot-detection',
  'canary',
  'confluent-consume',
  'confluent',
  'correlation-id',
  'cors',
  'datadog',
  'exit-transformer',
  'file-log',
  'forward-proxy',
  'graphql-proxy-cache-advanced',
  'graphql-rate-limiting-advanced',
  'header-cert-auth',
  'hmac-auth',
  'http-log',
  'injection-protection',
  'ip-restriction',
  'json-threat-protection',
  'jwe-decrypt',
  'kafka-consume',
  'kafka-log',
  'kafka-upstream',
  'key-auth-enc',
  'key-auth',
  'ldap-auth-advanced',
  'ldap-auth',
  'loggly',
  'metering-and-billing',
  'mocking',
  'mtls-auth',
  'mtls-auth',
  'oas-validation',
  'oauth2-introspection',
  'oauth2',
  'opa',
  'opentelemetry',
  'post-function',
  'pre-function',
  'prometheus',
  'proxy-cache-advanced',
  'proxy-cache',
  'rate-limiting-advanced',
  'redirect',
  'request-size-limiting',
  'request-termination',
  'request-transformer-advanced',
  'request-transformer',
  'request-validator',
  'response-ratelimiting',
  'response-transformer-advanced',
  'response-transformer',
  'route-by-header',
  'saml',
  'service-protection',
  'session',
  'solace-consume',
  'solace-log',
  'solace-upstream',
  'standard-webhooks',
  'statsd',
  'syslog',
  'tcp-log',
  'tls-handshake-modifier',
  'tls-metadata-headers',
  'udp-log',
  'upstream-oauth',
  'upstream-timeout',
  'vault-auth',
  'websocket-size-limit',
  'websocket-validator',
  'xml-threat-protection',
  'zipkin',
])

const enableDeckConfigCustomization = ref(false)
const enableDeckCallout = ref(false)

const konnectConfig = computed<KonnectPluginFormConfig>(() => ({
  app: 'konnect',
  apiBaseUrl: '/us/kong-api', // `/{geo}/kong-api`, with leading slash and no trailing slash; Consuming app would pass in something like `https://us.api.konghq.com`
  // Set the root `.env.development.local` variable to a control plane your PAT can access
  controlPlaneId,
  // force the scope
  // entityType: 'services',
  // entityId: '6f1ef200-d3d4-4979-9376-726f2216d90c',
  cancelRoute: { name: 'list-plugin' },
  viewServiceRoute: (serviceId: string) => ({ name: 'view-service', params: { id: serviceId } }),
  viewRouteRoute: (routeId: string) => ({ name: 'view-route', params: { id: routeId } }),
  viewConsumerRoute: (consumerId: string) => ({ name: 'view-consumer', params: { id: consumerId } }),
  viewConsumerGroupRoute: (consumerGroupId: string) => ({ name: 'view-consumer_group', params: { id: consumerGroupId } }),
  viewCertificateRoute: (certId: string) => ({ name: 'view-certificate', params: { id: certId } }),
  experimentalRenders: {
    keyAuthIdentityRealms: true,
  },
  // isKongIdentityAuthServersAvailable: false,
  canCreateAuthServer: false,
  enableDeckTab: {
    ...enableDeckConfigCustomization.value && {
      customization: {
        generateKonnectPat: async () => {
          await new Promise(resolve => setTimeout(resolve, 1000))
          return 'kpat_test'
        },
      },
    },
    calloutPreferenceKey: enableDeckCallout.value ? 'konnect-entities-plugin-form-deck-callout-sandbox' : undefined,
  },
  dataPlaneVersions: ['3.14.0.1', '3.15.0.0'], // For testing the Kong Identity principals DP version alert
  principalsDirectoryName: 'my-directory', // Sandbox: simulate host-resolved directory name
  principalsCreationGuideVisible: false, // Sandbox: false = principals exist; true = show creation guide
}))

const kongManagerConfig = computed<KongManagerPluginFormConfig>(() => ({
  app: 'kongManager',
  workspace: 'default',
  apiBaseUrl: '/kong-manager', // For local dev server proxy
  // force the scope
  // entityType: 'consumers',
  // entityId: '123-abc-i-lover-cats',
  cancelRoute: { name: 'list-plugin' },
  viewServiceRoute: (serviceId: string) => ({ name: 'view-service', params: { id: serviceId } }),
  viewRouteRoute: (routeId: string) => ({ name: 'view-route', params: { id: routeId } }),
  viewConsumerRoute: (consumerId: string) => ({ name: 'view-consumer', params: { id: consumerId } }),
  viewConsumerGroupRoute: (consumerGroupId: string) => ({ name: 'view-consumer_group', params: { id: consumerGroupId } }),
  viewCertificateRoute: (certId: string) => ({ name: 'view-certificate', params: { id: certId } }),
  deckCalloutPreferenceKey: enableDeckCallout.value ? 'kong-manager-entities-plugin-form-deck-callout-sandbox' : undefined,
}))

const onUpdate = (payload: Record<string, any>) => {
  console.log('update', payload)

  router.push({ name: 'list-plugin' })
}

const handleGlobalAction = (action: GlobalAction, payload: any) => {
  if (action === 'notify') {
    toaster.open(payload)
  }
}
</script>

<style lang="scss" scoped>
.plugin-form-sandbox {
  display: flex;
  flex-direction: column;
  padding: 20px;

  * {
    box-sizing: border-box;
  }

  .actions {
    align-self: flex-end;
  }

  .sandbox-controls {
    align-items: flex-start;
    display: flex;
    flex-direction: row;
    gap: 20px;
    margin-bottom: 20px;
  }

  .feature-flags-collapse {
    margin: 0;
  }

  .feature-flags-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding-top: 12px;
  }
}
</style>
