<template>
  <div class="kong-ui-entities-route-form">
    <EntityBaseForm
      :can-submit="isFormValid && changesExist"
      :config="config"
      :edit-id="routeId"
      :entity-type="SupportedEntityType.Route"
      :error-message="state.errorMessage || fetchServicesErrorMessage"
      :fetch-url="fetchUrl"
      :form-fields="payload"
      :is-readonly="state.isReadonly"
      @cancel="cancelHandler"
      @fetch:error="fetchErrorHandler"
      @fetch:success="updateFormValues"
      @loading="loadingHandler"
      @submit="saveFormData"
    >
      <EntityFormSection
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
        <RouteRulesComposer
          v-model:config-flavor="configFlavor"
          v-model:config-type="configType"
          v-model:custom-methods="customMethods"
          v-model:fields="state.fields"
          :is-ws-supported="isWsSupported"
          :protocols="state.fields.protocols"
          :readonly="state.isReadonly"
          :record-flavor="recordFlavor"
          :route-flavors="routeFlavors"
          :show-expressions-modal-entry="showExpressionsModalEntry"
          :tooltips="configTabTooltips"
          @notify="emit('notify', $event)"
          @update:payload="rulesPayload = $event"
          @update:protocols="state.fields.protocols = $event"
        />
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
import { computed, onBeforeMount, onMounted, reactive, ref, watch, provide } from 'vue'
import { useRouter } from 'vue-router'
import composables from '../composables'
import { INITIAL_SHARED_ROUTE_RULES_FIELDS, INITIAL_TRADITIONAL_ROUTE_RULES_VALUES, DEFAULT_PROTOCOL } from '../constants'
import endpoints from '../routes-endpoints'
import type {
  BaseRoutePayload,
  BaseRouteStateFields,
  CustomMethod,
  ExpressionsRouteRulesFields,
  HeaderFields,
  Headers,
  KongManagerRouteFormConfig,
  KonnectRouteFormConfig,
  Method,
  Protocol,
  RouteFlavors,
  RouteState,
  SharedRouteRulesFields,
  TraditionalRouteRulesFields,
  TypedRouteRulesPayload,
} from '../types'
import {
  Methods,
  RouteFlavor,
  RoutingRulesEntities,
  stateHasExpressionsFlavor,
  stateHasTraditionalFlavor,
} from '../types'
import RouteRulesComposer from './RouteFormRulesComposer.vue'
import { isDefinedByBasic } from '../utilities/helpers'

import '@kong-ui-public/entities-shared/dist/style.css'

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
      [RouteFlavor.TRADITIONAL]?: string
      [RouteFlavor.EXPRESSIONS]?: string
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
  (e: 'update', data: BaseRoutePayload): void
  (e: 'error', error: AxiosError): void
  (e: 'loading', isLoading: boolean): void
  (e: 'model-updated', val: BaseRoutePayload): void
  (e: 'notify', options: { message: string, type: string }): void
}>()

const configType = ref<'basic' | 'advanced'>('basic')
const configFlavor = ref<RouteFlavor>(
  (!props.routeFlavors.traditional && props.routeFlavors.expressions)
    ? RouteFlavor.EXPRESSIONS
    : RouteFlavor.TRADITIONAL,
)
const recordFlavor = ref<RouteFlavor | undefined>(undefined)

const payloadFlavor = computed<RouteFlavor | undefined>(() => {
  if (recordFlavor.value) {
    return recordFlavor.value
  }

  if (configFlavor.value) {
    return configFlavor.value as RouteFlavor
  }

  if (props.routeFlavors.traditional) {
    return RouteFlavor.TRADITIONAL
  } else if (props.routeFlavors.expressions) {
    return RouteFlavor.EXPRESSIONS
  }

  return undefined
})

const { i18n: { t } } = composables.useI18n()
const router = useRouter()
const { axiosInstance } = useAxios(props.config?.axiosRequestConfig)
const { getMessageFromError } = useErrors()

const getSelectedService = (item: any) => {
  return item.name ? `${item.name} - ${item.value}` : item.value
}

/** Declare as BaseRouteStateFields but use type narrowing helper functions to allow accessing more fields */
const state = reactive<RouteState<BaseRouteStateFields & TraditionalRouteRulesFields & ExpressionsRouteRulesFields>>({
  routeFlavors: props.routeFlavors,
  fields: {
    name: '',
    protocols: DEFAULT_PROTOCOL,
    tags: '',
    service_id: '',
    ...INITIAL_SHARED_ROUTE_RULES_FIELDS,
    ...{
      paths: [''],
      snis: [''],
      hosts: [''],
      methods: [],
      headers: [{ ...INITIAL_TRADITIONAL_ROUTE_RULES_VALUES[RoutingRulesEntities.HEADERS][0] }],
      sources: [{ ...INITIAL_TRADITIONAL_ROUTE_RULES_VALUES[RoutingRulesEntities.SOURCES][0] }],
      destinations: [{ ...INITIAL_TRADITIONAL_ROUTE_RULES_VALUES[RoutingRulesEntities.DESTINATIONS][0] }],
      regex_priority: 0,
      path_handling: 'v0',
    } as Omit<TraditionalRouteRulesFields, keyof SharedRouteRulesFields>,
    ...{
      expression: '',
      priority: 0,
    } as Omit<ExpressionsRouteRulesFields, keyof SharedRouteRulesFields>,
  },
  isReadonly: false,
  errorMessage: '',
})

watch(() => props.routeFlavors, (routeFlavors) => {
  state.routeFlavors = routeFlavors

  if (!routeFlavors.traditional) {
    configType.value = 'advanced'
  }
}, { immediate: true, deep: true })

const rulesPayload = ref<TypedRouteRulesPayload>()
const customMethods = ref<Array<{ label: string, value: string }>>([])
const originalCustomMethods = ref<Array<{ label: string, value: string }>>([])

const originalFields = reactive<BaseRouteStateFields & TraditionalRouteRulesFields & ExpressionsRouteRulesFields>({
  name: '',
  protocols: DEFAULT_PROTOCOL,
  tags: '',
  service_id: '',
  ...INITIAL_SHARED_ROUTE_RULES_FIELDS,
  ...{
    path_handling: 'v0',
    regex_priority: 0,
  } as Omit<TraditionalRouteRulesFields, keyof SharedRouteRulesFields>,
  ...{
    expression: '',
    priority: 0,
  } as Omit<ExpressionsRouteRulesFields, keyof SharedRouteRulesFields>,
})

const isWsSupported = props.config.app === 'konnect' || useGatewayFeatureSupported({
  gatewayInfo: props.config.gatewayInfo,
  // 'ws' and 'wss' are not valid values for the protocol field in Gateway Community Edition or before Gateway Enterprise Edition 3.0
  supportedRange: {
    enterprise: ['3.0'],
  },
})

const formType = computed((): EntityBaseFormType => props.routeId
  ? EntityBaseFormType.Edit
  : EntityBaseFormType.Create)

/**
* Generates a unique route name using the current timestamp.
* The name format is "new-route-" followed by numbers from the ISO timestamp.
*
* Example output: "new-route-20250307123045789"
*/
if (formType.value === EntityBaseFormType.Create) {
  state.fields.name = `new-route-${new Date()
    .toISOString() // Convert date to ISO string format (e.g., "2025-03-07T12:30:45.789Z")
    .replace(/\D/g, '') // Remove all non-digit characters
    .slice(0, 17)}` // Take the first 17 digits
}

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

const formatHeaders = (items: Headers): HeaderFields[] => {
  return Object.entries(items).map(item => {
    return { header: item[0], values: item[1]?.join() }
  })
}

const isProtocolSelected = (protocols: string[]): boolean => {
  return protocols.some(protocol => state.fields.protocols.includes(protocol))
}

const updateFormValues = (data: Record<string, any>): void => {
  if (props.routeId) {
    const flavor = typeof data.expression === 'string' && data.expression.length > 0 ? RouteFlavor.EXPRESSIONS : RouteFlavor.TRADITIONAL
    recordFlavor.value = flavor
    if (!isDefinedByBasic(data)) {
      configType.value = 'advanced'
    }
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
      state.fields.methods = data.methods.filter((method: Method) => Object.keys(Methods).includes(method))
      customMethods.value = data.methods.filter((method: Method) => !Object.keys(Methods).includes(method)).map((method: CustomMethod) => ({ label: method, value: method }))
      originalCustomMethods.value = [...customMethods.value]
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
        const destinations = state.fields.destinations ? state.fields.destinations.some(({ ip, port }) => !!ip || !!port) : null
        const sources = state.fields.sources ? state.fields.sources.some(({ ip, port }) => !!ip || !!port) : null
        const methods = state.fields.methods ? !!state.fields.methods.filter(Boolean).length : null

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

const changesExist = computed((): boolean => {
  return !isEqual(state.fields, originalFields) || !isEqual(customMethods.value, originalCustomMethods.value)
})

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
  emit('model-updated', payload.value)
}, { deep: true })

const payload = computed((): BaseRoutePayload => {
  return {
    ...(!props.hideNameField && { name: state.fields.name || null }),
    protocols: state.fields.protocols.split(',') as Protocol[],
    tags: state.fields.tags.split(',')?.map((tag: string) => String(tag || '').trim())?.filter((tag: string) => tag !== ''),
    service: (state.fields.service_id) ? { id: state.fields.service_id } : null,
    ...rulesPayload.value?.payload,
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

const saveFormData = async (uncheckedPayload?: BaseRoutePayload): Promise<void> => {
  const validPayload: BaseRoutePayload = (uncheckedPayload && isRoutePayloadValid(uncheckedPayload)) ? uncheckedPayload : payload.value

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
  emit('model-updated', payload.value)
})

defineExpose({ saveFormData, payload })

provide('configType', configType)
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
        font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
      }

      .select-item-description {
        color: var(--kui-color-text-neutral, $kui-color-text-neutral);
        font-size: var(--kui-font-size-20, $kui-font-size-20);
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
