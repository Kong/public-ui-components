<template>
  <div class="kong-ui-entities-upstreams-form">
    <EntityBaseForm
      :can-submit="isFormValid && changesExist"
      :config="config"
      :edit-id="upstreamId"
      :error-message="state.errorMessage"
      :fetch-url="fetchUrl"
      :form-fields="getPayload()"
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
import {
  EntityBaseForm,
  EntityBaseFormType,
  useAxios,
  useErrors,
} from '@kong-ui-public/entities-shared'
import UpstreamsFormGeneralInfo from './UpstreamsFormGeneralInfo.vue'
import UpstreamsFormLoadBalancing from './UpstreamsFormLoadBalancing.vue'
import UpstreamsFormHealthChecks from './UpstreamsFormHealthChecks.vue'
import UpstreamsFormActiveHealthCheck from './UpstreamsFormActiveHealthCheck.vue'
import UpstreamsFormPassiveHealthCheck from './UpstreamsFormPassiveHealthCheck.vue'
import '@kong-ui-public/entities-shared/dist/style.css'
import type { PropType } from 'vue'
import { computed, reactive } from 'vue'
import type {
  KongManagerUpstreamsFormConfig,
  KonnectUpstreamsFormConfig, UpstreamFormFields,
  UpstreamFormPayload,
  UpstreamFormState, UpstreamResponse, UpstreamsFormActions,
} from '../types'
import useHelpers from '../composables/useHelpers'
import endpoints from '../upstreams-endpoints'
import {
  SlotsMaxNumber,
  SlotsMinNumber,
} from '../constants'
import type { AxiosError, AxiosResponse } from 'axios'
import { useRouter } from 'vue-router'

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
const { axiosInstance } = useAxios({
  headers: props.config?.requestHeaders,
})
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
}

const resetOnPassiveSwitch = (val: boolean): void => {
  state.fields.passiveHealthCheck.timeouts = val ? '5' : '0'
  state.fields.passiveHealthCheck.successes = val ? '80' : '0'
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

const getPayload = (): UpstreamFormPayload => {
  const result: UpstreamFormPayload = {
    name: state.fields.name,
    slots: Number(state.fields.slots),
    algorithm: state.fields.algorithm,
    hash_on: state.fields.hashOn,
    hash_fallback: state.fields.hashFallback,
    healthchecks: {},
  }

  if (state.fields.hostHeader) {
    result.host_header = state.fields.hostHeader
  }

  if (state.fields.clientCertificate) {
    result.client_certificate = { id: state.fields.clientCertificate }
  }

  if (state.fields.healthchecksThreshold) {
    result.healthchecks.threshold = Number(state.fields.healthchecksThreshold)
  }

  if (state.fields.tags) {
    result.tags = state.fields.tags.split(',')?.map((tag: string) => String(tag || '')
      .trim())?.filter((tag: string) => tag !== '')
  }

  if (state.fields.hashOn === 'header') {
    result.hash_on_header = state.fields.hashOnHeader
  }

  if (state.fields.hashOn === 'cookie' || state.fields.hashFallback === 'cookie') {
    result.hash_on_cookie = state.fields.hashOnCookie
    result.hash_on_cookie_path = state.fields.hashOnCookiePath
  }

  if (state.fields.hashOn === 'query_arg') {
    result.hash_on_query_arg = state.fields.hashOnQueryArgument
  }

  if (state.fields.hashOn === 'uri_capture') {
    result.hash_on_uri_capture = state.fields.hashOnUriCapture
  }

  if (state.fields.hashFallback === 'header') {
    result.hash_fallback_header = state.fields.hashFallbackHeader
  }

  if (state.fields.hashFallback === 'query_arg') {
    result.hash_fallback_query_arg = state.fields.hashFallbackQueryArgument
  }

  if (state.fields.hashFallback === 'uri_capture') {
    result.hash_fallback_uri_capture = state.fields.hashFallbackUriCapture
  }

  if (state.fields.activeHealthSwitch) {
    result.healthchecks.active = {
      type: state.fields.activeHealthCheck.type,
      healthy: {},
      unhealthy: {},
    }

    if (state.fields.activeHealthCheck.timeout) {
      result.healthchecks.active.timeout = Number(state.fields.activeHealthCheck.timeout)
    }

    if (state.fields.activeHealthCheck.concurrency) {
      result.healthchecks.active.concurrency = Number(state.fields.activeHealthCheck.concurrency)
    }

    if (state.fields.activeHealthCheck.type !== 'tcp' && state.fields.activeHealthCheck.httpPath) {
      result.healthchecks.active.http_path = state.fields.activeHealthCheck.httpPath
    }

    if (props.config?.app === 'kongManager') {
      if (state.fields.activeHealthCheck.headers.length === 0) {
        result.healthchecks.active.headers = []
      } else {
        result.healthchecks.active.headers = state.fields.activeHealthCheck.headers.reduce((obj, item) => {
          if (item.key) {
            return {
              ...obj,
              [item.key]: item.values.split(',')?.map((val: string) => String(val || '')
                .trim())?.filter((val: string) => val !== ''),
            }
          } else {
            return {
              ...obj,
            }
          }
        }, {})
      }
    }

    if ((state.fields.activeHealthCheck.type === 'https' || state.fields.activeHealthCheck.type === 'grpcs') &&
      state.fields.activeHealthCheck.httpsSni) {
      result.healthchecks.active.https_sni = state.fields.activeHealthCheck.httpsSni
    }

    if ((state.fields.activeHealthCheck.type === 'https' || state.fields.activeHealthCheck.type === 'grpcs')) {
      result.healthchecks.active.https_verify_certificate = state.fields.activeHealthCheck.verifySsl
    }

    if (state.fields.activeHealthCheck.interval) {
      result.healthchecks.active.healthy.interval = Number(state.fields.activeHealthCheck.interval)
    }

    if (state.fields.activeHealthCheck.successes) {
      result.healthchecks.active.healthy.successes = Number(state.fields.activeHealthCheck.successes)
    }

    if (state.fields.activeHealthCheck.type !== 'tcp' && state.fields.activeHealthCheck.httpStatuses) {
      result.healthchecks.active.healthy.http_statuses = stringToNumberArray(state.fields.activeHealthCheck.httpStatuses)
    }

    if (state.fields.activeHealthCheck.unhealthyInterval) {
      result.healthchecks.active.unhealthy.interval = Number(state.fields.activeHealthCheck.unhealthyInterval)
    }

    if (state.fields.activeHealthCheck.unhealthyTimeouts) {
      result.healthchecks.active.unhealthy.timeouts = Number(state.fields.activeHealthCheck.unhealthyTimeouts)
    }

    if (state.fields.activeHealthCheck.type !== 'tcp' && state.fields.activeHealthCheck.unhealthyHttpStatuses) {
      result.healthchecks.active.unhealthy.http_statuses = stringToNumberArray(state.fields.activeHealthCheck.unhealthyHttpStatuses)
    }

    if (state.fields.activeHealthCheck.type !== 'tcp' && state.fields.activeHealthCheck.httpFailures) {
      result.healthchecks.active.unhealthy.http_failures = Number(state.fields.activeHealthCheck.httpFailures)
    }

    if (state.fields.activeHealthCheck.type === 'tcp' && state.fields.activeHealthCheck.tcpFailures) {
      result.healthchecks.active.unhealthy.tcp_failures = Number(state.fields.activeHealthCheck.tcpFailures)
    }
  } else {
    if (props.config?.app === 'kongManager' && formType.value === EntityBaseFormType.Edit) {
      result.healthchecks.active = {
        type: state.fields.activeHealthCheck.type,
        headers: {},
        healthy: {
          interval: 0,
        },
        unhealthy: {
          interval: 0,
        },
      }
    }
  }

  if (state.fields.passiveHealthSwitch) {
    result.healthchecks.passive = {
      type: state.fields.passiveHealthCheck.type,
      healthy: {},
      unhealthy: {},
    }

    if (state.fields.passiveHealthCheck.successes) {
      result.healthchecks.passive.healthy.successes = Number(state.fields.passiveHealthCheck.successes)
    }

    if (state.fields.passiveHealthCheck.type !== 'tcp' && state.fields.passiveHealthCheck.httpStatuses) {
      result.healthchecks.passive.healthy.http_statuses = stringToNumberArray(state.fields.passiveHealthCheck.httpStatuses)
    }

    if (state.fields.passiveHealthCheck.timeouts) {
      result.healthchecks.passive.unhealthy.timeouts = Number(state.fields.passiveHealthCheck.timeouts)
    }

    if (state.fields.passiveHealthCheck.type !== 'tcp' && state.fields.passiveHealthCheck.unhealthyHttpStatuses) {
      result.healthchecks.passive.unhealthy.http_statuses = stringToNumberArray(state.fields.passiveHealthCheck.unhealthyHttpStatuses)
    }

    if (state.fields.passiveHealthCheck.type !== 'tcp' && state.fields.passiveHealthCheck.httpFailures) {
      result.healthchecks.passive.unhealthy.http_failures = Number(state.fields.passiveHealthCheck.httpFailures)
    }

    if (state.fields.passiveHealthCheck.type === 'tcp' && state.fields.passiveHealthCheck.tcpFailures) {
      result.healthchecks.passive.unhealthy.tcp_failures = Number(state.fields.passiveHealthCheck.tcpFailures)
    }
  } else {
    if (props.config?.app === 'kongManager' && formType.value === EntityBaseFormType.Edit) {
      result.healthchecks.passive = {
        type: state.fields.passiveHealthCheck.type,
        healthy: {
          successes: 0,
        },
        unhealthy: {
          timeouts: 0,
          tcp_failures: 0,
          http_failures: 0,
        },
      }
    }
  }

  return result
}

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

    await axiosInstance.post(getUrl('validate'), getPayload())

    let response: AxiosResponse | undefined

    if (formType.value === EntityBaseFormType.Create) {
      response = await axiosInstance.post(getUrl('create'), getPayload())
    } else if (formType.value === EntityBaseFormType.Edit) {
      response = props.config?.app === 'konnect'
        ? await axiosInstance.put(getUrl('edit'), getPayload())
        : await axiosInstance.patch(getUrl('edit'), getPayload())
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
