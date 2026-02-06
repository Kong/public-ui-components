<template>
  <div class="kong-ui-entities-gateway-service-form">
    <EntityBaseForm
      :can-submit="canSubmit"
      :config="config"
      :edit-id="gatewayServiceId"
      :entity-type="SupportedEntityType.GatewayService"
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
        :description="t('gateway_services.form.sections.keys.description')"
        :hide-info-header="hideSectionsInfo"
        :title="t('gateway_services.form.sections.keys.title')"
      >
        <div
          v-if="!isEditing"
          class="gateway-service-form-general-info"
        >
          <div class="gateway-service-form-group-selection-wrapper">
            <KRadio
              v-model="checkedGroup"
              card
              card-orientation="horizontal"
              data-testid="gateway-service-url-radio"
              :description="t('gateway_services.form.sections.keys.url.description')"
              :label="t('gateway_services.form.sections.keys.url.label')"
              :selected-value="whereToSendTraffic.url"
              @change="changeCheckedGroup"
            />
            <KRadio
              v-model="checkedGroup"
              card
              card-orientation="horizontal"
              checked-group="protocol"
              data-testid="gateway-service-protocol-radio"
              :description="t('gateway_services.form.sections.keys.protocol.description')"
              :label="t('gateway_services.form.sections.keys.protocol.label')"
              :selected-value="whereToSendTraffic.protocol"
              @change="changeCheckedGroup"
            />
          </div>
          <Transition name="slide-fade">
            <div
              v-if="checkedGroup === 'url'"
              class="gateway-service-form-group-fields"
            >
              <KInput
                v-model.trim="form.fields.url"
                class="gateway-service-url-input gateway-service-form-margin-bottom"
                data-testid="gateway-service-url-input"
                :error="getFullUrlError"
                :error-message="getFieldErrorById('url')"
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
                @input="handleValidateFullUrl"
              >
                <template
                  v-if="!hideTrySampleApiButton"
                  #after
                >
                  <KButton
                    appearance="tertiary"
                    data-testid="try-sample-api"
                    size="small"
                    @click="handleTrySampleApi"
                  >
                    {{ t('gateway_services.form.buttons.try_sample') }}
                  </KButton>
                </template>
              </KInput>
            </div>
          </Transition>
        </div>
        <Transition name="slide-fade">
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
              @selected="handleProtocolSelect"
            />

            <KInput
              v-model.trim="form.fields.host"
              class="gateway-service-form-margin-top"
              data-testid="gateway-service-host-input"
              :error="!!form.formFieldErrors.host"
              :error-message="getFieldErrorById('host')"
              :label="t('gateway_services.form.fields.host.label')"
              :label-attributes="{
                info: t('gateway_services.form.fields.host.tooltip'),
                tooltipAttributes: { maxWidth: '400' },
              }"
              name="host"
              :placeholder="t('gateway_services.form.fields.host.placeholder')"
              required
              @input="handleValidateCustomUrl('host')"
            >
              <template
                v-if="!hideTrySampleApiButton"
                #after
              >
                <KButton
                  appearance="tertiary"
                  size="small"
                  @click="handleTrySampleApi"
                >
                  {{ t('gateway_services.form.buttons.try_sample') }}
                </KButton>
              </template>
            </KInput>

            <div v-if="setPathAllowed">
              <KInput
                v-model.trim="form.fields.path"
                class="gateway-service-form-margin-top"
                data-testid="gateway-service-path-input"
                :error="!!form.formFieldErrors.path"
                :error-message="getFieldErrorById('path')"
                :label="t('gateway_services.form.fields.path.label')"
                :label-attributes="{
                  info: t('gateway_services.form.fields.path.tooltip'),
                  tooltipAttributes: { maxWidth: '400' },
                }"
                name="path"
                :placeholder="t('gateway_services.form.fields.path.placeholder')"
                @input="handleValidateCustomUrl('path')"
              />
            </div>

            <KInput
              v-model="form.fields.port"
              class="gateway-service-form-margin-top"
              data-testid="gateway-service-port-input"
              :error="!!form.formFieldErrors.port"
              :error-message="getFieldErrorById('port')"
              :label="t('gateway_services.form.fields.port.label')"
              :label-attributes="{
                info: t('gateway_services.form.fields.port.tooltip'),
                tooltipAttributes: { maxWidth: '400' },
              }"
              name="port"
              type="number"
              @input="handleValidateCustomUrl('port')"
              @update:model-value="() => {
                form.fields.port = handleFloatVal(form.fields.port + '')
              }"
            />
          </div>
        </Transition>

        <!-- Advanced Fields -->
        <KCollapse
          v-model="isCollapsed"
          data-testid="advanced-fields-collapse"
          trigger-alignment="leading"
          :trigger-label="t('gateway_services.form.sections.keys.viewAdvancedFields')"
        >
          <Transition name="slide-fade">
            <div
              v-if="!isCollapsed"
              class="gateway-service-form-advanced-fields"
            >
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
                  :error="!!form.formFieldErrors.client_certificate"
                  :label="t('gateway_services.form.fields.client_certificate.label')"
                  :label-attributes="{
                    info: t('gateway_services.form.fields.client_certificate.tooltip'),
                    tooltipAttributes: { maxWidth: '400' },
                  }"
                  name="clientCert"
                  :placeholder="t('gateway_services.form.fields.client_certificate.placeholder')"
                  :readonly="form.isReadonly"
                  type="text"
                  @input="handleValidateAdvancedFields('client_certificate')"
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
                  :error="!!form.formFieldErrors.ca_certificates"
                  :label="t('gateway_services.form.fields.ca_certificates.label')"
                  :label-attributes="{ tooltipAttributes: { maxWidth: '400' } }"
                  :placeholder="t('gateway_services.form.fields.ca_certificates.placeholder')"
                  :readonly="form.isReadonly"
                  type="text"
                  @input="handleValidateAdvancedFields('ca_certificates')"
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
          </Transition>
        </KCollapse>
      </EntityFormSection>
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
        <KCollapse
          data-testid="tags-collapse"
          trigger-alignment="leading"
          :trigger-label="t('gateway_services.form.fields.tags.collapse')"
        >
          <div class="gateway-service-form-tags">
            <KInput
              v-model.trim="form.fields.tags"
              autocomplete="off"
              data-testid="gateway-service-tags-input"
              :help="t('gateway_services.form.fields.tags.help')"
              :label="t('gateway_services.form.fields.tags.label')"
              :label-attributes="{
                info: t('gateway_services.form.fields.tags.tooltip'),
                tooltipAttributes: { maxWidth: '400' },
              }"
              name="tags"
              :placeholder="t('gateway_services.form.fields.tags.placeholder')"
              :readonly="form.isReadonly"
              type="text"
              @input="resetFormFieldErrors('tags')"
            />
          </div>
        </KCollapse>
      </EntityFormSection>
      <KAlert
        v-if="form.errorMessages.length"
        appearance="danger"
        data-testid="form-error"
      >
        <ul class="form-error-list">
          <li
            v-for="errorMessage in form.errorMessages"
            :key="errorMessage"
          >
            {{ errorMessage }}
          </li>
        </ul>
      </KAlert>
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
  FormFieldErrors,
  GatewayServiceFormFields,
  GatewayServiceFormState,
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
  useHelpers,
} from '@kong-ui-public/entities-shared'
import type { SelectItem } from '@kong/kongponents'
import '@kong-ui-public/entities-shared/dist/style.css'
import { KongAirService } from '../constants'

const emit = defineEmits<{
  (e: 'update', data: Record<string, any>): void
  (e: 'error', error: any): void
  (e: 'url-valid:success'): void
  (e: 'url-valid:error', error: string): void
  (e: 'loading', isLoading: boolean): void
  (e: 'model-updated', val: Record<string, any>): void
  (e: 'try-sample-api', val: Record<string, any>): void
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
  /** Whether show or hide Try sample API button */
  hideTrySampleApiButton: {
    type: Boolean,
    required: false,
    default: false,
  },
})

const isCollapsed = ref(true)
const router = useRouter()
const { i18nT, i18n: { t } } = composables.useI18n()
const { getErrorFieldsFromError } = useErrors()
const { axiosInstance } = useAxios(props.config?.axiosRequestConfig)
const validators = useValidators()
const { validateHost, validatePath, validatePort, validateProtocol } = composables.useUrlValidators()
const { objectsAreEqual } = useHelpers()


const fetchUrl = computed<string>(() => endpoints.form[props.config.app].edit)
const formType = computed((): EntityBaseFormType => props.gatewayServiceId ? EntityBaseFormType.Edit : EntityBaseFormType.Create)
const hasExtractPortValue = ref(false)
const isEditing = computed(() => !!props.gatewayServiceId)
const checkedGroup = ref(isEditing.value ? 'protocol' : 'url')
const getPort = composables.usePortFromProtocol()
const preValidateErrorMessage = ref('')
const hasPreValidateError = computed((): boolean => !!preValidateErrorMessage.value || !!getFieldErrorById('name'))

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
    enabled: true,
  },
  isReadonly: false,
  errorMessages: [],
  formFieldErrors: {
    host: '',
    port: '',
    path: '',
    name: '',
    url: '',
    tags: '',
    retries: '',
    connect_timeout: '',
    write_timeout: '',
    read_timeout: '',
    client_certificate: '',
    ca_certificates: '',
    tls_verify_enabled: '',
    tls_verify_value: '',
  },
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
  enabled: true,
})

const isWsSupported = props.config.app === 'konnect' || useGatewayFeatureSupported({
  gatewayInfo: props.config.gatewayInfo,
  // 'ws' and 'wss' are not valid values for the protocol field in Gateway Community Edition or before Gateway Enterprise Edition 3.0
  supportedRange: {
    enterprise: ['3.0'],
  },
})

const gatewayServiceProtocolItems: SelectItem[] = [
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

const handleProtocolSelect = (item: SelectItem) => {
  form.fields.protocol = item.value as string
  form.fields.port = getPort.getPortFromProtocol(form.fields.protocol, String(form.fields.port))
}

const handleFloatVal = (oVal: string) => {
  if (oVal) {
    return parseFloat(oVal)
  }

  return 0
}

const initFieldDefaultValues = (): void => {
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
  form.fields.enabled = formFieldsOriginal.enabled
}

const changeCheckedGroup = (): void => {
  isCollapsed.value = true
  resetFormFieldErrors()
  form.errorMessages = []
  initFieldDefaultValues()
}

const handleTrySampleApi = (): void => {
  // Reset form fields before populating
  initFieldDefaultValues()

  form.fields.name = `${KongAirService.name}-${new Date()
    .toISOString() // Convert date to ISO string format (e.g., "2025-03-07T12:30:45.789Z")
    .replace(/\D/g, '') // Remove all non-digit characters
    .slice(0, 17)}` // Take the first 17 digits

  switch (checkedGroup.value) {
    case 'url':
      // Construct the full URL
      form.fields.url = `${KongAirService.protocol}://${KongAirService.host}${KongAirService.path}`
      break

    case 'protocol':
      // Populate individual protocol-related fields
      form.fields.host = KongAirService.host
      form.fields.path = KongAirService.path
      form.fields.protocol = KongAirService.protocol
      form.fields.port = KongAirService.port
      break

    default:
      form.fields.url = `${KongAirService.protocol}://${KongAirService.host}${KongAirService.path}`
  }
}

const handleValidateFullUrl = (): void => {
  // reset the errors
  resetFormFieldErrors()

  if (form.fields.url.length) {
    try {
      // try constructing a url
      const parsedUrl = new URL(form.fields.url)
      // url is valid

      // validate protocol
      const protocolError = validateProtocol(parsedUrl.protocol, gatewayServiceProtocolItems)
      if (protocolError) throw new Error(protocolError)
      form.fields.protocol = parsedUrl.protocol.slice(0, -1)

      // validate hostname
      const hostError = validateHost(parsedUrl.hostname)
      if (hostError) throw new Error(hostError)
      form.fields.host = parsedUrl.hostname

      // validate path
      const pathError = validatePath(parsedUrl.pathname)
      if (pathError) throw new Error(pathError)
      form.fields.path = parsedUrl.pathname

      // validate port
      const portError = validatePort(parsedUrl.port)
      if (portError) throw new Error(portError)
      // extract port value from url and convert to number
      const portValue = Number(parsedUrl.port)
      hasExtractPortValue.value = !!portValue
      form.fields.port = portValue || getPort.getPortFromProtocol(form.fields.protocol)

      emit('url-valid:success')
    } catch {
      emit('url-valid:error', t('gateway_services.form.errors.url.invalid'))
      form.formFieldErrors.url = t('gateway_services.form.errors.url.invalid')
    }
  }
}

const handleValidateAdvancedFields = (fieldId?: keyof FormFieldErrors) => {
  // reset the errors
  resetFormFieldErrors(fieldId)
}

const getFullUrlError = computed(() : boolean => !!form.formFieldErrors.url || !!form.formFieldErrors.host || !!form.formFieldErrors.port)

const getFieldErrorById = (fieldId: keyof FormFieldErrors): string => {
  // if form error is present return empty
  if (form.errorMessages.length) return ''

  const errorsMap = form.formFieldErrors
  if (errorsMap[fieldId]) return errorsMap[fieldId]
  return ''
}


// validate for the service type custom URL
const handleValidateCustomUrl = (fieldId?: keyof FormFieldErrors): void => {

  // reset the errors
  resetFormFieldErrors(fieldId ?? undefined)

  // validate hostname
  const hostError = validateHost(form.fields.host)
  if (hostError) form.formFieldErrors.host = hostError

  // validate path
  const pathError = validatePath(form.fields.path)
  if (pathError) form.formFieldErrors.path = pathError

  // validate port
  const portError = validatePort(form.fields.port)
  if (portError) form.formFieldErrors.port = portError

  if (isFormValid.value) {
    emit('url-valid:success')
  } else {
    emit('url-valid:error', form.errorMessages.join(',') || t('gateway_services.form.errors.url.invalid'))
  }
}

const resetFormFieldErrors = (fieldId?: keyof FormFieldErrors): void => {
  // if field Id is present only reset the field error
  if (fieldId) {
    form.formFieldErrors[fieldId] = ''
  } else {
    // reset all field errors
    for (let key in form.formFieldErrors) {
      form.formFieldErrors[key as keyof typeof form.formFieldErrors] = ''
    }
  }

  form.errorMessages = []
}

const isFormValid = computed((): boolean => {
  for (let key in form.formFieldErrors) {
    if (form.formFieldErrors[key as keyof typeof form.formFieldErrors].length) {
      return false
    }
  }

  return true
})

const validateUrl = (): void => {
  if (form.fields.url && checkedGroup.value === 'url') {
    handleValidateFullUrl()
  } else {
    handleValidateCustomUrl()
  }
}

/**
 * Generates a unique service name using the current timestamp.
 * The name format is "new-service-" followed by numbers from the ISO timestamp.
 *
 * Example output: "new-service-20250307123045789"
 */
const generateServiceName = (): string => {
  return `new-service-${new Date()
    .toISOString() // Convert date to ISO string format (e.g., "2025-03-07T12:30:45.789Z")
    .replace(/\D/g, '') // Remove all non-digit characters
    .slice(0, 17)}` // Take the first 17 digits
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

  const isValidProtocol = ['https', 'tls'].includes(form.fields.protocol)
  return checkedGroup.value === 'protocol' && isValidProtocol
})

// https://github.com/Kong/kong-ee/blob/ba6595a136c503c7f7ba93aaa45231985c00325e/kong/db/schema/entities/services.lua#L69-L74
const showTlsVerify = computed((): boolean => {
  if (checkedGroup.value === 'url') {
    return true
  }

  const isValidProtocol = ['https', 'wss', 'tls'].includes(form.fields.protocol)
  return checkedGroup.value === 'protocol' && isValidProtocol
})

const validateName = (input: string): void => {
  // reset the errors
  resetFormFieldErrors('name')
  preValidateErrorMessage.value = validators.utf8Name(input)
}

const canSubmit = computed((): boolean => {
  // If in edit mode, can submit only if there are changes
  const isEdited = !isEditing.value || !objectsAreEqual(form.fields, formFieldsOriginal)

  // if full URL check if the url is filled and valid
  const isUrlInputValid = checkedGroup.value === 'url' &&
    !!form.fields.url &&
    isFormValid.value

  // if advanced mode (protocol) check if the host is filled and all fields are valid
  const isProtocolInputValid = checkedGroup.value === 'protocol' &&
    !!form.fields.host &&
    isFormValid.value

  // Can submit if editing with changes, or if relevant fields are filled and valid
  return isEdited && (isUrlInputValid || isProtocolInputValid)
})

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
  form.fields.enabled = data?.enabled ?? true
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
    ca_certificates: form.fields.ca_certificates ? form.fields.ca_certificates?.split(',').filter(caCert => caCert !== '') : null,
    client_certificate: form.fields.client_certificate ? { id: form.fields.client_certificate } : null,
    write_timeout: form.fields.write_timeout,
    port: form.fields.port,
    url: form.fields.url,
    enabled: form.fields.enabled,
  }

  if (form.fields.client_certificate && ['https', 'wss', 'tls'].includes(form.fields.protocol)) {
    requestBody.client_certificate = { id: form.fields.client_certificate }
  }

  if (form.fields.tls_verify_enabled && ['https', 'wss', 'tls'].includes(form.fields.protocol)) {
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

    const payload = getPayload.value

    let response: AxiosResponse | undefined

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
      form.fields.enabled = data?.enabled ?? true
      // Set initial state of `formFieldsOriginal` to these values in order to detect changes
      Object.assign(formFieldsOriginal, form.fields)
      // Emit an update event for the host app to respond to
      emit('update', response?.data)
    }

    return response
  } catch (error: any) {
    const { fields, messages } = getErrorFieldsFromError(error)
    form.errorMessages = messages
    if (fields.length) {
      // display error for each of the fields
      fields.forEach((errorField) => {
        const field = errorField.field
        if (field === 'client_certificate.id') {
          form.formFieldErrors.client_certificate = errorField.message
        } else if (field.startsWith('ca_certificates')) {
          form.formFieldErrors.ca_certificates = errorField.message
        } else if (Object.keys(form.formFieldErrors).includes(field)) {
          form.formFieldErrors = {
            ...form.formFieldErrors,
            [field]: errorField.message,
          }
        }
      })
    }
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

watch(form.fields, () => {
  emit('model-updated', getPayload.value)
})

onMounted(() => {
  emit('model-updated', getPayload.value)
  // generate name if new service
  if (!isEditing.value) {
    form.fields.name = generateServiceName()
  }
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

  :deep(.k-radio) {
    align-items: normal;
  }

  :deep(.form-section-wrapper) {
    padding-bottom: var(--kui-space-110, $kui-space-110);
  }

  .form-error-list {
    list-style-type: disc;
    margin: var(--kui-space-0, $kui-space-0);
    padding-left: var(--kui-space-60, $kui-space-60);
  }

  .gateway-service-form-margin-top {
    margin-top: var(--kui-space-60, $kui-space-60);
  }

  .gateway-service-form-advanced-fields {
    display: flex;
    flex-direction: column;
    gap: var(--kui-space-60, $kui-space-60);
    margin-left: var(--kui-space-50, $kui-space-50);
  }

  .gateway-service-form-tags {
    margin-left: var(--kui-space-50, $kui-space-50);
  }

  .gateway-service-form-traffic-label {
    margin-bottom: var(--kui-space-60, $kui-space-60);
  }

  .gateway-service-url-input {
    display: flex;

    :deep(.input-element-wrapper) {
      display: flex;
    }
  }

  .gateway-service-form-general-info {
    display: flex;
    flex-direction: column;
    gap: var(--kui-space-80, $kui-space-80);
  }

  .gateway-service-form-group-selection-wrapper {
    display: flex;
    flex-direction: row;
    gap: var(--kui-space-60, $kui-space-60);

    :deep(.radio-label-wrapper) {
      height: auto;
    }
  }

  .checkbox-aligned-radio {
    margin: var(--kui-space-20, $kui-space-20);
    padding-left: var(--kui-space-80, $kui-space-80);
  }
}

/* Transition styles */
.slide-fade-enter-active {
  transition: all 0.5s ease;
}

.slide-fade-enter-from {
  opacity: 0;
  transform: translateY(-5px);
}

.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(5px);
}
</style>
