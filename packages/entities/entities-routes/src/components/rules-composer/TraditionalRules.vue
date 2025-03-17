<template>
  <KCard>
    <template #title>
      <div class="route-form-routing-rules-title-container">
        <span
          v-for="protocol in parsedProtocols"
          :key="protocol"
          class="protocol-title"
        >
          {{ protocol.toUpperCase() }}
        </span>
        <span class="routing-rules-title">
          {{ i18n.t('form.sections.routingRules.title') }}
        </span>
      </div>
    </template>

    <template #default>
      <KAlert
        v-if="showRoutingRulesWarning"
        appearance="warning"
        data-testid="routing-rules-warning"
      >
        <template #default>
          <i18nT keypath="form.warning.rulesMessage">
            <template #protocol>
              <b>{{ protocolsLabels[protocols] }}</b>
            </template>
            <template #routingRules>
              <i18nT
                :keypath="warningMessageRoutingRules[1] ? 'form.warning.multipleRules' : 'form.warning.singleRule'"
              >
                <template #routingRules>
                  <b>{{ warningMessageRoutingRules[0] }}</b>
                </template>
                <template #lastRoutingRule>
                  <b>{{ warningMessageRoutingRules[1] }}</b>
                </template>
              </i18nT>
            </template>
          </i18nT>
        </template>
      </KAlert>

      <!-- Routing Rules Fields -->
      <TransitionGroup name="appear">
        <!-- paths -->
        <PathRules
          v-if="fields.paths"
          key="paths-container"
          v-model="fields.paths"
          @add="addRule(RoutingRulesEntities.PATHS)"
          @remove="(index: number) => removeRule(RoutingRulesEntities.PATHS, index)"
        />

        <!-- snis -->
        <SniRules
          v-if="fields.snis"
          key="snis-container"
          v-model="fields.snis"
          @add="addRule(RoutingRulesEntities.SNIS)"
          @remove="(index: number) => removeRule(RoutingRulesEntities.SNIS, index)"
        />

        <!-- hosts -->
        <HostRules
          v-if="fields.hosts"
          key="hosts-container"
          v-model="fields.hosts"
          @add="addRule(RoutingRulesEntities.HOSTS)"
          @remove="(index: number) => removeRule(RoutingRulesEntities.HOSTS, index)"
        />

        <!-- methods -->
        <MethodRules
          v-if="fields.methods"
          key="methods-container"
          v-model:custom-methods="customMethods"
          v-model:methods="fields.methods"
          @remove="removeRule(RoutingRulesEntities.METHODS)"
        />

        <!-- headers -->
        <HeaderRules
          v-if="fields.headers"
          key="headers-container"
          v-model="fields.headers"
          @add="addRule(RoutingRulesEntities.HEADERS)"
          @remove="(index: number) => removeRule(RoutingRulesEntities.HEADERS, index)"
        />

        <!-- sources -->
        <SourceRules
          v-if="fields.sources"
          key="sources-container"
          v-model="fields.sources"
          @add="addRule(RoutingRulesEntities.SOURCES)"
          @remove="(index: number) => removeRule(RoutingRulesEntities.SOURCES, index)"
        />

        <!-- destinations -->
        <DestinationRules
          v-if="fields.destinations"
          key="destinations-container"
          v-model="fields.destinations"
          @add="addRule(RoutingRulesEntities.DESTINATIONS)"
          @remove="(index: number) => removeRule(RoutingRulesEntities.DESTINATIONS, index)"
        />
      </TransitionGroup>

      <!-- routing rules selector  -->
      <div
        v-if="showRuleSelector"
        class="route-form-routing-rules-selector-container"
      >
        <hr>
        <div class="route-form-routing-rules-selector-options">
          <ul>
            <li
              v-for="entity in PROTOCOLS_TO_ROUTE_RULES[protocols]"
              :key="entity"
            >
              <label
                :aria-disabled="!!fields[entity as RoutingRuleEntity]"
                class="option"
                :class="{ 'is-selected': fields[entity as RoutingRuleEntity] }"
                :data-testid="`routing-rule-${entity}`"
                role="button"
                @click="addRule(entity)"
              >
                {{ getRoutingRuleLabel(entity) }}
              </label>
            </li>
          </ul>
        </div>
      </div>
    </template>
  </KCard>

  <!-- Traditional Route Advanced Fields -->
  <KCollapse
    v-if="!hideAdvanced"
    v-model="isAdvancedFieldsCollapsed"
    class="route-form-advanced-fields-collapse"
    trigger-alignment="leading"
    :trigger-label="i18n.t('form.viewAdvancedFields')"
  >
    <div class="route-form-fields-container route-form-advanced-fields-container">
      <KSelect
        v-if="fields.paths"
        v-model="fields.path_handling"
        data-testid="route-form-path-handling"
        :items="PATH_HANDLING_OPTIONS"
        :label="i18n.t('form.fields.path_handling.label')"
        :label-attributes="{
          info: i18n.t('form.fields.path_handling.tooltip'),
          tooltipAttributes: { maxWidth: '400' },
        }"
        :readonly="readonly"
        width="100%"
      />
      <KSelect
        v-model="fields.https_redirect_status_code"
        data-testid="route-form-http-redirect-status-code"
        :items="HTTP_REDIRECT_STATUS_CODES"
        :label="i18n.t('form.fields.https_redirect_status_code.label')"
        :readonly="readonly"
        width="100%"
      />
      <KInput
        v-model="fields.regex_priority"
        autocomplete="off"
        data-testid="route-form-regex-priority"
        :label="i18n.t('form.fields.regex_priority.label')"
        :readonly="readonly"
        type="number"
      />
      <KCheckbox
        v-if="isProtocolSelected(['http', 'https', 'ws', 'wss', 'tls', 'tcp', 'udp', 'tls_passthrough'])"
        v-model="fields.strip_path"
        data-testid="route-form-strip-path"
        :label="i18n.t('form.fields.strip_path.label')"
      />
      <KCheckbox
        v-model="fields.preserve_host"
        data-testid="route-form-preserve-host"
        :label="i18n.t('form.fields.preserve_host.label')"
      />
      <KCheckbox
        v-model="fields.request_buffering"
        data-testid="route-form-request-buffering"
        :label="i18n.t('form.fields.request_buffering.label')"
      />
      <KCheckbox
        v-model="fields.response_buffering"
        data-testid="route-form-response-buffering"
        :label="i18n.t('form.fields.response_buffering.label')"
      />
    </div>
  </KCollapse>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import composables from '../../composables'
import { HTTP_REDIRECT_STATUS_CODES, INITIAL_TRADITIONAL_ROUTE_RULES_VALUES, PATH_HANDLING_OPTIONS, PROTOCOLS_TO_ROUTE_RULES } from '../../constants'
import { RoutingRulesEntities, type RoutingRuleEntity, type SharedRouteRulesFields, type TraditionalRouteRulesFields } from '../../types'
import DestinationRules from './rules/DestinationRules.vue'
import HeaderRules from './rules/HeaderRules.vue'
import HostRules from './rules/HostRules.vue'
import MethodRules from './rules/MethodRules.vue'
import PathRules from './rules/PathRules.vue'
import SniRules from './rules/SniRules.vue'
import SourceRules from './rules/SourceRules.vue'

const { i18nT, i18n } = composables.useI18n()
const protocolsLabels = i18n.source.form.protocols as Record<string, string>

const props = defineProps<{
  protocols: keyof typeof PROTOCOLS_TO_ROUTE_RULES
  hideAdvanced?: boolean
  readonly?: boolean
}>()

const fields = defineModel<SharedRouteRulesFields & TraditionalRouteRulesFields>('fields', { required: true })
const customMethods = defineModel<string[]>('customMethods', { required: true })

const isAdvancedFieldsCollapsed = ref<boolean>(true)

const parsedProtocols = computed((): string[] => props.protocols.split(',') || [])

const addRule = (ruleEntity: string): void => {
  switch (ruleEntity) {
    case RoutingRulesEntities.PATHS:
      if (Array.isArray(fields.value.paths)) {
        fields.value.paths.push([...INITIAL_TRADITIONAL_ROUTE_RULES_VALUES[RoutingRulesEntities.PATHS]][0])
      } else {
        fields.value.paths = [...INITIAL_TRADITIONAL_ROUTE_RULES_VALUES[RoutingRulesEntities.PATHS]]
      }
      break
    case RoutingRulesEntities.SNIS:
      if (Array.isArray(fields.value.snis)) {
        fields.value.snis.push([...INITIAL_TRADITIONAL_ROUTE_RULES_VALUES[RoutingRulesEntities.SNIS]][0])
      } else {
        fields.value.snis = [...INITIAL_TRADITIONAL_ROUTE_RULES_VALUES[RoutingRulesEntities.SNIS]]
      }
      break
    case RoutingRulesEntities.HOSTS:
      if (Array.isArray(fields.value.hosts)) {
        fields.value.hosts.push([...INITIAL_TRADITIONAL_ROUTE_RULES_VALUES[RoutingRulesEntities.HOSTS]][0])
      } else {
        fields.value.hosts = [...INITIAL_TRADITIONAL_ROUTE_RULES_VALUES[RoutingRulesEntities.HOSTS]]
      }
      break
    case RoutingRulesEntities.METHODS:
      if (!fields.value.methods) {
        fields.value.methods = { ...INITIAL_TRADITIONAL_ROUTE_RULES_VALUES[RoutingRulesEntities.METHODS] }
      }
      break
    case RoutingRulesEntities.HEADERS:
      if (Array.isArray(fields.value.headers)) {
        fields.value.headers.push({ ...INITIAL_TRADITIONAL_ROUTE_RULES_VALUES[RoutingRulesEntities.HEADERS][0] })
      } else {
        fields.value.headers = [{ ...INITIAL_TRADITIONAL_ROUTE_RULES_VALUES[RoutingRulesEntities.HEADERS][0] }]
      }
      break
    case RoutingRulesEntities.SOURCES:
      if (Array.isArray(fields.value.sources)) {
        fields.value.sources.push({ ...INITIAL_TRADITIONAL_ROUTE_RULES_VALUES[RoutingRulesEntities.SOURCES][0] })
      } else {
        fields.value.sources = [{ ...INITIAL_TRADITIONAL_ROUTE_RULES_VALUES[RoutingRulesEntities.SOURCES][0] }]
      }
      break
    case RoutingRulesEntities.DESTINATIONS:
      if (Array.isArray(fields.value.destinations)) {
        fields.value.destinations.push({ ...INITIAL_TRADITIONAL_ROUTE_RULES_VALUES[RoutingRulesEntities.DESTINATIONS][0] })
      } else {
        fields.value.destinations = [{ ...INITIAL_TRADITIONAL_ROUTE_RULES_VALUES[RoutingRulesEntities.DESTINATIONS][0] }]
      }
      break
    default:
      break
  }
}

// removes rule entity from the form
// or particular entry from particular rule entity if index is provided
const removeRule = async (entity: string, index?: number): Promise<void> => {
  if (typeof index !== 'undefined') {
    const items = fields.value[entity as RoutingRuleEntity]
    if (Array.isArray(items)) {
      items.splice(index, 1)
      if (items.length > 0) {
        return
      }
    }
  }

  await nextTick(() => {
    delete fields.value[entity as RoutingRuleEntity]

    if (entity === RoutingRulesEntities.METHODS) {
      customMethods.value = ['']
    }
  })
}

const isProtocolSelected = (protocols: string[]): boolean => {
  return protocols.some(protocol => props.protocols.includes(protocol))
}

const showRoutingRulesWarning = computed((): boolean => {
  const ruleKeys = Object.keys(INITIAL_TRADITIONAL_ROUTE_RULES_VALUES)
  return !Object.keys(fields.value).some(ruleKey => ruleKeys.includes(ruleKey))
})

const warningMessageRoutingRules = computed((): string[] => {
  if (isProtocolSelected(['tls_passthrough'])) {
    return [getRoutingRuleLabel(RoutingRulesEntities.SNIS)]
  }

  const protocolEntitiesLabels = PROTOCOLS_TO_ROUTE_RULES[props.protocols].map(entity => getRoutingRuleLabel(entity))
  return [[...protocolEntitiesLabels].splice(0, protocolEntitiesLabels.length - 1).join(', '), protocolEntitiesLabels[protocolEntitiesLabels.length - 1]]
})

// display or hide routing rules selector
const showRuleSelector = computed(() => PROTOCOLS_TO_ROUTE_RULES[props.protocols]?.filter(protocol => !fields.value[protocol as RoutingRuleEntity]))

const getRoutingRuleLabel = (entity: string): string => {
  const formFields = i18n.source.form.fields as Record<string, any>

  return formFields[entity]?.label || ''
}

// removes objects for routing rules that are not configurable for the chosen protocols
const sanitizeRoutingRulesEntities = (protocols: keyof typeof PROTOCOLS_TO_ROUTE_RULES) => {
  const allRuleNames = new Set(Object.keys(INITIAL_TRADITIONAL_ROUTE_RULES_VALUES))
  const protocolRuleNames = new Set<string>(PROTOCOLS_TO_ROUTE_RULES[protocols])

  for (const name of Object.keys(fields.value)) {
    if (allRuleNames.has(name) && !protocolRuleNames.has(name)) {
      removeRule(name)
    }
  }
}

watch(() => props.protocols, (protocols) => {
  sanitizeRoutingRulesEntities(protocols)
}, { immediate: true })
</script>

<style lang="scss" scoped>
@use "../../styles/mixins" as *;

@include routing-rules;
</style>
