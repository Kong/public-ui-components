<template>
  <div
    class="kong-ui-consumer-group-entity-config-card"
    :class="{ 'redis-nested-detail': disableKonnectManagedDetail }"
  >
    <!-- Konnect managed Redis only (FF). Self-managed Redis never uses this; it always uses the legacy card below -->
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
        <KAlert
          v-if="isManagedKonnectDetailEnabled && managedAddOnState === 'initializing'"
          appearance="info"
          class="redis-managed-state-alert"
          data-testid="redis-managed-state-alert-initializing"
          show-icon
        >
          {{ t('config_card.managed_state.initializing_alert') }}
        </KAlert>
        <KAlert
          v-else-if="isManagedKonnectDetailEnabled && managedAddOnState === 'terminating'"
          appearance="danger"
          class="redis-managed-state-alert"
          data-testid="redis-managed-state-alert-terminating"
          show-icon
        >
          {{ t('config_card.managed_state.terminating_alert') }}
        </KAlert>
        <EntityBaseConfigCard
          :key="addOnIdForCacheFetch"
          :code-block-record-formatter="addOnCodeFmt"
          :code-block-record-resolver="addOnCodeRslv"
          :config="addOnCardRuntimeConfig"
          :config-card-doc="configCardDoc"
          :config-schema="managedAddOnConfigSchema"
          :entity-type="SupportedEntityType.CloudGatewayAddon"
          fetch-url="/v2/cloud-gateways/add-ons/{id}"
          :formats-to-hide="['yaml']"
          :hide-title="false"
          :preserve-code-block-timestamps="true"
          :record-resolver="addOnRecordResolver"
          @fetch:error="onEntityBaseConfigCardFetchError"
          @fetch:success="onCacheAddOnLoaded"
          @loading="(v) => emit('loading', v)"
        >
          <template #title>
            {{ t('config_card.sections.cache_configuration') }}
          </template>
          <template #type>
            <div>{{ t('list.type.konnect_managed_redis') }}</div>
          </template>
          <!-- One JSON blob per group -->
          <template #data_plane_groups="{ row }">
            <div
              class="dpg-stack"
              data-testid="dpg-display"
            >
              <template v-if="!dataPlaneGroupEntries(row.value).length">
                –
              </template>
              <template v-else>
                <div
                  v-for="(entry, idx) in dataPlaneGroupEntries(row.value)"
                  :key="idx"
                  class="dpg-sub-row"
                  :data-testid="`dpg-sub-row-${idx}`"
                >
                  <div
                    class="dpg-sub-label"
                    :data-testid="`dpg-item-heading-${idx}`"
                  >
                    {{ dataPlaneGroupItemHeading(entry, idx) }}
                  </div>
                  <div
                    class="dpg-sub-value"
                    :data-testid="`dpg-entry-blob-${idx}`"
                  >
                    <KCodeBlock
                      :id="`dpg-${dataPlaneGroupsInstanceId}-${idx}`"
                      :code="jsonStringifyDpgEntryForBlob(entry)"
                      language="json"
                      max-height="480px"
                      :show-line-numbers="false"
                      @code-block-render="highlightCodeBlock"
                    />
                  </div>
                </div>
              </template>
            </div>
          </template>
          <!-- Spinner while add-on is initializing/terminating; full partial card when state is ready -->
          <template #after-fields>
            <KCollapse
              v-model="partialSectionCollapsed"
              class="redis-kcollapse"
              data-testid="managed-redis-partial-collapse"
              trigger-alignment="leading"
            >
              <template #trigger="{ isCollapsed, toggle }">
                <KButton
                  appearance="tertiary"
                  class="redis-collapse-trigger"
                  data-testid="redis-collapse-trigger"
                  type="button"
                  @click="toggle()"
                >
                  <ChevronUpIcon
                    v-if="!isCollapsed"
                    decorative
                    :size="KUI_ICON_SIZE_40"
                  />
                  <ChevronRightIcon
                    v-else
                    decorative
                    :size="KUI_ICON_SIZE_40"
                  />
                  {{ partialCollapseTriggerLabel }}
                </KButton>
              </template>
              <div class="redis-expand-body">
                <!-- Initializing/terminating Add on: keep partial header + format control, but render placeholder content -->
                <div
                  v-if="!partialSectionCollapsed && showPartialTransitionalUi"
                  class="redis-provisioning"
                  :data-redis-kind="partialTransitionalKind"
                  data-testid="redis-provisioning"
                >
                  <div class="redis-head">
                    <span class="redis-title">
                      {{ t('config_card.sections.partial_configuration') }}
                    </span>
                    <div class="redis-actions">
                      <KLabel class="redis-format-label">
                        {{ t('config_card.partial.format_label') }}
                      </KLabel>
                      <KSelect
                        v-model="partialTransitionalFormat"
                        data-testid="managed-redis-partial-format-select"
                        :items="partialTransitionalFormatItems"
                      />
                    </div>
                  </div>

                  <div
                    v-if="partialTransitionalFormat === 'structured'"
                    class="redis-transitional"
                  >
                    <div
                      v-for="field in partialTransitionalFields"
                      :key="field.key"
                      class="redis-row"
                    >
                      <div class="redis-lbl">
                        {{ field.label }}
                      </div>
                      <div class="redis-val">
                        <span
                          aria-hidden="true"
                          class="redis-spinner"
                        />
                        <span>{{ partialTransitionalMessage }}</span>
                      </div>
                    </div>
                  </div>

                  <div
                    v-else
                    class="redis-code"
                  >
                    <!-- Reuse ready-state code block components so JSON/TR styling stays identical -->
                    <JsonCodeBlock
                      v-if="partialTransitionalFormat === 'json'"
                      :config="innerPartialCardConfig"
                      :entity-record="partialTransitionalCodeRecord"
                    />
                    <TerraformCodeBlock
                      v-else
                      :entity-record="partialTransitionalCodeRecord"
                      :entity-type="SupportedEntityType.Partial"
                    />
                  </div>
                </div>

                <RedisConfigurationConfigCard
                  v-else-if="!partialSectionCollapsed"
                  :config="innerPartialCardConfig"
                  :config-card-doc="configCardDoc"
                  disable-konnect-managed-detail
                  :hide-title="false"
                  @fetch:error="(e) => emit('fetch:error', e)"
                  @fetch:not-found="emitFetchNotFound"
                  @fetch:success="onPartialNestedLoaded"
                  @loading="(v) => emit('loading', v)"
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
      @fetch:error="onEntityBaseConfigCardFetchError"
      @fetch:success="handleData"
      @loading="(v) => emit('loading', v)"
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
import { computed, onBeforeMount, onMounted, ref, useId, watch } from 'vue'
import { isAxiosError, type AxiosError } from 'axios'
import type {
  ConfigurationSchema,
  ConfigurationSchemaItem,
  ConfigCardCodeFormat,
} from '@kong-ui-public/entities-shared'
import {
  ConfigurationSchemaSection,
  ConfigurationSchemaType,
  EntityBaseConfigCard,
  JsonCodeBlock,
  SupportedEntityType,
  TerraformCodeBlock,
  highlightCodeBlock,
  useAxios,
} from '@kong-ui-public/entities-shared'
import { KUI_ICON_SIZE_40 } from '@kong/design-tokens'
import { ChevronRightIcon, ChevronUpIcon } from '@kong/icons'
import { KAlert, KButton, KCodeBlock, KCollapse, KLabel, KSelect, KSkeleton } from '@kong/kongponents'
import type {
  DetailLayout,
  KonnectRedisConfigurationEntityConfig,
  KongManagerRedisConfigurationEntityConfig,
  RedisConfigurationResponse,
  RedisConfigurationConfigDTO,
} from '../types'
import { RedisType } from '../types'
import type {
  AddOnRecord,
  AddOnValue,
  CloudGatewaysAddOnResponse,
  CloudGatewaysAddOnState,
  ManagedCacheAddOn,
} from '../types/cloud-gateways-add-on'
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
import { addOnToTerraformArgs, cloneAddOnResponseForConfigTabs } from '../helpers/managed-cache-add-on-tab-payloads'
import { DEFAULT_REDIS_TYPE } from '../constants'

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

/**
 * fetch:success` - Koko redis partial (`RedisConfigurationResponse`)
 * Konnect-managed redis loads Cloud Gateways add-ons as the primary entity; that payload is emitted
 * separately via `fetch:managed-add-on-success` to avoid confusion with legacy partial payload
 */
const emit = defineEmits<{
  (e: 'loading', isLoading: boolean): void
  (e: 'fetch:error', error: AxiosError): void
  (e: 'fetch:not-found', error: AxiosError): void
  (e: 'fetch:success', data: RedisConfigurationResponse): void
  (e: 'fetch:managed-add-on-success', data: ManagedCacheAddOn): void
}>()

const emitFetchNotFound = (error: AxiosError): void => {
  emit('fetch:not-found', error)
}

// Host app treat `fetch:error` as fatal navigation. After Konnect-managed Redis is deleted,
// `GET …/add-ons/{id}` returns 404, surface `fetch:not-found` instead
const onEntityBaseConfigCardFetchError = (error: AxiosError): void => {
  if (isAxiosError(error) && error.response?.status === 404) {
    emitFetchNotFound(error)
    return
  }
  emit('fetch:error', error)
}

const { i18n: { t } } = composables.useI18n()
const dataPlaneGroupsInstanceId = useId()

// Shaped add-on/cache values use `AddOnRecord`; `row.value` is typed `any` on the shared card, we only accept add-on shapes here
const isDataPlaneGroupObject = (v: AddOnValue | undefined): v is AddOnRecord =>
  v !== null && typeof v === 'object' && !Array.isArray(v)

const dataPlaneGroupEntries = (value: AddOnValue | undefined): AddOnRecord[] => {
  if (value === undefined || value === null) {
    return []
  }

  if (Array.isArray(value)) {
    return value.filter(isDataPlaneGroupObject)
  }

  if (isDataPlaneGroupObject(value)) {
    return [value]
  }

  return []
}

const dataPlaneGroupItemHeading = (entry: AddOnRecord, index: number): string => {
  const name = entry.name
  if (typeof name === 'string' && name.trim() !== '') {
    return name
  }

  return t('config_card.managed_dpg.entry_heading', { n: index + 1 })
}

// Omit UI-only `name` before JSON blob; everything else stays on the payload
const jsonStringifyDpgEntryForBlob = (entry: AddOnRecord): string => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- `name` is UI-only; rest is serialized
  const { name, ...payload } = entry
  return JSON.stringify(payload, null, 2)
}

const { managedAddOnConfigSchema, setManagedAddOnSchemaFromDisplayRecord } = composables.useManagedCacheAddOnDisplaySchema()
const { axiosInstance } = useAxios(props.config?.axiosRequestConfig)

const fetchUrl = computed((): string => endpoints.form[props.config.app].edit)

// Show cloud auth fields only when enabled in config
const konnectCloudAuthAvailable = computed((): boolean => props.config.cloudAuthAvailable === true )

// Konnect managed Redis only (FF). Excludes self-managed Redis, Kong Manager, and legacy Konnect partial detail
const isManagedKonnectDetailEnabled = computed((): boolean =>
  !props.disableKonnectManagedDetail &&
  props.config.app === 'konnect' &&
  isKonnectManagedRedisEnabled(props.config as KonnectRedisConfigurationEntityConfig),
)

// Use Cloud Gateways base when provided; otherwise use apiBaseUrl
const cloudGatewaysBase = computed((): string => {
  const k = props.config as KonnectRedisConfigurationEntityConfig
  return (k.cloudGatewaysApiBaseUrl ?? k.apiBaseUrl) ?? ''
})

const detailLayout = ref<DetailLayout>('legacy')
const addOnIdForCacheFetch = ref('')
const linkedPartialIdForCollapse = ref<string | null>(null)
const partialSectionCollapsed = ref(true)

// Add-on state from GET add-on
const managedAddOnState = ref<CloudGatewaysAddOnState | null>(null)

const showNestedPartialConfiguration = computed((): boolean => {
  const state = managedAddOnState.value
  if (state === 'ready') {
    return true
  }

  if (state === null) {
    return !!linkedPartialIdForCollapse.value
  }

  if (state === 'initializing' || state === 'terminating') {
    return false
  }

  return !!linkedPartialIdForCollapse.value
})

// Spinner row instead of nested partial when add-on is not in Ready state
const showPartialTransitionalUi = computed((): boolean => !showNestedPartialConfiguration.value)

const partialTransitionalKind = computed((): 'provisioning' | 'terminating' => (
  managedAddOnState.value === 'terminating' ? 'terminating' : 'provisioning'
))

const isPartialNonReadyState = computed((): boolean =>
  managedAddOnState.value === 'initializing' || managedAddOnState.value === 'terminating',
)

const partialTransitionalMessage = computed((): string =>
  partialTransitionalKind.value === 'terminating'
    ? t('config_card.partial.terminating_value')
    : t('config_card.partial.provisioning_value'),
)

// Placeholder field keys for managed-cache partial only (not self-managed Redis variants)
const partialTransitionalFieldKeys = [
  'id',
  'name',
  'type',
  'cluster_max_redirections',
  'connection_is_proxied',
  'database',
  'host',
  'port',
  'ssl',
  'ssl_verify',
  'keepalive_backlog',
  'keepalive_pool_size',
  'read_timeout',
  'send_timeout',
  'connect_timeout',
  'cloud_authentication',
] as const

const partialTransitionalFields = computed((): Array<{ key: string, label: string }> => {
  // Keep placeholder rows aligned with the legacy partial schema labels
  return partialTransitionalFieldKeys
    .filter((key) => key !== 'cloud_authentication' || konnectCloudAuthAvailable.value)
    .map((key) => ({
      key,
      label: configSchema.value[key]?.label || key,
    }))
})

// Konnect managed Redis partial collapse
type PartialTransitionalFormat = 'structured' | 'json' | 'terraform'

const partialTransitionalFormat = ref<PartialTransitionalFormat>('structured')

const partialTransitionalFormatItems = computed((): Array<{ label: string, value: PartialTransitionalFormat }> => [
  { label: t('config_card.partial.format_structured'), value: 'structured' },
  { label: t('config_card.partial.format_json'), value: 'json' },
  { label: t('config_card.partial.format_terraform'), value: 'terraform' },
])

const partialTransitionalCodeRecord = computed((): Record<string, string> => {
  // Code-format placeholders are string-only because syntax highlighters can't render Vue spinners inline
  const msg = partialTransitionalMessage.value
  return Object.fromEntries(partialTransitionalFields.value.map(({ key }) => [key, msg]))
})

const partialFormatPreferenceKey = computed((): string | undefined =>
  innerPartialCardConfig.value.formatPreferenceKey,
)

watch(partialTransitionalFormat, (format: PartialTransitionalFormat) => {
  if (partialFormatPreferenceKey.value) {
    localStorage.setItem(partialFormatPreferenceKey.value, format)
  }
})

watch(partialTransitionalFormatItems, (items) => {
  const allowed = items.map(item => item.value)
  if (!allowed.includes(partialTransitionalFormat.value)) {
    partialTransitionalFormat.value = items[0]?.value ?? 'structured'
  }
})

watch(isPartialNonReadyState, (isNonReady) => {
  if (isNonReady) {
    partialSectionCollapsed.value = true
  }
})

const partialCollapseTriggerLabel = computed((): string =>
  partialSectionCollapsed.value
    ? t('config_card.collapse.show_partial')
    : t('config_card.collapse.hide_partial'),
)

// The same Cloud Gateway add-on response powers 3 outputs:
// Structured tab: `addOnRecordResolver` maps and filters API fields for card display
// JSON tab: `addOnCodeRslv` preserves original GET payload including timestamps
// TR tab: `addOnCodeFmt` transforms that payload via `addOnToTerraformArgs`
const addOnCodeRslv = (raw: Record<string, any>): Record<string, any> =>
  cloneAddOnResponseForConfigTabs(raw as CloudGatewaysAddOnResponse)

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

  // Partial format (Structured /JSON /TR): use the same localStorage key as the nested
  // EntityBaseConfigCard (`innerPartialCardConfig.formatPreferenceKey`) so the user's choice
  // while provisioning matches the tab when the add-on becomes ready
  const formatItems = partialTransitionalFormatItems.value
  const fallbackFormat = formatItems[0]?.value ?? 'structured'
  const preferenceKey = partialFormatPreferenceKey.value

  if (!preferenceKey) {
    partialTransitionalFormat.value = fallbackFormat
  } else {
    const storedFormat = localStorage.getItem(preferenceKey) as PartialTransitionalFormat | null
    if (storedFormat && formatItems.some(item => item.value === storedFormat)) {
      partialTransitionalFormat.value = storedFormat
    } else {
      partialTransitionalFormat.value = fallbackFormat
    }
    localStorage.setItem(preferenceKey, partialTransitionalFormat.value)
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
        // Lifecycle state from prefetch
        managedAddOnState.value = addOnFromRouteId.state ?? null
        partialSectionCollapsed.value = isPartialNonReadyState.value
          ? true
          : linkedPartialIdForCollapse.value !== null
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
          // Route opened with Koko partial id; same lifecycle rules as direct add-on
          managedAddOnState.value = addOnForPartial.state ?? null
          partialSectionCollapsed.value = true
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

// Wire add-on JSON- pass through for JSON tab; TR uses `konnect_cloud_gateway_addon` map
const addOnCodeFmt = (
  record: Record<string, any>,
  codeFormat: ConfigCardCodeFormat,
): Record<string, any> => {
  const addOn = record as CloudGatewaysAddOnResponse
  return codeFormat === 'terraform' ? addOnToTerraformArgs(addOn) : cloneAddOnResponseForConfigTabs(addOn)
}

// Konnect-managed: refresh display schema from API row; notify hosts via add-on-only event
const onCacheAddOnLoaded = (data: Record<string, any>): void => {
  const row = data as AddOnRecord
  const display = addOnApiResponseToDisplayRecord(row, {
    cloudAuthAvailable: konnectCloudAuthAvailable.value,
  })
  setManagedAddOnSchemaFromDisplayRecord(display)

  if (isManagedCacheAddOn(row)) {
    // Keep partial UI in sync when add-on transitions
    managedAddOnState.value = row.state ?? null
    const nextLinkedPartialId = getCacheConfigId(row) ?? null
    if (nextLinkedPartialId && linkedPartialIdForCollapse.value !== nextLinkedPartialId) {
      linkedPartialIdForCollapse.value = nextLinkedPartialId
    }
    emit('fetch:managed-add-on-success', row)
  }
}

// Nested legacy partial config card
const onPartialNestedLoaded = (data: RedisConfigurationResponse) => {
  emit('fetch:success', data)
}

const redisType = ref<RedisType>(DEFAULT_REDIS_TYPE)

// Legacy partial config card
const handleData = (payload: Record<string, any>): void => {
  const row = payload as RedisConfigurationResponse
  redisType.value = getRedisType(row)
  emit('fetch:success', row)
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
  const row = payload as RedisConfigurationResponse
  const partialConfig = row.config ?? {}
  return {
    id: row.id,
    name: row.name,
    tags: row.tags,
    created_at: row.created_at,
    updated_at: row.updated_at,
    type: row.type,
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
const codeBlockRecordFormatter = (record: AddOnRecord, codeFormat: ConfigCardCodeFormat): AddOnRecord => {
  if (!record || Object.keys(record).length === 0) {
    return {}
  }

  const { id, name, created_at, updated_at, type, tags, ...config } = record
  if (codeFormat === 'terraform') {
    const typeKey = typeof type === 'string' ? type.replaceAll('-', '_') : 'partial'
    return {
      [typeKey]: {
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
.managed-konnect-redis-detail {
  .redis-managed-state-alert {
    margin-bottom: var(--kui-space-60, $kui-space-60);
  }

  // Fills the config card value column
  .dpg-stack {
    width: 100%;
  }

  // Mirror `ConfigCardItem`’s default label/value split
  .dpg-sub-row {
    align-items: flex-start;
    border-bottom: solid var(--kui-border-width-10, $kui-border-width-10) var(--kui-color-border, $kui-color-border);
    box-sizing: border-box;
    display: flex;
    padding: var(--kui-space-60, $kui-space-60) var(--kui-space-0, $kui-space-0);
    width: 100%;
  }

  .dpg-sub-label {
    box-sizing: border-box;
    color: var(--kui-color-text-neutral-stronger, $kui-color-text-neutral-stronger);
    font-size: var(--kui-font-size-30, $kui-font-size-30);
    font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
    padding-right: var(--kui-space-60, $kui-space-60);
    width: 25%;
  }

  .dpg-sub-value {
    box-sizing: border-box;
    flex: 1;
    min-width: 0;
    width: 75%;
  }

  :deep(.config-card-details-after) {
    padding-left: var(--kui-space-0, $kui-space-0);
    padding-top: var(--kui-space-60, $kui-space-60);
  }

  :deep(.redis-kcollapse .collapse-heading) {
    margin-bottom: var(--kui-space-0, $kui-space-0);
  }

  :deep(.redis-kcollapse .collapse-hidden-content) {
    margin-top: var(--kui-space-0, $kui-space-0);
  }

  :deep(.redis-nested-detail .kong-ui-entity-base-config-card.k-card) {
    background-color: transparent;
    border: none;
    box-shadow: none;
    padding-left: var(--kui-space-0, $kui-space-0);
    padding-right: var(--kui-space-0, $kui-space-0);
  }

  /* JsonArray fieldset legends (e.g. data plane groups): medium weight; keep global JsonCardItem unchanged */
  :deep(.config-card-fieldset-title b) {
    font-weight: var(--kui-font-weight-medium, $kui-font-weight-medium);
  }

  /* Tertiary KButton: no hover/active highlight */
  :deep(.redis-collapse-trigger) {
    &:hover:not(:disabled),
    &:active:not(:disabled) {
      background-color: transparent !important;
      box-shadow: none !important;
      color: var(--kui-color-text-primary, $kui-color-text-primary) !important;
    }
  }
}

.redis-expand-body {
  margin-top: var(--kui-space-0, $kui-space-0);
}

.redis-provisioning {
  width: 100%;
}

.redis-head {
  align-items: center;
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--kui-space-60, $kui-space-60);
}

.redis-title {
  color: var(--kui-color-text-neutral-stronger, $kui-color-text-neutral-stronger);
  font-size: var(--kui-font-size-40, $kui-font-size-40);
  font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
}

.redis-actions {
  align-items: center;
  display: flex;
  gap: var(--kui-space-40, $kui-space-40);
}

.redis-format-label {
  margin-bottom: var(--kui-space-0, $kui-space-0);
}

.redis-transitional {
  border-top: solid var(--kui-border-width-10, $kui-border-width-10) var(--kui-color-border, $kui-color-border);
  width: 100%;
}

.redis-row {
  border-bottom: solid var(--kui-border-width-10, $kui-border-width-10) var(--kui-color-border, $kui-color-border);
  display: flex;
  width: 100%;
}

.redis-lbl {
  box-sizing: border-box;
  color: var(--kui-color-text-neutral-stronger, $kui-color-text-neutral-stronger);
  font-size: var(--kui-font-size-30, $kui-font-size-30);
  font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
  padding: var(--kui-space-60, $kui-space-60) var(--kui-space-60, $kui-space-60) var(--kui-space-60, $kui-space-0);
  width: 25%;
}

.redis-val {
  align-items: center;
  box-sizing: border-box;
  color: var(--kui-color-text-neutral, $kui-color-text-neutral);
  display: flex;
  gap: var(--kui-space-30, $kui-space-30);
  min-height: 48px;
  padding: var(--kui-space-60, $kui-space-60) var(--kui-space-0, $kui-space-0);
  width: 75%;
}

.redis-val > span:last-child {
  min-width: 0;
  overflow-wrap: anywhere;
  width: 100%;
}

.redis-code {
  border-top: solid var(--kui-border-width-10, $kui-border-width-10) var(--kui-color-border, $kui-color-border);
  padding-top: var(--kui-space-40, $kui-space-40);
  width: 100%;
}

.redis-spinner {
  animation: redis-spin 0.8s linear infinite;
  border: 2px solid var(--kui-color-border, $kui-color-border);
  border-radius: 50%;
  border-right-color: var(--kui-color-border-primary, $kui-color-border-primary);
  display: inline-block;
  flex: 0 0 auto;
  height: 14px;
  width: 14px;
}

@keyframes redis-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
