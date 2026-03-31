<template>
  <div
    class="kong-ui-consumer-group-entity-config-card"
    :class="{ 'managed-redis-nested-detail': disableKonnectManagedDetail }"
  >
    <template v-if="isManagedKonnectDetailEnabled">
      <KSkeleton
        v-if="detailLayout === 'resolving'"
        data-testid="managed-redis-config-resolver-skeleton"
        :table-columns="2"
        type="table"
      />

      <div
        v-else-if="detailLayout === 'managed'"
        class="managed-konnect-redis-detail"
        data-testid="managed-konnect-redis-detail"
      >
        <!-- Konnect-managed add-on card intentionally hides YAML; only structured/json are shown here -->
        <EntityBaseConfigCard
          :key="addOnIdForCacheFetch"
          :code-block-record-formatter="cacheAddonCodeBlockFormatter"
          :config="addOnCardRuntimeConfig"
          :config-card-doc="configCardDoc"
          :config-schema="managedAddOnConfigSchema"
          :entity-type="SupportedEntityType.Partial"
          fetch-url="/v2/cloud-gateways/add-ons/{id}"
          :formats-to-hide="['yaml']"
          :hide-title="false"
          :record-resolver="addOnRecordResolver"
          @fetch:error="emitFetchError"
          @fetch:success="onCacheAddOnLoaded"
          @loading="emitLoading"
        >
          <template #title>
            {{ t('config_card.sections.cache_configuration') }}
          </template>
          <template #type>
            <div>{{ t('list.type.konnect_managed_redis') }}</div>
          </template>
          <!-- Partial config shown only when Koko creates partial; nothing under cache card while provisioning -->
          <template
            v-if="linkedPartialIdForCollapse"
            #after-fields
          >
            <KCollapse
              v-model="partialSectionCollapsed"
              data-testid="managed-redis-partial-collapse"
              trigger-alignment="leading"
              :trigger-label="partialCollapseTriggerLabel"
            >
              <div class="managed-redis-partial-expandable-body">
                <RedisConfigurationConfigCard
                  v-if="!partialSectionCollapsed"
                  :config="innerPartialCardConfig"
                  :config-card-doc="configCardDoc"
                  disable-konnect-managed-detail
                  :hide-title="false"
                  @fetch:error="emitFetchError"
                  @fetch:success="onPartialNestedLoaded"
                  @loading="emitLoading"
                >
                  <template #title>
                    {{ t('config_card.sections.partial_configuration') }}
                  </template>
                </RedisConfigurationConfigCard>
              </div>
            </KCollapse>
          </template>
        </EntityBaseConfigCard>
      </div>
    </template>

    <!-- Legacy card hides YAML only for nested managed-partial detail; default legacy Konnect/KM passes [ ] -->
    <EntityBaseConfigCard
      v-if="showLegacyConfigCard"
      :code-block-record-formatter="codeBlockRecordFormatter"
      :config="config"
      :config-card-doc="configCardDoc"
      :config-schema="configSchema"
      :entity-type="SupportedEntityType.Partial"
      :fetch-url="fetchUrl"
      :formats-to-hide="disableKonnectManagedDetail ? ['yaml'] : []"
      :hide-title="hideTitle"
      :record-resolver="recordResolver"
      @fetch:error="emitFetchError"
      @fetch:success="handleData"
      @loading="emitLoading"
    >
      <template #type>
        <div>{{ redisTypeText }}</div>
      </template>
      <template
        v-if="$slots.title"
        #title
      >
        <slot name="title" />
      </template>
    </EntityBaseConfigCard>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import { computed, onBeforeMount, onMounted, ref } from 'vue'
import type { AxiosError } from 'axios'
import type { ConfigurationSchema, ConfigurationSchemaItem } from '@kong-ui-public/entities-shared'
import {
  ConfigurationSchemaSection,
  ConfigurationSchemaType,
  EntityBaseConfigCard,
  SupportedEntityType,
  useAxios,
} from '@kong-ui-public/entities-shared'
import { KCollapse, KSkeleton } from '@kong/kongponents'
import type {
  KonnectRedisConfigurationEntityConfig,
  KongManagerRedisConfigurationEntityConfig,
  RedisConfigurationResponse,
  RedisConfigurationConfigDTO,
} from '../types'
import { RedisType } from '../types'
import type { AddOnRecord, ManagedCacheAddOn } from '../types/cloud-gateways-add-on'
import composables from '../composables'
import '@kong-ui-public/entities-shared/dist/style.css'
import endpoints from '../partials-endpoints'
import { getRedisType, isKonnectManagedRedisEnabled, pickCloudAuthFields } from '../helpers'
import {
  addOnApiResponseToDisplayRecord,
  fetchAllManagedCacheAddOns,
  fetchManagedCacheAddOnById,
  fetchRedisPartialForConfigCard,
  getCacheConfigId,
  isManagedCacheAddOn,
} from '../helpers/managed-cache-add-on'
import { pickManagedAddOnCardRecord } from '../helpers/managed-add-on-config-schema'
import { DEFAULT_REDIS_TYPE } from '../constants'

type DetailLayout = 'legacy' | 'resolving' | 'managed'

/**
 * Managed Konnect detail flow:
 * resolve route id as add-on first (source of truth), then fall back to partial and map back to add-on
 * render managed card when resolved; otherwise fall back to legacy partial card
 */

const props = defineProps({
  config: {
    type: Object as PropType<KonnectRedisConfigurationEntityConfig | KongManagerRedisConfigurationEntityConfig>,
    required: true,
    validator: (config: KonnectRedisConfigurationEntityConfig | KongManagerRedisConfigurationEntityConfig): boolean => {
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
    default: true,
  },
  /** Nested partial card only: skips managed (add-on + collapse) layout */
  disableKonnectManagedDetail: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits<{
  (e: 'loading', isLoading: boolean): void
  (e: 'fetch:error', error: AxiosError): void
  (e: 'fetch:success', data: RedisConfigurationResponse | ManagedCacheAddOn): void
}>()

const { i18n: { t } } = composables.useI18n()

const { managedAddOnConfigSchema, setManagedAddOnSchemaFromDisplayRecord } = composables.useManagedCacheAddOnDisplaySchema()
const { axiosInstance } = useAxios(props.config?.axiosRequestConfig)

const fetchUrl = computed((): string => endpoints.form[props.config.app].edit)
const emitFetchError = (error: AxiosError): void => emit('fetch:error', error)
const emitLoading = (isLoading: boolean): void => emit('loading', isLoading)

// Show cloud auth fields only when enabled in config
const konnectCloudAuthAvailable = computed((): boolean => props.config.cloudAuthAvailable === true )

// Enable managed layout only for supported Konnect setup
const isManagedKonnectDetailEnabled = computed((): boolean =>
  !props.disableKonnectManagedDetail &&
  props.config.app === 'konnect' &&
  isKonnectManagedRedisEnabled(props.config as KonnectRedisConfigurationEntityConfig),
)

// Use Cloud Gateways base when provided; otherwise use apiBaseUrl
const cloudGatewaysBase = computed((): string => {
  const k = props.config as KonnectRedisConfigurationEntityConfig
  return (k.cloudGatewaysApiBaseUrl ?? props.config.apiBaseUrl) ?? ''
})

const detailLayout = ref<DetailLayout>('legacy')
const addOnIdForCacheFetch = ref('')
const linkedPartialIdForCollapse = ref<string | null>(null)
const partialSectionCollapsed = ref(true)

// Keep only fields shown on the managed cache card
const addOnRecordResolver = (data: AddOnRecord): AddOnRecord => {
  const full = addOnApiResponseToDisplayRecord(data, {
    cloudAuthAvailable: konnectCloudAuthAvailable.value,
  })
  // allowlist filter for add-on cache data
  return pickManagedAddOnCardRecord(full)
}

// Show a skeleton first so legacy card does not flash
onBeforeMount(() => {
  if (isManagedKonnectDetailEnabled.value) {
    detailLayout.value = 'resolving'
  }
})

// Route id may be an add-on id or a partial id.
// Resolve add-on first because it is the source of truth for managed detail + linked partial mapping.
// If add-on is not found (for example during provisioning/teardown), resolve partial and map back to add-on.
onMounted(() => {
  if (!isManagedKonnectDetailEnabled.value) {
    return
  }

  void (async () => {
    emit('loading', true)

    const k = props.config as KonnectRedisConfigurationEntityConfig
    const routeEntityId = k.entityId
    const gatewaysBase = cloudGatewaysBase.value

    try {
      const addOnFromRouteId = await fetchManagedCacheAddOnById(
        axiosInstance,
        gatewaysBase,
        routeEntityId,
        k.controlPlaneId,
      )

      if (addOnFromRouteId) {
        addOnIdForCacheFetch.value = addOnFromRouteId.id
        linkedPartialIdForCollapse.value = getCacheConfigId(addOnFromRouteId) ?? null
        detailLayout.value = 'managed'
        return
      }

      // Shared helper keeps detail behavior aligned with list and avoids duplicate fetch logic
      const partial = await fetchRedisPartialForConfigCard(
        axiosInstance,
        k.apiBaseUrl,
        k.controlPlaneId,
        routeEntityId,
      )

      if (partial) {
        const addOns = await fetchAllManagedCacheAddOns(
          axiosInstance,
          gatewaysBase,
          k.controlPlaneId,
          k.controlPlaneGeo,
        )

        const addOnForPartial = addOns.find((a) => getCacheConfigId(a) === routeEntityId)

        if (addOnForPartial && isManagedCacheAddOn(addOnForPartial)) {
          addOnIdForCacheFetch.value = addOnForPartial.id
          linkedPartialIdForCollapse.value = routeEntityId
          detailLayout.value = 'managed'
          return
        }
      }
    } catch {
      // fall back to legacy partial-only card
    } finally {
      emit('loading', false)
    }

    detailLayout.value = 'legacy'
  })()
})

// Show legacy card when konnect FF is disbaled or unresolved
const showLegacyConfigCard = computed((): boolean =>
  !isManagedKonnectDetailEnabled.value || detailLayout.value === 'legacy',
)

// Runtime config for managed cache card fetches
const addOnCardRuntimeConfig = computed((): KonnectRedisConfigurationEntityConfig => {
  const k = props.config as KonnectRedisConfigurationEntityConfig
  return {
    ...k,
    apiBaseUrl: cloudGatewaysBase.value,
    entityId: addOnIdForCacheFetch.value,
    formatPreferenceKey: k.formatPreferenceKey ? `${k.formatPreferenceKey}_managed_cache` : undefined,
  }
})

// Runtime config for nested partial card
const innerPartialCardConfig = computed((): KonnectRedisConfigurationEntityConfig => {
  const k = props.config as KonnectRedisConfigurationEntityConfig
  const partialId = linkedPartialIdForCollapse.value ?? k.entityId
  return {
    ...k,
    entityId: partialId,
    formatPreferenceKey: k.formatPreferenceKey ? `${k.formatPreferenceKey}_managed_partial` : undefined,
  }
})

const partialCollapseTriggerLabel = computed((): string =>
  partialSectionCollapsed.value
    ? t('config_card.collapse.show_partial')
    : t('config_card.collapse.hide_partial'),
)

// Terraform export needs the managed_cache_add_on wrapper
const cacheAddonCodeBlockFormatter = (record: AddOnRecord, codeFormat: string): AddOnRecord => {
  if (!record || Object.keys(record).length === 0) {
    return {}
  }

  return codeFormat === 'terraform'
    ? { managed_cache_add_on: { ...record } }
    : { ...record }
}

// Rebuild schema from loaded add-on, then emit success
const onCacheAddOnLoaded = (data: AddOnRecord): void => {
  const display = addOnApiResponseToDisplayRecord(data, {
    cloudAuthAvailable: konnectCloudAuthAvailable.value,
  })
  setManagedAddOnSchemaFromDisplayRecord(display)
  if (isManagedCacheAddOn(data)) {
    emit('fetch:success', data)
  }
}

// Reuse the same success event for nested partial loads
const onPartialNestedLoaded = (data: RedisConfigurationResponse | ManagedCacheAddOn) => {
  if ('config' in data && 'type' in data && typeof data.type === 'string') {
    emit('fetch:success', data as RedisConfigurationResponse)
  }
}

const redisType = ref<RedisType>(DEFAULT_REDIS_TYPE)


// Legacy handler: derive type label and emit payload
const handleData = (payload: Record<string, any>): void => {
  const partialResponse = payload as RedisConfigurationResponse
  redisType.value = getRedisType(partialResponse)
  emit('fetch:success', partialResponse)
}

// Labels used in legacy detail mode
const redisTypeText = computed(() => {
  const suffix = redisType.value === RedisType.HOST_PORT_CE
    ? t('form.options.type.suffix_open_source')
    : t('form.options.type.suffix_enterprise')
  let prefix = ''
  switch (redisType.value) {
    case RedisType.HOST_PORT_CE:
      prefix = t('form.options.type.host_port')
      break
    case RedisType.HOST_PORT_EE:
      prefix = t('form.options.type.host_port')
      break
    case RedisType.CLUSTER:
      prefix = t('form.options.type.cluster')
      break
    case RedisType.SENTINEL:
      prefix = t('form.options.type.sentinel')
      break
  }
  return `${prefix}${suffix}`
})

// Flatten the config object to display in the structure tab
const recordResolver = (payload: Record<string, any>): AddOnRecord => {
  const partialResponse = payload as RedisConfigurationResponse
  const partialConfig = partialResponse.config ?? {}
  return {
    id: partialResponse.id,
    name: partialResponse.name,
    tags: partialResponse.tags,
    created_at: partialResponse.created_at,
    updated_at: partialResponse.updated_at,
    type: partialResponse.type,
    ...partialConfig,
    ...(props.config.cloudAuthAvailable
      ? { cloud_authentication: pickCloudAuthFields(partialConfig.cloud_authentication) } :
      {}
    ),
  }
}

/**
 * Put config details into `config` object to display in the code block tab
 */
const codeBlockRecordFormatter = (record: Record<string, any>, codeFormat: string): AddOnRecord => {
  // Prevent type errors, return empty object if no record
  if (!record || Object.keys(record).length === 0) {
    return {}
  }

  const { id, name, created_at, updated_at, type, tags, ...config } = record
  if (codeFormat === 'terraform') {
    return {
      [type.replaceAll('-', '_')]: {
        id, name, tags, created_at, updated_at, config,
      },
    }
  }
  return {
    id, name, tags, created_at, updated_at, type, config,
  }
}

type BasicFields = {
  id: string
  name: string
  updated_at: string | number
  created_at: string | number
  type: string
  tags: string[]
}
type Fields = RedisConfigurationConfigDTO & BasicFields

/**
 * Configuration schema for all fields
 */
const schemaFieldConfigs: {
  [key in keyof Fields]: ConfigurationSchemaItem
} = {
  id: {},
  name: {
    type: ConfigurationSchemaType.Text,
    section: ConfigurationSchemaSection.Basic,
    label: t('form.fields.name.label'),
  },
  tags: {
    type: ConfigurationSchemaType.BadgeTag,
    section: ConfigurationSchemaSection.Basic,
    label: t('form.fields.tags.label'),
    tooltip: t('form.fields.tags.tooltip'),
  },
  updated_at: {},
  created_at: {},
  type: {
    type: ConfigurationSchemaType.Text,
    section: ConfigurationSchemaSection.Basic,
    label: t('form.fields.type.label'),
  },
  cluster_max_redirections: {
    type: ConfigurationSchemaType.Text,
    section: ConfigurationSchemaSection.Basic,
    tooltip: t('form.fields.cluster_max_redirections.tooltip'),
    label: t('form.fields.cluster_max_redirections.label'),
  },
  cluster_nodes: {
    type: ConfigurationSchemaType.JsonArray,
    section: ConfigurationSchemaSection.Basic,
    label: t('form.fields.cluster_nodes.title'),
    tooltip: t('form.fields.cluster_nodes.tooltip'),
  },
  connect_timeout: {
    type: ConfigurationSchemaType.Text,
    section: ConfigurationSchemaSection.Basic,
    label: t('form.fields.connect_timeout.label'),
    tooltip: t('form.fields.connect_timeout.tooltip'),
  },
  connection_is_proxied: {
    type: ConfigurationSchemaType.Text,
    section: ConfigurationSchemaSection.Basic,
    label: t('form.fields.connection_is_proxied.label'),
    tooltip: t('form.fields.connection_is_proxied.tooltip'),
  },
  database: {
    type: ConfigurationSchemaType.Text,
    section: ConfigurationSchemaSection.Basic,
    label: t('form.fields.database.label'),
    tooltip: t('form.fields.database.tooltip'),
  },
  host: {
    type: ConfigurationSchemaType.Text,
    section: ConfigurationSchemaSection.Basic,
    label: t('form.fields.host.label'),
    tooltip: t('form.fields.host.tooltip'),
  },
  keepalive_backlog: {
    type: ConfigurationSchemaType.Text,
    section: ConfigurationSchemaSection.Basic,
    label: t('form.fields.keepalive_backlog.label'),
    tooltip: t('form.fields.keepalive_backlog.tooltip'),
  },
  keepalive_pool_size: {
    type: ConfigurationSchemaType.Text,
    section: ConfigurationSchemaSection.Basic,
    label: t('form.fields.keepalive_pool_size.label'),
    tooltip: t('form.fields.keepalive_pool_size.tooltip'),
  },
  password: {
    type: ConfigurationSchemaType.Redacted,
    section: ConfigurationSchemaSection.Basic,
    label: t('form.fields.password.label'),
    tooltip: t('form.fields.password.tooltip'),
  },
  port: {
    type: ConfigurationSchemaType.Text,
    section: ConfigurationSchemaSection.Basic,
    label: t('form.fields.port.label'),
    tooltip: t('form.fields.port.tooltip'),
  },
  read_timeout: {
    type: ConfigurationSchemaType.Text,
    section: ConfigurationSchemaSection.Basic,
    label: t('form.fields.read_timeout.label'),
    tooltip: t('form.fields.read_timeout.tooltip'),
  },
  send_timeout: {
    type: ConfigurationSchemaType.Text,
    section: ConfigurationSchemaSection.Basic,
    label: t('form.fields.send_timeout.label'),
    tooltip: t('form.fields.send_timeout.tooltip'),
  },
  sentinel_master: {
    type: ConfigurationSchemaType.Text,
    section: ConfigurationSchemaSection.Basic,
    label: t('form.fields.sentinel_master.label'),
    tooltip: t('form.fields.sentinel_master.tooltip'),
  },
  sentinel_nodes: {
    type: ConfigurationSchemaType.JsonArray,
    section: ConfigurationSchemaSection.Basic,
    tooltip: t('form.fields.sentinel_nodes.tooltip'),
  },
  sentinel_password: {
    type: ConfigurationSchemaType.Redacted,
    section: ConfigurationSchemaSection.Basic,
    label: t('form.fields.sentinel_password.label'),
    tooltip: t('form.fields.sentinel_password.tooltip'),
  },
  sentinel_role: {
    type: ConfigurationSchemaType.Text,
    section: ConfigurationSchemaSection.Basic,
    label: t('form.fields.sentinel_role.label'),
    tooltip: t('form.fields.sentinel_role.tooltip'),
  },
  sentinel_username: {
    type: ConfigurationSchemaType.Text,
    section: ConfigurationSchemaSection.Basic,
    label: t('form.fields.sentinel_username.label'),
    tooltip: t('form.fields.sentinel_username.tooltip'),
  },
  server_name: {
    type: ConfigurationSchemaType.Text,
    section: ConfigurationSchemaSection.Basic,
    label: t('form.fields.server_name.label'),
    tooltip: t('form.fields.server_name.tooltip'),
  },
  ssl_verify: {
    type: ConfigurationSchemaType.Text,
    section: ConfigurationSchemaSection.Basic,
    label: t('form.fields.ssl_verify.label'),
    tooltip: t('form.fields.ssl_verify.tooltip'),
  },
  ssl: {
    type: ConfigurationSchemaType.Text,
    section: ConfigurationSchemaSection.Basic,
    label: t('form.fields.ssl.label'),
    tooltip: t('form.fields.ssl.tooltip'),
  },
  timeout: {
    type: ConfigurationSchemaType.Text,
    section: ConfigurationSchemaSection.Basic,
    label: t('form.fields.timeout.label'),
    tooltip: t('form.fields.timeout.tooltip'),
  },
  username: {
    type: ConfigurationSchemaType.Text,
    section: ConfigurationSchemaSection.Basic,
    label: t('form.fields.username.label'),
    tooltip: t('form.fields.username.tooltip'),
  },
  cloud_authentication: {
    type: ConfigurationSchemaType.Json,
    section: ConfigurationSchemaSection.Basic,
    label: t('form.sections.cloud_auth.title'),
  },
}

/**
 * Pick fields to display in the configuration schema
 */
const pickSchemaFields = (fields: Array<keyof Fields>): ConfigurationSchema => {
  const schema: ConfigurationSchema = {}
  const keys = Object.keys(schemaFieldConfigs) as Array<keyof Fields>
  for (const field of keys) {
    if (fields.includes(field)) {
      schema[field] = {
        ...schemaFieldConfigs[field],
        order: fields.indexOf(field) + 1,
      }
    } else {
      schema[field] = {
        ...schemaFieldConfigs[field],
        hidden: true,
      }
    }
  }
  return schema
}

/**
 * Pick fields to display in the configuration card based on the Redis type
 */
const configSchema = computed<ConfigurationSchema>(() => {
  const commonFields: Array<keyof Fields> = ['id', 'name', 'tags', 'type', 'updated_at', 'created_at']
  switch (redisType.value) {
    case RedisType.HOST_PORT_CE:
      return pickSchemaFields([
        ...commonFields,
        'host',
        'port',
        'timeout',
        'database',
        'username',
        'password',
        'ssl',
        'ssl_verify',
        'server_name',
        'cloud_authentication',
      ])
    case RedisType.HOST_PORT_EE:
      return pickSchemaFields([
        ...commonFields,
        'host',
        'port',
        'connection_is_proxied',
        'database',
        'username',
        'password',
        'ssl',
        'ssl_verify',
        'server_name',
        'keepalive_backlog',
        'keepalive_pool_size',
        'read_timeout',
        'send_timeout',
        'connect_timeout',
        'cloud_authentication',
      ])
    case RedisType.CLUSTER:
      return pickSchemaFields([
        ...commonFields,
        'cluster_nodes',
        'cluster_max_redirections',
        'database',
        'username',
        'password',
        'ssl',
        'ssl_verify',
        'server_name',
        'keepalive_backlog',
        'keepalive_pool_size',
        'read_timeout',
        'send_timeout',
        'connect_timeout',
        'cloud_authentication',
      ])
    case RedisType.SENTINEL:
      return pickSchemaFields([
        ...commonFields,
        'sentinel_master',
        'sentinel_role',
        'sentinel_nodes',
        'sentinel_username',
        'sentinel_password',
        'database',
        'username',
        'password',
        'ssl',
        'ssl_verify',
        'server_name',
        'keepalive_backlog',
        'keepalive_pool_size',
        'read_timeout',
        'send_timeout',
        'connect_timeout',
      ])
    default:
      throw new Error('Invalid Redis type')
  }
})
</script>

<style lang="scss" scoped>
.managed-redis-partial-expandable-body {
  margin-top: var(--kui-space-50, $kui-space-50);
  padding-left: var(--kui-space-60, $kui-space-60);
}
</style>
