<template>
  <div class="kong-ui-entities-route-form">
    <EntityBaseForm
      :can-submit="isFormValid && changesExist"
      :config="config"
      :edit-id="routeId"
      :error-message="form.errorMessage || fetchServicesErrorMessage"
      :fetch-url="fetchUrl"
      :form-fields="form.fields"
      :is-readonly="form.isReadonly"
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
          v-model.trim="form.fields.name"
          autocomplete="off"
          data-testid="route-form-name"
          :label="t('form.fields.name.label')"
          :placeholder="t('form.fields.name.placeholder')"
          :readonly="form.isReadonly"
          type="text"
        />
        <div v-if="hideServiceField ? false : !serviceId">
          <KSelect
            v-model="form.fields.service_id"
            clearable
            data-testid="route-form-service-id"
            enable-filtering
            :filter-function="() => true"
            :items="availableServices"
            :label="t('form.fields.service_id.label')"
            :loading="loadingServices"
            :placeholder="t('form.fields.service_id.placeholder')"
            :readonly="form.isReadonly"
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
              <span class="k-select-selected-item-label">{{ getSelectedService(item) }}</span>
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
          v-model.trim="form.fields.tags"
          autocomplete="off"
          data-testid="route-form-tags"
          :help="t('form.fields.tags.help')"
          :label="t('form.fields.tags.label')"
          :placeholder="t('form.fields.tags.placeholder')"
          :readonly="form.isReadonly"
          type="text"
        />
      </EntityFormSection>
      <EntityFormSection
        :description="t('form.sections.config.description')"
        :hide-info-header="hideSectionsInfo"
        :title="t('form.sections.config.title')"
      >
        <KSelect
          v-model="form.fields.protocols"
          data-testid="route-form-protocols"
          :items="protocols"
          :label="t('form.fields.protocols.label')"
          :label-attributes="{ info: t('form.fields.protocols.tooltip') }"
          :readonly="form.isReadonly"
          required
          width="100%"
        />
        <KCard v-if="form.fields.protocols">
          <template #title>
            <div class="route-form-routing-rules-title-container">
              <span
                v-for="protocol in protocolsArr"
                :key="protocol"
                class="protocol-title"
              >
                {{ protocol.toUpperCase() }}
              </span>
              <span class="routing-rules-title">{{ t('form.sections.routingRules.title') }}</span>
            </div>
          </template>

          <KAlert
            v-if="showRoutingRulesWarning"
            appearance="warning"
            data-testid="routing-rules-warning"
          >
            <template #alertMessage>
              <i18nT keypath="form.warning.rulesMessage">
                <template #protocol>
                  <b>{{ protocolsLabels[form.fields.protocols] }}</b>
                </template>
                <template #routingRules>
                  <i18nT :keypath="warningMessageRoutingRules[1] ? 'form.warning.multipleRules' : 'form.warning.singleRule'">
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
              v-if="form.fields.paths"
              key="paths-container"
              v-model="form.fields.paths"
              @add="handleAddRoutingRuleEntity(RoutingRulesEntities.PATHS)"
              @remove="(index: number) => handleRemoveRoutingRuleEntity(RoutingRulesEntities.PATHS, index)"
            />

            <!-- snis -->
            <RouteFormSnisFields
              v-if="form.fields.snis"
              key="snis-container"
              v-model="form.fields.snis"
              @add="handleAddRoutingRuleEntity(RoutingRulesEntities.SNIS)"
              @remove="(index: number) => handleRemoveRoutingRuleEntity(RoutingRulesEntities.SNIS, index)"
            />

            <!-- hosts -->
            <RouteFormHostsFields
              v-if="form.fields.hosts"
              key="hosts-container"
              v-model="form.fields.hosts"
              @add="handleAddRoutingRuleEntity(RoutingRulesEntities.HOSTS)"
              @remove="(index: number) => handleRemoveRoutingRuleEntity(RoutingRulesEntities.HOSTS, index)"
            />

            <!-- methods -->
            <RouteFormMethodsFields
              v-if="form.fields.methods"
              key="methods-container"
              v-model="form.fields.methods"
              :custom-methods="customMethods"
              @remove="handleRemoveRoutingRuleEntity(RoutingRulesEntities.METHODS)"
              @update-custom-methods="(methods: string[]) => customMethods = methods"
            />

            <!-- headers -->
            <RouteFormHeadersFields
              v-if="form.fields.headers"
              key="headers-container"
              v-model="form.fields.headers"
              @add="handleAddRoutingRuleEntity(RoutingRulesEntities.HEADERS)"
              @remove="(index: number) => handleRemoveRoutingRuleEntity(RoutingRulesEntities.HEADERS, index)"
            />

            <!-- sources -->
            <RouteFormSourcesFields
              v-if="form.fields.sources"
              key="sources-container"
              v-model="form.fields.sources"
              @add="handleAddRoutingRuleEntity(RoutingRulesEntities.SOURCES)"
              @remove="(index: number) => handleRemoveRoutingRuleEntity(RoutingRulesEntities.SOURCES, index)"
            />

            <!-- destinations -->
            <RouteFormDestinationsFields
              v-if="form.fields.destinations"
              key="destinations-container"
              v-model="form.fields.destinations"
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
                  v-for="entity in routingRulesPerProtocolMap[form.fields.protocols]"
                  :key="entity"
                >
                  <label
                    :aria-disabled="!!form.fields[entity as RoutingRuleEntity]"
                    class="option"
                    :class="{ 'is-selected': form.fields[entity as RoutingRuleEntity] }"
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
        </KCard>

        <!-- Advanced Fields -->
        <KCollapse
          trigger-alignment="leading"
          :trigger-label="t('form.viewAdvancedFields')"
        >
          <div class="route-form-fields-container route-form-advanced-fields-container">
            <KSelect
              v-if="form.fields.paths"
              v-model="form.fields.path_handling"
              data-testid="route-form-path-handling"
              :items="pathHandlingOptions"
              :label="t('form.fields.path_handling.label')"
              :label-attributes="{ info: t('form.fields.path_handling.tooltip') }"
              :readonly="form.isReadonly"
              width="100%"
            />
            <KSelect
              v-model="form.fields.https_redirect_status_code"
              data-testid="route-form-http-redirect-status-code"
              :items="httpsRedirectStatusCodes"
              :label="t('form.fields.https_redirect_status_code.label')"
              :readonly="form.isReadonly"
              width="100%"
            />
            <KInput
              v-model="form.fields.regex_priority"
              autocomplete="off"
              data-testid="route-form-regex-priority"
              :label="t('form.fields.regex_priority.label')"
              :readonly="form.isReadonly"
              type="number"
            />
            <KInput
              v-if="showTagsFiledUnderAdvanced"
              v-model.trim="form.fields.tags"
              autocomplete="off"
              data-testid="route-form-tags"
              :help="t('form.fields.tags.help')"
              :label="t('form.fields.tags.label')"
              :placeholder="t('form.fields.tags.placeholder')"
              :readonly="form.isReadonly"
              type="text"
            />
            <KCheckbox
              v-if="isProtocolSelected(['http', 'https', 'ws', 'wss', 'tls', 'tcp', 'udp', 'tls_passthrough'])"
              v-model="form.fields.strip_path"
              data-testid="route-form-strip-path"
              :label="t('form.fields.strip_path.label')"
            />
            <KCheckbox
              v-model="form.fields.preserve_host"
              data-testid="route-form-preserve-host"
              :label="t('form.fields.preserve_host.label')"
            />
            <KCheckbox
              v-model="form.fields.request_buffering"
              data-testid="route-form-request-buffering"
              :label="t('form.fields.request_buffering.label')"
            />
            <KCheckbox
              v-model="form.fields.response_buffering"
              data-testid="route-form-response-buffering"
              :label="t('form.fields.response_buffering.label')"
            />
          </div>
        </KCollapse>
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
  useAxios,
  useErrors,
  useDebouncedFilter,
  useGatewayFeatureSupported,
  EntityFormSection,
  EntityBaseForm,
  EntityBaseFormType,
} from '@kong-ui-public/entities-shared'
import composables from '../composables'
import '@kong-ui-public/entities-shared/dist/style.css'
import type { PropType } from 'vue'
import { computed, nextTick, onBeforeMount, onMounted, reactive, ref, watch } from 'vue'
import type {
  KonnectRouteFormConfig,
  KongManagerRouteFormConfig,
  RouteStateFields,
  RouteState,
  RoutePayload,
  RoutingRuleEntity,
  Method,
  HeaderFields,
  MethodsFields,
  Sources,
  Destinations,
  Headers,
  Protocol,
} from '../types'
import { RoutingRulesEntities } from '../types'
import { useRouter } from 'vue-router'
import type { AxiosError, AxiosResponse } from 'axios'
import endpoints from '../routes-endpoints'
import RouteFormPathsFields from './RouteFormPathsFields.vue'
import RouteFormSnisFields from './RouteFormSnisFields.vue'
import RouteFormHostsFields from './RouteFormHostsFields.vue'
import RouteFormMethodsFields from './RouteFormMethodsFields.vue'
import RouteFormHeadersFields from './RouteFormHeadersFields.vue'
import RouteFormSourcesFields from './RouteFormSourcesFields.vue'
import RouteFormDestinationsFields from './RouteFormDestinationsFields.vue'
import { isRoutePayloadValid } from '../utilities'
import type { SelectItem } from '@kong/kongponents'

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
})

const emit = defineEmits<{
  (e: 'update', data: RoutePayload): void,
  (e: 'error', error: AxiosError): void,
  (e: 'loading', isLoading: boolean): void,
  (e: 'model-updated', val: RoutePayload): void,
}>()

const { i18nT, i18n, i18n: { t } } = composables.useI18n()
const protocolsLabels = i18n.source.form.protocols as Record<string, string>
const router = useRouter()
const { axiosInstance } = useAxios({
  headers: props.config?.requestHeaders,
})
const { getMessageFromError } = useErrors()

const showGeneralInfoSection = computed<boolean>(() => !(props.hideNameField && (props.hideServiceField || !!props.serviceId) && props.showTagsFiledUnderAdvanced))

const getSelectedService = (item: any) => {
  return item.name ? `${item.name} - ${item.value}` : item.value
}

const form = reactive<RouteState>({
  fields: {
    service_id: '',
    name: '',
    tags: '',
    regex_priority: 0,
    path_handling: 'v0',
    preserve_host: false,
    https_redirect_status_code: 426,
    protocols: 'http,https',
    request_buffering: true,
    response_buffering: true,
    strip_path: true,
    ...(!props.routeId && { paths: [''] }),
  },
  isReadonly: false,
  errorMessage: '',
})
const customMethods = ref<string[]>([''])

const originalFields = reactive<RouteStateFields>({
  service_id: '',
  name: '',
  tags: '',
  regex_priority: 0,
  path_handling: 'v0',
  preserve_host: false,
  https_redirect_status_code: 426,
  protocols: 'http,https',
  request_buffering: true,
  response_buffering: true,
  strip_path: true,
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
  grpc: [RoutingRulesEntities.HOSTS, RoutingRulesEntities.PATHS, RoutingRulesEntities.HEADERS],
  grpcs: [RoutingRulesEntities.HOSTS, RoutingRulesEntities.PATHS, RoutingRulesEntities.HEADERS, RoutingRulesEntities.SNIS],
  'grpc,grpcs': [RoutingRulesEntities.HOSTS, RoutingRulesEntities.PATHS, RoutingRulesEntities.HEADERS, RoutingRulesEntities.SNIS],
  udp: [RoutingRulesEntities.SOURCES, RoutingRulesEntities.DESTINATIONS],
  tls: [RoutingRulesEntities.SOURCES, RoutingRulesEntities.DESTINATIONS, RoutingRulesEntities.SNIS],
  tcp: [RoutingRulesEntities.SOURCES, RoutingRulesEntities.DESTINATIONS],
  'tls,udp': [RoutingRulesEntities.SOURCES, RoutingRulesEntities.DESTINATIONS, RoutingRulesEntities.SNIS],
  'tcp,udp': [RoutingRulesEntities.SOURCES, RoutingRulesEntities.DESTINATIONS],
  'tcp,tls': [RoutingRulesEntities.SOURCES, RoutingRulesEntities.DESTINATIONS, RoutingRulesEntities.SNIS],
  'tcp,tls,udp': [RoutingRulesEntities.SOURCES, RoutingRulesEntities.DESTINATIONS, RoutingRulesEntities.SNIS],
  tls_passthrough: [RoutingRulesEntities.SNIS],
  ws: [RoutingRulesEntities.HOSTS, RoutingRulesEntities.PATHS, RoutingRulesEntities.HEADERS],
  wss: [RoutingRulesEntities.HOSTS, RoutingRulesEntities.PATHS, RoutingRulesEntities.HEADERS, RoutingRulesEntities.SNIS],
  'ws,wss': [RoutingRulesEntities.HOSTS, RoutingRulesEntities.PATHS, RoutingRulesEntities.HEADERS, RoutingRulesEntities.SNIS],
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
  form.fields.methods = initialRoutingRulesValues[RoutingRulesEntities.METHODS]
  methods.forEach(method => {
    if (form.fields.methods) {
      form.fields.methods[method] = true
    }
  })
}

const formatHeaders = (items: Headers): HeaderFields[] => {
  return Object.entries(items).map(item => {
    return { header: item[0], values: item[1]?.join() }
  })
}

const isProtocolSelected = (protocols: string[]): boolean => {
  return protocols.some(protocol => form.fields.protocols.includes(protocol))
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
  const headers: HeaderFields[] = cleanDataArr(RoutingRulesEntities.HEADERS, form.fields.headers || []) || initialRoutingRulesValues[RoutingRulesEntities.HEADERS]
  if (headers.length === 0) {
    return null
  }
  const headerObj = {} as Headers

  headers.forEach(item => {
    headerObj[item.header] = item.values.split(',')
  })

  return headerObj
}

const handleAddRoutingRuleEntity = (entity: string): void => {
  if (entity === RoutingRulesEntities.PATHS) {
    if (!form.fields.paths) {
      // spread objects and arrays to avoid mutating the original values
      form.fields.paths = [...initialRoutingRulesValues[RoutingRulesEntities.PATHS]]
    } else {
      form.fields.paths.push([...initialRoutingRulesValues[RoutingRulesEntities.PATHS]][0])
    }
  }

  if (entity === RoutingRulesEntities.SNIS) {
    if (!form.fields.snis) {
      form.fields.snis = [...initialRoutingRulesValues[RoutingRulesEntities.SNIS]]
    } else {
      form.fields.snis.push([...initialRoutingRulesValues[RoutingRulesEntities.SNIS]][0])
    }
  }

  if (entity === RoutingRulesEntities.HOSTS) {
    if (!form.fields.hosts) {
      form.fields.hosts = [...initialRoutingRulesValues[RoutingRulesEntities.HOSTS]]
    } else {
      form.fields.hosts.push([...initialRoutingRulesValues[RoutingRulesEntities.HOSTS]][0])
    }
  }

  if (entity === RoutingRulesEntities.METHODS) {
    if (!form.fields.methods) {
      form.fields.methods = { ...initialRoutingRulesValues[RoutingRulesEntities.METHODS] }
    }
  }

  if (entity === RoutingRulesEntities.HEADERS) {
    if (!form.fields.headers) {
      form.fields.headers = [{ ...initialRoutingRulesValues[RoutingRulesEntities.HEADERS][0] }]
    } else {
      form.fields.headers.push({ ...initialRoutingRulesValues[RoutingRulesEntities.HEADERS][0] })
    }
  }

  if (entity === RoutingRulesEntities.SOURCES) {
    if (!form.fields.sources) {
      form.fields.sources = [{ ...initialRoutingRulesValues[RoutingRulesEntities.SOURCES][0] }]
    } else {
      form.fields.sources.push({ ...initialRoutingRulesValues[RoutingRulesEntities.SOURCES][0] })
    }
  }

  if (entity === RoutingRulesEntities.DESTINATIONS) {
    if (!form.fields.destinations) {
      form.fields.destinations = [{ ...initialRoutingRulesValues[RoutingRulesEntities.DESTINATIONS][0] }]
    } else {
      form.fields.destinations.push({ ...initialRoutingRulesValues[RoutingRulesEntities.DESTINATIONS][0] })
    }
  }
}

// display or hide routing rules selector
const displayRoutingRulesSelector = computed(() => {
  return routingRulesPerProtocolMap[form.fields.protocols]?.filter(protocol => !form.fields[protocol as RoutingRuleEntity])
})

// removes rule entity from the form
// or particular entry from particular rule entity if index is provided
const handleRemoveRoutingRuleEntity = async (entity: string, index?: number): Promise<void> => {
  if (typeof index !== 'undefined') {
    let items: any = []

    items = form.fields[entity as RoutingRuleEntity]

    items.splice(index, 1)

    if (items.length) {
      form.fields[entity as RoutingRuleEntity] = items

      // skip removing rule entity if it's not empty
      return
    }
  }

  await nextTick(() => {
    delete form.fields[entity as RoutingRuleEntity]

    if (entity === RoutingRulesEntities.METHODS) {
      customMethods.value = ['']
    }
  })
}

const getRoutingRuleLabel = (entity: string): string => {
  const formFields = i18n.source.form.fields as Record<string, any>

  return formFields[entity]?.label || ''
}

watch(() => form.fields.protocols, () => {
  sanitizeRoutingRulesEntities()
})

// removes objects for routing rules that are not configurable for the chosen protocols
const sanitizeRoutingRulesEntities = () => {
  const allRoutingRulesEntities = Object.keys(initialRoutingRulesValues)
  const protocolEntities = routingRulesPerProtocolMap[form.fields.protocols]
  const routingRulesEntities = Object.keys(form.fields).filter(element => allRoutingRulesEntities.includes(element))

  routingRulesEntities.forEach(entity => {
    if (!protocolEntities?.includes(entity)) {
      handleRemoveRoutingRuleEntity(entity)
    }
  })
}

// returns methods formatted in the payload format, except for custom methods (those are handled separately)
const selectedMethods = computed((): Method[] => {
  const methods: Method[] = []

  if (form.fields.methods) {
    Object.entries(form.fields.methods).forEach(([key, value]) => {
      if (value) {
        methods.push(key as Method)
      }
    })
  }

  return methods
})

const protocolsArr = computed((): string[] => form.fields.protocols?.split(',') || [])

const showRoutingRulesWarning = computed((): boolean => {
  const allRoutingRulesEntities = Object.keys(initialRoutingRulesValues)
  const routingRulesEntities = Object.keys(form.fields).filter(element => allRoutingRulesEntities.includes(element))

  return !routingRulesEntities.length
})
const warningMessageRoutingRules = computed((): string[] => {
  if (isProtocolSelected(['tls_passthrough'])) {
    return [getRoutingRuleLabel(RoutingRulesEntities.SNIS)]
  }

  const protocolEntitiesLabels = routingRulesPerProtocolMap[form.fields.protocols].map(entity => getRoutingRuleLabel(entity))
  return [[...protocolEntitiesLabels].splice(0, protocolEntitiesLabels.length - 1).join(', '), protocolEntitiesLabels[protocolEntitiesLabels.length - 1]]
})

const updateFormValues = (data: Record<string, any>): void => {
  if (data?.service?.id) {
    form.fields.service_id = data.service.id
  }

  form.fields.name = data?.name || ''

  const tags = data?.tags || []
  form.fields.tags = tags?.join(', ') || ''

  form.fields.regex_priority = data?.regex_priority || 0
  form.fields.path_handling = data?.path_handling || 'v0'
  form.fields.preserve_host = typeof data?.preserve_host === 'undefined' ? false : data?.preserve_host
  form.fields.https_redirect_status_code = data?.https_redirect_status_code || 426

  if (data?.protocols?.length) {
    if (data.protocols.length > 1) {
      form.fields.protocols = data.protocols.join()
    } else {
      form.fields.protocols = data.protocols[0]
    }
  }

  form.fields.request_buffering = typeof data?.request_buffering === 'undefined' ? true : data?.request_buffering
  form.fields.response_buffering = typeof data?.response_buffering === 'undefined' ? true : data?.response_buffering

  form.fields.strip_path = typeof data?.strip_path === 'undefined' ? true : data?.strip_path

  if (data?.paths) {
    form.fields.paths = data.paths
  }

  if (data?.snis) {
    form.fields.snis = data.snis
  }

  if (data?.hosts) {
    form.fields.hosts = data.hosts
  }

  if (data?.methods) {
    setMethods(data.methods)
  }

  if (data?.headers) {
    form.fields.headers = formatHeaders(data.headers)
  }

  if (data?.sources) {
    form.fields.sources = data.sources
  }

  if (data?.destinations) {
    form.fields.destinations = data.destinations
  }

  // copy form.fields to avoid referencing the original object in originalFields
  Object.assign(originalFields, JSON.parse(JSON.stringify(form.fields)))
}

/**
 * Is the form submit button enabled?
 */
const isFormValid = computed((): boolean => {
  const hosts = form.fields.hosts ? !!form.fields.hosts.filter(Boolean).length : null
  const paths = form.fields.paths ? !!form.fields.paths.filter(Boolean).length : null
  const headers = form.fields.headers ? form.fields.headers.some(({ header }) => !!header) : null
  const snis = form.fields.snis ? !!form.fields.snis.filter(Boolean).length : null
  const destinations = form.fields.destinations ? form.fields.destinations.some(({ ip }) => !!ip) : null
  const sources = form.fields.sources ? form.fields.sources.some(({ ip }) => !!ip) : null
  const hasCustomMethod = form.fields.methods?.CUSTOM
  const methods = hasCustomMethod ? customMethods.value.some(item => !!item) : Object.values(form.fields.methods || {}).includes(true)

  return !!form.fields.protocols && ((isProtocolSelected(['http']) && !!(hosts || methods || paths || headers)) ||
    (isProtocolSelected(['https']) && !!(hosts || methods || paths || headers || snis)) ||
    (isProtocolSelected(['grpc']) && !!(hosts || paths || headers)) ||
    (isProtocolSelected(['grpcs', 'wss']) && !!(hosts || paths || headers || snis)) ||
    (isProtocolSelected(['udp', 'tls']) && !!(destinations || sources || snis)) ||
    (isProtocolSelected(['tcp']) && !!(destinations || sources)) ||
    (isProtocolSelected(['tls_passthrough']) && !!snis) ||
    (isProtocolSelected(['ws']) && !!(hosts || paths || headers)))
})
const changesExist = computed((): boolean => JSON.stringify(form.fields) !== JSON.stringify(originalFields))

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

watch(() => form.fields, () => {
  emit('model-updated', getPayload())
}, { deep: true })

const getArrPayload = (arr?: any[]) => arr?.length ? arr : null

const getPayload = (serviceId?: string): RoutePayload => {
  const payload: RoutePayload = {
    service: (form.fields.service_id || serviceId) ? { id: serviceId || form.fields.service_id } : null,
    ...(!props.hideNameField && { name: form.fields.name || null }),
    paths: getArrPayload(cleanDataArr(RoutingRulesEntities.PATHS, form.fields.paths || [])),
    snis: getArrPayload(cleanDataArr(RoutingRulesEntities.SNIS, form.fields.snis || [])),
    hosts: getArrPayload(cleanDataArr(RoutingRulesEntities.HOSTS, form.fields.hosts || [])),
    methods: null,
    headers: getHeaders(),
    sources: getArrPayload(cleanDataArr(RoutingRulesEntities.SOURCES, form.fields.sources || [])),
    destinations: getArrPayload(cleanDataArr(RoutingRulesEntities.DESTINATIONS, form.fields.destinations || [])),
    tags: form.fields.tags.split(',')?.map((tag: string) => String(tag || '')
      .trim())?.filter((tag: string) => tag !== ''),
    regex_priority: Number(form.fields.regex_priority),
    path_handling: form.fields.path_handling,
    strip_path: isProtocolSelected(['grpc', 'gprcs']) ? false : form.fields.strip_path,
    preserve_host: form.fields.preserve_host,
    https_redirect_status_code: form.fields.https_redirect_status_code,
    protocols: form.fields.protocols.split(',') as Protocol[],
    request_buffering: form.fields.request_buffering,
    response_buffering: form.fields.response_buffering,
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

const saveFormData = async (payload?: RoutePayload): Promise<void> => {
  const validPayload: RoutePayload = (payload && isRoutePayloadValid(payload)) ? payload : getPayload()

  try {
    form.isReadonly = true

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
    form.errorMessage = getMessageFromError(error)
    emit('error', error as AxiosError)
  } finally {
    form.isReadonly = false
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
    form.fields.service_id = props.serviceId
  }
})

onMounted(() => {
  emit('model-updated', getPayload())
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
@import '../styles/mixins';

.kong-ui-entities-route-form {
  width: 100%;

  .route-form {
    &-service-dropdown-item {
      display: flex;
      flex-direction: column;

      .select-item-label {
        font-weight: $kui-font-weight-bold;
      }
      .select-item-description {
        color: $kui-color-text-neutral;
      }
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

    &-advanced-fields-container {
      margin-top: $kui_space_80;
    }

    &-fields-container {
      > * {
        &:not(:first-child) {
          margin-top: $kui_space_80;
        }
      }
    }
  }
  .k-select-selected-item-label {
    margin-left: 30px;
  }

  .k-checkbox {
    display: flex;
  }
}
</style>
