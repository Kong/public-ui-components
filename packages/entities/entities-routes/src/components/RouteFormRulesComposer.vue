<template>
  <RulesComposer
    v-if="routeFlavors.traditional || routeFlavors.expressions"
    v-model="hash"
    :route-flavors="routeFlavors"
    :tooltips="tooltips"
  >
    <template #before-content>
      <FlavorSwitchAlert
        :current="currentFlavor"
        :record-flavor="recordFlavor"
        :route-flavors="routeFlavors"
      />
    </template>

    <template
      v-if="!recordFlavor || recordFlavor === RouteFlavor.TRADITIONAL"
      #[RouteFlavor.TRADITIONAL]
    >
      <TraditionalRules
        v-model:custom-methods="customMethods"
        v-model:fields="(fields as BaseRouteStateFields & SharedRouteRulesFields & TraditionalRouteRulesFields)"
        :protocols="protocols"
        :readonly="readonly"
      />
    </template>

    <template
      v-if="!recordFlavor || recordFlavor === RouteFlavor.EXPRESSIONS"
      #[RouteFlavor.EXPRESSIONS]
    >
      <ExpressionsRules
        v-model:fields="(fields as BaseRouteStateFields & SharedRouteRulesFields & ExpressionsRouteRulesFields)"
        :protocols="protocols"
        :readonly="readonly"
        :show-expressions-modal-entry="showExpressionsModalEntry"
        @notify="emit('notify', $event)"
      />
    </template>
  </RulesComposer>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { INITIAL_SHARED_ROUTE_RULES_FIELDS, INITIAL_TRADITIONAL_ROUTE_RULES_VALUES, type PROTOCOLS_TO_ROUTE_RULES } from '../constants'
import { RouteFlavor, RoutingRulesEntities, type BaseRouteStateFields, type Destinations, type ExpressionsRouteRulesFields, type HeaderFields, type Headers, type Method, type RouteFlavors, type SharedRouteRulesFields, type Sources, type TraditionalRouteRulesFields, type TraditionalRouteRulesPayload, type TypedRouteRulesPayload } from '../types'
import ExpressionsRules from './rules-composer/ExpressionsRules.vue'
import FlavorSwitchAlert from './rules-composer/FlavorSwitchAlert.vue'
import RulesComposer from './rules-composer/RulesComposer.vue'
import TraditionalRules from './rules-composer/TraditionalRules.vue'

const fields = defineModel<SharedRouteRulesFields>('fields', {
  default: () => reactive({
    ...INITIAL_SHARED_ROUTE_RULES_FIELDS,
    ...{
      paths: [''],
      regex_priority: 0,
      path_handling: 'v0',
    } as Omit<TraditionalRouteRulesFields, keyof SharedRouteRulesFields>,
    ...{
      expression: '',
      priority: 0,
    } as Omit<ExpressionsRouteRulesFields, keyof SharedRouteRulesFields>,
  }),
})
const customMethods = defineModel<string[]>('customMethods', { default: () => reactive([]) })
const hash = defineModel<string | undefined>('hash')

const props = defineProps<{
  protocols: keyof typeof PROTOCOLS_TO_ROUTE_RULES
  routeFlavors: RouteFlavors
  readonly?: boolean
  recordFlavor?: RouteFlavor
  showExpressionsModalEntry?: boolean
  tooltips?: {
    [RouteFlavor.TRADITIONAL]?: string
    [RouteFlavor.EXPRESSIONS]?: string
  }
}>()

const emit = defineEmits<{
  notify: [notification: { message: string, type: string }]
  'update:payload': [payload?: TypedRouteRulesPayload]
}>()

const currentFlavor = computed<RouteFlavor | undefined>(() => {
  const hashFlavor = hash.value?.substring(1)
  switch (hashFlavor) {
    case RouteFlavor.TRADITIONAL:
    case RouteFlavor.EXPRESSIONS:
      return hashFlavor
    default:
      break
  }

  if (props.routeFlavors.traditional) {
    return RouteFlavor.TRADITIONAL
  } else if (props.routeFlavors.expressions) {
    return RouteFlavor.EXPRESSIONS
  }

  return undefined
})

// removes any empty values left behind by empty fields on the form
const cleanDataArr = (entity: string, originalData: any) => {
  if (entity === RoutingRulesEntities.PATHS || entity === RoutingRulesEntities.HOSTS || entity === RoutingRulesEntities.SNIS) {
    return [...originalData].filter((item: string) => !!item)
  } else if (entity === RoutingRulesEntities.SOURCES || entity === RoutingRulesEntities.DESTINATIONS) {
    return [...originalData]
      .filter((item: Sources | Destinations) => !!item.ip)
      .map((item: Sources | Destinations) => ({
        ...item,
        port: !item.port && item.port !== 0 ? null : item.port,
      }))
  } else if (entity === RoutingRulesEntities.HEADERS) {
    return [...originalData].filter((item: Headers) => !!item.header)
  }
}

// returns methods formatted in the payload format, except for custom methods (those are handled separately)
const selectedMethods = computed((): Method[] => {
  if (currentFlavor.value !== RouteFlavor.TRADITIONAL) {
    return []
  }

  const traditionalFields = fields.value as TraditionalRouteRulesFields
  if (!traditionalFields.methods) {
    return []
  }

  return Object.entries(traditionalFields.methods).reduce<Method[]>((methods, [key, value]) => {
    if (value) {
      methods.push(key as Method)
    }
    return methods
  }, [])
})

const getHeaders = (): Headers | null => {
  if (currentFlavor.value !== RouteFlavor.TRADITIONAL) {
    return null
  }

  const traditionalFields = fields.value as TraditionalRouteRulesFields
  const compactHeaders: HeaderFields[] = cleanDataArr(RoutingRulesEntities.HEADERS, traditionalFields.headers || []) || INITIAL_TRADITIONAL_ROUTE_RULES_VALUES[RoutingRulesEntities.HEADERS]
  if (compactHeaders.length === 0) {
    return null
  }

  return compactHeaders.reduce<Headers>((headers, compactHeader) => {
    headers[compactHeader.header] = compactHeader.values.split(',')
    return headers
  }, {})
}

const getArrPayload = (arr?: any[]) => arr?.length ? arr : null

const sharedPayload = computed(() => ({
  https_redirect_status_code: fields.value.https_redirect_status_code,
  strip_path:  fields.value.strip_path,
  preserve_host:  fields.value.preserve_host,
  request_buffering:  fields.value.request_buffering,
  response_buffering:  fields.value.response_buffering,
}))

const payload = computed<TypedRouteRulesPayload | undefined>(() => {
  switch (currentFlavor.value) {
    case RouteFlavor.TRADITIONAL: {
      const traditionalFields = fields.value as TraditionalRouteRulesFields
      const payload: TraditionalRouteRulesPayload = {
        ...sharedPayload.value,
        methods: null,
        hosts: getArrPayload(cleanDataArr(RoutingRulesEntities.HOSTS, traditionalFields.hosts || [])),
        paths: getArrPayload(cleanDataArr(RoutingRulesEntities.PATHS, traditionalFields.paths || [])),
        headers: getHeaders(),
        regex_priority: Number(traditionalFields.regex_priority),
        path_handling: traditionalFields.path_handling,
        sources: getArrPayload(cleanDataArr(RoutingRulesEntities.SOURCES, traditionalFields.sources || [])),
        destinations: getArrPayload(cleanDataArr(RoutingRulesEntities.DESTINATIONS, traditionalFields.destinations || [])),
        snis: getArrPayload(cleanDataArr(RoutingRulesEntities.SNIS, traditionalFields.snis || [])),
      }

      if (selectedMethods.value?.length) {
        payload.methods = [...selectedMethods.value]

        // handle custom method input
        // add any custom methods from input field, avoid duplicate

        if (selectedMethods.value?.includes('CUSTOM')) {
          const customMethodIndex = payload.methods.indexOf('CUSTOM')
          if (customMethodIndex !== -1) {
            payload.methods.splice(customMethodIndex, 1)
          }

          customMethods.value.forEach(method => {
            if (method && payload.methods && !payload.methods?.includes(method)) {
              payload.methods.push(method.toUpperCase())
            }
          })
        }
      }

      return {
        type: currentFlavor.value,
        payload,
      }
    }
    case RouteFlavor.EXPRESSIONS: {
      const expressionsFields = fields.value as ExpressionsRouteRulesFields

      return {
        type: currentFlavor.value,
        payload: {
          ...sharedPayload.value,
          expression: expressionsFields.expression,
          priority: Number(expressionsFields.priority),
        },
      }
    }
    default:
      return undefined
  }
})

watch(payload, (newPayload) => {
  emit('update:payload', newPayload)
}, { deep: true, immediate: true })
</script>

<style lang="scss" scoped>
.route-form-config-tabs-tooltip {
  display: inline-flex;
  margin: $kui-space-auto $kui-space-0 $kui-space-auto $kui-space-20;
  vertical-align: middle;
}
</style>
