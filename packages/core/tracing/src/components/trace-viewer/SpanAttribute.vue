<template>
  <ConfigCardItem
    :item="{
      type: itemType,
      key: keyValue.key,
      label: keyValue.key,
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
    </template>
  </ConfigCardItem>
</template>

<script setup lang="ts">
import { ConfigCardItem, ConfigurationSchemaType, EntityLink, type EntityLinkData } from '@kong-ui-public/entities-shared'
import type { IKeyValue } from '@opentelemetry/otlp-transformer'
import { computed, inject, onWatcherCleanup, shallowRef, watchEffect } from 'vue'
import { SPAN_ATTRIBUTE_VALUE_UNKNOWN, SPAN_ATTRIBUTES, TRACE_VIEWER_CONFIG } from '../../constants'
import type { EntityRequest, Span, TraceViewerConfig } from '../../types'
import { getPhaseAndPlugin, unwrapAnyValue } from '../../utils'

import '@kong-ui-public/entities-shared/dist/style.css'

const props = defineProps<{
  span: Span
  keyValue: IKeyValue
}>()

const config = inject<TraceViewerConfig>(TRACE_VIEWER_CONFIG)!
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
const ATTRIBUTE_KEY_TO_ENTITY = {
  [SPAN_ATTRIBUTES.KONG_SERVICE_ID.name]: 'services',
  [SPAN_ATTRIBUTES.KONG_ROUTE_ID.name]: 'routes',
  [SPAN_ATTRIBUTES.KONG_CONSUMER_ID.name]: 'consumers',
  [SPAN_ATTRIBUTES.KONG_PLUGIN_ID.name]: 'plugins',
  [SPAN_ATTRIBUTES.KONG_UPSTREAM_ID.name]: 'upstreams',
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

  // Check if this is a plugin ID attribute
  if (props.keyValue.key === SPAN_ATTRIBUTES.KONG_PLUGIN_ID.name) {
    // We will need to parse the plugin name from the span name
    request.plugin = getPhaseAndPlugin(props.span.name)?.[1]
    if (!request.plugin) {
      // Missing plugin name
      console.warn(`Failed to parse plugin name from span name "${props.span.name}"`)
      return undefined
    }
  }

  return request
})

const entityLink = computed(() => {
  if (!entityRequest.value) {
    return undefined
  }

  // When `buildEntityLink` is not provided, we will show copyable UUID instead
  return config.buildEntityLink?.(entityRequest.value)
})

const entityLinkData = shallowRef<EntityLinkData | undefined>(undefined)

watchEffect(async () => {
  if (!entityRequest.value) {
    return
  }

  // Preload with the entity request
  entityLinkData.value = {
    id: entityRequest.value.entityId,
    label: entityRequest.value.entityId,
  }

  const controller = new AbortController()
  config.getEntityLinkData?.(entityRequest.value, controller.signal)
    .then((data) => {
      entityLinkData.value = data
    })

  onWatcherCleanup(() => {
    // Abort the previous fetch when applicable
    controller.abort()
  })
})
</script>
