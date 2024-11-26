<template>
  <div class="kong-ui-entities-route-form">
    <EntityBaseForm
      :can-submit="isFormValid && changesExist"
      :config="config"
      :edit-id="routeId"
      :entity-type="SupportedEntityType.Route"
      :error-message="state.errorMessage || fetchServicesErrorMessage"
      :fetch-url="fetchUrl"
      :form-fields="getPayload"
      :is-readonly="state.isReadonly"
      @cancel="cancelHandler"
      @fetch:error="fetchErrorHandler"
      @fetch:success="updateFormValues"
      @loading="loadingHandler"
      @submit="saveFormData"
    >
      <EntityFormSection
        v-if="showGeneralInfoSection"
        :description="t('form.sections.general.description')"
        :hide-info-header="hideSectionsInfo"
        :title="t('form.sections.general.title')"
      >
        <KInput
          v-if="!hideNameField"
          v-model.trim="state.fields.name"
          autocomplete="off"
          data-testid="route-form-name"
          :label="t('form.fields.name.label')"
          :placeholder="t('form.fields.name.placeholder')"
          :readonly="state.isReadonly"
          type="text"
        />
        <div v-if="hideServiceField ? false : !serviceId">
          <KSelect
            v-model="state.fields.service_id"
            clearable
            data-testid="route-form-service-id"
            enable-filtering
            :filter-function="() => true"
            :items="availableServices"
            :label="t('form.fields.service_id.label')"
            :loading="loadingServices"
            :placeholder="t('form.fields.service_id.placeholder')"
            :readonly="state.isReadonly"
            reuse-item-template
            width="100%"
            @query-change="debouncedServicesQuery"
          >
            <template #loading>
              <div>{{ t('actions.loading') }}</div>
            </template>
            <template #empty>
              <div data-testid="no-search-results">
                {{ t('search.no_results') }}
              </div>
            </template>
            <template #selected-item-template="{ item }">
              {{ getSelectedService(item) }}
            </template>
            <template #item-template="{ item }">
              <div class="route-form-service-dropdown-item">
                <span class="select-item-label">{{ item.name }}</span>
                <span class="select-item-description">{{ item.value }}</span>
              </div>
            </template>
          </KSelect>
        </div>
        <KInput
          v-if="!showTagsFiledUnderAdvanced"
          v-model.trim="state.fields.tags"
          autocomplete="off"
          data-testid="route-form-tags"
          :help="t('form.fields.tags.help')"
          :label="t('form.fields.tags.label')"
          :placeholder="t('form.fields.tags.placeholder')"
          :readonly="state.isReadonly"
          type="text"
        />
      </EntityFormSection>

      <EntityFormSection
        :description="t('form.sections.config.description')"
        :hide-info-header="hideSectionsInfo"
        :title="t('form.sections.config.title')"
      >
        <KSelect
          v-model="state.fields.protocols"
          data-testid="route-form-protocols"
          :items="protocols"
          :label="t('form.fields.protocols.label')"
          :label-attributes="{
            info: t('form.fields.protocols.tooltip'),
            tooltipAttributes: { maxWidth: '400' },
          }"
          :readonly="state.isReadonly"
          required
          width="100%"
        />

        <RouteFormConfigTabs
          v-model="currentConfigHash"
          :route-flavors="routeFlavors"
          :tooltips="configTabTooltips"
        >
          <template
            v-if="routeFlavors.traditional && routeFlavors.expressions && (!recordFlavor || recordFlavor !== currentConfigTab)"
            #before-content
          >
            <KAlert
              :appearance="!recordFlavor ? 'info' : 'warning'"
              class="route-form-config-type-immutable-alert"
              data-testid="route-config-type-immutable-alert"
            >
              <template #default>
                <template v-if="!recordFlavor">
                  {{ t('form.warning.cannotChangeFlavor.create') }}
                </template>
                <template v-else-if="recordFlavor !== currentConfigTab">
                  {{ t('form.warning.cannotChangeFlavor.edit', { format: t(`form.flavors.${recordFlavor}`) }) }}
                </template>
              </template>
            </KAlert>
          </template>

          <!-- Traditional Route -->
          <template
            v-if="stateHasTraditionalFlavor(state)"
            #traditional
          >
            <template v-if="!recordFlavor || recordFlavor === RouteFlavor.TRADITIONAL">
              <KCard v-if="state.fields.protocols">
                <template #title>
                  <div class="route-form-routing-rules-title-container">
                    <span
                      v-for="protocol in protocolsArr"
                      :key="protocol"
                      class="protocol-title"
                    >
                      {{ protocol.toUpperCase() }}
                    </span>
                    <span class="routing-rules-title">
                      {{ t('form.sections.routingRules.title') }}
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
                          <b>{{ protocolsLabels[state.fields.protocols] }}</b>
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
                    <RouteFormPathsFields
                      v-if="state.fields.paths"
                      key="paths-container"
                      v-model="state.fields.paths"
                      @add="handleAddRoutingRuleEntity(RoutingRulesEntities.PATHS)"
                      @remove="(index: number) => handleRemoveRoutingRuleEntity(RoutingRulesEntities.PATHS, index)"
                    />

                    <!-- snis -->
                    <RouteFormSnisFields
                      v-if="state.fields.snis"
                      key="snis-container"
                      v-model="state.fields.snis"
                      @add="handleAddRoutingRuleEntity(RoutingRulesEntities.SNIS)"
                      @remove="(index: number) => handleRemoveRoutingRuleEntity(RoutingRulesEntities.SNIS, index)"
                    />

                    <!-- hosts -->
                    <RouteFormHostsFields
                      v-if="state.fields.hosts"
                      key="hosts-container"
                      v-model="state.fields.hosts"
                      @add="handleAddRoutingRuleEntity(RoutingRulesEntities.HOSTS)"
                      @remove="(index: number) => handleRemoveRoutingRuleEntity(RoutingRulesEntities.HOSTS, index)"
                    />

                    <!-- methods -->
                    <RouteFormMethodsFields
                      v-if="state.fields.methods"
                      key="methods-container"
                      v-model="state.fields.methods"
                      :custom-methods="customMethods"
                      @remove="handleRemoveRoutingRuleEntity(RoutingRulesEntities.METHODS)"
                      @update-custom-methods="(methods: string[]) => customMethods = methods"
                    />

                    <!-- headers -->
                    <RouteFormHeadersFields
                      v-if="state.fields.headers"
                      key="headers-container"
                      v-model="state.fields.headers"
                      @add="handleAddRoutingRuleEntity(RoutingRulesEntities.HEADERS)"
                      @remove="(index: number) => handleRemoveRoutingRuleEntity(RoutingRulesEntities.HEADERS, index)"
                    />

                    <!-- sources -->
                    <RouteFormSourcesFields
                      v-if="state.fields.sources"
                      key="sources-container"
                      v-model="state.fields.sources"
                      @add="handleAddRoutingRuleEntity(RoutingRulesEntities.SOURCES)"
                      @remove="(index: number) => handleRemoveRoutingRuleEntity(RoutingRulesEntities.SOURCES, index)"
                    />

                    <!-- destinations -->
                    <RouteFormDestinationsFields
                      v-if="state.fields.destinations"
                      key="destinations-container"
                      v-model="state.fields.destinations"
                      @add="handleAddRoutingRuleEntity(RoutingRulesEntities.DESTINATIONS)"
                      @remove="(index: number) => handleRemoveRoutingRuleEntity(RoutingRulesEntities.DESTINATIONS, index)"
                    />
                  </TransitionGroup>

                  <!-- routing rules selector  -->
                  <div
                    v-if="displayRoutingRulesSelector"
                    class="route-form-routing-rules-selector-container"
                  >
                    <hr>
                    <div class="route-form-routing-rules-selector-options">
                      <ul>
                        <li
                          v-for="entity in routingRulesPerProtocolMap[state.fields.protocols]"
                          :key="entity"
                        >
                          <label
                            :aria-disabled="!!state.fields[entity as RoutingRuleEntity]"
                            class="option"
                            :class="{ 'is-selected': state.fields[entity as RoutingRuleEntity] }"
                            :data-testid="`routing-rule-${entity}`"
                            role="button"
                            @click="handleAddRoutingRuleEntity(entity)"
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
                v-model="isAdvancedFieldsCollapsed"
                class="route-form-advanced-fields-collapse"
                trigger-alignment="leading"
                :trigger-label="t('form.viewAdvancedFields')"
              >
                <div class="route-form-fields-container route-form-advanced-fields-container">
                  <KSelect
                    v-if="state.fields.paths"
                    v-model="state.fields.path_handling"
                    data-testid="route-form-path-handling"
                    :items="pathHandlingOptions"
                    :label="t('form.fields.path_handling.label')"
                    :label-attributes="{
                      info: t('form.fields.path_handling.tooltip'),
                      tooltipAttributes: { maxWidth: '400' },
                    }"
                    :readonly="state.isReadonly"
                    width="100%"
                  />
                  <KSelect
                    v-model="state.fields.https_redirect_status_code"
                    data-testid="route-form-http-redirect-status-code"
                    :items="httpsRedirectStatusCodes"
                    :label="t('form.fields.https_redirect_status_code.label')"
                    :readonly="state.isReadonly"
                    width="100%"
                  />
                  <KInput
                    v-model="state.fields.regex_priority"
                    autocomplete="off"
                    data-testid="route-form-regex-priority"
                    :label="t('form.fields.regex_priority.label')"
                    :readonly="state.isReadonly"
                    type="number"
                  />
                  <KInput
                    v-if="showTagsFiledUnderAdvanced"
                    v-model.trim="state.fields.tags"
                    autocomplete="off"
                    data-testid="route-form-tags"
                    :help="t('form.fields.tags.help')"
                    :label="t('form.fields.tags.label')"
                    :placeholder="t('form.fields.tags.placeholder')"
                    :readonly="state.isReadonly"
                    type="text"
                  />
                  <KCheckbox
                    v-if="isProtocolSelected(['http', 'https', 'ws', 'wss', 'tls', 'tcp', 'udp', 'tls_passthrough'])"
                    v-model="state.fields.strip_path"
                    data-testid="route-form-strip-path"
                    :label="t('form.fields.strip_path.label')"
                  />
                  <KCheckbox
                    v-model="state.fields.preserve_host"
                    data-testid="route-form-preserve-host"
                    :label="t('form.fields.preserve_host.label')"
                  />
                  <KCheckbox
                    v-model="state.fields.request_buffering"
                    data-testid="route-form-request-buffering"
                    :label="t('form.fields.request_buffering.label')"
                  />
                  <KCheckbox
                    v-model="state.fields.response_buffering"
                    data-testid="route-form-response-buffering"
                    :label="t('form.fields.response_buffering.label')"
                  />
                </div>
              </KCollapse>
            </template>
          </template>

          <template
            v-if="stateHasExpressionsFlavor(state)"
            #expressions
          >
            <template v-if="!recordFlavor || recordFlavor === RouteFlavor.EXPRESSIONS">
              <KCard v-if="state.fields.protocols">
                <template #title>
                  <div class="route-form-routing-rules-title-container">
                    <span
                      v-for="protocol in protocolsArr"
                      :key="protocol"
                      class="protocol-title"
                    >
                      {{ protocol.toUpperCase() }}
                    </span>
                    <span class="routing-rules-title">
                      {{ t('form.sections.routingExpression.title') }}
                    </span>
                  </div>
                </template>

                <RouteFormExpressionsEditorLoader
                  v-model="state.fields.expression"
                  :protocol="exprEditorProtocol"
                  :show-expressions-modal-entry="showExpressionsModalEntry"
                  @notify="emit('notify', $event)"
                >
                  <template #after-editor="editor">
                    <slot
                      :expression="editor.expression"
                      name="after-expressions-editor"
                      :state="editor.state"
                    />
                  </template>
                </RouteFormExpressionsEditorLoader>
              </KCard>

              <!-- Expressions Route Advanced Fields -->
              <KCollapse
                v-model="isAdvancedFieldsCollapsed"
                class="route-form-advanced-fields-collapse"
                trigger-alignment="leading"
                :trigger-label="t('form.viewAdvancedFields')"
              >
                <div class="route-form-fields-container route-form-advanced-fields-container">
                  <KSelect
                    v-model="state.fields.https_redirect_status_code"
                    data-testid="route-form-http-redirect-status-code"
                    :items="httpsRedirectStatusCodes"
                    :label="t('form.fields.https_redirect_status_code.label')"
                    :readonly="state.isReadonly"
                    width="100%"
                  />
                  <KInput
                    v-model="state.fields.priority"
                    autocomplete="off"
                    data-testid="route-form-priority"
                    :label="t('form.fields.priority.label')"
                    :label-attributes="{
                      info: t('form.fields.priority.tooltip'),
                      tooltipAttributes: { maxWidth: '400' },
                    }"
                    :readonly="state.isReadonly"
                    type="number"
                  />
                  <KInput
                    v-if="showTagsFiledUnderAdvanced"
                    v-model.trim="state.fields.tags"
                    autocomplete="off"
                    data-testid="route-form-tags"
                    :help="t('form.fields.tags.help')"
                    :label="t('form.fields.tags.label')"
                    :placeholder="t('form.fields.tags.placeholder')"
                    :readonly="state.isReadonly"
                    type="text"
                  />
                  <KCheckbox
                    v-if="isProtocolSelected(['http', 'https', 'ws', 'wss', 'tls', 'tcp', 'udp', 'tls_passthrough'])"
                    v-model="state.fields.strip_path"
                    data-testid="route-form-strip-path"
                    :label="t('form.fields.strip_path.label')"
                  />
                  <KCheckbox
                    v-model="state.fields.preserve_host"
                    data-testid="route-form-preserve-host"
                    :label="t('form.fields.preserve_host.label')"
                  />
                  <KCheckbox
                    v-model="state.fields.request_buffering"
                    data-testid="route-form-request-buffering"
                    :label="t('form.fields.request_buffering.label')"
                  />
                  <KCheckbox
                    v-model="state.fields.response_buffering"
                    data-testid="route-form-response-buffering"
                    :label="t('form.fields.response_buffering.label')"
                  />
                </div>
              </KCollapse>
            </template>
          </template>
        </RouteFormConfigTabs>
      </EntityFormSection>

      <template #form-actions>
        <slot
          :can-submit="isFormValid && changesExist"
          :cancel="cancelHandler"
          name="form-actions"
          :submit="saveFormData"
        />
      </template>
    </EntityBaseForm>
  </div>
</template>

<script lang="ts" setup>
import {
  EntityBaseForm,
  EntityBaseFormType,
  EntityFormSection,
  SupportedEntityType,
  useAxios,
  useDebouncedFilter,
  useErrors,
  useGatewayFeatureSupported,
} from '@kong-ui-public/entities-shared'
import type { SelectItem } from '@kong/kongponents'
import type { AxiosError, AxiosResponse } from 'axios'
import isEqual from 'lodash.isequal'
import type { PropType } from 'vue'
import { computed, nextTick, onBeforeMount, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import composables from '../composables'
import endpoints from '../routes-endpoints'
import type {
  BaseRoutePayload,
  BaseRouteStateFields,
  Destinations,
  ExpressionsRoutePayload,
  ExpressionsRouteStateFields,
  HeaderFields,
  Headers,
  KongManagerRouteFormConfig,
  KonnectRouteFormConfig,
  Method,
  MethodsFields,
  Protocol,
  RouteFlavors,
  RouteState,
  RoutingRuleEntity,
  Sources,
  TraditionalRoutePayload,
  TraditionalRouteStateFields,
} from '../types'
import {
  RouteFlavor,
  RoutingRulesEntities,
  stateHasExpressionsFlavor,
  stateHasTraditionalFlavor,
} from '../types'
import RouteFormDestinationsFields from './RouteFormDestinationsFields.vue'
import RouteFormHeadersFields from './RouteFormHeadersFields.vue'
import RouteFormHostsFields from './RouteFormHostsFields.vue'
import RouteFormMethodsFields from './RouteFormMethodsFields.vue'
import RouteFormPathsFields from './RouteFormPathsFields.vue'
import RouteFormSnisFields from './RouteFormSnisFields.vue'
import RouteFormSourcesFields from './RouteFormSourcesFields.vue'

import '@kong-ui-public/entities-shared/dist/style.css'
import RouteFormConfigTabs from './RouteFormConfigTabs.vue'
import RouteFormExpressionsEditorLoader from './RouteFormExpressionsEditorLoader.vue'

// Component props - This structure must exist in ALL entity components, with the exclusion of unneeded action props (e.g. if you don't need `canDelete`, just exclude it)
const props = defineProps({
  /** The base konnect or kongManger config. Pass additional config props in the shared entity component as needed. */
  config: {
    type: Object as PropType<KonnectRouteFormConfig | KongManagerRouteFormConfig>,
    required: true,
    validator: (config: KonnectRouteFormConfig | KongManagerRouteFormConfig): boolean => {
      if (!config || !['konnect', 'kongManager'].includes(config?.app)) return false
      if (config?.app === 'konnect' && !config?.controlPlaneId) return false
      if (config?.app === 'kongManager' && typeof config?.workspace !== 'string') return false
      if (!config?.cancelRoute) return false
      return true
    },
  },
  /** If a valid routeId is provided, it will put the form in Edit mode instead of Create */
  routeId: {
    type: String,
    required: false,
    default: '',
  },
  /** If valid serviceId is provided, don't show service select field */
  serviceId: {
    type: String,
    required: false,
    default: '',
  },
  /** Whether show or hide EntityFormSection info column */
  hideSectionsInfo: {
    type: Boolean,
    required: false,
    default: false,
  },
  /** Whether show or hide Route name field */
  hideNameField: {
    type: Boolean,
    required: false,
    default: false,
  },
  /** Whether show or hide Service Select field */
  hideServiceField: {
    type: Boolean,
    required: false,
    default: false,
  },
  /** Show tags field under advance fields */
  showTagsFiledUnderAdvanced: {
    type: Boolean,
    required: false,
    default: false,
  },
  /** Route flavors to be enabled for this form */
  routeFlavors: {
    type: Object as PropType<RouteFlavors>,
    required: false,
    default: () => ({
      traditional: true,
    }),
  },
  /** Tooltips to show on config tabs */
  configTabTooltips: {
    type: Object as PropType<{
      [RouteFlavor.TRADITIONAL]?: string,
      [RouteFlavor.EXPRESSIONS]?: string,
    } | undefined>,
    required: false,
    default: () => undefined,
  },
  /** Whether to show the expressions modal entry */
  showExpressionsModalEntry: {
    type: Boolean,
    required: false,
    default: false,
  },
})

const emit = defineEmits<{
  (e: 'update', data: BaseRoutePayload): void,
  (e: 'error', error: AxiosError): void,
  (e: 'loading', isLoading: boolean): void,
  (e: 'model-updated', val: BaseRoutePayload): void,
  (e: 'notify', options: { message: string, type: string }): void,
}>()

const currentConfigHash = ref<string>(
  props.routeFlavors.traditional
    ? `#${RouteFlavor.TRADITIONAL}`
    : props.routeFlavors.expressions
      ? `#${RouteFlavor.EXPRESSIONS}`
      : '')

const currentConfigTab = computed<RouteFlavor | undefined>(() => {
  if (currentConfigHash.value) {
    return currentConfigHash.value.substring(1) as RouteFlavor
  }

  return undefined
})

const recordFlavor = ref<RouteFlavor | undefined>(undefined)
const isAdvancedFieldsCollapsed = ref<boolean>(true)

const payloadFlavor = computed<RouteFlavor | undefined>(() => {
  if (recordFlavor.value) {
    return recordFlavor.value
  }

  if (currentConfigTab.value) {
    return currentConfigTab.value as RouteFlavor
  }

  if (props.routeFlavors.traditional) {
    return RouteFlavor.TRADITIONAL
  } else if (props.routeFlavors.expressions) {
    return RouteFlavor.EXPRESSIONS
  }

  return undefined
})

const { i18nT, i18n, i18n: { t } } = composables.useI18n()
const protocolsLabels = i18n.source.form.protocols as Record<string, string>
const router = useRouter()
const { axiosInstance } = useAxios(props.config?.axiosRequestConfig)
const { getMessageFromError } = useErrors()

const showGeneralInfoSection = computed<boolean>(() => !(props.hideNameField && (props.hideServiceField || !!props.serviceId) && props.showTagsFiledUnderAdvanced))

const getSelectedService = (item: any) => {
  return item.name ? `${item.name} - ${item.value}` : item.value
}

/** Declare as BaseRouteStateFields but use type narrowing helper functions to allow accessing more fields */
const state = reactive<RouteState<BaseRouteStateFields>>({
  routeFlavors: props.routeFlavors,
  fields: {
    name: '',
    protocols: 'http,https',
    https_redirect_status_code: 426,
    strip_path: true,
    preserve_host: false,
    request_buffering: true,
    response_buffering: true,
    tags: '',
    service_id: '',
    ...{
      ...(!props.routeId && { paths: [''] }), // We don't expect this prop to be updated throughout the lifecycle of the component
      regex_priority: 0,
      path_handling: 'v0',
    } as TraditionalRouteStateFields,
    ...{
      expression: '',
      priority: 0,
    } as ExpressionsRouteStateFields,
  },
  isReadonly: false,
  errorMessage: '',
})

watch(() => props.routeFlavors, (routeFlavors) => {
  state.routeFlavors = routeFlavors
})

const exprEditorProtocol = computed(() => state.fields.protocols.split(',')[0])

const customMethods = ref<string[]>([''])

const originalFields = reactive<BaseRouteStateFields>({
  name: '',
  protocols: 'http,https',
  https_redirect_status_code: 426,
  strip_path: true,
  preserve_host: false,
  request_buffering: true,
  response_buffering: true,
  tags: '',
  service_id: '',
  ...{
    path_handling: 'v0',
    regex_priority: 0,
  } as TraditionalRouteStateFields,
  ...{
    expression: '',
    priority: 0,
  } as ExpressionsRouteStateFields,
})

const initialRoutingRulesValues = {
  [RoutingRulesEntities.PATHS]: [''] as string[],
  [RoutingRulesEntities.SNIS]: [''] as string[],
  [RoutingRulesEntities.HOSTS]: [''] as string[],
  [RoutingRulesEntities.METHODS]: {
    GET: false,
    PUT: false,
    POST: false,
    PATCH: false,
    DELETE: false,
    OPTIONS: false,
    HEAD: false,
    CONNECT: false,
    TRACE: false,
    CUSTOM: false,
  } as MethodsFields,
  [RoutingRulesEntities.HEADERS]: [{ header: '', values: '' }] as HeaderFields[],
  [RoutingRulesEntities.SOURCES]: [{ ip: '', port: null }] as unknown as Sources[],
  [RoutingRulesEntities.DESTINATIONS]: [{ ip: '', port: null }] as unknown as Destinations[],
}

const isWsSupported = props.config.app === 'konnect' || useGatewayFeatureSupported({
  gatewayInfo: props.config.gatewayInfo,
  // 'ws' and 'wss' are not valid values for the protocol field in Gateway Community Edition or before Gateway Enterprise Edition 3.0
  supportedRange: {
    enterprise: ['3.0'],
  },
})

const protocols = [
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
    isWsSupported
      ? [
        { label: t('form.protocols.ws'), value: 'ws' },
        { label: t('form.protocols.wss'), value: 'wss' },
        { label: t('form.protocols.ws,wss'), value: 'ws,wss' },
      ]
      : []
  ),
]

const pathHandlingOptions = [
  { label: 'v0', value: 'v0' },
  { label: 'v1', value: 'v1' },
]

const httpsRedirectStatusCodes = [
  { label: '426', value: 426 },
  { label: '301', value: 301 },
  { label: '302', value: 302 },
  { label: '307', value: 307 },
  { label: '308', value: 308 },
]

const routingRulesPerProtocolMap: Record<string, string[]> = {
  http: [RoutingRulesEntities.HOSTS, RoutingRulesEntities.METHODS, RoutingRulesEntities.PATHS, RoutingRulesEntities.HEADERS],
  https: [RoutingRulesEntities.HOSTS, RoutingRulesEntities.METHODS, RoutingRulesEntities.PATHS, RoutingRulesEntities.HEADERS, RoutingRulesEntities.SNIS],
  'http,https': [RoutingRulesEntities.HOSTS, RoutingRulesEntities.METHODS, RoutingRulesEntities.PATHS, RoutingRulesEntities.HEADERS, RoutingRulesEntities.SNIS],
  'https,http': [RoutingRulesEntities.HOSTS, RoutingRulesEntities.METHODS, RoutingRulesEntities.PATHS, RoutingRulesEntities.HEADERS, RoutingRulesEntities.SNIS],
  grpc: [RoutingRulesEntities.HOSTS, RoutingRulesEntities.PATHS, RoutingRulesEntities.HEADERS],
  grpcs: [RoutingRulesEntities.HOSTS, RoutingRulesEntities.PATHS, RoutingRulesEntities.HEADERS, RoutingRulesEntities.SNIS],
  'grpc,grpcs': [RoutingRulesEntities.HOSTS, RoutingRulesEntities.PATHS, RoutingRulesEntities.HEADERS, RoutingRulesEntities.SNIS],
  'grpcs,grpc': [RoutingRulesEntities.HOSTS, RoutingRulesEntities.PATHS, RoutingRulesEntities.HEADERS, RoutingRulesEntities.SNIS],
  udp: [RoutingRulesEntities.SOURCES, RoutingRulesEntities.DESTINATIONS],
  tls: [RoutingRulesEntities.SOURCES, RoutingRulesEntities.DESTINATIONS, RoutingRulesEntities.SNIS],
  tcp: [RoutingRulesEntities.SOURCES, RoutingRulesEntities.DESTINATIONS],
  'tls,udp': [RoutingRulesEntities.SOURCES, RoutingRulesEntities.DESTINATIONS, RoutingRulesEntities.SNIS],
  'udp,tls': [RoutingRulesEntities.SOURCES, RoutingRulesEntities.DESTINATIONS, RoutingRulesEntities.SNIS],
  'tcp,udp': [RoutingRulesEntities.SOURCES, RoutingRulesEntities.DESTINATIONS],
  'udp,tcp': [RoutingRulesEntities.SOURCES, RoutingRulesEntities.DESTINATIONS],
  'tcp,tls': [RoutingRulesEntities.SOURCES, RoutingRulesEntities.DESTINATIONS, RoutingRulesEntities.SNIS],
  'tls,tcp': [RoutingRulesEntities.SOURCES, RoutingRulesEntities.DESTINATIONS, RoutingRulesEntities.SNIS],
  'tcp,tls,udp': [RoutingRulesEntities.SOURCES, RoutingRulesEntities.DESTINATIONS, RoutingRulesEntities.SNIS],
  'tls,udp,tcp': [RoutingRulesEntities.SOURCES, RoutingRulesEntities.DESTINATIONS, RoutingRulesEntities.SNIS],
  'udp,tcp,tls': [RoutingRulesEntities.SOURCES, RoutingRulesEntities.DESTINATIONS, RoutingRulesEntities.SNIS],
  tls_passthrough: [RoutingRulesEntities.SNIS],
  ws: [RoutingRulesEntities.HOSTS, RoutingRulesEntities.PATHS, RoutingRulesEntities.HEADERS],
  wss: [RoutingRulesEntities.HOSTS, RoutingRulesEntities.PATHS, RoutingRulesEntities.HEADERS, RoutingRulesEntities.SNIS],
  'ws,wss': [RoutingRulesEntities.HOSTS, RoutingRulesEntities.PATHS, RoutingRulesEntities.HEADERS, RoutingRulesEntities.SNIS],
  'wss,ws': [RoutingRulesEntities.HOSTS, RoutingRulesEntities.PATHS, RoutingRulesEntities.HEADERS, RoutingRulesEntities.SNIS],
}

const formType = computed((): EntityBaseFormType => props.routeId
  ? EntityBaseFormType.Edit
  : EntityBaseFormType.Create)

const fetchUrl = computed<string>(() => endpoints.form[props.config?.app]?.fetch?.[props.serviceId ? 'forGatewayService' : 'all'].replace(/{serviceId}/gi, props.serviceId || ''))

const cancelHandler = (): void => {
  router.push(props.config?.cancelRoute)
}

const loadingHandler = (val: boolean): void => {
  emit('loading', val)
}

const fetchErrorHandler = (err: AxiosError): void => {
  emit('error', err)
}

const setMethods = (methods: Method[]): void => {
  if (stateHasTraditionalFlavor(state)) {
    // traditional

    state.fields.methods = initialRoutingRulesValues[RoutingRulesEntities.METHODS]
    methods.forEach(method => {
      if (state.fields.methods) {
        state.fields.methods[method] = true
      }
    })
  }
}

const formatHeaders = (items: Headers): HeaderFields[] => {
  return Object.entries(items).map(item => {
    return { header: item[0], values: item[1]?.join() }
  })
}

const isProtocolSelected = (protocols: string[]): boolean => {
  return protocols.some(protocol => state.fields.protocols.includes(protocol))
}

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

const getHeaders = (): Headers | null => {
  if (stateHasTraditionalFlavor(state)) {
    const headers: HeaderFields[] = cleanDataArr(RoutingRulesEntities.HEADERS, state.fields.headers || []) || initialRoutingRulesValues[RoutingRulesEntities.HEADERS]
    if (headers.length === 0) {
      return null
    }
    const headerObj = {} as Headers

    headers.forEach(item => {
      headerObj[item.header] = item.values.split(',')
    })

    return headerObj
  }

  return null
}

const handleAddRoutingRuleEntity = (entity: string): void => {
  if (stateHasTraditionalFlavor(state)) {
    if (entity) {
      if (entity === RoutingRulesEntities.PATHS) {
        if (!state.fields.paths) {
          // spread objects and arrays to avoid mutating the original values
          state.fields.paths = [...initialRoutingRulesValues[RoutingRulesEntities.PATHS]]
        } else {
          state.fields.paths.push([...initialRoutingRulesValues[RoutingRulesEntities.PATHS]][0])
        }
      }
    }

    if (entity === RoutingRulesEntities.SNIS) {
      if (!state.fields.snis) {
        state.fields.snis = [...initialRoutingRulesValues[RoutingRulesEntities.SNIS]]
      } else {
        state.fields.snis.push([...initialRoutingRulesValues[RoutingRulesEntities.SNIS]][0])
      }
    }

    if (entity === RoutingRulesEntities.HOSTS) {
      if (!state.fields.hosts) {
        state.fields.hosts = [...initialRoutingRulesValues[RoutingRulesEntities.HOSTS]]
      } else {
        state.fields.hosts.push([...initialRoutingRulesValues[RoutingRulesEntities.HOSTS]][0])
      }
    }

    if (entity === RoutingRulesEntities.METHODS) {
      if (!state.fields.methods) {
        state.fields.methods = { ...initialRoutingRulesValues[RoutingRulesEntities.METHODS] }
      }
    }

    if (entity === RoutingRulesEntities.HEADERS) {
      if (!state.fields.headers) {
        state.fields.headers = [{ ...initialRoutingRulesValues[RoutingRulesEntities.HEADERS][0] }]
      } else {
        state.fields.headers.push({ ...initialRoutingRulesValues[RoutingRulesEntities.HEADERS][0] })
      }
    }

    if (entity === RoutingRulesEntities.SOURCES) {
      if (!state.fields.sources) {
        state.fields.sources = [{ ...initialRoutingRulesValues[RoutingRulesEntities.SOURCES][0] }]
      } else {
        state.fields.sources.push({ ...initialRoutingRulesValues[RoutingRulesEntities.SOURCES][0] })
      }
    }

    if (entity === RoutingRulesEntities.DESTINATIONS) {
      if (!state.fields.destinations) {
        state.fields.destinations = [{ ...initialRoutingRulesValues[RoutingRulesEntities.DESTINATIONS][0] }]
      } else {
        state.fields.destinations.push({ ...initialRoutingRulesValues[RoutingRulesEntities.DESTINATIONS][0] })
      }
    }
  }
}

// display or hide routing rules selector
const displayRoutingRulesSelector = computed(() => {
  if (stateHasTraditionalFlavor(state)) {
    return routingRulesPerProtocolMap[state.fields.protocols]?.filter(protocol => !state.fields[protocol as RoutingRuleEntity])
  }

  return false
})

// removes rule entity from the form
// or particular entry from particular rule entity if index is provided
const handleRemoveRoutingRuleEntity = async (entity: string, index?: number): Promise<void> => {
  if (stateHasTraditionalFlavor(state)) {
    if (typeof index !== 'undefined') {
      let items: any = []

      items = state.fields[entity as RoutingRuleEntity]

      items.splice(index, 1)

      if (items.length) {
        state.fields[entity as RoutingRuleEntity] = items

        // skip removing rule entity if it's not empty
        return
      }
    }

    await nextTick(() => {
      delete state.fields[entity as RoutingRuleEntity]

      if (entity === RoutingRulesEntities.METHODS) {
        customMethods.value = ['']
      }
    })
  }
}

const getRoutingRuleLabel = (entity: string): string => {
  const formFields = i18n.source.form.fields as Record<string, any>

  return formFields[entity]?.label || ''
}

watch(() => state.fields.protocols, () => {
  sanitizeRoutingRulesEntities()
})

// removes objects for routing rules that are not configurable for the chosen protocols
const sanitizeRoutingRulesEntities = () => {
  const allRoutingRulesEntities = Object.keys(initialRoutingRulesValues)
  const protocolEntities = routingRulesPerProtocolMap[state.fields.protocols]
  const routingRulesEntities = Object.keys(state.fields).filter(element => allRoutingRulesEntities.includes(element))

  routingRulesEntities.forEach(entity => {
    if (!protocolEntities?.includes(entity)) {
      handleRemoveRoutingRuleEntity(entity)
    }
  })
}

// returns methods formatted in the payload format, except for custom methods (those are handled separately)
const selectedMethods = computed((): Method[] => {
  if (stateHasTraditionalFlavor(state)) {
    const methods: Method[] = []

    if (state.fields.methods) {
      Object.entries(state.fields.methods).forEach(([key, value]) => {
        if (value) {
          methods.push(key as Method)
        }
      })
    }

    return methods
  }

  return []
})

const protocolsArr = computed((): string[] => state.fields.protocols?.split(',') || [])

const showRoutingRulesWarning = computed((): boolean => {
  const allRoutingRulesEntities = Object.keys(initialRoutingRulesValues)
  const routingRulesEntities = Object.keys(state.fields).filter(element => allRoutingRulesEntities.includes(element))

  return !routingRulesEntities.length
})

const warningMessageRoutingRules = computed((): string[] => {
  if (isProtocolSelected(['tls_passthrough'])) {
    return [getRoutingRuleLabel(RoutingRulesEntities.SNIS)]
  }

  const protocolEntitiesLabels = routingRulesPerProtocolMap[state.fields.protocols].map(entity => getRoutingRuleLabel(entity))
  return [[...protocolEntitiesLabels].splice(0, protocolEntitiesLabels.length - 1).join(', '), protocolEntitiesLabels[protocolEntitiesLabels.length - 1]]
})

const updateFormValues = (data: Record<string, any>): void => {
  if (props.routeId) {
    const flavor = typeof data.expression === 'string' && data.expression.length > 0 ? RouteFlavor.EXPRESSIONS : RouteFlavor.TRADITIONAL
    recordFlavor.value = flavor
    currentConfigHash.value = `#${flavor}`
  }

  if (data?.service?.id) {
    state.fields.service_id = data.service.id
  }

  state.fields.name = data?.name || ''

  const tags = data?.tags || []
  state.fields.tags = tags?.join(', ') || ''

  state.fields.preserve_host = typeof data?.preserve_host === 'undefined' ? false : data?.preserve_host
  state.fields.https_redirect_status_code = data?.https_redirect_status_code || 426

  if (data?.protocols?.length) {
    if (data.protocols.length > 1) {
      state.fields.protocols = data.protocols.join()
    } else {
      state.fields.protocols = data.protocols[0]
    }
  }

  state.fields.request_buffering = typeof data?.request_buffering === 'undefined' ? true : data?.request_buffering
  state.fields.response_buffering = typeof data?.response_buffering === 'undefined' ? true : data?.response_buffering

  state.fields.strip_path = typeof data?.strip_path === 'undefined' ? true : data?.strip_path

  if (stateHasTraditionalFlavor(state)) {
    state.fields.regex_priority = data?.regex_priority || 0
    state.fields.path_handling = data?.path_handling || 'v0'

    if (data?.paths) {
      state.fields.paths = data.paths
    }

    if (data?.snis) {
      state.fields.snis = data.snis
    }

    if (data?.hosts) {
      state.fields.hosts = data.hosts
    }

    if (data?.methods) {
      setMethods(data.methods)
    }

    if (data?.headers) {
      state.fields.headers = formatHeaders(data.headers)
    }

    if (data?.sources) {
      state.fields.sources = data.sources
    }

    if (data?.destinations) {
      state.fields.destinations = data.destinations
    }
  }

  if (stateHasExpressionsFlavor(state)) {
    state.fields.expression = data?.expression || ''
    state.fields.priority = data?.priority || 0
  }

  // copy form.fields to avoid referencing the original object in originalFields
  Object.assign(originalFields, JSON.parse(JSON.stringify(state.fields)))
}

/**
 * Is the form submit button enabled?
 */
const isFormValid = computed((): boolean => {
  switch (payloadFlavor.value) {
    case RouteFlavor.TRADITIONAL: {
      if (stateHasTraditionalFlavor(state)) {
        const hosts = state.fields.hosts ? !!state.fields.hosts.filter(Boolean).length : null
        const paths = state.fields.paths ? !!state.fields.paths.filter(Boolean).length : null
        const headers = state.fields.headers ? state.fields.headers.some(({ header }) => !!header) : null
        const snis = state.fields.snis ? !!state.fields.snis.filter(Boolean).length : null
        const destinations = state.fields.destinations ? state.fields.destinations.some(({ ip }) => !!ip) : null
        const sources = state.fields.sources ? state.fields.sources.some(({ ip }) => !!ip) : null
        const hasCustomMethod = state.fields.methods?.CUSTOM
        const methods = hasCustomMethod ? customMethods.value.some(item => !!item) : Object.values(state.fields.methods || {}).includes(true)

        return !!state.fields.protocols && ((isProtocolSelected(['http']) && !!(hosts || methods || paths || headers)) ||
          (isProtocolSelected(['https']) && !!(hosts || methods || paths || headers || snis)) ||
          (isProtocolSelected(['grpc']) && !!(hosts || paths || headers)) ||
          (isProtocolSelected(['grpcs', 'wss']) && !!(hosts || paths || headers || snis)) ||
          (isProtocolSelected(['udp', 'tls']) && !!(destinations || sources || snis)) ||
          (isProtocolSelected(['tcp']) && !!(destinations || sources)) ||
          (isProtocolSelected(['tls_passthrough']) && !!snis) ||
          (isProtocolSelected(['ws']) && !!(hosts || paths || headers)))
      }

      break
    }
    case RouteFlavor.EXPRESSIONS: {
      if (stateHasExpressionsFlavor(state)) {
        return state.fields.expression.length > 0
      }

      break
    }
  }

  // We shouldn't reach here. Let the BE respond with an error if we did.
  // Always returning "valid" here.
  return true
})

const changesExist = computed((): boolean => !isEqual(state.fields, originalFields))

/* ---------------
 * Saving
 * ---------------
 */

/**
 * Build the submit URL
 */
const submitUrl = computed<string>(() => {
  let url = `${props.config.apiBaseUrl}${endpoints.form[props.config.app][formType.value][props.serviceId ? 'forGatewayService' : 'all']}`

  if (props.config.app === 'konnect') {
    url = url
      .replace(/{controlPlaneId}/gi, props.config?.controlPlaneId || '')
      .replace(/{serviceId}/gi, props.serviceId || '')
  } else if (props.config.app === 'kongManager') {
    url = url
      .replace(/\/{workspace}/gi, props.config?.workspace ? `/${props.config.workspace}` : '')
      .replace(/{serviceId}/gi, props.serviceId || '')
  }

  // Always replace the id when editing
  url = url.replace(/{id}/gi, props.routeId)

  return url
})

watch(() => state.fields, () => {
  emit('model-updated', getPayload.value)
}, { deep: true })

const getArrPayload = (arr?: any[]) => arr?.length ? arr : null

const getTraditionalPayload = () => {
  if (stateHasTraditionalFlavor(state)) {
    const payload: TraditionalRoutePayload = {
      methods: null,
      hosts: getArrPayload(cleanDataArr(RoutingRulesEntities.HOSTS, state.fields.hosts || [])),
      paths: getArrPayload(cleanDataArr(RoutingRulesEntities.PATHS, state.fields.paths || [])),
      headers: getHeaders(),
      regex_priority: Number(state.fields.regex_priority),
      path_handling: state.fields.path_handling,
      sources: getArrPayload(cleanDataArr(RoutingRulesEntities.SOURCES, state.fields.sources || [])),
      destinations: getArrPayload(cleanDataArr(RoutingRulesEntities.DESTINATIONS, state.fields.destinations || [])),
      snis: getArrPayload(cleanDataArr(RoutingRulesEntities.SNIS, state.fields.snis || [])),
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

    return payload
  }
}

const getExpressionsPayload = () => {
  if (stateHasExpressionsFlavor(state)) {
    return {
      expression: state.fields.expression,
      priority: Number(state.fields.priority),
    } as ExpressionsRoutePayload
  }
}

const getPayload = computed((): BaseRoutePayload => {
  const base: BaseRoutePayload = {
    ...(!props.hideNameField && { name: state.fields.name || null }),
    protocols: state.fields.protocols.split(',') as Protocol[],
    https_redirect_status_code: state.fields.https_redirect_status_code,
    strip_path: isProtocolSelected(['grpc', 'gprcs']) ? false : state.fields.strip_path,
    preserve_host: state.fields.preserve_host,
    request_buffering: state.fields.request_buffering,
    response_buffering: state.fields.response_buffering,
    tags: state.fields.tags.split(',')?.map((tag: string) => String(tag || '')
      .trim())?.filter((tag: string) => tag !== ''),
    service: (state.fields.service_id) ? { id: state.fields.service_id } : null,
  }

  switch (payloadFlavor.value) {
    case RouteFlavor.TRADITIONAL:
      return { ...base, ...getTraditionalPayload() }
    case RouteFlavor.EXPRESSIONS:
      return { ...base, ...getExpressionsPayload() }
    default:
      // We shouldn't reach here. Let the BE respond with an error if we did.
      return base
  }
})

const isRoutePayloadValid = (val: any): boolean => {
  switch (payloadFlavor.value) {
    case RouteFlavor.TRADITIONAL: {
      if (!('regex_priority' in val && 'path_handling' in val)) {
        return false
      }
      break
    }
    case RouteFlavor.EXPRESSIONS: {
      if (!('priority' in val)) {
        return false
      }
      break
    }
  }

  return 'service' in val && 'tags' in val && 'protocols' in val
}

const saveFormData = async (payload?: BaseRoutePayload): Promise<void> => {
  const validPayload: BaseRoutePayload = (payload && isRoutePayloadValid(payload)) ? payload : getPayload.value

  try {
    state.isReadonly = true

    let response: AxiosResponse | undefined

    if (formType.value === 'create') {
      response = await axiosInstance.post(submitUrl.value, validPayload)
    } else if (formType.value === 'edit') {
      response = props.config?.app === 'konnect'
        ? await axiosInstance.put(submitUrl.value, validPayload)
        : await axiosInstance.patch(submitUrl.value, validPayload)
    }

    updateFormValues(response?.data)

    emit('update', response?.data)
  } catch (error: any) {
    state.errorMessage = getMessageFromError(error)
    emit('error', error as AxiosError)
  } finally {
    state.isReadonly = false
  }
}

/**
 * Services Handling
 */

const {
  debouncedQueryChange: debouncedServicesQuery,
  loading: loadingServices,
  error: servicesFetchError,
  loadItems: loadServices,
  results: servicesResults,
} = useDebouncedFilter(props.config, endpoints.form[props.config.app].services, undefined, {
  fetchedItemsKey: 'data',
  searchKeys: ['id', 'name'],
})

const fetchServicesErrorMessage = computed((): string => servicesFetchError.value ? t('errors.services.fetch') : '')

const availableServices = computed((): SelectItem[] => servicesResults.value?.map(el => ({ label: el.id, name: el.name, value: el.id })))

onBeforeMount(async () => {
  if (!props.hideServiceField && !props.serviceId) {
    // load services for filtering
    await loadServices()
  } else {
    state.fields.service_id = props.serviceId
  }
})

onMounted(() => {
  emit('model-updated', getPayload.value)
})

defineExpose({ saveFormData, getPayload })
</script>

<style lang="scss">
.appear-enter-active {
  transition: all 0.5s ease;
}

.appear-enter-from,
.appear-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>

<style lang="scss" scoped>
@use "../styles/mixins" as *;

.kong-ui-entities-route-form {
  width: 100%;

  .route-form {
    &-service-dropdown-item {
      display: flex;
      flex-direction: column;

      .select-item-label {
        font-weight: $kui-font-weight-semibold;
      }

      .select-item-description {
        color: $kui-color-text-neutral;
        font-size: $kui-font-size-20;
      }
    }

    &-config-type-immutable-alert {
      margin-bottom: $kui_space_60;
    }

    &-routing-rules-title-container {
      display: flex;
      justify-content: center;

      .protocol-title {
        font-size: $kui_font_size_40;

        &:not(:first-child) {
          &::before {
            content: '/';
            margin-right: $kui_space_40;
            padding-left: $kui_space_40;
          }
        }
      }

      .routing-rules-title {
        font-size: $kui_font_size_40;
        margin-left: $kui_space_40;
      }
    }

    &-routing-rules-selector {
      @include routing-rules-selector;
    }

    &-advanced-fields-collapse {
      margin-top: $kui_space_80;
    }

    &-advanced-fields-container {
      margin-top: $kui_space_80;
    }

    &-fields-container {
      >* {
        &:not(:first-child) {
          margin-top: $kui_space_80;
        }
      }
    }
  }

  .k-checkbox {
    display: flex;
  }

  :deep(.form-section-content) {
    min-width: 0;
  }

  .expression-editor {
    min-height: 200px;
  }
}
</style>
