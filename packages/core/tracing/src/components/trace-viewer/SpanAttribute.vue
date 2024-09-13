<template>
  <ConfigCardItem
    :item="{
      type: ConfigurationSchemaType.Text,
      key: keyValue.key,
      label: keyValue.key,
      value: formattedValue,
    }"
  >
    <template
      v-for="attrKey in ENTITY_LINKED_ATTRIBUTE_KEYS"
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

<script setup lang="tsx">
import { ConfigCardItem, ConfigurationSchemaType, EntityLink, type EntityLinkData } from '@kong-ui-public/entities-shared'
import type { IKeyValue } from '@opentelemetry/otlp-transformer'
import { computed, inject, onWatcherCleanup, ref, watchEffect, type PropType } from 'vue'
import { SPAN_ATTRIBUTE_VALUE_UNKNOWN, SPAN_ATTRIBUTES, TRACE_VIEWER_CONFIG } from '../../constants'
import type { Span, TraceViewerConfig } from '../../types'
import { getPhaseAndPlugin, unwrapAnyValue } from '../../utils'

import '@kong-ui-public/entities-shared/dist/style.css'

const props = defineProps({
  span: {
    type: Object as PropType<Span>,
    required: true,
  },
  keyValue: {
    type: Object as PropType<IKeyValue>,
    required: true,
  },
})

const config = inject<TraceViewerConfig>(TRACE_VIEWER_CONFIG)!

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

// These are keys of attributes whose values are IDs of entities like services, routes, consumers, etc.
const ENTITY_LINKED_ATTRIBUTE_KEYS = [
  SPAN_ATTRIBUTES.KONG_SERVICE_ID.name,
  SPAN_ATTRIBUTES.KONG_ROUTE_ID.name,
  SPAN_ATTRIBUTES.KONG_CONSUMER_ID.name,
  SPAN_ATTRIBUTES.KONG_PLUGIN_ID.name,
  SPAN_ATTRIBUTES.KONG_UPSTREAM_ID.name,
]

const entityLink = ref<string | undefined>(undefined)
const entityLinkData = ref<EntityLinkData | undefined>(undefined)

watchEffect(() => {
  let entity: { entity: string; entityId: string } | undefined

  const value = props.keyValue.value.stringValue
  if (typeof value === 'string' && value !== SPAN_ATTRIBUTE_VALUE_UNKNOWN) {
    switch (props.keyValue.key) {
      case SPAN_ATTRIBUTES.KONG_SERVICE_ID.name: {
        if (value) {
          entity = {
            entity: 'services',
            entityId: value,
          }
        }
        break
      }
      case SPAN_ATTRIBUTES.KONG_ROUTE_ID.name: {
        if (value) {
          entity = {
            entity: 'routes',
            entityId: value,
          }
        }
        break
      }
      case SPAN_ATTRIBUTES.KONG_CONSUMER_ID.name: {
        if (props.keyValue.value.stringValue) {
          entity = {
            entity: 'consumers',
            entityId: value,
          }
        }
        break
      }
      case SPAN_ATTRIBUTES.KONG_PLUGIN_ID.name: {
        if (props.keyValue.value.stringValue) {
          entity = {
            entity: 'plugins',
            entityId: value,
          }
        }
        break
      }
      case SPAN_ATTRIBUTES.KONG_UPSTREAM_ID.name: {
        if (props.keyValue.value.stringValue) {
          entity = {
            entity: 'upstreams',
            entityId: value,
          }
        }
        break
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
