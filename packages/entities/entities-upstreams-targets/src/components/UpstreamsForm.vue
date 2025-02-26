<template>
  <div class="kong-ui-entities-upstreams-form">
    <EntityBaseForm
      :can-submit="isFormValid && changesExist"
      :config="config"
      :edit-id="upstreamId"
      :entity-type="SupportedEntityType.Upstream"
      :error-message="state.errorMessage"
      :fetch-url="fetchUrl"
      :form-fields="getPayload"
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
        :readonly="state.readonly"
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
        v-model:http-failures="state.fields.activeHealthCheck.httpFailures"
        v-model:http-path="state.fields.activeHealthCheck.httpPath"
        v-model:http-statuses="state.fields.activeHealthCheck.httpStatuses"
        v-model:https-sni="state.fields.activeHealthCheck.httpsSni"
        v-model:interval="state.fields.activeHealthCheck.interval"
        v-model:successes="state.fields.activeHealthCheck.successes"
        v-model:tcp-failures="state.fields.activeHealthCheck.tcpFailures"
        v-model:timeout="state.fields.activeHealthCheck.timeout"
        v-model:type="state.fields.activeHealthCheck.type"
        v-model:unhealthy-http-statuses="state.fields.activeHealthCheck.unhealthyHttpStatuses"
        v-model:unhealthy-interval="state.fields.activeHealthCheck.unhealthyInterval"
        v-model:unhealthy-timeouts="state.fields.activeHealthCheck.unhealthyTimeouts"
        v-model:verify-ssl="state.fields.activeHealthCheck.verifySsl"
        :config="config"
        :readonly="state.readonly"
      />

      <UpstreamsFormPassiveHealthCheck
        v-if="state.fields.passiveHealthSwitch"
        v-model:http-failures="state.fields.passiveHealthCheck.httpFailures"
        v-model:http-statuses="state.fields.passiveHealthCheck.httpStatuses"
        v-model:successes="state.fields.passiveHealthCheck.successes"
        v-model:tcp-failures="state.fields.passiveHealthCheck.tcpFailures"
        v-model:timeouts="state.fields.passiveHealthCheck.timeouts"
        v-model:type="state.fields.passiveHealthCheck.type"
        v-model:unhealthy-http-statuses="state.fields.passiveHealthCheck.unhealthyHttpStatuses"
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
  (e: 'update', data: UpstreamResponse): void,
  (e: 'error', error: AxiosError): void,
  (e: 'loading', isLoading: boolean): void,
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
  state.fields.activeHealthCheck.interval = val ? '5' : '0'
  state.fields.activeHealthCheck.successes = val ? '5' : '0'
  state.fields.activeHealthCheck.httpFailures = val ? '5' : '0'
  state.fields.activeHealthCheck.unhealthyInterval = val ? '5' : '0'
  state.fields.activeHealthCheck.tcpFailures = val ? '5' : '0'
}

const resetOnPassiveSwitch = (val: boolean): void => {
  state.fields.passiveHealthCheck.timeouts = val ? '5' : '0'
  state.fields.passiveHealthCheck.successes = val ? '80' : '0'
  state.fields.passiveHealthCheck.tcpFailures = val ? '5' : '0'
  state.fields.passiveHealthCheck.httpFailures = val ? '5' : '0'
}

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

const getBasePayload = (): UpstreamFormPayload => ( {
  name: state.fields.name,
  slots: Number(state.fields.slots),
  algorithm: state.fields.algorithm,
  hash_on: state.fields.hashOn,
  hash_fallback: state.fields.hashFallback,
  healthchecks: {
    threshold : Number(state.fields.healthchecksThreshold || '0'),
  },
  host_header : state.fields.hostHeader || null,
  client_certificate : state.fields.clientCertificate ? { id: state.fields.clientCertificate } : null,
})

const getHashingConfig = (payload: UpstreamFormPayload): void => {
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
}

const getActiveHealthChecks = (): UpstreamActivePayload | undefined => {
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
        },
      }
    }
    return undefined
  }

  const active: UpstreamActivePayload = {
    type: state.fields.activeHealthCheck.type,
    healthy: {
      interval: Number(state.fields.activeHealthCheck.interval || '0'),
      successes: Number(state.fields.activeHealthCheck.successes || '5'),
    },
    unhealthy: {
      interval: Number(state.fields.activeHealthCheck.interval || '0'),
      timeouts: Number(state.fields.activeHealthCheck.successes || '0'),
      tcp_failures: Number(state.fields.activeHealthCheck.tcpFailures || '5'),
    },
    timeout: Number(state.fields.activeHealthCheck.timeout || '1'),
    concurrency: Number(state.fields.activeHealthCheck.concurrency || '10'),
  }

  // Add HTTP-specific configurations
  if (state.fields.activeHealthCheck.type !== 'tcp') {
    active.http_path = state.fields.activeHealthCheck.httpPath || '/'
    active.unhealthy.http_failures = Number(state.fields.activeHealthCheck.httpFailures || '5')
    // Use default ActiveUnhealthyHttpStatuses if unhealthyHttpStatuses is null, empty, or undefined
    const unHealthyStatuses = (!state.fields.activeHealthCheck.unhealthyHttpStatuses?.length)
      ? ActiveUnhealthyHttpStatuses
      : state.fields.activeHealthCheck.unhealthyHttpStatuses
    active.unhealthy.http_statuses = stringToNumberArray(unHealthyStatuses)

    // Use default ActiveHealthyHttpStatuses if httpStatuses is null, empty, or undefined
    const healthyStatuses = (!state.fields.activeHealthCheck.httpStatuses?.length)
      ? ActiveHealthyHttpStatuses
      : state.fields.activeHealthCheck.httpStatuses
    active.healthy.http_statuses = stringToNumberArray(healthyStatuses)
  }

  // Add HTTPS/GRPCS specific configurations
  if (['https', 'grpcs'].includes(state.fields.activeHealthCheck.type)) {
    active.https_sni = state.fields.activeHealthCheck.httpsSni || null
    active.https_verify_certificate = state.fields.activeHealthCheck.verifySsl
  }

  // Add headers for Kong Manager
  if (props.config?.app === 'kongManager') {
    active.headers = state.fields.activeHealthCheck.headers.reduce((obj, item) => {
      if (!item.key) return obj
      return {
        ...obj,
        [item.key]: item.values.split(',')
          ?.map((val: string) => val.trim())
          ?.filter(Boolean),
      }
    }, {})
  }

  return active
}

const getPassiveHealthChecks = (): UpstreamPassivePayload | undefined => {
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
      successes: Number(state.fields.passiveHealthCheck.successes || '0'),
    },
    unhealthy: {
      timeouts: Number(state.fields.passiveHealthCheck.timeouts || '0'),
      tcp_failures: Number(state.fields.passiveHealthCheck.tcpFailures || '5'),
    },
  }

  if (state.fields.passiveHealthCheck.type !== 'tcp') {
    passive.unhealthy.http_failures = Number(state.fields.passiveHealthCheck.httpFailures || '5')
    // Use default PassiveHealthyHttpStatuses if httpStatuses is null, empty, or undefined
    const healthyStatuses = (!state.fields.passiveHealthCheck.httpStatuses?.length)
      ? PassiveHealthyHttpStatuses
      : state.fields.passiveHealthCheck.httpStatuses
    passive.healthy.http_statuses = stringToNumberArray(healthyStatuses)

    // Use default PassiveUnhealthyHttpStatuses if unhealthyHttpStatuses is null, empty, or undefined
    const unHealthyStatuses = (!state.fields.passiveHealthCheck.unhealthyHttpStatuses?.length)
      ? PassiveUnhealthyHttpStatuses
      : state.fields.passiveHealthCheck.unhealthyHttpStatuses
    passive.unhealthy.http_statuses = stringToNumberArray(unHealthyStatuses)
  }

  return passive
}

const getPayload = computed((): UpstreamFormPayload => {
  const payload = getBasePayload()

  payload.tags = state.fields.tags
    ? state.fields.tags.split(',')
      .map((tag: string) => String(tag || '')
        .trim())
      .filter((tag: string) => tag !== '')
    : []

  // Add hashing configuration
  getHashingConfig(payload)

  // Add health checks configuration
  const active = getActiveHealthChecks()
  if (active) {
    payload.healthchecks.active = active
  }

  const passive = getPassiveHealthChecks()
  if (passive) {
    payload.healthchecks.passive = passive
  }

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

    await axiosInstance.post(getUrl('validate'), getPayload.value)

    let response: AxiosResponse | undefined

    if (formType.value === EntityBaseFormType.Create) {
      response = await axiosInstance.post(getUrl('create'), getPayload.value)
    } else if (formType.value === EntityBaseFormType.Edit) {
      response = props.config?.app === 'konnect'
        ? await axiosInstance.put(getUrl('edit'), getPayload.value)
        : await axiosInstance.patch(getUrl('edit'), getPayload.value)
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
