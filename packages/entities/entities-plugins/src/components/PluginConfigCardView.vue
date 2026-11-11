<template>
  <div>
    <EntityConfigCardView
      v-if="schema?.fields"
      :code-block-record-formatter="codeBlockRecordFormatter"
      :config="config"
      :config-schema="configSchema"
      :entity-type="SupportedEntityType.Plugin"
      :hide-title="hideTitle"
      :plugin-config-key="PLUGIN_CONFIG_KEY"
      :plugin-config-schema="pluginConfigSchema"
      :record="displayRecord"
      :schema="schema"
    >
      <template #name="slotProps">
        <div class="name-cell-wrapper">
          <PluginIcon
            class="plugin-icon"
            :name="getPropValue('rowValue', slotProps)"
            :size="24"
          />
          <span class="info-name">
            {{ pluginMetaData.getDisplayName(getPropValue('rowValue', slotProps)) }}
          </span>
        </div>
      </template>

      <template
        v-for="field in REFERENCE_SCOPES"
        :key="field"
        #[field]="{ row, rowValue }"
      >
        <span v-if="!rowValue">–</span>
        <InternalLinkItem
          v-else-if="showNameAsLink"
          :item="referenceLinkItem(field, rowValue.id)"
          @navigation-click="$emit('navigation-click', rowValue.id, field)"
        />
        <KCopy
          v-else
          :copy-tooltip="t('copy.tooltip', { label: row.label })"
          :data-testid="`${field.replace('_', '-')}-copy-uuid`"
          :text="rowValue.id"
        />
      </template>

      <template #partials="{ row, rowValue }">
        <span v-if="!rowValue?.[0]">–</span>
        <InternalLinkItem
          v-else-if="showNameAsLink"
          :item="{
            key: rowValue[0].id,
            value: rowValue[0].name ? `${rowValue[0].id}/${rowValue[0].name}` : rowValue[0].id,
            type: ConfigurationSchemaType.LinkInternal,
          }"
          @navigation-click="$emit('navigation-click', rowValue[0].id, 'partial')"
        />
        <KCopy
          v-else
          :copy-tooltip="t('copy.tooltip', { label: row.label })"
          data-testid="partial-copy-uuid"
          :text="rowValue[0].id"
        />
      </template>

      <template
        v-if="record.name === 'datakit' && config.app === 'konnect'"
        #config-card-item-nodes="slotProps"
      >
        <DatakitConfigCardCanvas
          :key="datakitRecordKey"
          :item="slotProps.row"
          :plugin-data="slotProps.record"
          :schema="schema"
        />
      </template>
      <template
        v-if="$slots.title"
        #title
      >
        <slot name="title" />
      </template>
      <template
        v-if="$slots.actions"
        #actions
      >
        <slot name="actions" />
      </template>
    </EntityConfigCardView>
    <!-- Without the API schema, encrypted fields cannot be identified and masked -->
    <KEmptyState
      v-else
      data-testid="plugin-config-card-schema-error"
      icon-variant="error"
    >
      <template #default>
        <h3>{{ t('errors.load_schema') }}</h3>
      </template>
    </KEmptyState>
  </div>
</template>

<script setup lang="ts">
import { PluginIcon } from '@kong-ui-public/entities-plugins-icon'
import { ConfigurationSchemaSection, ConfigurationSchemaType, EntityConfigCardView, InternalLinkItem, SupportedEntityType, useHelpers } from '@kong-ui-public/entities-shared'
import { computed } from 'vue'
import { omit } from 'lodash-es'

import composables from '../composables'
import { PluginScope } from '../types'
import DatakitConfigCardCanvas from './free-form/plugins/datakit/DatakitConfigCardCanvas.vue'
import { supportsCallErrorHandling } from './free-form/plugins/datakit/flow-editor/composables/useNodeForm'

import '@kong-ui-public/entities-shared/dist/style.css'

import type { ReferenceField } from '../composables/useReferenceEntityNames'
import type { ConfigurationSchema, PluginConfigurationSchema, RecordItem } from '@kong-ui-public/entities-shared'
import type { PropType } from 'vue'
import type { RouteLocationRaw } from 'vue-router'

import type { EntityConfigCardViewConfig } from '@kong-ui-public/entities-shared'


const PLUGIN_CONFIG_KEY = 'config'
const REFERENCE_SCOPES = [PluginScope.CONSUMER, PluginScope.ROUTE, PluginScope.SERVICE, PluginScope.CONSUMER_GROUP] as const

defineEmits<{
  (e: 'navigation-click', data: string, direction: 'route' | 'consumer' | 'consumer_group' | 'service' | 'partial'): void
}>()

const props = defineProps({
  record: { type: Object as PropType<Record<string, any>>, required: true },
  schema: { type: Object as PropType<Record<string, any>>, required: true },
  /** Resolved scope entities. A non-empty map labels scope rows by entity; names show with `showNameAsLink` when the ID matches. */
  referenceEntities: { type: Object as PropType<Partial<Record<ReferenceField, { id: string, name?: string, loading?: boolean, to?: RouteLocationRaw }>>>, default: () => ({}) },
  config: {
    type: Object as PropType<EntityConfigCardViewConfig>,
    default: () => ({}),
  },
  showNameAsLink: {
    type: Boolean,
    default: false,
  },
  /**
   * Control visibility of card title content
   */
  hideTitle: {
    type: Boolean,
    default: false,
  },

})

const { i18n: { t } } = composables.useI18n()
const pluginMetaData = composables.usePluginMetaData()
const { setFieldType } = composables.usePluginHelpers()
const { getApiSchemaField, getPropValue } = useHelpers()

// The local canvas initializes its graph and schema capabilities once; refresh it when they change.
const datakitRecordKey = computed(() => JSON.stringify([props.record.id, props.record.config, props.record.__ui_data, props.record.partials, supportsCallErrorHandling(props.schema)]))

// Supplying resolved association data opts into names; rollout flags stay in the owner.
const scopeNameEnabled = computed(() => Object.keys(props.referenceEntities).length > 0)

// schema for the basic properties
const configSchema = computed((): ConfigurationSchema => {
  const customSchema: ConfigurationSchema = {}
  for (const field of props.schema?.fields ?? []) {
    const key = Object.keys(field)[0]

    setFieldType(customSchema, key, field[key])
  }

  for (const field of REFERENCE_SCOPES) {
    customSchema[field] = {
      label: t(scopeNameEnabled.value ? `plugins.fields.${field}` : `plugins.fields.${field}_id`),
      section: ConfigurationSchemaSection.Basic,
      order: 6,
    }
  }

  return {
    ...customSchema,
    instance_name: {
      section: ConfigurationSchemaSection.Basic,
      order: 1.5,
    },
    protocols: {
      type: ConfigurationSchemaType.BadgeTag,
      section: ConfigurationSchemaSection.Basic,
      order: 7,
    },
  }
})

// Schema for the plugin config section
const pluginConfigSchema = computed((): PluginConfigurationSchema => {
  const customSchema: PluginConfigurationSchema = {}
  const fields = getApiSchemaField(props.schema?.fields, PLUGIN_CONFIG_KEY)?.fields ?? []

  for (const field of fields) {
    const key = Object.keys(field)[0]
    const rec = field[key]

    // prioritize required fields
    if (rec.required) {
      customSchema[key] = {
        order: 1,
      }
    }

    setFieldType(customSchema, key, rec)
  }

  return customSchema
})

const displayRecord = computed(() => {
  const record = props.record
  const scopes = pluginMetaData.pluginMetaData[record.name]?.scope

  if (!scopes) return record

  return Object.fromEntries(Object.entries(record).filter(([key, value]) => {
    // Preserve populated scopes even if plugin metadata is incomplete.
    const scope = REFERENCE_SCOPES.find(scope => scope === key)
    return value || !scope || scopes.includes(scope)
  }))
})

const codeBlockRecordFormatter = (record: Record<string, any>) => {
  return omit(record, '__ui_data')
}

const referenceLinkItem = (field: ReferenceField, id: string): RecordItem => {
  const reference = props.referenceEntities[field]
  const entity = reference?.id === id ? reference : undefined
  return {
    key: id,
    value: entity?.name || id,
    to: entity?.to,
    subtitle: entity?.name ? id : undefined,
    subtitleLoading: !!entity?.loading,
    type: ConfigurationSchemaType.LinkInternal,
  }
}

</script>

<style lang="scss" scoped>
.name-cell-wrapper {
  align-items: center;
  display: flex;

  .plugin-icon {
    margin-right: 12px;
  }

  .info-name {
    color: var(--kui-color-text-neutral-stronger, $kui-color-text-neutral-stronger);
    font-size: var(--kui-font-size-30, $kui-font-size-30);
    font-weight: 600;
    line-height: 20px;
  }
}
</style>
