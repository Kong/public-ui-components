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
            {{ reader?.label || t('baseConfigCard.general.formatLabel') }}
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
          v-if="reader?.configCardDoc"
          appearance="tertiary"
          class="book-icon"
          data-testid="book-icon"
          rel="noopener"
          target="_blank"
          :to="reader.configCardDoc"
        >
          <BookIcon
            :size="`var(--kui-icon-size-40, ${KUI_ICON_SIZE_40})`"
          />
        </KButton>
      </div>
    </template>

    <KSkeleton
      v-if="reader?.status === 'loading'"
      data-testid="config-card-loader"
      :table-columns="2"
      type="table"
    />
    <KEmptyState
      v-else-if="reader?.status === 'error'"
      data-testid="config-card-fetch-error"
      icon-variant="error"
    >
      <template #default>
        <h3>{{ reader?.errorMessage }}</h3>
      </template>
    </KEmptyState>
    <div
      v-else
      class="config-card-details-section"
    >
      <ConfigCardDisplay
        :code-block-record="codeBlockRecord"
        :code-block-record-formatter="codeBlockRecordFormatter"
        :code-block-record-redacted="!showSensitiveFields ? redactedCodeBlockRecord : undefined"
        :config="displayConfig"
        :entity-type="entityType"
        :fetcher-url="reader?.requestUrl"
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
        <!-- Standalone Views reserve card slots; existing readers also use them for same-named fields. -->
        <template
          v-for="slotKey in Object.keys($slots).filter(key => reader || (key !== 'title' && key !== 'actions'))"
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
import { READER_CONFIG_CARD_CONTEXT } from './reader-config-card'
import { CONFIG_CARD_ROW_SCHEMA } from './row-schema'
import type { ConfigCardDisplayConfig } from '../../utils/config-card'
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
const reader = inject(READER_CONFIG_CARD_CONTEXT, undefined)
// Views rendered inside field or header slots are independent of the reader.
provide(READER_CONFIG_CARD_CONTEXT, undefined)
const { getApiSchemaField } = composables.useHelpers()
const schema = computed(() => props.schema)
composables.useSchemaProvider(schema)
const isManagedByEnabled = composables.useManagedByEnabled()

const deckCommandEditor = inject(DECK_COMMAND_EDITOR_KEY, null)
const displayConfig = computed((): ConfigCardDisplayConfig => ({
  ...props.config,
  deckCalloutPreferenceKey: reader?.value.deckCalloutPreferenceKey,
  // The reader keeps its decK options, including token generation. A View enables local editing only.
  enableDeckConfig: reader
    ? reader.value.deckOptions
    : props.config.enableDeckConfig && deckCommandEditor ? { customization: true } : props.config.enableDeckConfig,
}))
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

  const hidden = new Set(props.formatsToHide)
  return items.filter((item) => item.value === 'structured' || !hidden.has(item.value as ConfigCardCodeFormat))
})

// Initial tab matches the first format item- `structured`. The reader's saved format may replace it.
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

watch(configFormat, (format) => {
  const key = reader?.value.formatPreferenceKey
  if (key) localStorage.setItem(key, format)
})

// Restore the saved format if it is still available, otherwise fall back to `structured`
onMounted(() => {
  const key = reader?.value.formatPreferenceKey
  if (!key) return

  const storedFormat = localStorage.getItem(key)
  const item = configFormatItems.value.find(item => item.value === storedFormat)
  configFormat.value = item?.value ?? 'structured'
  localStorage.setItem(key, configFormat.value)
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

// redact sensitive fields by default
const showSensitiveFields = ref(false)
provide(CONFIG_CARD_SHOW_SENSITIVE_FIELDS, showSensitiveFields)

const redactedCodeBlockRecord = computed(() => reader?.value.redactedCodeBlockRecord ??
  redactConfigCardRecord(props.codeBlockRecord || record.value, schema.value, props.configSchema),
)

const orderedFields = (configSchema: ConfigurationSchema, rowSchemas: WeakMap<RecordItem, Record<string, any> | undefined>, group?: {
  key: string
  section: ConfigurationSchemaSection.Plugin | ConfigurationSchemaSection.Policy
}): RecordItem[] => {
  if (group && !group.key) return []

  const source = group ? record.value[group.key] || {} : record.value
  // The API schema of the record the rows come from: root, Plugin or Policy
  const sourceSchema = group ? getApiSchemaField(schema.value?.fields, group.key) : schema.value
  const fields = sourceSchema?.fields
  const fieldCount = Object.keys(source).length
  const rows: Array<{ row: RecordItem, order: number }> = []

  for (const key in source) {
    const entry = configSchema?.[key]
    if (entry?.hidden) continue
    if (!group && (key === '__ui_data' || key === props.pluginConfigKey || (key === 'managed_by' && !isManagedByEnabled.value))) continue

    const value = source[key]
    const defaults = group ? undefined : DEFAULT_BASIC_FIELDS_CONFIGURATION[key as keyof DefaultCommonFieldsConfigurationSchema]
    const field = entry?.type == null ? getApiSchemaField(fields, key) : undefined
    const encrypted = field?.type === 'string' && field.encrypted
    // Nested groups put populated fields first. A custom order of 0 keeps the default order.
    const hasValue = value !== null && value !== undefined && value !== ''
    const defaultOrder = defaults?.order ?? (group && hasValue ? fieldCount - 1 : fieldCount)
    const order = entry?.order || defaultOrder

    const row: RecordItem = {
      key,
      value,
      hidden: false,
      type: entry?.type ?? (encrypted ? ConfigurationSchemaType.Redacted : defaults?.type ?? ConfigurationSchemaType.Text),
      label: entry?.label ?? (defaults?.label || convertKeyToTitle(key)),
      tooltip: entry?.tooltip ?? (defaults?.tooltip || undefined),
      section: group?.section ?? entry?.section ?? defaults?.section ?? ConfigurationSchemaSection.Advanced,
    }
    rowSchemas.set(row, sourceSchema)
    rows.push({ order: order === -1 ? fieldCount + 1 : order, row })
  }
  return rows.sort((a, b) => a.order - b.order).map(({ row }) => row)
}

const rows = computed(() => {
  // A row's section may differ from its source, e.g. a root field shown in the Plugin section
  const schemas = new WeakMap<RecordItem, Record<string, any> | undefined>()
  const sections: Record<ConfigurationSchemaSection, RecordItem[]> = {
    basic: [],
    advanced: [],
    plugin: orderedFields(props.pluginConfigSchema, schemas, { key: props.pluginConfigKey, section: ConfigurationSchemaSection.Plugin }),
    policy: orderedFields(props.policyConfigSchema, schemas, { key: props.policyConfigKey, section: ConfigurationSchemaSection.Policy }),
  }
  for (const row of orderedFields(props.configSchema, schemas)) {
    if (row.section && Object.hasOwn(sections, row.section)) {
      sections[row.section].push(row)
    }
  }
  return { sections, schemas }
})
const propertyLists = computed(() => rows.value.sections)
provide(CONFIG_CARD_ROW_SCHEMA, row => rows.value.schemas.has(row) ? { schema: rows.value.schemas.get(row) } : undefined)

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
