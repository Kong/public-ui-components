<template>
  <ConfigCardItem
    :item="{
      type: itemType,
      key: keyValue.key,
      label: label || keyValue.key,
      value: formattedValue,
    }"
  >
    <template
      v-for="(_, attrKey) in ATTRIBUTE_KEY_TO_ENTITY"
      :key="attrKey"
      #[attrKey]
    >
      <EntityLink
        v-if="entityLink && entityLinkData"
        allow-copy
        :entity-link-data="entityLinkData"
        :external-link="entityLink"
        new-window
      />
      <span v-else>
        {{ formattedValue || t('trace_viewer.span_attributes.not_applicable') }}
      </span>
    </template>
  </ConfigCardItem>
</template>

<script setup lang="ts">
import { ConfigCardItem, ConfigurationSchemaType, EntityLink, type EntityLinkData } from '@kong-ui-public/entities-shared'
import { computed, inject, onWatcherCleanup, shallowRef, watch } from 'vue'
import composables from '../../composables'
import { SPAN_ATTRIBUTE_KEYS, SPAN_ATTRIBUTE_VALUE_UNKNOWN, TRACE_VIEWER_CONFIG } from '../../constants'
import type { EntityRequest, IKeyValue, SpanNode, TraceViewerConfig } from '../../types'
import { getPhaseAndPlugin, unwrapAnyValue } from '../../utils'

import '@kong-ui-public/entities-shared/dist/style.css'

const { i18n: { t } } = composables.useI18n()

const props = defineProps<{
  span: SpanNode['span']
  keyValue: IKeyValue
  /**
   * Label to show for the attribute.
   * If omitted, the key will be used as the default label.
   */
  label?: string
}>()

const config = inject<TraceViewerConfig>(TRACE_VIEWER_CONFIG)
if (!config) {
  throw new Error('TRACE_VIEWER_CONFIG is not provided')
}

// TODO: This formatter is simply implemented for now
const formattedValue = computed(() => {
  const value = unwrapAnyValue(props.keyValue.value)

  if (typeof value === 'string') {
    return value
  }

  if (typeof value === 'boolean' || typeof value === 'number') {
    return value.toString()
  }

  if (value instanceof Uint8Array) {
    return JSON.stringify(Array.from(value))
  }

  return JSON.stringify(value)
})

// A map of keys of attributes whose values are IDs of entities (services, routes, consumers, etc.)
// to their corresponding entities
const ATTRIBUTE_KEY_TO_ENTITY: Record<string, string> = {
  [SPAN_ATTRIBUTE_KEYS.KONG_SERVICE_ID]: 'services',
  [SPAN_ATTRIBUTE_KEYS.KONG_ROUTE_ID]: 'routes',
  [SPAN_ATTRIBUTE_KEYS.KONG_CONSUMER_ID]: 'consumers',
  [SPAN_ATTRIBUTE_KEYS.KONG_PLUGIN_ID]: 'plugins',
  [SPAN_ATTRIBUTE_KEYS.KONG_TARGET_ID]: 'targets',
  [SPAN_ATTRIBUTE_KEYS.KONG_UPSTREAM_ID]: 'upstreams',
}

// Let's only make the attributes listed above copyable, for now.
const itemType = computed(() => {
  if (ATTRIBUTE_KEY_TO_ENTITY[props.keyValue.key]) {
    return ConfigurationSchemaType.ID
  }

  return ConfigurationSchemaType.Text
})

// EntityRequest is used to ask for information about an entity from the host app
const entityRequest = computed(() => {
  const value = props.keyValue.value.stringValue
  if (!value || value === SPAN_ATTRIBUTE_VALUE_UNKNOWN) {
    return undefined
  }

  const entity = ATTRIBUTE_KEY_TO_ENTITY[props.keyValue.key]
  if (!entity) {
    return undefined
  }

  const request: EntityRequest = {
    entity: entity,
    entityId: value,
  }

  switch (props.keyValue.key) {
    case SPAN_ATTRIBUTE_KEYS.KONG_PLUGIN_ID: {
      // We will need to parse the plugin name from the span name
      request.plugin = getPhaseAndPlugin(props.span.name)?.plugin
      if (!request.plugin) {
        // Missing plugin name
        console.warn(`Failed to parse plugin name from span name "${props.span.name}"`)
        return undefined
      }
      break
    }
    case SPAN_ATTRIBUTE_KEYS.KONG_TARGET_ID: {
      const upstreamIdAttrValue = props.span.attributes?.find((attr) => attr.key === SPAN_ATTRIBUTE_KEYS.KONG_UPSTREAM_ID)?.value
      const upstreamId = upstreamIdAttrValue && unwrapAnyValue<string>(upstreamIdAttrValue)
      if (!upstreamId) {
        console.warn(`Failed to look up the upstream ID for the upstream target in the span "${props.span.name}"`)
        return undefined
      }
      request.upstream = upstreamId
      break
    }
    default:
      break
  }

  return request
})

const entityLink = computed(() => {
  if (!entityRequest.value) {
    return undefined
  }

  // We will show copyable UUID instead when `entityLink` is `undefined`
  return config.buildEntityLink?.(entityRequest.value)
})

const entityLinkData = shallowRef<EntityLinkData | undefined>(undefined)

// Get the data for the entity link, asynchronously
watch([() => config.getEntityLinkData, entityRequest], async ([getEntityLinkData, request]) => {
  if (!request) {
    return
  }

  // Set defaults
  entityLinkData.value = {
    id: request.entityId,
    label: request.entityId,
  }

  if (!getEntityLinkData) {
    return
  }

  const controller = new AbortController()

  onWatcherCleanup(() => {
    // Abort the previous fetch when applicable
    controller.abort()
  }, true)

  // The host app MUST handle exceptions inside `getEntityLinkData`.
  // In case these exceptions are thrown, we will catch them here and log them.
  try {
    const data = await getEntityLinkData(request, controller.signal)
    if (data) {
      // Only update the link data when it is truthy
      entityLinkData.value = data
    }
    // Do not update the link data when it is falsy
  } catch (e) {
    if (e instanceof Error && e.name === 'CanceledError') {
      // Ignore CanceledErrors
      return
    }
    console.warn('The host app MUST handle exceptions in `getEntityLinkData` instead of throwing them here:', e)
  }
}, { immediate: true })
</script>
