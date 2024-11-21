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
import { computed, inject, onWatcherCleanup, ref, shallowRef, watchEffect } from 'vue'
import { SPAN_ATTRIBUTE_VALUE_UNKNOWN, SPAN_ATTRIBUTES, TRACE_VIEWER_CONFIG } from '../../constants'
import type { Span, TraceViewerConfig } from '../../types'
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

const entityLink = ref<string | undefined>(undefined)
const entityLinkData = shallowRef<EntityLinkData | undefined>(undefined)

watchEffect(() => {
  let entity: { entity: string; entityId: string } | undefined

  const value = props.keyValue.value.stringValue
  if (value && value !== SPAN_ATTRIBUTE_VALUE_UNKNOWN) {
    const matchedEntity = ATTRIBUTE_KEY_TO_ENTITY[props.keyValue.key]
    if (matchedEntity) {
      entity = {
        entity: matchedEntity,
        entityId: value,
      }
    }
  }

  if (!entity) {
    entityLink.value = undefined
    entityLinkData.value = undefined
    return
  }

  let plugin: string | undefined
  if (props.keyValue.key === SPAN_ATTRIBUTES.KONG_PLUGIN_ID.name) {
    // We will need to parse the plugin name from the span name
    plugin = getPhaseAndPlugin(props.span.name)?.[1]
  }

  // When `buildEntityLink` is not provided, we will fallback to show the UUID instead
  entityLink.value = config.buildEntityLink?.(entity.entity, entity.entityId, plugin)
  entityLinkData.value = {
    id: entity.entityId,
    label: entity.entityId, // Will be populated asynchronously
  }

  const controller = new AbortController()
  config.getEntityLinkData?.(entity.entity, entity.entityId, controller.signal)
    .then((data) => {
      entityLinkData.value = data
    })

  onWatcherCleanup(() => {
    // Abort the previous fetch when applicable
    controller.abort()
  })
})
</script>
