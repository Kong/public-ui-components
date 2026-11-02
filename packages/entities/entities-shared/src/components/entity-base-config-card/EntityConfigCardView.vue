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

        <KCheckbox
          v-model="showSensitiveFields"
          class="sensitive-fields-checkbox"
          data-testid="sensitive-fields-checkbox"
          :label="t('baseConfigCard.actions.sensitive_fields')"
          :label-attributes="{
            info: t('baseConfigCard.actions.sensitive_fields_tooltip'),
            tooltipAttributes: {
              maxWidth: '200',
              placement: 'top',
            },
          }"
        />

        <div class="row">
          <KLabel
            class="config-format-select-label"
            data-testid="config-format-select-label"
          >
            {{ legacyContext?.label ?? t('baseConfigCard.general.formatLabel') }}
          </KLabel>
          <KSelect
            v-model="configFormat"
            data-testid="select-config-format"
            :items="configFormatItems"
            @change="handleChange"
          />
        </div>

        <KButton
          v-if="configFormat === 'deck' && Boolean(deckCustomizationOptions)"
          appearance="secondary"
          class="button-customize-deck"
          data-testid="config-deck-customize-button"
          @click="isDeckCustomizationVisible = true"
        >
          {{ t('baseConfigCard.actions.deck_customize') }}
        </KButton>

        <KButton
          v-if="documentationUrl"
          appearance="tertiary"
          class="book-icon"
          data-testid="book-icon"
        >
          <a
            :href="documentationUrl"
            rel="noopener"
            target="_blank"
          >
            <BookIcon
              :size="`var(--kui-icon-size-40, ${KUI_ICON_SIZE_40})`"
            />
          </a>
        </KButton>
      </div>
    </template>

    <!-- Properties Content -->
    <div
      class="config-card-details-section"
    >
      <slot name="content">
        <ConfigCardDisplay
          :code-block-record="codeBlockRecord"
          :code-block-record-formatter="codeBlockRecordFormatter"
          :code-block-record-redacted="!showSensitiveFields ? redactedCodeBlockRecord : undefined"
          :config="displayConfig"
          :entity-type="entityType"
          :fetcher-url="legacyContext?.requestUrl"
          :format="configFormat"
          :is-deck-customization-visible="isDeckCustomizationVisible"
          :preserve-code-block-timestamps="preserveCodeBlockTimestamps"
          :prop-list-types="propListTypes"
          :property-collections="propertyLists"
          :record="record"
          :sub-entity-type="subEntityType"
          @deck-customization:close="isDeckCustomizationVisible = false"
          @request-deck-format="configFormat = 'deck'"
        >
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
      </slot>
    </div>
  </KCard>
</template>

<script setup lang="ts">
import { getConfigCardViewConfig } from '../../utils/config-card'
import type { ConfigCardDisplayConfig } from '../../utils/config-card'
import { withForceShowFields, redactConfigCardRecord } from './record'
import type { PropType } from 'vue'
import { computed, ref, watch, onMounted, provide, inject } from 'vue'
import type {
  EntityConfigCardViewConfig,
  ConfigurationSchema,
  ConfigCardCodeFormat,
  ConfigCardFormat,
  PluginConfigurationSchema,
  RecordItem,
  DefaultCommonFieldsConfigurationSchema,
  SupportedEntityType,
  PolicyConfigurationSchema,
} from '../../types'
import { ConfigurationSchemaType, ConfigurationSchemaSection, SupportedEntityTypesArray } from '../../types'
import composables from '../../composables'
import ConfigCardDisplay from './ConfigCardDisplay.vue'
import { LEGACY_CONFIG_CARD_CONTEXT } from './legacy-config-card'
import { CONFIG_CARD_SHOW_SENSITIVE_FIELDS, DECK_COMMAND_EDITOR_KEY } from '../../constants'
import { BookIcon } from '@kong/icons'
import { KUI_ICON_SIZE_40 } from '@kong/design-tokens'
import type { HeaderTag } from '@kong/kongponents'

const emit = defineEmits<{
  (e: 'configFormatChange', format: ConfigCardFormat): void
}>()

const props = defineProps({
  /** Product and local export context. */
  config: {
    type: Object as PropType<EntityConfigCardViewConfig>,
    default: () => ({}),
  },
  /** Resolved entity. Mount the View after the owner has loaded the record. */
  record: {
    type: Object as PropType<Record<string, any>>,
    required: true,
  },
  /** Optional code representation, independent of the structured record. */
  codeBlockRecord: {
    type: Object as PropType<Record<string, any>>,
    default: undefined,
  },
  /** Resolved API schema. No schema lookup is performed. */
  schema: { type: Object as PropType<Record<string, any>>, default: undefined },
  /** Schema to configure display of fields */
  configSchema: {
    type: Object as PropType<ConfigurationSchema>,
    required: false,
    default: () => ({}),
  },
  /**
   * Optional entity type. Terraform and decK are available only when provided.
   */
  entityType: {
    type: String as PropType<SupportedEntityType>,
    default: undefined,
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
   * A function to format the entity record before displaying it in the code block.
   */
  codeBlockRecordFormatter: {
    type: Function as PropType<(entityRecord: Record<string, any>, format: ConfigCardCodeFormat) => Record<string, any>>,
    required: false,
    default: (entityRecord: Record<string, any>) => entityRecord,
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
const { convertKeyToTitle } = composables.useStringHelpers()
const legacyContext = inject(LEGACY_CONFIG_CARD_CONTEXT, undefined)
const documentationUrl = computed(() => {
  const value = legacyContext?.value.configCardDoc?.trim()
  if (!value) return undefined
  try {
    // Keep relative documentation links, while rejecting executable/non-web schemes.
    const { protocol } = new URL(value, 'https://documentation.invalid/')
    return protocol === 'https:' || protocol === 'http:' ? value : undefined
  } catch {
    return undefined
  }
})
const { getApiSchemaField } = composables.useHelpers()
const inheritedSchema = composables.useSchema()
const schema = computed(() => props.schema ?? inheritedSchema?.value)
composables.useSchemaProvider(schema)
const isManagedByEnabled = composables.useManagedByEnabled()

if (props.pluginConfigKey) composables.useSubSchema(props.pluginConfigKey, schema)


const deckCommandEditor = inject(DECK_COMMAND_EDITOR_KEY, null)
const displayConfig = computed<ConfigCardDisplayConfig>(() => {
  const config = getConfigCardViewConfig(props.config)
  return {
    ...config,
    enableDeckConfig: legacyContext
      ? legacyContext.value.deckOptions
      : config.enableDeckConfig && deckCommandEditor ? { customization: true } : config.enableDeckConfig,
  }
})
const isDeckCustomizationVisible = ref(false)

const {
  isDeckEnabled,
  deckCustomizationOptions,
} = composables.useBaseEntityDeckOptions(
  () => displayConfig.value,
  () => props.entityType,
)

/** KSelect items: built in display order, then filtered by `formatsToHide` */
const configFormatItems = computed(() => {
  const items: Array<{ label: string, value: ConfigCardFormat, selected?: boolean }> = [
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
  if (props.config.app === 'konnect' && props.entityType) {
    // insert terraform as the third option
    items.splice(2, 0, {
      label: t('baseForm.configuration.terraform'),
      value: 'terraform',
    })
  }

  if (isDeckEnabled.value) {
    items.push({
      label: t('baseForm.configuration.deck'),
      value: 'deck',
    })
  }

  const hidden = new Set([...props.formatsToHide, ...(legacyContext?.value.formatsToHide ?? [])])
  return items.filter((item) => item.value === 'structured' || !hidden.has(item.value as ConfigCardCodeFormat))
})

// Initial tab matches the first format item- `structured`.onMounted may replace this from localStorage
// when `config.formatPreferenceKey` is set
const configFormat = ref<ConfigCardFormat>('structured')

// Removing export metadata must not leave an unavailable format selected.
watch(configFormatItems, (items) => {
  if (!items.some(item => item.value === configFormat.value)) {
    configFormat.value = 'structured'
    isDeckCustomizationVisible.value = false
  }
})

const handleChange = (payload: any): void => {
  configFormat.value = payload?.value
  emit('configFormatChange', configFormat.value)
}

const persistFormat = (localStorageKey: string, format: ConfigCardFormat): void => {
  localStorage.setItem(localStorageKey, format)
}

watch(configFormat, (format: ConfigCardFormat) => {
  const key = legacyContext?.value.formatPreferenceKey
  if (key) {
    persistFormat(key, format)
  }
})

// Restore last format from localStorage if still allowed and not removed by `formatsToHide`
// Otherwise fall back to the first dropdown option (always `structured`)
onMounted(() => {
  const key = legacyContext?.value.formatPreferenceKey
  if (key) {
    const storedFormat = localStorage.getItem(key)
    const items = configFormatItems.value
    if (storedFormat && items.some(item => item.value === storedFormat)) {
      configFormat.value = storedFormat as ConfigCardFormat
    } else {
      configFormat.value = items[0]?.value as ConfigCardFormat ?? 'structured'
    }
    persistFormat(key, configFormat.value)
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
  managed_by: {
    type: ConfigurationSchemaType.ManagedBy,
    label: t('baseConfigCard.commonFields.managed_by_label'),
    section: ConfigurationSchemaSection.Advanced,
  },
  tags: {
    type: ConfigurationSchemaType.BadgeTag,
    order: -1, // the last property displayed
    section: ConfigurationSchemaSection.Basic,
  },
  labels: {
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

// Add missing forceShow fields to a derived record, never to caller-owned data.
const record = computed(() => withForceShowFields(props.record, props.configSchema))

const apiScalarType = (key: string, parentKey?: string) => {
  const fields = parentKey ? getApiSchemaField(schema.value?.fields, parentKey)?.fields : schema.value?.fields
  const field = getApiSchemaField(fields, key)
  return field?.type === 'string' && field.encrypted ? ConfigurationSchemaType.Redacted : undefined
}

// redact sensitive fields by default
const showSensitiveFields = ref(false)
provide(CONFIG_CARD_SHOW_SENSITIVE_FIELDS, showSensitiveFields)


const redactedCodeBlockRecord = computed(() => legacyContext?.value.redactedCodeBlockRecord ??
  redactConfigCardRecord(props.codeBlockRecord || record.value, schema.value, props.configSchema),
)

// Handle sorting by 'order' prop
const orderedRecordArray = computed((): RecordItem[] => {
  // each item is an array of the key and the order
  // ex. [ ['id', 1], ['description', 5], ... ]
  const sortableKeys = []
  const fieldCount = Object.keys(record.value).length
  for (const key in record.value) {
    if (key === '__ui_data') continue // skip ui_data
    // `managed_by` is behind a feature flag; until it is on, keep it out of the structured view
    // entirely rather than letting the raw object fall through to a JSON code block.
    if (key === 'managed_by' && !isManagedByEnabled.value) continue
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
      type: configEntry.type ?? apiScalarType(key) ?? (defaultConfigSchema?.type || ConfigurationSchemaType.Text),
      label: configEntry.label ?? (defaultConfigSchema?.label || convertKeyToTitle(key)),
      tooltip: configEntry.tooltip ?? (defaultConfigSchema?.tooltip || undefined),
      section: configEntry.section ?? (defaultConfigSchema?.section || ConfigurationSchemaSection.Advanced),
    } as RecordItem
  }).filter(item => !item.hidden && item.key !== props.pluginConfigKey) // strip hidden & plugin config fields
})

// Plugin and policy fields share ordering and display semantics.
const getConfigFields = (configKey: string, configSchema: PluginConfigurationSchema, section: ConfigurationSchemaSection): RecordItem[] => {
  if (!configKey) {
    return []
  }

  // each item is an array of the key and the order
  // ex. [ ['id', 1], ['description', 5], ... ]
  const configRecord = record.value[configKey] || {}
  const fieldCount = Object.keys(configRecord).length
  const sortableKeys = []
  for (const key in configRecord) {
    const configOrder = configSchema?.[key]?.order
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
    const configEntry = configSchema?.[key] || {}

    return {
      key,
      value: recordEntry,
      hidden: configEntry.hidden || false,
      type: configEntry.type ?? apiScalarType(key, configKey) ?? ConfigurationSchemaType.Text,
      label: configEntry.label ?? convertKeyToTitle(key),
      tooltip: configEntry.tooltip ?? undefined,
      section,
    } as RecordItem
  }).filter(item => !item.hidden) // strip hidden fields
}

const orderedPluginConfigArray = computed(() => getConfigFields(props.pluginConfigKey, props.pluginConfigSchema, ConfigurationSchemaSection.Plugin))
const orderedPolicyConfigArray = computed(() => getConfigFields(props.policyConfigKey, props.policyConfigSchema, ConfigurationSchemaSection.Policy))

// Split ordered rows by schema section so ConfigCardDisplay can render basic vs advanced vs plugin vs policy
const propertyLists = computed((): { basic: RecordItem[], advanced: RecordItem[], plugin: RecordItem[], policy: RecordItem[] } => {
  return {
    basic: orderedRecordArray.value.filter((orderedItem: RecordItem) => orderedItem.section === ConfigurationSchemaSection.Basic),
    advanced: orderedRecordArray.value.filter((orderedItem: RecordItem) => orderedItem.section === ConfigurationSchemaSection.Advanced),
    plugin: orderedPluginConfigArray.value.concat(orderedRecordArray.value.filter((orderedItem: RecordItem) => orderedItem.section === ConfigurationSchemaSection.Plugin)),
    policy: orderedPolicyConfigArray.value.concat(orderedRecordArray.value.filter((orderedItem: RecordItem) => orderedItem.section === ConfigurationSchemaSection.Policy)),
  }
})

const propListTypes = computed(() => Object.entries(propertyLists.value)
  .filter(([, rows]) => rows.length > 0)
  .map(([section]) => section),
)

// Refreshes of the same entity preserve the user's display choices.
watch(() => props.record.id, () => {
  showSensitiveFields.value = false
  isDeckCustomizationVisible.value = false
})
</script>

<style lang="scss" scoped>
.kong-ui-entity-base-config-card {
  .config-card-actions {
    align-items: center;
    display: flex;
    gap: var(--kui-space-60, $kui-space-60);

    .row {
      align-items: center;
      display: flex;
    }

    .config-format-select-label {
      margin-bottom: var(--kui-space-0, $kui-space-0);
      margin-right: var(--kui-space-40, $kui-space-40);
    }

    .sensitive-fields-checkbox {
      align-items: center;

      :deep(.checkbox-label) {
        width: max-content;
      }
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
