<template>
  <div class="kong-ui-entities-gateway-service-form">
    <EntityBaseForm
      :can-submit="canSubmit"
      :config="config"
      :edit-id="gatewayServiceId"
      :entity-type="SupportedEntityType.GatewayService"
      :error-message="form.errorMessage"
      :fetch-url="fetchUrl"
      :form-fields="getPayload"
      :is-readonly="form.isReadonly"
      @cancel="handleClickCancel"
      @fetch:error="(err: any) => $emit('error', err)"
      @fetch:success="initForm"
      @loading="(val: boolean) => $emit('loading', val)"
      @submit="saveFormData"
    >
      <EntityFormSection
        :description="t('gateway_services.form.sections.general.description')"
        :hide-info-header="hideSectionsInfo"
        :title="t('gateway_services.form.sections.general.title')"
      >
        <KInput
          v-model.trim="form.fields.name"
          autocomplete="off"
          data-testid="gateway-service-name-input"
          :error="hasPreValidateError"
          :error-message="preValidateErrorMessage"
          :label="t('gateway_services.form.fields.name.label')"
          :label-attributes="{
            info: t('gateway_services.form.fields.name.tooltip'),
            tooltipAttributes: { maxWidth: '400' },
          }"
          name="name"
          :placeholder="t('gateway_services.form.fields.name.placeholder')"
          :readonly="form.isReadonly"
          type="text"
          @input="validateName"
        />

        <KInput
          v-model.trim="form.fields.tags"
          autocomplete="off"
          data-testid="gateway-service-tags-input"
          :help="t('gateway_services.form.fields.tags.help')"
          :label="t('gateway_services.form.fields.tags.label')"
          :label-attributes="{
            info: t('gateway_services.form.fields.tags.tooltip'),
            tooltipAttributes: { maxWidth: '400' }
          }"
          name="tags"
          :placeholder="t('gateway_services.form.fields.tags.placeholder')"
          :readonly="form.isReadonly"
          type="text"
        />
      </EntityFormSection>

      <EntityFormSection
        :description="t('gateway_services.form.sections.keys.description')"
        :hide-info-header="hideSectionsInfo"
        :title="t('gateway_services.form.sections.keys.title')"
      >
        <div v-if="!isEditing">
          <div class="gateway-service-form-traffic-label">
            <KLabel required>
              {{ t('gateway_services.form.sections.keys.checkedGroupLabel') }}
            </KLabel>
          </div>

          <div class="gateway-service-form-margin-bottom">
            <KRadio
              v-model="checkedGroup"
              data-testid="gateway-service-url-radio"
              :selected-value="whereToSendTraffic.url"
              @change="changeCheckedGroup"
            >
              {{ t('gateway_services.form.sections.keys.urlLabel') }}
            </KRadio>
          </div>

          <div
            v-if="checkedGroup === 'url'"
            class="gateway-service-form-group-fields"
          >
            <KInput
              v-model.trim="form.fields.url"
              class="gateway-service-url-input gateway-service-form-margin-bottom"
              data-testid="gateway-service-url-input"
              :label="t('gateway_services.form.fields.upstream_url.label')"
              :label-attributes="{
                info: config.app === 'konnect'
                  ? t('gateway_services.form.fields.upstream_url.tooltip_for_konnect')
                  : t('gateway_services.form.fields.upstream_url.tooltip_for_km'),
                tooltipAttributes: { maxWidth: '400' },
              }"
              name="url"
              :placeholder="t('gateway_services.form.fields.upstream_url.placeholder')"
              required
            />
          </div>

          <KRadio
            v-model="checkedGroup"
            checked-group="protocol"
            data-testid="gateway-service-protocol-radio"
            :selected-value="whereToSendTraffic.protocol"
            @change="changeCheckedGroup"
          >
            {{ t('gateway_services.form.sections.keys.checkedGroupAltLabel') }}
          </KRadio>
        </div>

        <div
          v-if="checkedGroup === 'protocol' || isEditing"
          class="gateway-service-form-group-fields"
        >
          <KSelect
            v-model="form.fields.protocol"
            data-testid="gateway-service-protocol-select"
            :items="gatewayServiceProtocolItems"
            :label="t('gateway_services.form.fields.protocol.label')"
            :label-attributes="{
              info: t('gateway_services.form.fields.protocol.tooltip'),
              tooltipAttributes: { maxWidth: '400' },
            }"
            :readonly="form.isReadonly"
            required
            width="100%"
            @selected="(item: any) => handleItemSelect(form.fields.protocol, item)"
          />

          <KInput
            v-model.trim="form.fields.host"
            class="gateway-service-form-margin-top"
            data-testid="gateway-service-host-input"
            :label="t('gateway_services.form.fields.host.label')"
            :label-attributes="{
              info: t('gateway_services.form.fields.host.tooltip'),
              tooltipAttributes: { maxWidth: '400' },
            }"
            name="host"
            :placeholder="t('gateway_services.form.fields.host.placeholder')"
            required
          />

          <div v-if="setPathAllowed">
            <KInput
              v-model.trim="form.fields.path"
              class="gateway-service-form-margin-top"
              data-testid="gateway-service-path-input"
              :label="t('gateway_services.form.fields.path.label')"
              :label-attributes="{
                info: t('gateway_services.form.fields.path.tooltip'),
                tooltipAttributes: { maxWidth: '400' },
              }"
              name="path"
              :placeholder="t('gateway_services.form.fields.path.placeholder')"
            />
          </div>

          <KInput
            v-model="form.fields.port"
            class="gateway-service-form-margin-top"
            data-testid="gateway-service-port-input"
            :label="t('gateway_services.form.fields.port.label')"
            :label-attributes="{
              info: t('gateway_services.form.fields.port.tooltip'),
              tooltipAttributes: { maxWidth: '400' },
            }"
            name="port"
            type="number"
            @update:model-value="() => {
              form.fields.port = handleFloatVal(form.fields.port + '')
            }"
          />
        </div>

        <!-- Advanced Fields -->
        <KCollapse
          v-model="isCollapsed"
          data-testid="advanced-fields-collapse"
          trigger-alignment="leading"
          :trigger-label="t('gateway_services.form.sections.keys.viewAdvancedFields')"
        >
          <div class="gateway-service-form-margin-top">
            <div class="gateway-service-form-margin-bottom">
              <KInput
                v-model="form.fields.retries"
                autocomplete="off"
                data-testid="gateway-service-retries-input"
                :label="t('gateway_services.form.fields.retries.label')"
                :label-attributes="{
                  info: t('gateway_services.form.fields.retries.tooltip'),
                  tooltipAttributes: { maxWidth: '400' },
                }"
                name="retries"
                :readonly="form.isReadonly"
                type="number"
                @update:model-value="() => {
                  form.fields.retries = handleFloatVal(form.fields.retries + '')
                }"
              />
            </div>

            <div class="gateway-service-form-margin-bottom">
              <KInput
                v-model="form.fields.connect_timeout"
                autocomplete="off"
                data-testid="gateway-service-connTimeout-input"
                :label="t('gateway_services.form.fields.connect_timeout.label')"
                :label-attributes="{
                  info: t('gateway_services.form.fields.connect_timeout.tooltip'),
                  tooltipAttributes: { maxWidth: '400' },
                }"
                name="connTimeout"
                :readonly="form.isReadonly"
                type="number"
                @update:model-value="() => {
                  form.fields.connect_timeout = handleFloatVal(form.fields.connect_timeout + '')
                }"
              />
            </div>

            <div class="gateway-service-form-margin-bottom">
              <KInput
                v-model="form.fields.write_timeout"
                autocomplete="off"
                data-testid="gateway-service-writeTimeout-input"
                :label="t('gateway_services.form.fields.write_timeout.label')"
                :label-attributes="{
                  info: t('gateway_services.form.fields.write_timeout.tooltip'),
                  tooltipAttributes: { maxWidth: '400' },
                }"
                name="writeTimeout"
                :readonly="form.isReadonly"
                type="number"
                @update:model-value="() => {
                  form.fields.write_timeout = handleFloatVal(form.fields.write_timeout + '')
                }"
              />
            </div>

            <div class="gateway-service-form-margin-bottom">
              <KInput
                v-model="form.fields.read_timeout"
                autocomplete="off"
                data-testid="gateway-service-readTimeout-input"
                :label="t('gateway_services.form.fields.read_timeout.label')"
                :label-attributes="{
                  info: t('gateway_services.form.fields.read_timeout.tooltip'),
                  tooltipAttributes: { maxWidth: '400' },
                }"
                name="readTimeout"
                :readonly="form.isReadonly"
                type="number"
                @update:model-value="() => {
                  form.fields.read_timeout = handleFloatVal(form.fields.read_timeout + '')
                }"
              />
            </div>

            <div
              v-if="showClientCert"
              class="gateway-service-form-margin-bottom"
            >
              <KInput
                v-model.trim="form.fields.client_certificate"
                autocomplete="off"
                data-testid="gateway-service-clientCert-input"
                :label="t('gateway_services.form.fields.client_certificate.label')"
                :label-attributes="{
                  info: t('gateway_services.form.fields.client_certificate.tooltip'),
                  tooltipAttributes: { maxWidth: '400' },
                }"
                name="clientCert"
                :placeholder="t('gateway_services.form.fields.client_certificate.placeholder')"
                :readonly="form.isReadonly"
                type="text"
              />
            </div>

            <div
              v-if="showCaCert"
              class="gateway-service-form-margin-bottom"
            >
              <KInput
                v-model.trim="form.fields.ca_certificates"
                autocomplete="off"
                data-testid="gateway-service-ca-certs-input"
                :label="t('gateway_services.form.fields.ca_certificates.label')"
                :label-attributes="{ tooltipAttributes: { maxWidth: '400' } }"
                :placeholder="t('gateway_services.form.fields.ca_certificates.placeholder')"
                :readonly="form.isReadonly"
                type="text"
              >
                <template #label-tooltip>
                  <i18nT
                    keypath="gateway_services.form.fields.ca_certificates.tooltip"
                    scope="global"
                  >
                    <template #code1>
                      <code>{{ t('gateway_services.form.fields.ca_certificates.code1') }}</code>
                    </template>
                    <template #code2>
                      <code>{{ t('gateway_services.form.fields.ca_certificates.code2') }}</code>
                    </template>
                  </i18nT>
                </template>
              </KInput>
            </div>

            <div
              v-if="showTlsVerify"
              class="gateway-service-form-margin-bottom"
            >
              <KCheckbox
                v-model="form.fields.tls_verify_enabled"
                data-testid="gateway-service-tls-verify-checkbox"
                :description="t('gateway_services.form.fields.tls_verify_enabled.help')"
                :label="t('gateway_services.form.fields.tls_verify_enabled.label')"
                :label-attributes="{ tooltipAttributes: { maxWidth: '400' } }"
              >
                <template #tooltip>
                  <i18nT
                    keypath="gateway_services.form.fields.tls_verify_enabled.tooltip"
                    scope="global"
                  >
                    <template #code1>
                      <code>{{ t('gateway_services.form.fields.tls_verify_enabled.code1') }}</code>
                    </template>
                  </i18nT>
                </template>
              </KCheckbox>
              <div
                v-if="form.fields.tls_verify_enabled"
                class="checkbox-aligned-radio"
              >
                <KRadio
                  v-model="form.fields.tls_verify_value"
                  data-testid="gateway-service-tls-verify-true-option"
                  :label="t('gateway_services.form.fields.tls_verify_option.true.label')"
                  :selected-value="true"
                />
              </div>
              <div
                v-if="form.fields.tls_verify_enabled"
                class="checkbox-aligned-radio"
              >
                <KRadio
                  v-model="form.fields.tls_verify_value"
                  data-testid="gateway-service-tls-verify-false-option"
                  :label="t('gateway_services.form.fields.tls_verify_option.false.label')"
                  :selected-value="false"
                />
              </div>
            </div>
          </div>
        </KCollapse>
      </EntityFormSection>

      <template #form-actions>
        <slot
          :can-submit="canSubmit"
          :cancel="handleClickCancel"
          name="form-actions"
          :submit="saveFormData"
        />
      </template>
    </EntityBaseForm>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import { computed, ref, reactive, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import type { AxiosResponse } from 'axios'
import type {
  KonnectGatewayServiceFormConfig,
  KongManagerGatewayServiceFormConfig,
  GatewayServiceFormState,
  GatewayServiceFormFields,
} from '../types'
import endpoints from '../gateway-services-endpoints'
import composables from '../composables'
import {
  useAxios,
  useErrors,
  useGatewayFeatureSupported,
  useValidators,
  EntityFormSection,
  EntityBaseForm,
  EntityBaseFormType,
  SupportedEntityType,
} from '@kong-ui-public/entities-shared'
import '@kong-ui-public/entities-shared/dist/style.css'

const emit = defineEmits<{
  (e: 'update', data: Record<string, any>): void,
  (e: 'error', error: any): void,
  (e: 'url-valid:success'): void,
  (e: 'url-valid:error', error: string): void,
  (e: 'loading', isLoading: boolean): void,
  (e: 'model-updated', val: Record<string, any>): void,
}>()

// Component props - This structure must exist in ALL entity components, with the exclusion of unneeded action props (e.g. if you don't need `canDelete`, just exclude it)
const props = defineProps({
  /** The base konnect or kongManger config. Pass additional config props in the shared entity component as needed. */
  config: {
    type: Object as PropType<KonnectGatewayServiceFormConfig | KongManagerGatewayServiceFormConfig>,
    required: true,
    validator: (config: KonnectGatewayServiceFormConfig | KongManagerGatewayServiceFormConfig): boolean => {
      if (!config || !['konnect', 'kongManager'].includes(config?.app)) return false
      if (config.app === 'konnect' && !config.controlPlaneId) return false
      if (config.app === 'kongManager' && typeof config.workspace !== 'string') return false
      if (!config.cancelRoute) return false
      return true
    },
  },
  /** If a valid Gateway Service ID is provided, it will put the form in Edit mode instead of Create */
  gatewayServiceId: {
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
})

const isCollapsed = ref(true)
const router = useRouter()
const { i18nT, i18n: { t } } = composables.useI18n()
const { getMessageFromError } = useErrors()
const { axiosInstance } = useAxios(props.config?.axiosRequestConfig)
const validators = useValidators()

const fetchUrl = computed<string>(() => endpoints.form[props.config.app].edit)
const formType = computed((): EntityBaseFormType => props.gatewayServiceId ? EntityBaseFormType.Edit : EntityBaseFormType.Create)
const hasExtractPortValue = ref(false)
const isEditing = computed(() => !!props.gatewayServiceId)
const checkedGroup = ref(isEditing.value ? 'protocol' : 'url')
const getPort = composables.usePortFromProtocol()
const preValidateErrorMessage = ref('')
const hasPreValidateError = computed((): boolean => !!preValidateErrorMessage.value)

const form = reactive<GatewayServiceFormState>({
  fields: {
    name: '',
    protocol: 'http',
    host: '',
    path: '',
    port: 80,
    url: '',
    retries: 5,
    connect_timeout: 60000,
    write_timeout: 60000,
    read_timeout: 60000,
    client_certificate: '',
    ca_certificates: '',
    tls_verify_enabled: false,
    tls_verify_value: false,
    tags: '',
  },
  isReadonly: false,
  errorMessage: '',
})

const formFieldsOriginal = reactive<GatewayServiceFormFields>({
  name: '',
  protocol: 'http',
  host: '',
  path: '',
  port: 80,
  url: '',
  retries: 5,
  connect_timeout: 60000,
  write_timeout: 60000,
  read_timeout: 60000,
  client_certificate: '',
  ca_certificates: '',
  tls_verify_enabled: false,
  tls_verify_value: false,
  tags: '',
})

const isWsSupported = props.config.app === 'konnect' || useGatewayFeatureSupported({
  gatewayInfo: props.config.gatewayInfo,
  // 'ws' and 'wss' are not valid values for the protocol field in Gateway Community Edition or before Gateway Enterprise Edition 3.0
  supportedRange: {
    enterprise: ['3.0'],
  },
})

const gatewayServiceProtocolItems = [
  {
    label: t('gateway_services.form.fields.protocol.options.http'),
    value: 'http',
    group: 'http',
  },
  {
    label: t('gateway_services.form.fields.protocol.options.https'),
    value: 'https',
    group: 'http',
  },
  {
    label: t('gateway_services.form.fields.protocol.options.tcp'),
    value: 'tcp',
    group: 'tcp',
  },
  {
    label: t('gateway_services.form.fields.protocol.options.tls'),
    value: 'tls',
    group: 'tcp',
  },
  {
    label: t('gateway_services.form.fields.protocol.options.tls_passthrough'),
    value: 'tls_passthrough',
    group: 'tcp',
  },
  {
    label: t('gateway_services.form.fields.protocol.options.grpc'),
    value: 'grpc',
    group: 'grpc',
  },
  {
    label: t('gateway_services.form.fields.protocol.options.grpcs'),
    value: 'grpcs',
    group: 'grpc',
  },
  ...(
    isWsSupported
      ? [
        {
          label: t('gateway_services.form.fields.protocol.options.ws'),
          value: 'ws',
          group: 'websocket',
        },
        {
          label: t('gateway_services.form.fields.protocol.options.wss'),
          value: 'wss',
          group: 'websocket',
        },
      ]
      : []
  ),
  {
    label: t('gateway_services.form.fields.protocol.options.udp'),
    value: 'udp',
    group: 'udp',
  },
]

const whereToSendTraffic = { url: 'url', protocol: 'protocol' }

const handleItemSelect = (field: any, item: { value: any }): void => {
  field = item.value
}

const handleFloatVal = (oVal: string) => {
  if (oVal) {
    return parseFloat(oVal)
  }

  return 0
}

const changeCheckedGroup = () => {
  isCollapsed.value = true
  form.errorMessage = ''
  form.fields.host = formFieldsOriginal.host
  form.fields.path = formFieldsOriginal.path
  form.fields.port = formFieldsOriginal.port
  form.fields.protocol = formFieldsOriginal.protocol
  form.fields.url = formFieldsOriginal.url
  form.fields.retries = formFieldsOriginal.retries
  form.fields.connect_timeout = formFieldsOriginal.connect_timeout
  form.fields.write_timeout = formFieldsOriginal.write_timeout
  form.fields.read_timeout = formFieldsOriginal.read_timeout
  form.fields.client_certificate = formFieldsOriginal.client_certificate
  form.fields.ca_certificates = formFieldsOriginal.ca_certificates
  form.fields.tls_verify_enabled = formFieldsOriginal.tls_verify_enabled
  form.fields.tls_verify_value = formFieldsOriginal.tls_verify_value
}

const validateUrl = (): void => {
  if (form.fields.url && checkedGroup.value === 'url') {
    try {
      const parsedUrl = new URL(form.fields.url)
      // if the URL is parsed successfully, clear error message
      form.errorMessage = ''

      // remove the trailing colon appended to parsedUrl.protocol
      form.fields.protocol = parsedUrl.protocol.slice(0, -1)
      form.fields.host = parsedUrl.hostname
      form.fields.path = parsedUrl.pathname

      // extract port value from url and convert to number
      const portValue = Number(parsedUrl.port)

      hasExtractPortValue.value = !!portValue
      form.fields.port = portValue || getPort.getPortFromProtocol(form.fields.protocol)

      form.errorMessage = ''
      emit('url-valid:success')
    } catch (error: any) {
      form.errorMessage = t('errors.urlErrorMessage')
      emit('url-valid:error', getMessageFromError(error))
    }
  } else {
    emit('url-valid:success')
    form.errorMessage = ''
  }
}

const setPathAllowed = computed(() => {
  return !['tcp', 'tls', 'tls_passthrough', 'grpc', 'grpcs', 'udp'].includes(form.fields.protocol)
})

// https://github.com/Kong/kong-ee/blob/ba6595a136c503c7f7ba93aaa45231985c00325e/kong/db/schema/entities/services.lua#L63-L68
const showClientCert = computed((): boolean => {
  if (checkedGroup.value === 'url') {
    return true
  }

  const isValidProtocol = ['https', 'wss', 'tls'].includes(form.fields.protocol)
  return checkedGroup.value === 'protocol' && isValidProtocol
})

// https://github.com/Kong/kong-ee/blob/ba6595a136c503c7f7ba93aaa45231985c00325e/kong/db/schema/entities/services.lua#L79-L82
const showCaCert = computed((): boolean => {
  if (checkedGroup.value === 'url') {
    return true
  }

  const isValidProtocol = ['https', 'tls', 'grpcs'].includes(form.fields.protocol)
  return checkedGroup.value === 'protocol' && isValidProtocol
})

// https://github.com/Kong/kong-ee/blob/ba6595a136c503c7f7ba93aaa45231985c00325e/kong/db/schema/entities/services.lua#L69-L74
const showTlsVerify = computed((): boolean => {
  if (checkedGroup.value === 'url') {
    return true
  }

  const isValidProtocol = ['https', 'wss', 'tls', 'grpcs'].includes(form.fields.protocol)
  return checkedGroup.value === 'protocol' && isValidProtocol
})

const validateName = (input: string): void => {
  preValidateErrorMessage.value = validators.utf8Name(input)
}

/**
 * Is the form submit button enabled?
 * If the form.fields and formFieldsOriginal are equal, always return false
 */
const canSubmit = computed((): boolean =>
  (isEditing.value && (JSON.stringify(form.fields) !== JSON.stringify(formFieldsOriginal))) || ((checkedGroup.value === 'url' && !!form.fields.url) ||
  (checkedGroup.value === 'protocol' && !!form.fields.host)))

const initForm = (data: Record<string, any>): void => {
  form.fields.name = data?.name || ''
  form.fields.tags = data?.tags?.join(', ') || ''
  form.fields.protocol = data?.protocol || 'http'
  form.fields.path = data?.path || ''
  form.fields.read_timeout = (data?.read_timeout || data?.read_timeout === 0) ? data?.read_timeout : 60000
  form.fields.retries = (data?.retries || data?.retries === 0) ? data?.retries : 5
  form.fields.host = data?.host || ''
  form.fields.connect_timeout = (data?.connect_timeout || data?.connect_timeout === 0) ? data?.connect_timeout : 60000
  form.fields.tls_verify_enabled = data?.tls_verify !== '' && data?.tls_verify !== null && data?.tls_verify !== undefined
  form.fields.tls_verify_value = data?.tls_verify ? data?.tls_verify : false
  form.fields.ca_certificates = data?.ca_certificates?.join(',') || ''
  form.fields.client_certificate = data?.client_certificate?.id || ''
  form.fields.write_timeout = (data?.write_timeout || data?.write_timeout === 0) ? data?.write_timeout : 60000
  form.fields.port = (data?.port || data?.port === 0) ? data?.port : 80
  // Set initial state of `formFieldsOriginal` to these values in order to detect changes
  Object.assign(formFieldsOriginal, form.fields)
}

const handleClickCancel = (): void => {
  router.push(props.config.cancelRoute)
}

///   Saving    ///
/**
 * Build the validate and submit URL
 */

const validateSubmitUrl = computed<string>(() => {
  let url = `${props.config.apiBaseUrl}${endpoints.form[props.config.app].validate}`

  if (props.config.app === 'konnect') {
    url = url.replace(/{controlPlaneId}/gi, props.config?.controlPlaneId || '')
  } else if (props.config.app === 'kongManager') {
    url = url.replace(/\/{workspace}/gi, props.config?.workspace ? `/${props.config.workspace}` : '')
  }
  // Always replace the id when editing
  url = url.replace(/{id}/gi, props.gatewayServiceId)
  return url
})

const submitUrl = computed<string>(() => {
  let url = `${props.config.apiBaseUrl}${endpoints.form[props.config.app][formType.value]}`

  if (props.config.app === 'konnect') {
    url = url.replace(/{controlPlaneId}/gi, props.config?.controlPlaneId || '')
  } else if (props.config.app === 'kongManager') {
    url = url.replace(/\/{workspace}/gi, props.config?.workspace ? `/${props.config.workspace}` : '')
  }
  // Always replace the id when editing
  url = url.replace(/{id}/gi, props.gatewayServiceId)
  return url
})

const saveTlsVerify = (gatewayService: Record<string, any>) => {
  let protocol = ''
  if (gatewayService.url) {
    protocol = new URL(gatewayService.url).protocol
  }

  if (['https', 'wss', 'tls', 'grpcs'].includes(gatewayService.protocol) || ['https', 'wss', 'tls', 'grpcs'].includes(protocol)) {
    gatewayService.tls_verify = gatewayService.tls_verify_enabled ? gatewayService.tls_verify_value : null
  }
  delete gatewayService.tls_verify_enabled
  delete gatewayService.tls_verify_value
}

const getPayload = computed((): Record<string, any> => {
  const requestBody: Record<string, any> = {
    name: form.fields.name || null,
    tags: form.fields.tags ? form.fields.tags?.split(',')?.map((tag: string) => String(tag || '').trim())?.filter((tag: string) => tag !== '') : null,
    protocol: form.fields.protocol,
    path: form.fields.path || null,
    read_timeout: form.fields.read_timeout,
    retries: form.fields.retries,
    host: form.fields.host,
    connect_timeout: form.fields.connect_timeout,
    tls_verify_value: form.fields.tls_verify_value,
    tls_verify_enabled: form.fields.tls_verify_enabled,
    ca_certificates: form.fields.ca_certificates ? form.fields.ca_certificates?.split(',').filter(caCert => caCert !== '') : null,
    client_certificate: form.fields.client_certificate ? { id: form.fields.client_certificate } : null,
    write_timeout: form.fields.write_timeout,
    port: form.fields.port,
    url: form.fields.url,
  }

  if (form.fields.client_certificate && ['https', 'wss', 'tls'].includes(form.fields.protocol)) {
    requestBody.client_certificate = { id: form.fields.client_certificate }
  }

  if (form.fields.tls_verify_enabled && ['https', 'wss', 'tls', 'grpcs'].includes(form.fields.protocol)) {
    requestBody.tls_verify = form.fields.tls_verify_value
  }

  if (!setPathAllowed.value) {
    requestBody.path = null
  }

  if (formType.value === 'create') {
    // Only submit the appropriate fields based on current checked group
    if (checkedGroup.value === 'url') {
      delete requestBody.protocol
      delete requestBody.host
      delete requestBody.path
      // for validation call
      if (props.config.app === 'konnect') {
        delete requestBody.port
      }
    } else {
      delete requestBody.url
    }
  } else if (formType.value === 'edit') {
    delete requestBody.url
  }

  return requestBody
})

const saveFormData = async (): Promise<AxiosResponse | undefined> => {
  try {
    form.isReadonly = true

    validateUrl()
    const payload = getPayload.value
    saveTlsVerify(payload)

    let response: AxiosResponse | undefined

    await axiosInstance.post(validateSubmitUrl.value, payload)

    if (formType.value === 'create') {
      response = await axiosInstance.post(submitUrl.value, payload)

    } else if (formType.value === 'edit') {
      response = props.config?.app === 'konnect'
        // Note: Konnect currently uses PUT because PATCH is not fully supported in Koko
        //       If this changes, the `edit` form methods should be re-evaluated/updated accordingly
        ? await axiosInstance.put(submitUrl.value, payload)
        : await axiosInstance.patch(submitUrl.value, payload)
    }

    if (response) {
      const { data } = response

      form.fields.name = data?.name || ''
      form.fields.port = data.port || getPort.getPortFromProtocol(data.protocol)
      form.fields.protocol = data?.protocol || 'http'
      form.fields.host = data?.host || ''
      form.fields.path = data?.path || ''
      form.fields.url = data?.url || ''
      form.fields.retries = (data?.retries || data?.retries === 0) ? data?.retries : 5
      form.fields.connect_timeout = (data?.connect_timeout || data?.connect_timeout === 0) ? data?.connect_timeout : 60000
      form.fields.write_timeout = (data?.write_timeout || data?.write_timeout === 0) ? data?.write_timeout : 60000
      form.fields.read_timeout = (data?.read_timeout || data?.read_timeout === 0) ? data?.read_timeout : 60000
      form.fields.client_certificate = data?.client_certificate?.id || ''
      form.fields.ca_certificates = data?.ca_certificates?.length ? data?.ca_certificates.join(',') : ''
      form.fields.tls_verify_enabled = data?.tls_verify !== '' && data?.tls_verify !== null && data?.tls_verify !== undefined
      form.fields.tls_verify_value = form.fields.tls_verify_enabled && data?.tls_verify
      form.fields.tags = data?.tags?.length ? data.tags.join(', ') : ''
      // Set initial state of `formFieldsOriginal` to these values in order to detect changes
      Object.assign(formFieldsOriginal, form.fields)
      // Emit an update event for the host app to respond to
      emit('update', response?.data)
    }

    return response
  } catch (error: any) {
    form.errorMessage = getMessageFromError(error)
    // Emit the error for the host app
    emit('error', error)
  } finally {
    form.isReadonly = false
  }
}

watch(() => props.gatewayServiceId, () => {
  // Reset the form fields
  Object.assign(form.fields, formFieldsOriginal)
})

watch(form.fields, (newValue) => {
  form.fields.port = getPort.getPortFromProtocol(newValue.protocol, String(newValue.port))
  emit('model-updated', getPayload.value)
})

onMounted(() => {
  emit('model-updated', getPayload.value)
})

defineExpose({
  validateUrl,
  getPayload,
  saveFormData,
  canSubmit,
  initForm,
})
</script>

<style lang="scss" scoped>
.kong-ui-entities-gateway-service-form {
  width: 100%;

  :deep(.k-tooltip) {
    max-width: 300px;
  }

  .gateway-service-form-margin-top {
    margin-top: $kui-space-60;
  }

  .gateway-service-form-traffic-label {
    margin-bottom: $kui-space-60;
  }

  .gateway-service-url-input {
    display: flex;

    :deep(.input-element-wrapper) {
      display: flex;
    }
  }

  .gateway-service-form-group-fields {
    margin-left: $kui-space-80;
  }

  .gateway-service-form-margin-bottom {
    margin-bottom: $kui-space-60;
  }

  .checkbox-aligned-radio {
    margin: $kui-space-20;
    padding-left: $kui-space-80;
  }
}
</style>
