<template>
  <div class="kong-ui-consumer-group-entity-config-card">
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
        <KSegmentedControl
          v-model="activeSegment"
          class="redis-config-segment"
          data-testid="managed-redis-config-segment"
          :options="configSegmentOptions"
          size="large"
        >
          <template #option-label="{ option }">
            <KTooltip
              :disabled="isTooltipDisabled(option)"
              max-width="320"
              placement="right"
              :text="partialSegmentTooltip"
            >
              <span>{{ option.label }}</span>
            </KTooltip>
          </template>
        </KSegmentedControl>
        <EntityBaseConfigCard
          v-if="activeSegment === 'cache'"
          :key="cacheConfigCardKey"
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
          @fetch:error="onFetchError"
          @fetch:success="onCacheAddOnLoaded"
          @loading="onLoadingChange"
        >
          <template #title>
            {{ t('config_card.sections.cache_configuration') }}
          </template>
          <template #type>
            <div>{{ t('list.type.konnect_managed_redis') }}</div>
          </template>
          <!-- One JSON blob per group -->
          <template #data_plane_groups="{ row }">
            <ManagedRedisDataPlaneGroups :value="row.value" />
          </template>
        </EntityBaseConfigCard>
        <RedisConfigurationConfigCard
          v-else-if="activeSegment === 'partial'"
          :config="innerPartialCardConfig"
          :config-card-doc="configCardDoc"
          disable-konnect-managed-detail
          :hide-title="false"
          @fetch:error="onFetchError"
          @fetch:success="onPartialLoaded"
          @loading="onLoadingChange"
        >
          <template #title>
            {{ t('config_card.sections.partial_configuration') }}
          </template>
        </RedisConfigurationConfigCard>
      </div>
    </template>

    <!-- Legacy card hides YAML only for nested managed-partial detail; default legacy Konnect/KM passes [ ] -->
    <EntityBaseConfigCard
      v-if="showLegacyConfigCard"
      :code-block-record-formatter="formatPartialRecord"
      :config="config"
      :config-card-doc="configCardDoc"
      :config-schema="configSchema"
      :entity-type="SupportedEntityType.Partial"
      :fetch-url="fetchUrl"
      :formats-to-hide="disableKonnectManagedDetail ? ['yaml'] : []"
      :hide-title="hideTitle"
      :record-resolver="recordResolver"
      @fetch:error="onFetchError"
      @fetch:success="handleData"
      @loading="onLoadingChange"
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
import { computed, onBeforeMount, onMounted, ref, watch } from 'vue'
import type { AxiosError } from 'axios'
import type {
  ConfigCardCodeFormat,
} from '@kong-ui-public/entities-shared'
import {
  EntityBaseConfigCard,
  SupportedEntityType,
  useAxios,
} from '@kong-ui-public/entities-shared'
import { KSegmentedControl, KSkeleton, KTooltip } from '@kong/kongponents'
import type { SegmentedControlOption } from '@kong/kongponents'
import type {
  DetailLayout,
  KonnectRedisConfigurationEntityConfig,
  KongManagerRedisConfigurationEntityConfig,
  RedisConfigurationResponse,
} from '../types'
import type { RedisType } from '../types'
import type {
  AddOnRecord,
  CloudGatewaysAddOnResponse,
  CloudGatewaysAddOnState,
  ManagedCacheAddOn,
} from '../types/cloud-gateways-add-on'
import composables from '../composables'
import ManagedRedisDataPlaneGroups from './ManagedRedisDataPlaneGroups.vue'
import '@kong-ui-public/entities-shared/dist/style.css'
import endpoints from '../partials-endpoints'
import { getRedisType, isKonnectManagedRedisEnabled } from '../helpers'
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
import { formatPartialRecord, toRedisPartialConfigCardRecord, useRedisPartialConfigCardPresentation } from '../composables/useRedisConfigCardPresentation'

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
  /** Nested partial card only: skips managed (add-on + segment) layout */
  disableKonnectManagedDetail: {
    type: Boolean,
    default: false,
  },
})

/**
 * `fetch:success` - Koko redis partial (`RedisConfigurationResponse`)
 * Konnect-managed redis loads Cloud Gateways add-ons as the primary entity; that payload is emitted
 * separately via `fetch:managed-add-on-success` to avoid confusion with legacy partial payload
 */
const emit = defineEmits<{
  (e: 'loading', isLoading: boolean): void
  (e: 'fetch:error', error: AxiosError): void
  (e: 'fetch:success', data: RedisConfigurationResponse): void
  (e: 'fetch:managed-add-on-success', data: ManagedCacheAddOn): void
}>()

const onFetchError = (error: AxiosError): void => {
  emit('fetch:error', error)
}

const onLoadingChange = (isLoading: boolean): void => {
  emit('loading', isLoading)
}

const { i18n: { t } } = composables.useI18n()
const { managedAddOnConfigSchema, setManagedAddOnSchemaFromDisplayRecord } = composables.useManagedCacheAddOnDisplaySchema()
const { axiosInstance } = useAxios(props.config?.axiosRequestConfig)

const fetchUrl = computed((): string => endpoints.form[props.config.app].edit)

// Show cloud auth fields only when enabled in config
const konnectCloudAuthAvailable = computed((): boolean => props.config.cloudAuthAvailable === true )

// Konnect managed Redis only. Excludes self-managed Redis, Kong Manager, and legacy Konnect partial detail
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
const linkedPartialId = ref<string | null>(null)

// Add-on state from GET add-on
const managedAddOnState = ref<CloudGatewaysAddOnState | null>(null)

// EntityBaseConfigCard fetches once on mount; include state so poll transitions refetch cache fields
const cacheConfigCardKey = computed(
  () => `${addOnIdForCacheFetch.value}:${managedAddOnState.value ?? 'unknown'}`,
)

type ConfigSegment = 'cache' | 'partial'
const activeSegment = ref<ConfigSegment>('cache')

const isPartialReady = computed(() => managedAddOnState.value === 'ready')

const partialSegmentTooltip = computed((): string => {
  switch (managedAddOnState.value) {
    case 'initializing':
      return t('config_card.managed_state.initializing_tooltip')
    case 'terminating':
      return t('config_card.managed_state.terminating_tooltip')
    default:
      return ''
  }
})

const isPartialSegmentTooltipDisabled = computed(
  () => isPartialReady.value || !partialSegmentTooltip.value,
)

const isTooltipDisabled = (option: SegmentedControlOption<ConfigSegment>): boolean =>
  option.value !== 'partial' || isPartialSegmentTooltipDisabled.value

const configSegmentOptions = computed((): Array<SegmentedControlOption<ConfigSegment>> => [
  { label: t('config_card.sections.cache_configuration'), value: 'cache' },
  {
    label: t('config_card.sections.partial_configuration'),
    value: 'partial',
    disabled: !isPartialReady.value,
  },
])

// Host polls add-on state on the detail page, keep segment in sync, skip while host is still loading
const hostManagedAddOnState = computed((): CloudGatewaysAddOnState | undefined => {
  if (!isManagedKonnectDetailEnabled.value || props.config.app !== 'konnect') return undefined
  return (props.config as KonnectRedisConfigurationEntityConfig).managedAddOnState
})

watch(hostManagedAddOnState, (state) => {
  if (state !== undefined) {
    managedAddOnState.value = state
  }
})

// Partial stays disabled until ready
watch(managedAddOnState, (state) => {
  if (state !== 'ready') {
    activeSegment.value = 'cache'
  }
})

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

  void (async () => {
    onLoadingChange(true)

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
        linkedPartialId.value = getCacheConfigId(addOnFromRouteId) ?? null
        managedAddOnState.value = addOnFromRouteId.state ?? null
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
          linkedPartialId.value = routeEntityId
          managedAddOnState.value = addOnForPartial.state ?? null
          detailLayout.value = 'managed'
          return
        }
      }
    } catch {
      // fall back to legacy partial-only card
    } finally {
      onLoadingChange(false)
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

const innerPartialCardConfig = computed((): KonnectRedisConfigurationEntityConfig => {
  const k = props.config as KonnectRedisConfigurationEntityConfig
  return {
    ...k,
    entityId: linkedPartialId.value ?? k.entityId,
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
    managedAddOnState.value = row.state ?? null
    const partialId = getCacheConfigId(row)
    if (partialId) {
      linkedPartialId.value = partialId
    }
    emit('fetch:managed-add-on-success', row)
  }
}

const onPartialLoaded = (data: RedisConfigurationResponse): void => {
  emit('fetch:success', data)
}

const redisType = ref<RedisType>(DEFAULT_REDIS_TYPE)

// Legacy partial config card
const handleData = (payload: Record<string, any>): void => {
  const row = payload as RedisConfigurationResponse
  redisType.value = getRedisType(row)
  emit('fetch:success', row)
}

const { redisTypeText, partialSchema: configSchema } = useRedisPartialConfigCardPresentation(redisType, t)

const recordResolver = (payload: Record<string, any>): AddOnRecord =>
  toRedisPartialConfigCardRecord(payload as RedisConfigurationResponse, props.config.cloudAuthAvailable)
</script>

<style lang="scss" scoped>
.managed-konnect-redis-detail {
  .redis-config-segment {
    margin-bottom: var(--kui-space-60, $kui-space-60);
    width: fit-content;

    :deep(.k-segmented-control) {
      // Override for compact pill layout
      width: fit-content !important;
    }
  }

  /* JsonArray fieldset legends (e.g. data plane groups): medium weight; keep global JsonCardItem unchanged */
  :deep(.config-card-fieldset-title b) {
    font-weight: var(--kui-font-weight-medium, $kui-font-weight-medium);
  }
}
</style>
