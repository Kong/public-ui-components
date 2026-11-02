<template>
  <div class="kong-ui-entity-plugin-config-card">
    <!-- Record content -->
    <EntityConfigCardView
      v-if="schema?.fields"
      :code-block-record-formatter="codeBlockRecordFormatter"
      :config="config"
      :config-card-doc="configCardDoc"
      :config-schema="configSchema"
      :entity-type="SupportedEntityType.Plugin"
      :hide-title="hideTitle"
      :plugin-config-key="PLUGIN_CONFIG_KEY"
      :plugin-config-schema="pluginConfigSchema"
      :record="resolveRecord(record)"
      :request-url="requestUrl"
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

      <template #consumer="slotProps">
        <span v-if="!getPropValue('rowValue', slotProps)">–</span>
        <InternalLinkItem
          v-else-if="showNameAsLink"
          :item="referenceLinkItem('consumer', getPropValue('rowValue', slotProps).id, config.getConsumerViewRoute)"
          @navigation-click="() => $emit('navigation-click', getPropValue('rowValue', slotProps).id, 'consumer')"
        />
        <KCopy
          v-if="schema?.fields"
          :copy-tooltip="t('copy.tooltip', { label: getPropValue('row', slotProps).label })"
          data-testid="consumer-copy-uuid"
          :text="getPropValue('rowValue', slotProps).id"
        />
      </template>

      <template #route="slotProps">
        <span v-if="!getPropValue('rowValue', slotProps)">–</span>
        <InternalLinkItem
          v-else-if="showNameAsLink"
          :item="referenceLinkItem('route', getPropValue('rowValue', slotProps).id, config.getRouteViewRoute)"
          @navigation-click="() => $emit('navigation-click', getPropValue('rowValue', slotProps).id, 'route')"
        />
        <KCopy
          v-if="schema?.fields"
          :copy-tooltip="t('copy.tooltip', { label: getPropValue('row', slotProps).label })"
          data-testid="route-copy-uuid"
          :text="getPropValue('rowValue', slotProps).id"
        />
      </template>
      <template #service="slotProps">
        <span v-if="!getPropValue('rowValue', slotProps)">–</span>
        <InternalLinkItem
          v-else-if="showNameAsLink"
          :item="referenceLinkItem('service', getPropValue('rowValue', slotProps).id, config.getServiceViewRoute)"
          @navigation-click="() => $emit('navigation-click', getPropValue('rowValue', slotProps).id, 'service')"
        />
        <KCopy
          v-if="schema?.fields"
          :copy-tooltip="t('copy.tooltip', { label: getPropValue('row', slotProps).label })"
          data-testid="service-copy-uuid"
          :text="getPropValue('rowValue', slotProps).id"
        />
      </template>
      <template #consumer_group="slotProps">
        <span v-if="!getPropValue('rowValue', slotProps)">–</span>
        <InternalLinkItem
          v-else-if="showNameAsLink"
          :item="referenceLinkItem('consumer_group', getPropValue('rowValue', slotProps).id, config.getConsumerGroupViewRoute)"
          @navigation-click="() => $emit('navigation-click', getPropValue('rowValue', slotProps).id, 'consumer_group')"
        />
        <KCopy
          v-if="schema?.fields"
          :copy-tooltip="t('copy.tooltip', { label: getPropValue('row', slotProps).label })"
          data-testid="consumer-group-copy-uuid"
          :text="getPropValue('rowValue', slotProps).id"
        />
      </template>
      <template #partials="slotProps">
        <span v-if="!getPropValue('rowValue', slotProps)">–</span>
        <InternalLinkItem
          v-else-if="showNameAsLink"
          :item="{
            key: getPropValue('rowValue', slotProps)?.[0]?.id,
            value: getPropValue('rowValue', slotProps)?.[0]?.id + (getPropValue('rowValue', slotProps)?.[0]?.name ? '/' + getPropValue('rowValue', slotProps)?.[0]?.name : ''),
            type: ConfigurationSchemaType.LinkInternal,
          }"
          @navigation-click="() => $emit('navigation-click', getPropValue('rowValue', slotProps)?.[0]?.id, 'partial')"
        />
        <KCopy
          v-if="schema?.fields"
          :copy-tooltip="t('copy.tooltip', { label: getPropValue('row', slotProps).label })"
          data-testid="partial-copy-uuid"
          :text="getPropValue('rowValue', slotProps)?.[0].id"
        />
      </template>

      <template
        v-if="config.pluginType === 'datakit' && config.app === 'konnect'"
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
    <KEmptyState
      v-else
      data-testid="plugin-config-card-schema-error"
      icon-variant="error"
    />
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

import '@kong-ui-public/entities-shared/dist/style.css'

import type { ReferenceField } from '../composables/useReferenceEntityNames'
import type { ConfigurationSchema, PluginConfigurationSchema, RecordItem } from '@kong-ui-public/entities-shared'
import type { PropType } from 'vue'
import type { RouteLocationRaw } from 'vue-router'

import type { EntityConfigCardViewConfig } from '@kong-ui-public/entities-shared'
import type { KongManagerPluginEntityConfig } from '../types'
export type PluginConfigCardViewConfig = EntityConfigCardViewConfig & Partial<Pick<KongManagerPluginEntityConfig,
  'pluginType' | 'showScopeName' | 'getConsumerViewRoute' | 'getRouteViewRoute' | 'getServiceViewRoute' | 'getConsumerGroupViewRoute'>>


const PLUGIN_CONFIG_KEY = 'config'

defineEmits<{
  (e: 'navigation-click', data: string, direction: 'route' | 'consumer' | 'consumer_group' | 'service' | 'partial'): void
}>()

const props = defineProps({
  /** The base konnect or kongManger config. Pass additional config props in the shared entity component as needed. */
  record: { type: Object as PropType<Record<string, any>>, required: true },
  schema: { type: Object as PropType<Record<string, any>>, required: true },
  requestUrl: { type: String, default: '' },
  referenceEntities: { type: Object as PropType<Partial<Record<ReferenceField, { id: string, name?: string, loading?: boolean }>>>, default: () => ({}) },
  config: {
    type: Object as PropType<PluginConfigCardViewConfig>,
    default: () => ({}),
  },
  /**
   * External link for documentation that determines visibility of Documentation button
   */
  configCardDoc: {
    type: String,
    default: '',
    required: false,
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
const { getPropValue } = useHelpers()

// The local canvas initializes its graph once; refresh it when its resolved inputs change.
const datakitRecordKey = computed(() => JSON.stringify([props.record.id, props.record.config, props.record.__ui_data, props.record.partials, props.schema]))

/**
 * KM-2996 rollout gate — see `showScopeName` on the config. Read through a computed so a host
 * that flips it once its flag service resolves re-renders the rows.
 */
const scopeNameEnabled = computed<boolean>(() => !!props.config.showScopeName)

// schema for the basic properties
const configSchema = computed((): ConfigurationSchema => {
  const customSchema: ConfigurationSchema = {}
  const apiSchema = props.schema?.fields || []

  for (let i = 0; i < apiSchema.length; i++) {
    const field = props.schema.fields[i] as Record<string, any>
    const key = Object.keys(field)?.[0]

    setFieldType(customSchema, key, field[key])
  }

  return {
    ...customSchema,
    instance_name: {
      section: ConfigurationSchemaSection.Basic,
      order: 1.5,
    },
    consumer: {
      label: scopeNameEnabled.value ? t('plugins.fields.consumer') : t('plugins.fields.consumer_id'),
      section: ConfigurationSchemaSection.Basic,
      order: 6,
    },
    route: {
      label: scopeNameEnabled.value ? t('plugins.fields.route') : t('plugins.fields.route_id'),
      section: ConfigurationSchemaSection.Basic,
      order: 6,
    },
    service: {
      label: scopeNameEnabled.value ? t('plugins.fields.service') : t('plugins.fields.service_id'),
      section: ConfigurationSchemaSection.Basic,
      order: 6,
    },
    consumer_group: {
      label: scopeNameEnabled.value ? t('plugins.fields.consumer_group') : t('plugins.fields.consumer_group_id'),
      section: ConfigurationSchemaSection.Basic,
      order: 6,
    },
    protocols: {
      type: ConfigurationSchemaType.BadgeTag,
      section: ConfigurationSchemaSection.Basic,
      order: 7,
    },
  }
})

const apiPluginSchema = computed((): Array<Record<string, any>> => {
  if (!props.schema?.fields) {
    return []
  }

  const configField = props.schema.fields?.find((rec: Record<string, any>) => {
    const key = Object.keys(rec)?.[0]

    return key === PLUGIN_CONFIG_KEY
  })

  return configField?.[PLUGIN_CONFIG_KEY]?.fields || []
})

// Schema for the plugin config section
const pluginConfigSchema = computed((): PluginConfigurationSchema => {
  const customSchema: PluginConfigurationSchema = {}

  if (!apiPluginSchema.value) {
    return customSchema
  }

  for (let i = 0; i < apiPluginSchema.value?.length; i++) {
    const field = apiPluginSchema.value[i] as Record<string, any>
    const key = Object.keys(field)?.[0]
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

const resolveRecord = (data: Record<string, any>): Record<string, any> => {
  const scopes: PluginScope[] | undefined = pluginMetaData.pluginMetaData[props.config.pluginType || props.record.name]?.scope

  // Missing `scope` indicates an unknown plugin. We'd better not touch the data.
  if (!scopes)
    return data

  return Object.fromEntries(Object.entries(data).filter(([key, value]) => {
    // If a scoped field is falsy (e.g., empty), and the plugin doesn't support that scope, remove it.
    // Keeping non-empty scoping fields in case, in the very rare case, we made a mistake in the metadata.
    if (value) return true

    if (key === 'service' && !scopes.includes(PluginScope.SERVICE))
      return false

    if (key === 'route' && !scopes.includes(PluginScope.ROUTE))
      return false

    if (key === 'consumer' && !scopes.includes(PluginScope.CONSUMER))
      return false

    if (key === 'consumer_group' && !scopes.includes(PluginScope.CONSUMER_GROUP))
      return false

    return true
  }))
}

const codeBlockRecordFormatter = (record: Record<string, any>) => {
  return omit(record, '__ui_data')
}

const getReferenceName = (field: ReferenceField): string | undefined => {
  const entity = props.referenceEntities[field]
  return entity?.id === props.record[field]?.id ? entity?.name : undefined
}
const isReferenceNameLoading = (field: ReferenceField): boolean => {
  const entity = props.referenceEntities[field]
  return entity?.id === props.record[field]?.id && !!entity?.loading
}

/**
 * With `showScopeName` on, the resolved name surfaces as a router-link with the id underneath for
 * reference, falling back to the bare id until (or unless) a name is available.
 * With it off, we keep the pre-KM-2996 behavior: the bare id as an emit-only button, no name lookup.
 */
const referenceLinkItem = (field: ReferenceField, id: string, getViewRoute?: (id: string) => RouteLocationRaw): RecordItem => ({
  key: id,
  value: scopeNameEnabled.value ? getReferenceName(field) || id : id,
  to: scopeNameEnabled.value ? getViewRoute?.(id) : undefined,
  subtitle: scopeNameEnabled.value && getReferenceName(field) ? id : undefined,
  subtitleLoading: scopeNameEnabled.value && isReferenceNameLoading(field),
  type: ConfigurationSchemaType.LinkInternal,
})

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
