<template>
  <div class="kong-ui-entity-plugin-config-card">
    <!-- Loading -->
    <KSkeleton
      v-if="schemaLoading"
      data-testid="plugin-config-card-loader"
      :table-columns="2"
      type="table"
    />

    <!-- Error fetching record schema -->
    <KEmptyState
      v-else-if="fetchSchemaError"
      data-testid="plugin-config-card-schema-error"
      icon-variant="error"
    >
      <template #default>
        <h3>{{ fetchSchemaError }}</h3>
      </template>
    </KEmptyState>

    <!-- Record content -->
    <EntityBaseConfigCard
      v-else
      :config="config"
      :config-card-doc="configCardDoc"
      :config-schema="configSchema"
      :entity-type="SupportedEntityType.Plugin"
      :fetch-url="fetchUrl"
      :hide-title="hideTitle"
      :plugin-config-key="PLUGIN_CONFIG_KEY"
      :plugin-config-schema="pluginConfigSchema"
      @fetch:error="(err: any) => $emit('fetch:error', err)"
      @fetch:success="(entity: any) => $emit('fetch:success', entity)"
      @loading="(val: boolean) => $emit('loading', val)"
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
          v-else-if="showIdAsLink"
          :item="{
            key: getPropValue('rowValue', slotProps).id,
            value: getPropValue('rowValue', slotProps).id,
            type: ConfigurationSchemaType.LinkInternal
          }"
          @navigation-click="() => $emit('navigation-click', getPropValue('rowValue', slotProps).id, 'consumer')"
        />
        <KCopy
          v-else
          :copy-tooltip="t('copy.tooltip', { label: getPropValue('row', slotProps).label })"
          data-testid="consumer-copy-uuid"
          :text="getPropValue('rowValue', slotProps).id"
        />
      </template>

      <template #route="slotProps">
        <span v-if="!getPropValue('rowValue', slotProps)">–</span>
        <InternalLinkItem
          v-else-if="showIdAsLink"
          :item="{
            key: getPropValue('rowValue', slotProps).id,
            value: getPropValue('rowValue', slotProps).id,
            type: ConfigurationSchemaType.LinkInternal
          }"
          @navigation-click="() => $emit('navigation-click', getPropValue('rowValue', slotProps).id, 'route')"
        />
        <KCopy
          v-else
          :copy-tooltip="t('copy.tooltip', { label: getPropValue('row', slotProps).label })"
          data-testid="route-copy-uuid"
          :text="getPropValue('rowValue', slotProps).id"
        />
      </template>
      <template #service="slotProps">
        <span v-if="!getPropValue('rowValue', slotProps)">–</span>
        <InternalLinkItem
          v-else-if="showIdAsLink"
          :item="{
            key: getPropValue('rowValue', slotProps).id,
            value: getPropValue('rowValue', slotProps).id,
            type: ConfigurationSchemaType.LinkInternal
          }"
          @navigation-click="() => $emit('navigation-click', getPropValue('rowValue', slotProps).id, 'service')"
        />
        <KCopy
          v-else
          :copy-tooltip="t('copy.tooltip', { label: getPropValue('row', slotProps).label })"
          data-testid="service-copy-uuid"
          :text="getPropValue('rowValue', slotProps).id"
        />
      </template>
      <template #consumer_group="slotProps">
        <span v-if="!getPropValue('rowValue', slotProps)">–</span>
        <InternalLinkItem
          v-else-if="showIdAsLink"
          :item="{
            key: getPropValue('rowValue', slotProps).id,
            value: getPropValue('rowValue', slotProps).id,
            type: ConfigurationSchemaType.LinkInternal
          }"
          @navigation-click="() => $emit('navigation-click', getPropValue('rowValue', slotProps).id, 'consumer_group')"
        />
        <KCopy
          v-else
          :copy-tooltip="t('copy.tooltip', { label: getPropValue('row', slotProps).label })"
          data-testid="consumer-group-copy-uuid"
          :text="getPropValue('rowValue', slotProps).id"
        />
      </template>
      <template #partials="slotProps">
        <span v-if="!getPropValue('rowValue', slotProps)">–</span>
        <InternalLinkItem
          v-else-if="showIdAsLink"
          :item="{
            key: getPropValue('rowValue', slotProps)?.[0]?.id,
            value: getPropValue('rowValue', slotProps)?.[0]?.id + (getPropValue('rowValue', slotProps)?.[0]?.name ? '/' + getPropValue('rowValue', slotProps)?.[0]?.name : ''),
            type: ConfigurationSchemaType.LinkInternal
          }"
          @navigation-click="() => $emit('navigation-click', getPropValue('rowValue', slotProps).id, 'partial')"
        />
        <KCopy
          v-else
          :copy-tooltip="t('copy.tooltip', { label: getPropValue('row', slotProps).label })"
          data-testid="partial-copy-uuid"
          :text="getPropValue('rowValue', slotProps)?.[0].id"
        />
      </template>
    </EntityBaseConfigCard>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import { computed, ref, onBeforeMount } from 'vue'
import type { AxiosError } from 'axios'
import type { KongManagerPluginEntityConfig, KonnectPluginEntityConfig } from '../types'
import type {
  ConfigurationSchema,
  PluginConfigurationSchema,
} from '@kong-ui-public/entities-shared'
import {
  EntityBaseConfigCard,
  ConfigurationSchemaType,
  ConfigurationSchemaSection,
  InternalLinkItem,
  useAxios,
  useErrors,
  useHelpers,
  SupportedEntityType,
} from '@kong-ui-public/entities-shared'
import composables from '../composables'
import { useSchemaProvider } from '@kong-ui-public/entities-shared'
import endpoints from '../plugins-endpoints'
import PluginIcon from './PluginIcon.vue'
import '@kong-ui-public/entities-shared/dist/style.css'

const PLUGIN_CONFIG_KEY = 'config'

const emit = defineEmits<{
  (e: 'loading', isLoading: boolean): void
  (e: 'fetch:error', error: AxiosError): void,
  (e: 'error:fetch-schema', error: AxiosError): void,
  (e: 'fetch:success', data: Record<string, any>): void,
  (e: 'navigation-click', data: string, direction: 'route' | 'consumer' | 'consumer_group' | 'service' | 'partial'): void
}>()

// Component props - This structure must exist in ALL entity components, with the exclusion of unneeded action props (e.g. if you don't need `canDelete`, just exclude it)
const props = defineProps({
  /** The base konnect or kongManger config. Pass additional config props in the shared entity component as needed. */
  config: {
    type: Object as PropType<KonnectPluginEntityConfig | KongManagerPluginEntityConfig>,
    required: true,
    validator: (config: KonnectPluginEntityConfig | KongManagerPluginEntityConfig): boolean => {
      if (!config || !['konnect', 'kongManager'].includes(config?.app)) return false
      if (config.app === 'konnect' && !config.controlPlaneId) return false
      if (config.app === 'kongManager' && typeof config.workspace !== 'string') return false
      if (!config.entityId || !config.pluginType) return false
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
  showIdAsLink: {
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
  /** The type of the entity with which the plugin is associated */
  scopedEntityType: {
    type: String,
    required: false,
    default: '',
  },
  /** The id of the entity with which the plugin is associated */
  scopedEntityId: {
    type: String,
    required: false,
    default: '',
  },
  /** Whether to expand partial in config */
  expandPartial: {
    type: Boolean,
    default: true,
  },
})

const { i18n: { t } } = composables.useI18n()
const pluginMetaData = composables.usePluginMetaData()
const { setFieldType } = composables.usePluginHelpers()
const { getPropValue } = useHelpers()

const fetchUrl = computed<string>(
  () => endpoints.item[props.config.app]?.[props.scopedEntityType ? 'forEntity' : 'all']
    .replace(/{entityType}/gi, props.scopedEntityType)
    .replace(/{entityId}/gi, props.scopedEntityId)
    .concat(props.expandPartial ? '?expand_partials=true' : ''),
)

// schema for the basic properties
const configSchema = computed((): ConfigurationSchema => {
  const customSchema: ConfigurationSchema = {}
  const apiSchema = schema.value?.fields || []

  for (let i = 0; i < apiSchema.length; i++) {
    const field = schema.value.fields[i] as Record<string, any>
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
      label: t('plugins.fields.consumer'),
      section: ConfigurationSchemaSection.Basic,
      order: 6,
    },
    route: {
      label: t('plugins.fields.route'),
      section: ConfigurationSchemaSection.Basic,
      order: 6,
    },
    service: {
      label: t('plugins.fields.service'),
      section: ConfigurationSchemaSection.Basic,
      order: 6,
    },
    consumer_group: {
      label: t('plugins.fields.consumer_group'),
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

const apiPluginSchema = computed((): Record<string, any>[] => {
  if (!schema.value?.fields) {
    return []
  }

  const configField = schema.value.fields?.find((rec: Record<string, any>) => {
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

const { getMessageFromError } = useErrors()
const { axiosInstance } = useAxios(props.config?.axiosRequestConfig)

const schemaUrl = computed<string>(() => {
  let url = `${props.config.apiBaseUrl}${endpoints.form[props.config.app].pluginSchema}`

  if (props.config.app === 'konnect') {
    url = url.replace(/{controlPlaneId}/gi, props.config?.controlPlaneId || '')
  } else if (props.config.app === 'kongManager') {
    url = url.replace(/\/{workspace}/gi, props.config?.workspace ? `/${props.config.workspace}` : '')
  }

  // replace the plugin type
  url = url.replace(/{plugin}/gi, props.config.pluginType)

  return url
})

const schema = ref<Record<string, any>>({})
useSchemaProvider(schema)
const schemaLoading = ref(false)
const fetchSchemaError = ref('')
onBeforeMount(async () => {
  schemaLoading.value = true

  try {
    const { data } = await axiosInstance.get(schemaUrl.value)

    schema.value = data
  } catch (error: any) {
    fetchSchemaError.value = getMessageFromError(error)
    // Emit the error for the host app
    emit('error:fetch-schema', error)
  } finally {
    schemaLoading.value = false
  }
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
    color: $kui-color-text-neutral-stronger;
    font-size: $kui-font-size-30;
    font-weight: 600;
    line-height: 20px;
  }
}
</style>
