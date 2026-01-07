<template>
  <KCard
    class="kong-ui-entity-base-config-card"
    :title-tag="titleTag"
  >
    <template
      v-if="!hideTitle"
      #title
    >
      <span
        class="config-card-title"
        data-testid="config-card-title"
      >
        <slot name="title">
          {{ t('baseConfigCard.title') }}
        </slot>
      </span>
    </template>

    <template #actions>
      <div class="config-card-actions">
        <slot name="actions" />
        <KLabel
          class="config-format-select-label"
          data-testid="config-format-select-label"
        >
          {{ label }}
        </KLabel>
        <KSelect
          v-model="configFormat"
          data-testid="select-config-format"
          :items="configFormatItems"
          @change="handleChange"
        />

        <KButton
          v-if="configCardDoc"
          appearance="tertiary"
          class="book-icon"
          data-testid="book-icon"
        >
          <a
            :href="configCardDoc"
            rel="noopener"
            target="_blank"
          >
            <BookIcon
              :size="KUI_ICON_SIZE_40"
            />
          </a>
        </KButton>
      </div>
    </template>

    <!-- Loading -->
    <KSkeleton
      v-if="isLoading"
      data-testid="config-card-loader"
      :table-columns="2"
      type="table"
    />

    <!-- Error fetching record -->
    <KEmptyState
      v-else-if="fetchDetailsError"
      data-testid="config-card-fetch-error"
      icon-variant="error"
    >
      <template #default>
        <h3>{{ fetchErrorMessage }}</h3>
      </template>
    </KEmptyState>

    <!-- Properties Content -->
    <div
      class="config-card-details-section"
    >
      <ConfigCardDisplay
        :code-block-record-formatter="codeBlockRecordFormatter"
        :config="config"
        :entity-type="entityType"
        :fetcher-url="fetcherUrl"
        :format="configFormat"
        :prop-list-types="propListTypes"
        :property-collections="propertyLists"
        :record="record"
        :sub-entity-type="subEntityType"
      >
        <!-- Pass all the slots from GrandParent to Child components -->
        <template
          v-for="slotKey in Object.keys($slots)"
          :key="slotKey"
          #[slotKey]="slotProps"
        >
          <slot
            :name="slotKey"
            :record="record"
            v-bind="slotProps"
          />
        </template>
      </ConfigCardDisplay>
    </div>
  </KCard>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import { computed, ref, onBeforeMount, watch, onMounted } from 'vue'
import type { AxiosError } from 'axios'
import type {
  KonnectBaseEntityConfig,
  KongManagerBaseEntityConfig,
  ConfigurationSchema,
  PluginConfigurationSchema,
  RecordItem,
  DefaultCommonFieldsConfigurationSchema,
  SupportedEntityType,
  PolicyConfigurationSchema,
} from '../../types'
import { ConfigurationSchemaType, ConfigurationSchemaSection, SupportedEntityTypesArray } from '../../types'
import composables from '../../composables'
import ConfigCardDisplay, { type CodeFormat, type Format } from './ConfigCardDisplay.vue'
import { BookIcon } from '@kong/icons'
import { KUI_ICON_SIZE_40 } from '@kong/design-tokens'
import type { HeaderTag } from '@kong/kongponents'

const emit = defineEmits<{
  (e: 'loading', isLoading: boolean): void
  (e: 'fetch:success', data: Record<string, any>): void
  (e: 'fetch:error', error: AxiosError): void
  (e: 'configFormatChange', format: Format): void
}>()

// Component props - This structure must exist in ALL entity components, with the exclusion of unneeded action props
const props = defineProps({
  /** The base konnect or kongManger config. Pass additional config props in the shared entity component as needed. */
  config: {
    type: Object as PropType<KonnectBaseEntityConfig | KongManagerBaseEntityConfig>,
    required: true,
    validator: (config: KonnectBaseEntityConfig | KongManagerBaseEntityConfig): boolean => {
      if (!config || !['konnect', 'kongManager'].includes(config?.app)) return false
      if (config.app === 'konnect' && !config.controlPlaneId) return false
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
    type: Function as PropType<(data: any) => any>,
    required: false,
    default: (data: any) => data,
  },
  /**
   * A function to format the entity record before displaying it in the code block.
   */
  codeBlockRecordFormatter: {
    type: Function as PropType<(entityRecord: Record<string, any>, format: CodeFormat) => Record<string, any>>,
    required: false,
    default: (entityRecord: Record<string, any>) => entityRecord,
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
})

const { i18n: { t } } = composables.useI18n()
const { getMessageFromError } = composables.useErrors()
const { convertKeyToTitle } = composables.useStringHelpers()

composables.useSubSchema(props.pluginConfigKey) // reduce the schema to only the plugin config

const { axiosInstance } = composables.useAxios(props.config?.axiosRequestConfig)

const configFormatItems = [
  {
    label: t('baseConfigCard.general.structuredFormat'),
    value: 'structured',
    selected: true,
  },
  {
    label: t('baseForm.configuration.json'),
    value: 'json',
  },
  {
    label: t('baseForm.configuration.yaml'),
    value: 'yaml',
  },
]

// terraform only supported in konnect
if (props.config.app === 'konnect') {
  // insert terraform as the third option
  configFormatItems.splice(2, 0, {
    label: t('baseForm.configuration.terraform'),
    value: 'terraform',
  })
}

const DEFAULT_FORMAT = configFormatItems[0].value as Format

const configFormat = ref<Format>(DEFAULT_FORMAT)

const handleChange = (payload: any): void => {
  configFormat.value = payload?.value
  emit('configFormatChange', configFormat.value)
}

const persistFormat = (localStorageKey: string, format: Format): void => {
  localStorage.setItem(localStorageKey, format)
}

watch(configFormat, (format: Format) => {
  if (props.config.formatPreferenceKey) {
    persistFormat(props.config.formatPreferenceKey, format)
  }
})

onMounted(() => {
  if (props.config.formatPreferenceKey) {
    const storedFormat = localStorage.getItem(props.config.formatPreferenceKey)
    if (storedFormat && configFormatItems.some(item => item.value === storedFormat)) {
      configFormat.value = storedFormat as Format
    } else {
      configFormat.value = DEFAULT_FORMAT
    }
    persistFormat(props.config.formatPreferenceKey, configFormat.value)
  }
})

/**
 * default ordering for these common fields:
 *   - name, id, enabled (if exists), updated_at, created_at, tags
 */
const DEFAULT_BASIC_FIELDS_CONFIGURATION: DefaultCommonFieldsConfigurationSchema = {
  id: {
    type: ConfigurationSchemaType.ID,
    label: t('baseConfigCard.commonFields.id_label'),
    order: 0,
    section: ConfigurationSchemaSection.Basic,
  },
  name: {
    order: 1,
    section: ConfigurationSchemaSection.Basic,
  },
  enabled: {
    type: ConfigurationSchemaType.BadgeStatus,
    order: 2,
    section: ConfigurationSchemaSection.Basic,
  },
  updated_at: {
    type: ConfigurationSchemaType.Date,
    label: t('baseConfigCard.commonFields.updated_at_label'),
    order: 3,
    section: ConfigurationSchemaSection.Basic,
  },
  created_at: {
    type: ConfigurationSchemaType.Date,
    label: t('baseConfigCard.commonFields.created_at_label'),
    order: 4,
    section: ConfigurationSchemaSection.Basic,
  },
  tags: {
    type: ConfigurationSchemaType.BadgeTag,
    order: -1, // the last property displayed
    section: ConfigurationSchemaSection.Basic,
  },
  partials: {
    type: ConfigurationSchemaType.LinkInternal,
    label: t('baseConfigCard.commonFields.partial_label'),
    order: -1, // the last property displayed
    section: ConfigurationSchemaSection.Basic,
  },
}

const isLoading = ref(false)
const fetchDetailsError = ref(false)
const fetchErrorMessage = ref('')
const record = ref<Record<string, any>>({})

// Handle sorting by 'order' prop
const orderedRecordArray = computed((): RecordItem[] => {
  if (!record.value) {
    return []
  }

  // each item is an array of the key and the order
  // ex. [ ['id', 1], ['description', 5], ... ]
  const sortableKeys = []
  const fieldCount = Object.keys(record.value).length
  for (const key in record.value) {
    if (key === '__ui_data') continue // skip ui_data
    const configOrder = props.configSchema?.[key]?.order
    const defaultConfigOrder = DEFAULT_BASIC_FIELDS_CONFIGURATION[key as keyof DefaultCommonFieldsConfigurationSchema]?.order
    // if no order provided, default to end of list
    let order = fieldCount

    // check if an order exists in the basic fields array
    if (defaultConfigOrder || defaultConfigOrder === 0) {
      // -1 means send it to the end
      order = defaultConfigOrder === -1 ? fieldCount + 1 : defaultConfigOrder
    }

    // check if order exists in config
    // config order overrides basic fields array order
    if (configOrder) {
      // -1 means send it to the end
      order = configOrder === -1 ? fieldCount + 1 : configOrder
    }

    sortableKeys.push([key, order])
  }

  sortableKeys.sort(function(a, b) {
    return (a[1] as number) - (b[1] as number)
  })

  return sortableKeys.map((sKey: Array<string | number>) => {
    const key = sKey[0] as string
    const recordEntry = record.value?.[key]
    const configEntry = props.configSchema?.[key] || {}
    const defaultConfigSchema = DEFAULT_BASIC_FIELDS_CONFIGURATION[key as keyof DefaultCommonFieldsConfigurationSchema]

    return {
      key,
      value: recordEntry,
      hidden: configEntry.hidden || false,
      type: configEntry.type ?? (defaultConfigSchema?.type || ConfigurationSchemaType.Text),
      label: configEntry.label ?? (defaultConfigSchema?.label || convertKeyToTitle(key)),
      tooltip: configEntry.tooltip ?? (defaultConfigSchema?.tooltip || undefined),
      section: configEntry.section ?? (defaultConfigSchema?.section || ConfigurationSchemaSection.Advanced),
    } as RecordItem
  }).filter(item => !item.hidden && item.key !== props.pluginConfigKey) // strip hidden & plugin config fields
})

// Handle sorting by 'order' prop
const orderedPluginConfigArray = computed((): RecordItem[] => {
  if (!record.value || !props.pluginConfigKey) {
    return []
  }

  // each item is an array of the key and the order
  // ex. [ ['id', 1], ['description', 5], ... ]
  const configRecord = record.value[props.pluginConfigKey] || {}
  const fieldCount = Object.keys(configRecord).length
  const sortableKeys = []
  for (const key in configRecord) {
    const configOrder = props.pluginConfigSchema?.[key]?.order
    const recEntry = configRecord[key]
    // if no order provided, prioritize entries that have values
    let order = recEntry !== null && recEntry !== undefined && recEntry !== '' ? fieldCount - 1 : fieldCount

    // check if order exists in config
    // config order overrides default order
    if (configOrder) {
      // -1 means send it to the end
      order = configOrder === -1 ? fieldCount + 1 : configOrder
    }

    sortableKeys.push([key, order])
  }

  sortableKeys.sort(function(a, b) {
    return (a[1] as number) - (b[1] as number)
  })

  return sortableKeys.map((sKey: Array<string | number>) => {
    const key = sKey[0] as string
    const recordEntry = configRecord[key]
    const configEntry = props.pluginConfigSchema?.[key] || {}

    return {
      key,
      value: recordEntry,
      hidden: configEntry.hidden || false,
      type: configEntry.type ?? ConfigurationSchemaType.Text,
      label: configEntry.label ?? convertKeyToTitle(key),
      tooltip: configEntry.tooltip ?? undefined,
      section: ConfigurationSchemaSection.Plugin,
    } as RecordItem
  }).filter(item => !item.hidden) // strip hidden fields
})

const orderedPolicyConfigArray = computed((): RecordItem[] => {
  if (!record.value || !props.policyConfigKey) {
    return []
  }

  // each item is an array of the key and the order
  // ex. [ ['id', 1], ['description', 5], ... ]
  const configRecord = record.value[props.policyConfigKey] || {}
  const fieldCount = Object.keys(configRecord).length
  const sortableKeys = []
  for (const key in configRecord) {
    const configOrder = props.policyConfigSchema?.[key]?.order
    const recEntry = configRecord[key]
    // if no order provided, prioritize entries that have values
    let order = recEntry !== null && recEntry !== undefined && recEntry !== '' ? fieldCount - 1 : fieldCount

    // check if order exists in config
    // config order overrides default order
    if (configOrder) {
      // -1 means send it to the end
      order = configOrder === -1 ? fieldCount + 1 : configOrder
    }

    sortableKeys.push([key, order])
  }

  sortableKeys.sort(function(a, b) {
    return (a[1] as number) - (b[1] as number)
  })

  return sortableKeys.map((sKey: Array<string | number>) => {
    const key = sKey[0] as string
    const recordEntry = configRecord[key]
    const configEntry = props.policyConfigSchema?.[key] || {}

    return {
      key,
      value: recordEntry,
      hidden: configEntry.hidden || false,
      type: configEntry.type ?? ConfigurationSchemaType.Text,
      label: configEntry.label ?? convertKeyToTitle(key),
      tooltip: configEntry.tooltip ?? undefined,
      section: ConfigurationSchemaSection.Policy,
    } as RecordItem
  }).filter(item => !item.hidden) // strip hidden fields
})

const propertyLists = computed((): { basic: RecordItem[], advanced: RecordItem[], plugin: RecordItem[], policy: RecordItem[] } => {
  return {
    basic: orderedRecordArray.value?.filter((orderedItem: RecordItem) => orderedItem.section === ConfigurationSchemaSection.Basic),
    advanced: orderedRecordArray.value?.filter((orderedItem: RecordItem) => orderedItem.section === ConfigurationSchemaSection.Advanced),
    plugin: orderedPluginConfigArray.value?.concat(orderedRecordArray.value?.filter((orderedItem: RecordItem) => orderedItem.section === ConfigurationSchemaSection.Plugin)),
    policy: orderedPolicyConfigArray.value?.concat(orderedRecordArray.value?.filter((orderedItem: RecordItem) => orderedItem.section === ConfigurationSchemaSection.Policy)),
  }
})

const propListTypes = computed((): string[] => {
  const types = []

  if (propertyLists.value.basic.length) {
    types.push('basic')
  }

  if (propertyLists.value.advanced.length) {
    types.push('advanced')
  }

  if (propertyLists.value.plugin.length) {
    types.push('plugin')
  }

  if (propertyLists.value.policy.length) {
    types.push('policy')
  }

  return types
})

/**
 * Build the fetcher URL
 */
const fetcherUrl = computed<string>(() => {
  let url = `${props.config.apiBaseUrl}${props.fetchUrl}`

  if (props.config.app === 'konnect') {
    url = url.replace(/{controlPlaneId}/gi, props.config?.controlPlaneId || '')
  } else if (props.config.app === 'kongManager') {
    url = url.replace(/\/{workspace}/gi, props.config?.workspace ? `/${props.config.workspace}` : '')
  }

  // Always replace the id for editing
  url = url.replace(/{id}/gi, props.config.entityId)

  return url
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

    // Inject forceShow keys into the record
    const forceShowKeys = Object.keys(props.configSchema).filter(key => props.configSchema[key].forceShow)
    forceShowKeys.forEach(key => {
      if (record.value && typeof record.value[key] === 'undefined') {
        record.value[key] = null
      }
    })

    emit('fetch:success', data)
  } catch (error: any) {
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
</script>

<style lang="scss" scoped>
.kong-ui-entity-base-config-card {
  .config-card-actions {
    align-items: center;
    display: flex;

    .config-format-select-label {
      margin-bottom: var(--kui-space-0, $kui-space-0);
      margin-right: var(--kui-space-40, $kui-space-40);
    }
  }

  .config-card-prop-section-title {
    color: var(--kui-color-text, $kui-color-text);
    font-size: var(--kui-font-size-40, $kui-font-size-40);
    font-weight: 600;
    margin-bottom: var(--kui-space-60, $kui-space-60);
    margin-top: var(--kui-space-110, $kui-space-110);
  }

  :deep(.config-card-details-row:last-of-type) {
    border-bottom: none;
  }

  .book-icon {
    margin-left: var(--kui-space-40, $kui-space-40);
    padding: var(--kui-space-0, $kui-space-0);
  }
}
</style>
