<template>
  <EntityConfigCardView
    v-bind="$attrs"
    :code-block-record="codeBlockRecordFromApi"
    :code-block-record-formatter="codeBlockRecordFormatter"
    :config="viewConfig"
    :config-schema="configSchema"
    :entity-type="entityType"
    :formats-to-hide="formatsToHide"
    :hide-title="hideTitle"
    :plugin-config-key="pluginConfigKey"
    :plugin-config-schema="pluginConfigSchema"
    :policy-config-key="policyConfigKey"
    :policy-config-schema="policyConfigSchema"
    :preserve-code-block-timestamps="preserveCodeBlockTimestamps"
    :record="record"
    :schema="schema"
    :sub-entity-type="subEntityType"
    :title-tag="titleTag"
    @config-format-change="emit('configFormatChange', $event)"
  >
    <template
      v-for="slotKey in Object.keys($slots)"
      :key="slotKey"
      #[slotKey]="slotProps"
    >
      <slot
        :name="slotKey"
        v-bind="slotProps"
      />
    </template>
  </EntityConfigCardView>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import { computed, ref, onBeforeMount, watch, provide } from 'vue'
import type { AxiosError } from 'axios'
import type { KonnectBaseEntityConfig, KongManagerBaseEntityConfig, ConfigurationSchema, ConfigCardCodeFormat, ConfigCardFormat, PluginConfigurationSchema, SupportedEntityType, PolicyConfigurationSchema } from '../../types'
import { SupportedEntityTypesArray } from '../../types'
import type { HeaderTag } from '@kong/kongponents'
import composables from '../../composables'
import EntityConfigCardView from './EntityConfigCardView.vue'
import { withForceShowFields, redactConfigCardRecord } from './record'
import { READER_CONFIG_CARD_CONTEXT } from './reader-config-card'
import type { ReaderConfigCardContext } from './reader-config-card'
import { getConfigCardViewConfig } from '../../utils/config-card'

defineOptions({ inheritAttrs: false })

const emit = defineEmits<{
  (e: 'loading', isLoading: boolean): void
  (e: 'fetch:success', data: Record<string, any>): void
  (e: 'fetch:error', error: AxiosError): void
  (e: 'configFormatChange', format: ConfigCardFormat): void
}>()
const props = defineProps({
  /** The base konnect or kongManger config. Pass additional config props in the shared entity component as needed. */
  config: {
    type: Object as PropType<KonnectBaseEntityConfig | KongManagerBaseEntityConfig>,
    required: true,
    validator: (config: KonnectBaseEntityConfig | KongManagerBaseEntityConfig): boolean => {
      if (!config || !['konnect', 'kongManager'].includes(config?.app)) return false
      if (config.app === 'kongManager' && typeof config.workspace !== 'string') return false
      if (!config.entityId) return false
      return true
    },
  },
  /** Schema to configure display of fields */
  configSchema: {
    type: Object as PropType<ConfigurationSchema>,
    required: false,
    default: () => ({}),
  },
  /**
   * Entity type, required to generate terraform code
   */
  entityType: {
    type: String as PropType<SupportedEntityType>,
    required: true,
    validator: (val: SupportedEntityType) => SupportedEntityTypesArray.includes(val),
  },
  /**
   * Sub Entity type, required to generate terraform code for event gateway entities
   */
  subEntityType: {
    type: String,
    default: '',
  },
  /** Record key that contains the plugin configuration */
  pluginConfigKey: {
    type: String,
    required: false,
    default: '',
  },
  /** Configuration schema for the plugin configuration section */
  pluginConfigSchema: {
    type: Object as PropType<PluginConfigurationSchema>,
    required: false,
    default: () => ({}),
  },
  /** Record key that contains the policy configuration */
  policyConfigKey: {
    type: String,
    required: false,
    default: '',
  },
  /** Configuration schema for the policy configuration section */
  policyConfigSchema: {
    type: Object as PropType<PolicyConfigurationSchema>,
    required: false,
    default: () => ({}),
  },
  /**
   * Fetch url for the item to display configuration for.
   * We will handle the replacement of {controlPlaneId}, {workspace}, and {id}.
   * Value should NOT contain config.apiBaseUrl, as we auto include this. Typically this will just an entry from
   * the endpoints file.
   *
   * ex. `/v2/control-planes/{controlPlaneId}/core-entities/snis/{id}`
   */
  fetchUrl: {
    type: String,
    required: true,
  },
  /**
   * Optional key to use to access the record from fetched response.data
   * If not provided, response.data will be used.
   */
  dataKey: {
    type: String,
    required: false,
    default: '',
  },
  /**
   * Function to resolve the record from the fetched response.
   * This prop only works if dataKey is not provided.
   */
  recordResolver: {
    type: Function as PropType<(data: Record<string, any>) => Record<string, any>>,
    required: false,
    default: (data: Record<string, any>) => data,
  },
  /**
   * A function to format the entity record before displaying it in the code block.
   */
  codeBlockRecordFormatter: {
    type: Function as PropType<(entityRecord: Record<string, any>, format: ConfigCardCodeFormat) => Record<string, any>>,
    required: false,
    default: (entityRecord: Record<string, any>) => entityRecord,
  },
  /**
   * JSON tab show the same nested shape the GET returned
   */
  codeBlockRecordResolver: {
    type: Function as PropType<(rawData: Record<string, any>) => Record<string, any>>,
    required: false,
    default: undefined,
  },
  /**
   * When true, code blocks keep `created_at`/ `updated_at` (default strips them per KHCP-9837)
   */
  preserveCodeBlockTimestamps: {
    type: Boolean,
    required: false,
    default: false,
  },
  /**
   * Boolean to control card title visibility.
   */
  hideTitle: {
    type: Boolean,
    default: false,
  },
  /**
   * The label text to show for the select Format element
   */
  label: {
    type: String,
    default: 'Format: ',
    required: false,
  },
  /**
   * External link for documentation
   */
  configCardDoc: {
    type: String,
    default: '',
    required: false,
  },
  titleTag: {
    type: String as PropType<HeaderTag>,
    default: 'h2',
  },
  /**
   * Hide entries from the Format dropdown (eg. ['yaml']). Structured view is always shown
   */
  formatsToHide: {
    type: Array as PropType<ConfigCardCodeFormat[]>,
    required: false,
    default: () => [],
  },
})

const { i18n: { t } } = composables.useI18n()
const { getMessageFromError } = composables.useErrors()
const { axiosInstance } = composables.useAxios(props.config?.axiosRequestConfig)
const schema = composables.useSchema()
const isLoading = ref(false)
const fetchDetailsError = ref(false)
const status = computed(() => isLoading.value ? 'loading' : fetchDetailsError.value ? 'error' : 'ready')
const fetchErrorMessage = ref('')
const record = ref<Record<string, any>>({})
// Raw API payload for code tabs, structured tab always reads `record` (from `recordResolver`)
const rawFetchedData = ref<Record<string, any> | null>(null)

// Optional resolver for JSON/YAML/TR/deck tabs; fallback is `record` when omitted
const codeBlockRecordFromApi = computed((): Record<string, any> | undefined => {
  if (!props.codeBlockRecordResolver || rawFetchedData.value == null) {
    return undefined
  }
  return props.codeBlockRecordResolver(rawFetchedData.value)
})

/**
 * Build the fetcher URL
 */
const fetcherUrl = computed<string>(() => {
  let url = `${props.config.apiBaseUrl}${props.fetchUrl}`

  if (props.config.app === 'konnect') {
    url = url.replace(/{controlPlaneId}/gi, props.config?.controlPlaneId || '')
  }

  return url
    .replace(/\/{workspace}/gi, props.config?.workspace ? `/${props.config.workspace}` : '')
    .replace(/{id}/gi, props.config.entityId) // Always replace the id for editing
})

watch(isLoading, (loading: boolean) => {
  // Emit the loading state for the host app
  emit('loading', loading)
}, { immediate: true })

onBeforeMount(async () => {
  fetchDetailsError.value = false
  isLoading.value = true

  try {
    const { data } = await axiosInstance.get(fetcherUrl.value)
    // Stash raw payload before `recordResolver` reshape it
    rawFetchedData.value = data

    if (props.dataKey) {
      if (typeof data[props.dataKey] !== 'undefined') {
        record.value = { ...data[props.dataKey] }
      } else {
        throw new Error(t('errors.dataKeyUndefined', { dataKey: props.dataKey }))
      }
    } else if (props.recordResolver) {
      record.value = { ...props.recordResolver(data) }
    } else {
      record.value = { ...data }
    }

    emit('fetch:success', data)
  } catch (error: any) {
    rawFetchedData.value = null // avoid showing stale JSON after a failed refetch
    const parsedError = getMessageFromError(error)
    // Custom logic here for 404 - if error message is `code 5` fallback to default error message
    fetchErrorMessage.value = !parsedError.startsWith('code') ? parsedError : t('baseConfigCard.errors.load')
    fetchDetailsError.value = true
    // Emit the error for the host app
    emit('fetch:error', error)
  } finally {
    isLoading.value = false
  }
})

// Kept for compatibility: the resolver also runs after redaction, as it always has.
const redactedCodeBlockRecord = computed(() => {
  const resolve = props.codeBlockRecordResolver
  if (!resolve || rawFetchedData.value == null) return undefined
  const source = codeBlockRecordFromApi.value || withForceShowFields(record.value, props.configSchema)
  return resolve(redactConfigCardRecord(source, schema?.value, props.configSchema))
})

const viewConfig = computed(() => getConfigCardViewConfig(props.config))

provide(READER_CONFIG_CARD_CONTEXT, computed((): ReaderConfigCardContext => ({
  status: status.value,
  errorMessage: fetchErrorMessage.value,
  requestUrl: fetcherUrl.value,
  deckOptions: props.config.app === 'konnect' ? props.config.enableDeckConfig : undefined,
  deckCalloutPreferenceKey: props.config.app === 'kongManager' ? props.config.deckCalloutPreferenceKey : undefined,
  formatPreferenceKey: props.config.formatPreferenceKey,
  redactedCodeBlockRecord: redactedCodeBlockRecord.value,
  configCardDoc: props.configCardDoc,
  label: props.label,
})))

</script>
