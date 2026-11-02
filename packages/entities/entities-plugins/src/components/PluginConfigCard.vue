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
      :entity-type="SupportedEntityType.Plugin"
      :fetch-url="fetchUrl"
      :hide-title="hideTitle"
      @fetch:error="(err: any) => $emit('fetch:error', err)"
      @fetch:success="handleFetchSuccess"
      @loading="(val: boolean) => $emit('loading', val)"
    >
      <template #default="{ record, config: viewConfig }">
        <PluginConfigCardView
          v-bind="props"
          :config="{ ...config, ...viewConfig, enableDeckConfig: viewConfig.enableDeckConfig }"
          :record="record"
          :reference-entities="referenceEntities"
          :schema="schema"
          @navigation-click="(id, direction) => emit('navigation-click', id, direction)"
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
        </PluginConfigCardView>
      </template>
    </EntityBaseConfigCard>
  </div>
</template>

<script setup lang="ts">
import PluginConfigCardView from './PluginConfigCardView.vue'
import { EntityBaseConfigCard, SupportedEntityType, useAxios, useErrors, useSchemaProvider } from '@kong-ui-public/entities-shared'
import { computed, onBeforeMount, ref } from 'vue'

import composables from '../composables'
import endpoints from '../plugins-endpoints'

import '@kong-ui-public/entities-shared/dist/style.css'

import type { AxiosError } from 'axios'
import type { PropType } from 'vue'

import type { KongManagerPluginEntityConfig, KonnectPluginEntityConfig } from '../types'



const emit = defineEmits<{
  (e: 'loading', isLoading: boolean): void
  (e: 'fetch:error', error: AxiosError): void
  (e: 'error:fetch-schema', error: AxiosError): void
  (e: 'fetch:success', data: Record<string, any>): void
  (e: 'navigation-click', data: string, direction: 'route' | 'consumer' | 'consumer_group' | 'service' | 'partial'): void
}>()

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
  /** The type of the entity with which the plugin is associated */
  scopedEntityType: {
    type: String,
    required: false,
    default: '',
  },
  /** The id of the entity with which the plugin is associated */
  scopedEntityId: {
    type: String as PropType<string | null>,
    required: false,
    default: null,
  },
  /** Whether to expand partial in config */
  expandPartial: {
    type: Boolean,
    default: true,
  },
})


const fetchUrl = computed<string>(() => {
  let url = endpoints.item[props.config.app]?.[props.scopedEntityType ? 'forEntity' : 'all']
    .replace(/{entityType}/gi, props.scopedEntityType)
    .replace(/{entityId}/gi, props.scopedEntityId ?? '')
    .concat(props.expandPartial ? '?expand_partials=true' : '')

  if (props.config.app === 'konnect') {
    const separator = props.expandPartial ? '&' : '?'
    url = url.concat(`${separator}__ui_data=true`)
  }

  return url
})

/**
 * KM-2996 rollout gate — see `showScopeName` on the config. Read through a computed so a host
 * that flips it once its flag service resolves re-renders the rows.
 */
const scopeNameEnabled = computed<boolean>(() => !!props.config.showScopeName)

const { getMessageFromError } = useErrors()
const { axiosInstance } = useAxios(props.config?.axiosRequestConfig)

const { resolveReferenceNames, getReferenceName, isReferenceNameLoading } = composables.useReferenceEntityNames({
  config: props.config,
  axiosInstance,
  onError: (err: AxiosError) => emit('fetch:error', err),
})

const referenceRecord = ref<Record<string, any>>({})
const referenceEntities = computed(() => Object.fromEntries(
  (['service', 'route', 'consumer', 'consumer_group'] as const).map(field => [field, {
    id: referenceRecord.value[field]?.id,
    name: getReferenceName(field),
    loading: isReferenceNameLoading(field),
  }]),
))

const handleFetchSuccess = (entity: Record<string, any>) => {
  referenceRecord.value = entity
  emit('fetch:success', entity)

  // Names are only ever displayed via InternalLinkItem, so skip the lookups entirely otherwise.
  // Reads the flag at fetch time: a host that flips `showScopeName` after this point relabels the
  // rows and renders links, but shows ids until the card refetches.
  if (scopeNameEnabled.value && props.showNameAsLink) {
    resolveReferenceNames(entity)
  }
}

const schemaUrl = computed<string>(() => {
  let url = `${props.config.apiBaseUrl}${endpoints.form[props.config.app].pluginSchema}`

  if (props.config.app === 'konnect') {
    url = url.replace(/{controlPlaneId}/gi, props.config?.controlPlaneId || '')
  }

  return url
    .replace(/\/{workspace}/gi, props.config?.workspace ? `/${props.config.workspace}` : '')
    .replace(/{plugin}/gi, props.config.pluginType) // replace the plugin type
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
