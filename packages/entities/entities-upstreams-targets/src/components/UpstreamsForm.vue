<template>
  <div class="kong-ui-entities-upstreams-form">
    <EntityBaseForm
      :can-submit="isFormValid && changesExist"
      :config="config"
      :edit-id="upstreamId"
      :entity-type="SupportedEntityType.Upstream"
      :error-message="state.errorMessage"
      :fetch-url="fetchUrl"
      :form-fields="upstreamPayload"
      :is-readonly="state.readonly"
      @cancel="cancelHandler"
      @fetch:error="fetchErrorHandler"
      @fetch:success="updateFormValues"
      @loading="loadingHandler"
      @submit="submitData"
    >
      <UpstreamsFormGeneralInfo
        v-model:client-certificate="state.fields.clientCertificate"
        v-model:host-header="state.fields.hostHeader"
        v-model:name="state.fields.name"
        v-model:tags="state.fields.tags"
        :config="config"
        :readonly="state.readonly"
      />

      <UpstreamsFormLoadBalancing
        v-model:algorithm="state.fields.algorithm"
        v-model:hash-fallback="state.fields.hashFallback"
        v-model:hash-fallback-header="state.fields.hashFallbackHeader"
        v-model:hash-fallback-query-argument="state.fields.hashFallbackQueryArgument"
        v-model:hash-fallback-uri-capture="state.fields.hashFallbackUriCapture"
        v-model:hash-on="state.fields.hashOn"
        v-model:hash-on-cookie="state.fields.hashOnCookie"
        v-model:hash-on-cookie-path="state.fields.hashOnCookiePath"
        v-model:hash-on-header="state.fields.hashOnHeader"
        v-model:hash-on-query-argument="state.fields.hashOnQueryArgument"
        v-model:hash-on-uri-capture="state.fields.hashOnUriCapture"
        v-model:slots="state.fields.slots"
        v-model:sticky-sessions-cookie="state.fields.stickySessionsCookie"
        v-model:sticky-sessions-cookie-path="state.fields.stickySessionsCookiePath"
        :readonly="state.readonly"
        :sticky-sessions-available="config.stickySessionsAvailable"
      />

      <UpstreamsFormHealthChecks
        v-model:active-health-switch="state.fields.activeHealthSwitch"
        v-model:healthchecks-threshold="state.fields.healthchecksThreshold"
        v-model:passive-health-switch="state.fields.passiveHealthSwitch"
        :readonly="state.readonly"
        @update:active-health-switch="resetOnActiveSwitch"
        @update:passive-health-switch="resetOnPassiveSwitch"
      />

      <UpstreamsFormActiveHealthCheck
        v-if="state.fields.activeHealthSwitch"
        v-model:concurrency="state.fields.activeHealthCheck.concurrency"
        v-model:headers="state.fields.activeHealthCheck.headers"
        v-model:healthy-http-statuses="state.fields.activeHealthCheck.healthy.httpStatuses"
        v-model:healthy-interval="state.fields.activeHealthCheck.healthy.interval"
        v-model:healthy-successes="state.fields.activeHealthCheck.healthy.successes"
        v-model:http-path="state.fields.activeHealthCheck.httpPath"
        v-model:https-sni="state.fields.activeHealthCheck.httpsSni"
        v-model:timeout="state.fields.activeHealthCheck.timeout"
        v-model:type="state.fields.activeHealthCheck.type"
        v-model:unhealthy-http-failures="state.fields.activeHealthCheck.unhealthy.httpFailures"
        v-model:unhealthy-http-statuses="state.fields.activeHealthCheck.unhealthy.httpStatuses"
        v-model:unhealthy-interval="state.fields.activeHealthCheck.unhealthy.interval"
        v-model:unhealthy-tcp-failures="state.fields.activeHealthCheck.unhealthy.tcpFailures"
        v-model:unhealthy-timeouts="state.fields.activeHealthCheck.unhealthy.timeouts"
        v-model:verify-ssl="state.fields.activeHealthCheck.verifySsl"
        :config="config"
        :readonly="state.readonly"
      />

      <UpstreamsFormPassiveHealthCheck
        v-if="state.fields.passiveHealthSwitch"
        v-model:healthy-http-statuses="state.fields.passiveHealthCheck.healthy.httpStatuses"
        v-model:healthy-successes="state.fields.passiveHealthCheck.healthy.successes"
        v-model:type="state.fields.passiveHealthCheck.type"
        v-model:unhealthy-http-failures="state.fields.passiveHealthCheck.unhealthy.httpFailures"
        v-model:unhealthy-http-statuses="state.fields.passiveHealthCheck.unhealthy.httpStatuses"
        v-model:unhealthy-tcp-failures="state.fields.passiveHealthCheck.unhealthy.tcpFailures"
        v-model:unhealthy-timeouts="state.fields.passiveHealthCheck.unhealthy.timeouts"
        :readonly="state.readonly"
      />
    </EntityBaseForm>
  </div>
</template>

<script lang="ts" setup>
import { computed, reactive, type PropType } from 'vue'
import { useRouter } from 'vue-router'
import type { AxiosError, AxiosResponse } from 'axios'
import {
  EntityBaseForm,
  EntityBaseFormType,
  SupportedEntityType,
  useAxios,
  useErrors,
} from '@kong-ui-public/entities-shared'
import UpstreamsFormGeneralInfo from './UpstreamsFormGeneralInfo.vue'
import UpstreamsFormLoadBalancing from './UpstreamsFormLoadBalancing.vue'
import UpstreamsFormHealthChecks from './UpstreamsFormHealthChecks.vue'
import UpstreamsFormActiveHealthCheck from './UpstreamsFormActiveHealthCheck.vue'
import UpstreamsFormPassiveHealthCheck from './UpstreamsFormPassiveHealthCheck.vue'
import '@kong-ui-public/entities-shared/dist/style.css'
import type {
  KongManagerUpstreamsFormConfig,
  KonnectUpstreamsFormConfig,
  UpstreamFormFields,
  UpstreamFormPayload,
  UpstreamActivePayload,
  UpstreamPassivePayload,
  UpstreamFormState,
  UpstreamResponse,
  UpstreamsFormActions,
} from '../types'
import useHelpers from '../composables/useHelpers'
import endpoints from '../upstreams-endpoints'
import {
  ActiveHealthyHttpStatuses,
  ActiveUnhealthyHttpStatuses,
  PassiveHealthyHttpStatuses,
  PassiveUnhealthyHttpStatuses,
  SlotsMaxNumber,
  SlotsMinNumber,
} from '../constants'

const props = defineProps({
  /** The base konnect or kongManger config. Pass additional config props in the shared entity component as needed. */
  config: {
    type: Object as PropType<KonnectUpstreamsFormConfig | KongManagerUpstreamsFormConfig>,
    required: true,
    validator: (config: KonnectUpstreamsFormConfig | KongManagerUpstreamsFormConfig): boolean => {
      if (!config || !['konnect', 'kongManager'].includes(config?.app)) return false
      if (config?.app === 'konnect' && !config?.controlPlaneId) return false
      if (config?.app === 'kongManager' && typeof config?.workspace !== 'string') return false
      if (!config?.cancelRoute) return false
      return true
    },
  },
  /** If a valid upstreamId is provided, it will put the form in Edit mode instead of Create */
  upstreamId: {
    type: String,
    required: false,
    default: '',
  },
})

const emit = defineEmits<{
  (e: 'update', data: UpstreamResponse): void
  (e: 'error', error: AxiosError): void
  (e: 'loading', isLoading: boolean): void
}>()

const { inRange, stringToNumberArray, upstreamsResponseToFields, getDefaultUpstreamFields, objectsAreEqual, cloneDeep } =
  useHelpers()
const { axiosInstance } = useAxios(props.config?.axiosRequestConfig)
const { getMessageFromError } = useErrors()
const router = useRouter()

const state = reactive<UpstreamFormState>({
  fields: getDefaultUpstreamFields(),
  readonly: false,
  errorMessage: '',
})

const originalFields = reactive<UpstreamFormFields>(getDefaultUpstreamFields())

const changesExist = computed(() => {
  return !objectsAreEqual(state.fields, originalFields)
})

const resetOnActiveSwitch = (val: boolean): void => {
  state.fields.activeHealthCheck.healthy.interval = val ? '5' : '0'
  state.fields.activeHealthCheck.healthy.successes = val ? '5' : '0'
  state.fields.activeHealthCheck.healthy.httpStatuses = val ? ActiveHealthyHttpStatuses : []
  state.fields.activeHealthCheck.unhealthy.httpStatuses = val ? ActiveUnhealthyHttpStatuses : []
  state.fields.activeHealthCheck.unhealthy.httpFailures = val ? '5' : '0'
  state.fields.activeHealthCheck.unhealthy.interval = val ? '5' : '0'
  state.fields.activeHealthCheck.unhealthy.tcpFailures = val ? '5' : '0'
  state.fields.activeHealthCheck.unhealthy.timeouts = val ? '5' : '0'
  state.fields.activeHealthCheck.timeout = val ? '1' : '0'
  state.fields.activeHealthCheck.concurrency = val ? '10' : '0'
  state.fields.activeHealthCheck.httpPath = val ? '/' : ''
  state.fields.activeHealthCheck.httpsSni = ''
  state.fields.activeHealthCheck.type = 'http'
}

const resetOnPassiveSwitch = (val: boolean): void => {
  state.fields.passiveHealthCheck.healthy.successes = val ? '80' : '0'
  state.fields.passiveHealthCheck.healthy.httpStatuses = val ? PassiveHealthyHttpStatuses : []
  state.fields.passiveHealthCheck.unhealthy.timeouts = val ? '5' : '0'
  state.fields.passiveHealthCheck.unhealthy.tcpFailures = val ? '5' : '0'
  state.fields.passiveHealthCheck.unhealthy.httpFailures = val ? '5' : '0'
  state.fields.passiveHealthCheck.unhealthy.httpStatuses = val ? PassiveUnhealthyHttpStatuses : []
  state.fields.passiveHealthCheck.type = 'http'
}

const isStickySessionsValid = computed((): boolean => {
  if (state.fields.algorithm !== 'sticky-sessions') {
    return true
  }
  return !!state.fields.stickySessionsCookie && !!state.fields.stickySessionsCookiePath
})

const isSlotsValid = computed((): boolean => state.fields.slots
  ? inRange(state.fields.slots, SlotsMinNumber, SlotsMaxNumber)
  : true)

const isHashOnHeaderValid = computed((): boolean => state.fields.hashOn === 'header' ? !!state.fields.hashOnHeader : true)

const isHashOnCookieValid = computed((): boolean => (state.fields.hashOn === 'cookie' || state.fields.hashFallback === 'cookie') ? !!state.fields.hashOnCookie : true)

const isHashOnCookiePathValid = computed((): boolean => (state.fields.hashOn === 'cookie' || state.fields.hashFallback === 'cookie') ? !!state.fields.hashOnCookiePath : true)

const isHashOnQueryArgumentValid = computed((): boolean => state.fields.hashOn === 'query_arg' ? !!state.fields.hashOnQueryArgument : true)

const isHashOnUriCaptureValid = computed((): boolean => state.fields.hashOn === 'uri_capture' ? !!state.fields.hashOnUriCapture : true)

const isHashFallbackHeaderValid = computed((): boolean => state.fields.hashFallback === 'header' ? !!state.fields.hashFallbackHeader : true)

const isHashFallbackQueryArgumentValid = computed((): boolean => state.fields.hashFallback === 'query_arg'
  ? !!state.fields.hashFallbackQueryArgument
  : true)

const isHashFallbackUriCaptureValid = computed((): boolean => state.fields.hashFallback === 'uri_capture'
  ? !!state.fields.hashFallbackUriCapture
  : true)

const isFormValid = computed((): boolean =>
  !!state.fields.name &&
  isStickySessionsValid.value &&
  isSlotsValid.value &&
  isHashOnHeaderValid.value &&
  isHashOnCookieValid.value &&
  isHashOnCookiePathValid.value &&
  isHashOnQueryArgumentValid.value &&
  isHashOnUriCaptureValid.value &&
  isHashFallbackHeaderValid.value &&
  isHashFallbackQueryArgumentValid.value &&
  isHashFallbackUriCaptureValid.value)

const formType = computed((): EntityBaseFormType => props.upstreamId
  ? EntityBaseFormType.Edit
  : EntityBaseFormType.Create)

const fetchUrl = computed<string>(() => endpoints.form[props.config?.app]?.edit)

const updateFormValues = (data: Record<string, any>): void => {
  Object.assign(state.fields, upstreamsResponseToFields(data as UpstreamResponse))
  Object.assign(originalFields, cloneDeep(state.fields))
}

const cancelHandler = (): void => {
  router.push(props.config?.cancelRoute || { name: 'upstreams-list' })
}

const loadingHandler = (val: boolean): void => {
  emit('loading', val)
}

const fetchErrorHandler = (err: AxiosError): void => {
  emit('error', err)
}

const stickySessions = computed((): Partial<UpstreamFormPayload> => {
  const payload: Partial<UpstreamFormPayload> = props.config.stickySessionsAvailable
    ? {
      sticky_sessions_cookie: null,
      sticky_sessions_cookie_path: null,
    }
    : {}

  if (state.fields.algorithm === 'sticky-sessions') {
    payload.sticky_sessions_cookie = state.fields.stickySessionsCookie || null
    payload.sticky_sessions_cookie_path = state.fields.stickySessionsCookiePath || null
  }

  return payload
})

const hashingConfig = computed((): Partial<UpstreamFormPayload> => {
  const payload: Partial<UpstreamFormPayload> = {}

  if (state.fields.hashOn === 'header') {
    payload.hash_on_header = state.fields.hashOnHeader
  }

  if (state.fields.hashOn === 'cookie' || state.fields.hashFallback === 'cookie') {
    payload.hash_on_cookie = state.fields.hashOnCookie
    payload.hash_on_cookie_path = state.fields.hashOnCookiePath
  }

  if (state.fields.hashOn === 'query_arg') {
    payload.hash_on_query_arg = state.fields.hashOnQueryArgument
  }

  if (state.fields.hashOn === 'uri_capture') {
    payload.hash_on_uri_capture = state.fields.hashOnUriCapture
  }

  if (state.fields.hashFallback === 'header') {
    payload.hash_fallback_header = state.fields.hashFallbackHeader
  }

  if (state.fields.hashFallback === 'query_arg') {
    payload.hash_fallback_query_arg = state.fields.hashFallbackQueryArgument
  }

  if (state.fields.hashFallback === 'uri_capture') {
    payload.hash_fallback_uri_capture = state.fields.hashFallbackUriCapture
  }

  return payload
})

const activeHealthChecks = computed((): UpstreamActivePayload | undefined => {
  if (!state.fields.activeHealthSwitch) {
    // Return early if active health checks are disabled
    if (props.config?.app === 'kongManager' && formType.value === EntityBaseFormType.Edit) {
      return {
        type: state.fields.activeHealthCheck.type,
        headers: {},
        healthy: {
          interval: 0,
          successes: 0,
        },
        unhealthy: {
          interval: 0,
          http_failures: 0,
          tcp_failures: 0,
          timeouts: 0,
        },
      }
    }
    return undefined
  }

  const active: UpstreamActivePayload = {
    type: state.fields.activeHealthCheck.type,
    healthy: {
      interval: Number(state.fields.activeHealthCheck.healthy.interval || '0'),
      successes: Number(state.fields.activeHealthCheck.healthy.successes || '0'),
    },
    unhealthy: {
      interval: Number(state.fields.activeHealthCheck.unhealthy.interval || '0'),
      timeouts: Number(state.fields.activeHealthCheck.unhealthy.timeouts || '0'),
      tcp_failures: Number(state.fields.activeHealthCheck.unhealthy.tcpFailures || '0'),
    },
    timeout: Number(state.fields.activeHealthCheck.timeout || '1'),
    concurrency: Number(state.fields.activeHealthCheck.concurrency || '10'),
  }

  // Add HTTP-specific configurations
  if (state.fields.activeHealthCheck.type !== 'tcp') {
    active.http_path = state.fields.activeHealthCheck.httpPath || '/'
    active.unhealthy.http_failures = Number(state.fields.activeHealthCheck.unhealthy.httpFailures || '5')
    // Use default ActiveUnhealthyHttpStatuses if unhealthyHttpStatuses is null, empty, or undefined
    const unHealthyStatuses = (!state.fields.activeHealthCheck.unhealthy.httpStatuses?.length)
      ? ActiveUnhealthyHttpStatuses
      : state.fields.activeHealthCheck.unhealthy.httpStatuses
    active.unhealthy.http_statuses = stringToNumberArray(unHealthyStatuses)

    // Use default ActiveHealthyHttpStatuses if httpStatuses is null, empty, or undefined
    const healthyStatuses = (!state.fields.activeHealthCheck.healthy.httpStatuses?.length)
      ? ActiveHealthyHttpStatuses
      : state.fields.activeHealthCheck.healthy.httpStatuses
    active.healthy.http_statuses = stringToNumberArray(healthyStatuses)
  }

  // Add HTTPS/GRPCS specific configurations
  if (['https', 'grpcs'].includes(state.fields.activeHealthCheck.type)) {
    active.https_sni = state.fields.activeHealthCheck.httpsSni || null
    active.https_verify_certificate = state.fields.activeHealthCheck.verifySsl
  }

  // Add headers for both Konnect and Kong Manager
  active.headers = state.fields.activeHealthCheck.headers.reduce((obj, item) => {
    if (!item.key) return obj
    return {
      ...obj,
      [item.key]: item.values.split(',')
        ?.map((val: string) => val.trim())
        ?.filter(Boolean),
    }
  }, {})

  return active
})

const passiveHealthChecks = computed((): UpstreamPassivePayload | undefined => {
  if (!state.fields.passiveHealthSwitch) {
    // Return early if passive health checks are disabled
    if (props.config?.app === 'kongManager' && formType.value === EntityBaseFormType.Edit) {
      return {
        type: state.fields.passiveHealthCheck.type,
        healthy: { successes: 0 },
        unhealthy: {
          timeouts: 0,
          tcp_failures: 0,
          http_failures: 0,
        },
      }
    }
    return undefined
  }

  const passive: UpstreamPassivePayload = {
    type: state.fields.passiveHealthCheck.type,
    healthy: {
      successes: Number(state.fields.passiveHealthCheck.healthy.successes || '0'),
    },
    unhealthy: {
      timeouts: Number(state.fields.passiveHealthCheck.unhealthy.timeouts || '0'),
      tcp_failures: Number(state.fields.passiveHealthCheck.unhealthy.tcpFailures || '5'),
    },
  }

  if (state.fields.passiveHealthCheck.type !== 'tcp') {
    passive.unhealthy.http_failures = Number(state.fields.passiveHealthCheck.unhealthy.httpFailures || '5')
    // Use default PassiveHealthyHttpStatuses if httpStatuses is null, empty, or undefined
    const healthyStatuses = (!state.fields.passiveHealthCheck.healthy.httpStatuses?.length)
      ? PassiveHealthyHttpStatuses
      : state.fields.passiveHealthCheck.healthy.httpStatuses
    passive.healthy.http_statuses = stringToNumberArray(healthyStatuses)

    // Use default PassiveUnhealthyHttpStatuses if unhealthyHttpStatuses is null, empty, or undefined
    const unHealthyStatuses = (!state.fields.passiveHealthCheck.unhealthy.httpStatuses?.length)
      ? PassiveUnhealthyHttpStatuses
      : state.fields.passiveHealthCheck.unhealthy.httpStatuses
    passive.unhealthy.http_statuses = stringToNumberArray(unHealthyStatuses)
  }

  return passive
})

const upstreamPayload = computed((): UpstreamFormPayload => {
  const basePayload = {
    name: state.fields.name,
    slots: Number(state.fields.slots),
    algorithm: state.fields.algorithm,
    hash_on: state.fields.hashOn,
    hash_fallback: state.fields.hashFallback,
    healthchecks: {
      threshold: Number(state.fields.healthchecksThreshold || '0'),
    },
    host_header: state.fields.hostHeader || null,
    client_certificate: state.fields.clientCertificate ? { id: state.fields.clientCertificate } : null,
  }
  const active = activeHealthChecks.value
  const passive = passiveHealthChecks.value

  const payload: UpstreamFormPayload = {
    ...basePayload,
    ...stickySessions.value,
    healthchecks: {
      ...basePayload.healthchecks,
      active: active || undefined,
      passive: passive || undefined,
    },
  }

  payload.tags = state.fields.tags
    ? state.fields.tags.split(',')
      .map((tag: string) => String(tag || '')
        .trim())
      .filter((tag: string) => tag !== '')
    : []

  // Add hashing configuration
  Object.assign(payload, hashingConfig.value)

  return payload
})

const getUrl = (action: UpstreamsFormActions): string => {
  let url = `${props.config?.apiBaseUrl}${endpoints.form[props.config?.app][action]}`

  if (props.config?.app === 'konnect') {
    url = url.replace(/{controlPlaneId}/gi, props.config?.controlPlaneId || '')
  } else if (props.config?.app === 'kongManager') {
    url = url.replace(/\/{workspace}/gi, props.config?.workspace ? `/${props.config.workspace}` : '')
  }

  url = url.replace(/{id}/gi, props.upstreamId)

  return url
}

const submitData = async (): Promise<void> => {
  try {
    state.readonly = true

    let response: AxiosResponse | undefined

    if (formType.value === EntityBaseFormType.Create) {
      response = await axiosInstance.post(getUrl('create'), upstreamPayload.value)
    } else if (formType.value === EntityBaseFormType.Edit) {
      response = props.config?.app === 'konnect'
        ? await axiosInstance.put(getUrl('edit'), upstreamPayload.value)
        : await axiosInstance.patch(getUrl('edit'), upstreamPayload.value)
    }

    emit('update', response?.data as UpstreamResponse)
  } catch (e) {
    state.errorMessage = getMessageFromError(e)
    emit('error', e as AxiosError)
  } finally {
    state.readonly = false
  }
}
</script>

<style scoped lang="scss">
.kong-ui-entities-upstreams-form {
  width: 100%;

  @media screen and (min-width: $kui-breakpoint-laptop) {
    &:deep(.form-section-wrapper) {
      column-gap: $kui-space-130;
    }
  }
}
</style>
