<template>
  <KCard>
    <span class="traditional-rules-hint">
      <i18nT keypath="form.hint.rules_message">
        <template #protocol>
          <b>{{ protocolsLabels[protocols] }}</b>
        </template>
        <template #routingRules>
          <i18nT
            :keypath="hintMessageRoutingRules[1] ? 'form.hint.multiple_rules' : 'form.hint.single_rule'"
          >
            <template #routingRules>
              {{ hintMessageRoutingRules[0] }}
            </template>
            <template #lastRoutingRule>
              {{ hintMessageRoutingRules[1] }}
            </template>
          </i18nT>
        </template>
      </i18nT>
      <span v-if="configType === 'basic'">
        {{ t('form.hint.advanced') }}
      </span>
    </span>

    <!-- Routing Rules Fields -->
    <TransitionGroup name="appear">
      <!-- paths -->
      <PathRules
        v-if="fields.paths && protocolRuleNames.has(RoutingRulesEntities.PATHS)"
        key="paths-container"
        v-model="fields.paths"
        @add="addRule(RoutingRulesEntities.PATHS)"
        @remove="(index: number) => removeRule(RoutingRulesEntities.PATHS, index)"
      />

      <KCheckbox
        v-if="isProtocolSelected(['http', 'https', 'ws', 'wss'])"
        v-model="fields.strip_path"
        class="route-form-strip-path"
        data-testid="route-form-strip-path"
        :disabled="!fields.paths?.some(Boolean)"
        :label="t('form.fields.strip_path.label')"
        :label-attributes="{
          tooltipAttributes: { maxWidth: '320' },
        }"
      >
        <template #tooltip>
          <!-- eslint-disable-next-line vue/no-v-html -->
          <span v-html="t('form.fields.strip_path.tooltip')" />
        </template>
      </KCheckbox>

      <!-- methods -->
      <MethodRules
        v-if="fields.methods && protocolRuleNames.has(RoutingRulesEntities.METHODS)"
        key="methods-container"
        v-model:custom-methods="customMethods"
        v-model:methods="fields.methods"
      />

      <!-- hosts -->
      <HostRules
        v-if="fields.hosts && protocolRuleNames.has(RoutingRulesEntities.HOSTS)"
        key="hosts-container"
        v-model="fields.hosts"
        @add="addRule(RoutingRulesEntities.HOSTS)"
        @remove="(index: number) => removeRule(RoutingRulesEntities.HOSTS, index)"
      />

      <!-- headers -->
      <HeaderRules
        v-if="fields.headers && configType === 'advanced' && protocolRuleNames.has(RoutingRulesEntities.HEADERS)"
        key="headers-container"
        v-model="fields.headers"
        @add="addRule(RoutingRulesEntities.HEADERS)"
        @remove="(index: number) => removeRule(RoutingRulesEntities.HEADERS, index)"
      />

      <!-- sources -->
      <SourceRules
        v-if="fields.sources && protocolRuleNames.has(RoutingRulesEntities.SOURCES)"
        key="sources-container"
        v-model="fields.sources"
        @add="addRule(RoutingRulesEntities.SOURCES)"
        @remove="(index: number) => removeRule(RoutingRulesEntities.SOURCES, index)"
      />

      <!-- destinations -->
      <DestinationRules
        v-if="fields.destinations && protocolRuleNames.has(RoutingRulesEntities.DESTINATIONS)"
        key="destinations-container"
        v-model="fields.destinations"
        @add="addRule(RoutingRulesEntities.DESTINATIONS)"
        @remove="(index: number) => removeRule(RoutingRulesEntities.DESTINATIONS, index)"
      />

      <!-- snis -->
      <SniRules
        v-if="fields.snis && configType === 'advanced' && protocolRuleNames.has(RoutingRulesEntities.SNIS)"
        key="snis-container"
        v-model="fields.snis"
        @add="addRule(RoutingRulesEntities.SNIS)"
        @remove="(index: number) => removeRule(RoutingRulesEntities.SNIS, index)"
      />
    </TransitionGroup>

    <template
      v-if="!hideAdvanced"
    >
      <div class="route-form-fields-container route-form-advanced-fields-container">
        <KSelect
          v-if="fields.paths?.some(Boolean)"
          v-model="fields.path_handling"
          data-testid="route-form-path-handling"
          :items="PATH_HANDLING_OPTIONS"
          :label="t('form.fields.path_handling.label')"
          :label-attributes="{
            tooltipAttributes: { maxWidth: '320' },
          }"
          :readonly="readonly"
          width="100%"
        >
          <template #label-tooltip>
            <!-- eslint-disable-next-line vue/no-v-html -->
            <span v-html="t('form.fields.path_handling.tooltip')" />
          </template>
        </KSelect>
        <KSelect
          v-model="fields.https_redirect_status_code"
          data-testid="route-form-http-redirect-status-code"
          :items="HTTP_REDIRECT_STATUS_CODES"
          :label="t('form.fields.https_redirect_status_code.label')"
          :label-attributes="{
            tooltipAttributes: { maxWidth: '320' },
          }"
          :readonly="readonly"
          width="100%"
        >
          <template #label-tooltip>
            <!-- eslint-disable-next-line vue/no-v-html -->
            <span v-html="t('form.fields.https_redirect_status_code.tooltip')" />
          </template>
        </KSelect>
        <KInput
          v-model="fields.regex_priority"
          autocomplete="off"
          data-testid="route-form-regex-priority"
          :label="t('form.fields.regex_priority.label')"
          :label-attributes="{
            tooltipAttributes: { maxWidth: '320' },
          }"
          :readonly="readonly"
          type="number"
        >
          <template #label-tooltip>
            <!-- eslint-disable-next-line vue/no-v-html -->
            <span v-html="t('form.fields.regex_priority.tooltip')" />
          </template>
        </KInput>
        <KCheckbox
          v-model="fields.preserve_host"
          data-testid="route-form-preserve-host"
          :label="t('form.fields.preserve_host.label')"
          :label-attributes="{
            tooltipAttributes: { maxWidth: '320' },
          }"
        >
          <template #tooltip>
            <!-- eslint-disable-next-line vue/no-v-html -->
            <span v-html="t('form.fields.preserve_host.tooltip')" />
          </template>
        </KCheckbox>
        <KCheckbox
          v-model="fields.request_buffering"
          data-testid="route-form-request-buffering"
          :label="t('form.fields.request_buffering.label')"
          :label-attributes="{
            tooltipAttributes: { maxWidth: '320' },
          }"
        >
          <template #tooltip>
            <!-- eslint-disable-next-line vue/no-v-html -->
            <span v-html="t('form.fields.request_buffering.tooltip')" />
          </template>
        </KCheckbox>
        <KCheckbox
          v-model="fields.response_buffering"
          data-testid="route-form-response-buffering"
          :label="t('form.fields.response_buffering.label')"
          :label-attributes="{
            tooltipAttributes: { maxWidth: '320' },
          }"
        >
          <template #tooltip>
            <!-- eslint-disable-next-line vue/no-v-html -->
            <span v-html="t('form.fields.response_buffering.tooltip')" />
          </template>
        </KCheckbox>
      </div>
    </template>
  </KCard>
</template>

<script setup lang="ts">
import { computed, nextTick } from 'vue'
import composables from '../../composables'
import { HTTP_REDIRECT_STATUS_CODES, INITIAL_TRADITIONAL_ROUTE_RULES_VALUES, PATH_HANDLING_OPTIONS, PROTOCOLS_TO_ROUTE_RULES } from '../../constants'
import { RoutingRulesEntities, type SharedRouteRulesFields, type TraditionalRouteRulesFields } from '../../types'
import DestinationRules from './rules/DestinationRules.vue'
import HeaderRules from './rules/HeaderRules.vue'
import HostRules from './rules/HostRules.vue'
import MethodRules from './rules/MethodRules.vue'
import PathRules from './rules/PathRules.vue'
import SniRules from './rules/SniRules.vue'
import SourceRules from './rules/SourceRules.vue'

const { i18nT, i18n, i18n: { t } } = composables.useI18n()
const protocolsLabels = i18n.source.form.protocols as Record<string, string>

const props = defineProps<{
  protocols: keyof typeof PROTOCOLS_TO_ROUTE_RULES
  hideAdvanced?: boolean
  readonly?: boolean
  configType: 'basic' | 'advanced'
}>()

const fields = defineModel<SharedRouteRulesFields & TraditionalRouteRulesFields>('fields', { required: true })
const customMethods = defineModel<Array<{ label: string, value: string }>>('customMethods', { required: true })

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
    const items = fields.value[entity as RoutingRulesEntities]
    if (Array.isArray(items)) {
      items.splice(index, 1)
      if (items.length > 0) {
        return
      }
    }
  }

  await nextTick(() => {
    delete fields.value[entity as RoutingRulesEntities]
  })
}

const isProtocolSelected = (protocols: string[]): boolean => {
  return protocols.some(protocol => props.protocols.includes(protocol))
}

const protocolRuleNames = computed(() => new Set<string>(PROTOCOLS_TO_ROUTE_RULES[props.protocols]))

const hintMessageRoutingRules = computed((): string[] => {
  if (isProtocolSelected(['tls_passthrough'])) {
    return [getRoutingRuleLabel(RoutingRulesEntities.SNIS)]
  }

  const protocolEntitiesLabels = (
    props.configType === 'basic'
      ? [RoutingRulesEntities.PATHS, RoutingRulesEntities.METHODS, RoutingRulesEntities.HOSTS]
      : PROTOCOLS_TO_ROUTE_RULES[props.protocols]
  ).map(entity => getRoutingRuleLabel(entity))
  return [[...protocolEntitiesLabels].splice(0, protocolEntitiesLabels.length - 1).join(', '), protocolEntitiesLabels[protocolEntitiesLabels.length - 1]]
})

const getRoutingRuleLabel = (entity: string): string => {
  const formFields = i18n.source.form.fields as Record<string, any>

  return formFields[entity]?.singular || ''
}
</script>

<style lang="scss" scoped>
@use "../../styles/mixins" as *;

@include routing-rules;

.traditional-rules-hint {
  color: var(--kui-color-text-neutral-strong, $kui-color-text-neutral-strong);
  margin-bottom: var(--kui-space-80, $kui-space-80);

  span:not(:first-child) {
    margin-left: var(--kui-space-20, $kui-space-20);
  }
}

.route-form-strip-path {
  margin-top: var(--kui-space-80, $kui-space-80);
}
</style>
