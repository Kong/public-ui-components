<template>
  <div class="config-type-container">
    <KRadio
      v-model="configType"
      card
      card-orientation="horizontal"
      data-testid="route-form-config-type-basic"
      :description="t('form.config_types.basic.description')"
      :disabled="!routeFlavors.traditional || recordFlavor === RouteFlavor.EXPRESSIONS"
      :label="t('form.config_types.basic.label')"
      selected-value="basic"
    />
    <KRadio
      v-model="configType"
      card
      card-orientation="horizontal"
      data-testid="route-form-config-type-advanced"
      :description="t('form.config_types.advanced.description')"
      :label="t('form.config_types.advanced.label')"
      selected-value="advanced"
    />
  </div>

  <template v-if="configType === 'basic'">
    <TraditionalRules
      v-model:custom-methods="customMethods"
      v-model:fields="(fields as BaseRouteStateFields & SharedRouteRulesFields & TraditionalRouteRulesFields)"
      config-type="basic"
      hide-advanced
      :protocols="protocols"
      :readonly="readonly"
    />
  </template>

  <template v-else>
    <div
      v-if="routeFlavors.traditional && routeFlavors.expressions"
      class="config-flavor"
    >
      <KLabel class="config-flavor-label">
        {{ t('form.config_flavor.label') }}
      </KLabel>
      <KSegmentedControl
        v-model="configFlavor"
        class="config-flavor-control"
        data-testid="route-form-config-flavor"
        :options="configFlavorOptions"
      >
        <template #option-label="{ option }">
          <span>{{ option.label }}</span>
          <KTooltip
            v-if="tooltips?.[option.value as RouteFlavor]"
            class="route-form-config-tabs-tooltip"
            :text="tooltips?.[option.value as RouteFlavor]"
            :tooltip-id="`route-form-config-tabs-tooltip-${option.value}`"
          >
            <InfoIcon />
          </KTooltip>
        </template>
      </KSegmentedControl>
    </div>

    <KAlert
      v-if="routeFlavors.traditional && routeFlavors.expressions && (!recordFlavor || recordFlavor !== configFlavor)"
      :appearance="!recordFlavor ? 'info' : 'warning'"
      class="route-form-config-type-immutable-alert"
      data-testid="route-config-type-immutable-alert"
    >
      <template #default>
        <template v-if="!recordFlavor">
          {{ t('form.warning.cannotChangeFlavor.create') }}
        </template>
        <template v-else-if="recordFlavor !== configFlavor">
          {{ t('form.warning.cannotChangeFlavor.edit', { format: t(`form.flavors.${recordFlavor}`) }) }}
        </template>
      </template>
    </KAlert>

    <template v-if="!recordFlavor || !(routeFlavors.traditional && routeFlavors.expressions && recordFlavor !== configFlavor)">
      <KSelect
        v-if="!hideProtocols"
        data-testid="route-form-protocols"
        :items="protocolOptions"
        :label="t('form.fields.protocols.label')"
        :label-attributes="{
          info: t('form.fields.protocols.tooltip'),
          tooltipAttributes: { maxWidth: '400' },
        }"
        :model-value="protocols"
        :readonly="readonly"
        required
        width="100%"
        @update:model-value="onProtocolUpdate"
      />

      <TraditionalRules
        v-if="configFlavor === RouteFlavor.TRADITIONAL"
        v-model:custom-methods="customMethods"
        v-model:fields="(fields as BaseRouteStateFields & SharedRouteRulesFields & TraditionalRouteRulesFields)"
        config-type="advanced"
        :protocols="protocols"
        :readonly="readonly"
      />

      <ExpressionsRules
        v-else
        v-model:fields="(fields as BaseRouteStateFields & SharedRouteRulesFields & ExpressionsRouteRulesFields)"
        :protocols="protocols"
        :readonly="readonly"
        :show-expressions-modal-entry="showExpressionsModalEntry"
        @notify="emit('notify', $event)"
      />
    </template>
  </template>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { InfoIcon } from '@kong/icons'
import composables from '../composables'
import { INITIAL_SHARED_ROUTE_RULES_FIELDS, INITIAL_TRADITIONAL_ROUTE_RULES_VALUES, PROTOCOLS_TO_ROUTE_RULES, DEFAULT_PROTOCOL } from '../constants'
import {
  RouteFlavor,
  RoutingRulesEntities,
  Methods,
  type BaseRouteStateFields,
  type Destinations,
  type ExpressionsRouteRulesFields,
  type HeaderFields,
  type Headers,
  type RouteFlavors,
  type SharedRouteRulesFields,
  type Sources,
  type TraditionalRouteRulesFields,
  type TraditionalRouteRulesPayload,
  type TypedRouteRulesPayload,
} from '../types'
import TraditionalRules from './rules-composer/TraditionalRules.vue'
import ExpressionsRules from './rules-composer/ExpressionsRules.vue'

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
  isWsSupported?: boolean
  hideProtocols?: boolean
}>()

const configType = defineModel<'basic' | 'advanced'>('configType', { required: true })
const configFlavor = defineModel<RouteFlavor>('configFlavor', { required: true })
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
const customMethods = defineModel<Array<{ label: string, value: string }>>('customMethods', { default: () => reactive([]) })

const emit = defineEmits<{
  notify: [notification: { message: string, type: string }]
  'update:payload': [payload?: TypedRouteRulesPayload]
  'update:protocols': [protocols: BaseRouteStateFields['protocols']]
}>()

const { i18n: { t } } = composables.useI18n()

const configFlavorOptions = [
  {
    value: RouteFlavor.TRADITIONAL,
    label: t('form.flavors.traditional'),
  },
  {
    value: RouteFlavor.EXPRESSIONS,
    label: t('form.flavors.expressions'),
  },
]

const protocolOptions = computed(() => [
  { label: t('form.protocols.grpc'), value: 'grpc' },
  { label: t('form.protocols.grpcs'), value: 'grpcs' },
  { label: t('form.protocols.grpc,grpcs'), value: 'grpc,grpcs' },
  { label: t('form.protocols.http'), value: 'http' },
  { label: t('form.protocols.https'), value: 'https' },
  { label: t('form.protocols.http,https'), value: 'http,https' },
  { label: t('form.protocols.tcp'), value: 'tcp' },
  { label: t('form.protocols.tls'), value: 'tls' },
  { label: t('form.protocols.tls,udp'), value: 'tls,udp' },
  { label: t('form.protocols.tcp,udp'), value: 'tcp,udp' },
  { label: t('form.protocols.tcp,tls'), value: 'tcp,tls' },
  { label: t('form.protocols.tcp,tls,udp'), value: 'tcp,tls,udp' },
  { label: t('form.protocols.tls_passthrough'), value: 'tls_passthrough' },
  { label: t('form.protocols.udp'), value: 'udp' },
  ...(
    props.isWsSupported
      ? [
        { label: t('form.protocols.ws'), value: 'ws' },
        { label: t('form.protocols.wss'), value: 'wss' },
        { label: t('form.protocols.ws,wss'), value: 'ws,wss' },
      ]
      : []
  ),
])
const payloadFlavor = computed<RouteFlavor | undefined>(() => {
  if (props.recordFlavor) {
    return props.recordFlavor
  }

  return configFlavor.value
})

// removes any empty values left behind by empty fields on the form
const cleanDataArr = (entity: RoutingRulesEntities, originalData: any) => {
  const protocolRuleNames = new Set<string>(PROTOCOLS_TO_ROUTE_RULES[props.protocols])
  if (!protocolRuleNames.has(entity)) {
    return []
  }

  if ([RoutingRulesEntities.PATHS, RoutingRulesEntities.HOSTS, RoutingRulesEntities.METHODS, RoutingRulesEntities.SNIS].includes(entity)) {
    return [...originalData].filter((item: string) => !!item)
  } else if (entity === RoutingRulesEntities.SOURCES || entity === RoutingRulesEntities.DESTINATIONS) {
    return [...originalData]
      .filter((item: Sources | Destinations) => !!item.ip || !!item.port)
      .map((item: Sources | Destinations) => ({
        ip: item.ip || undefined,
        port: !item.port && item.port !== 0 ? undefined : item.port,
      }))
  } else if (entity === RoutingRulesEntities.HEADERS) {
    return [...originalData].filter((item: Headers) => !!item.header)
  }
}

const isProtocolSelected = (protocols: string[]): boolean => {
  return protocols.some(protocol => props.protocols.includes(protocol))
}

const getHeaders = (): Headers | null => {
  if (payloadFlavor.value !== RouteFlavor.TRADITIONAL) {
    return null
  }

  const traditionalFields = fields.value as TraditionalRouteRulesFields
  const compactHeaders: HeaderFields[] = cleanDataArr(RoutingRulesEntities.HEADERS, traditionalFields.headers || []) ||
    INITIAL_TRADITIONAL_ROUTE_RULES_VALUES[RoutingRulesEntities.HEADERS]
  if (compactHeaders.length === 0) {
    return null
  }

  return compactHeaders.reduce<Headers>((headers, compactHeader) => {
    headers[compactHeader.header] = compactHeader.values.split(',')
    return headers
  }, {})
}

const getMethodsPayload = computed(() => {
  const traditionalFields = fields.value as TraditionalRouteRulesFields

  const preDefinedMethods = (traditionalFields.methods || []).filter(method => Object.keys(Methods).includes(method))
  return preDefinedMethods.concat(customMethods.value.map(el => el.label.toUpperCase()))
})

const getArrPayload = (arr?: any[]) => arr?.length ? arr : null

const sharedPayload = computed(() => ({
  https_redirect_status_code: fields.value.https_redirect_status_code,
  strip_path: isProtocolSelected(['http', 'https', 'ws', 'wss']) ? fields.value.strip_path : false,
  preserve_host: fields.value.preserve_host,
  request_buffering: fields.value.request_buffering,
  response_buffering: fields.value.response_buffering,
}))

const payload = computed<TypedRouteRulesPayload | undefined>(() => {
  switch (payloadFlavor.value) {
    case RouteFlavor.TRADITIONAL: {
      const traditionalFields = fields.value as TraditionalRouteRulesFields
      const paths = getArrPayload(cleanDataArr(RoutingRulesEntities.PATHS, traditionalFields.paths || []))
      const hosts = getArrPayload(cleanDataArr(RoutingRulesEntities.HOSTS, traditionalFields.hosts || []))
      const payload: TraditionalRouteRulesPayload = {
        ...sharedPayload.value,
        methods: getArrPayload(cleanDataArr(RoutingRulesEntities.METHODS, getMethodsPayload.value)),
        hosts: configType.value === 'basic' && hosts ? hosts.slice(0, 1) : hosts,
        paths: configType.value === 'basic' && paths ? paths.slice(0, 1) : paths,
        headers: configType.value === 'basic' ? null : getHeaders(),
        regex_priority: Number(traditionalFields.regex_priority),
        path_handling: traditionalFields.path_handling,
        sources: getArrPayload(cleanDataArr(RoutingRulesEntities.SOURCES, traditionalFields.sources || [])),
        destinations: getArrPayload(cleanDataArr(RoutingRulesEntities.DESTINATIONS, traditionalFields.destinations || [])),
        snis: configType.value === 'basic' ? null : getArrPayload(cleanDataArr(RoutingRulesEntities.SNIS, traditionalFields.snis || [])),
      }

      return {
        type: payloadFlavor.value,
        payload,
      }
    }
    case RouteFlavor.EXPRESSIONS: {
      const expressionsFields = fields.value as ExpressionsRouteRulesFields

      return {
        type: payloadFlavor.value,
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

const onProtocolUpdate = (protocol: string | number | null) => {
  if (protocol) {
    emit('update:protocols', protocol as keyof typeof PROTOCOLS_TO_ROUTE_RULES)
  }
}

watch([() => props.recordFlavor, () => props.routeFlavors], ([newRecordFlavor, newRouteFlavors]) => {
  if (newRecordFlavor) {
    configFlavor.value = newRecordFlavor
    return
  }

  configFlavor.value = (!newRouteFlavors.traditional && newRouteFlavors.expressions)
    ? RouteFlavor.EXPRESSIONS
    : RouteFlavor.TRADITIONAL
}, { immediate: true, deep: true })

watch(configType, (newConfigType) => {
  if (newConfigType === 'basic') {
    configFlavor.value = RouteFlavor.TRADITIONAL
    emit('update:protocols', DEFAULT_PROTOCOL)
  }
})

watch(payload, (newPayload) => {
  emit('update:payload', newPayload)
}, { deep: true, immediate: true })
</script>

<style lang="scss" scoped>
.config-type-container {
  display: flex;
  gap: var(--kui-space-60, $kui-space-60);

  :deep(.radio-card-wrapper) {
    box-sizing: border-box;
  }
}

.config-flavor {
  .config-flavor-label {
    display: flex;
  }

  .config-flavor-control {
    display: inline-flex;
    width: auto;
  }
}
</style>
