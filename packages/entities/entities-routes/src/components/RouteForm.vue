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
        :description="i18n.t('form.sections.general.description')"
        :hide-info-header="hideSectionsInfo"
        :title="i18n.t('form.sections.general.title')"
      >
        <KInput
          v-if="!hideNameField"
          v-model.trim="state.fields.name"
          autocomplete="off"
          data-testid="route-form-name"
          :label="i18n.t('form.fields.name.label')"
          :placeholder="i18n.t('form.fields.name.placeholder')"
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
            :label="i18n.t('form.fields.service_id.label')"
            :loading="loadingServices"
            :placeholder="i18n.t('form.fields.service_id.placeholder')"
            :readonly="state.isReadonly"
            reuse-item-template
            width="100%"
            @query-change="debouncedServicesQuery"
          >
            <template #loading>
              <div>{{ i18n.t('actions.loading') }}</div>
            </template>
            <template #empty>
              <div data-testid="no-search-results">
                {{ i18n.t('search.no_results') }}
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
          :help="i18n.t('form.fields.tags.help')"
          :label="i18n.t('form.fields.tags.label')"
          :placeholder="i18n.t('form.fields.tags.placeholder')"
          :readonly="state.isReadonly"
          type="text"
        />
      </EntityFormSection>

      <EntityFormSection
        :description="i18n.t('form.sections.config.description')"
        :hide-info-header="hideSectionsInfo"
        :title="i18n.t('form.sections.config.title')"
      >
        <KSelect
          v-model="state.fields.protocols"
          data-testid="route-form-protocols"
          :items="protocols"
          :label="i18n.t('form.fields.protocols.label')"
          :label-attributes="{
            info: i18n.t('form.fields.protocols.tooltip'),
            tooltipAttributes: { maxWidth: '400' },
          }"
          :readonly="state.isReadonly"
          required
          width="100%"
        />

        <RouteRulesComposer
          v-model:custom-methods="customMethods"
          v-model:fields="state.fields"
          v-model:hash="currentConfigHash"
          v-model:tags="state.fields.tags"
          :protocols="state.fields.protocols"
          :readonly="state.isReadonly"
          :record-flavor="recordFlavor"
          :route-flavors="routeFlavors"
          :show-expressions-modal-entry="showExpressionsModalEntry"
          :tooltips="configTabTooltips"
          @notify="emit('notify', $event)"
          @update:payload="rulesPayload = $event"
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
import { computed, onBeforeMount, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import composables from '../composables'
import { INITIAL_SHARED_ROUTE_RULES_FIELDS, INITIAL_TRADITIONAL_ROUTE_RULES_VALUES } from '../constants'
import endpoints from '../routes-endpoints'
import type {
  BaseRoutePayload,
  BaseRouteStateFields,
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
  RouteFlavor,
  RoutingRulesEntities,
  stateHasExpressionsFlavor,
  stateHasTraditionalFlavor,
} from '../types'
import RouteRulesComposer from './RouteFormRulesComposer.vue'

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

const { i18n } = composables.useI18n()
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
    protocols: 'http,https',
    tags: '',
    service_id: '',
    ...INITIAL_SHARED_ROUTE_RULES_FIELDS,
    ...{
      ...(!props.routeId && { paths: [''] }), // We don't expect this prop to be updated throughout the lifecycle of the component
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
})

const rulesPayload = ref<TypedRouteRulesPayload>()
const customMethods = ref<string[]>([''])

const originalFields = reactive<BaseRouteStateFields & TraditionalRouteRulesFields & ExpressionsRouteRulesFields>({
  name: '',
  protocols: 'http,https',
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

const protocols = [
  { label: i18n.t('form.protocols.grpc'), value: 'grpc' },
  { label: i18n.t('form.protocols.grpcs'), value: 'grpcs' },
  { label: i18n.t('form.protocols.grpc,grpcs'), value: 'grpc,grpcs' },
  { label: i18n.t('form.protocols.http'), value: 'http' },
  { label: i18n.t('form.protocols.https'), value: 'https' },
  { label: i18n.t('form.protocols.http,https'), value: 'http,https' },
  { label: i18n.t('form.protocols.tcp'), value: 'tcp' },
  { label: i18n.t('form.protocols.tls'), value: 'tls' },
  { label: i18n.t('form.protocols.tls,udp'), value: 'tls,udp' },
  { label: i18n.t('form.protocols.tcp,udp'), value: 'tcp,udp' },
  { label: i18n.t('form.protocols.tcp,tls'), value: 'tcp,tls' },
  { label: i18n.t('form.protocols.tcp,tls,udp'), value: 'tcp,tls,udp' },
  { label: i18n.t('form.protocols.tls_passthrough'), value: 'tls_passthrough' },
  { label: i18n.t('form.protocols.udp'), value: 'udp' },
  ...(
    isWsSupported
      ? [
        { label: i18n.t('form.protocols.ws'), value: 'ws' },
        { label: i18n.t('form.protocols.wss'), value: 'wss' },
        { label: i18n.t('form.protocols.ws,wss'), value: 'ws,wss' },
      ]
      : []
  ),
]

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

    state.fields.methods = { ...INITIAL_TRADITIONAL_ROUTE_RULES_VALUES[RoutingRulesEntities.METHODS] }
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

const fetchServicesErrorMessage = computed((): string => servicesFetchError.value ? i18n.t('errors.services.fetch') : '')

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
      display: flex;
      flex-direction: column;
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
