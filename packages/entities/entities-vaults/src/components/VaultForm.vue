<template>
  <div class="kong-ui-entities-vault-form">
    <EntityBaseForm
      :can-submit="isFormValid && changesExist"
      :config="config"
      :edit-id="vaultId"
      :error-message="form.errorMessage"
      :fetch-url="fetchUrl"
      :is-readonly="form.isReadonly"
      @cancel="cancelHandler"
      @fetch:error="fetchErrorHandler"
      @fetch:success="updateFormValues"
      @loading="loadingHandler"
      @submit="saveFormData"
    >
      <EntityFormSection
        :description="t('form.sections.general.description')"
        :title="t('form.sections.general.title')"
      >
        <KInput
          v-model.trim="form.fields.prefix"
          autocomplete="off"
          data-testid="vault-form-prefix"
          :help="t('form.fields.prefix.help')"
          :is-readonly="form.isReadonly"
          :label="t('form.fields.prefix.label')"
          :label-attributes="{ info: t('form.fields.prefix.tooltip') }"
          :placeholder="t('form.fields.prefix.placeholder')"
          required
          type="text"
        />
        <KTextArea
          v-model.trim="form.fields.description"
          :character-limit="1000"
          class="vault-form-textarea"
          data-testid="vault-form-description"
          :label="t('form.fields.description.label')"
          :placeholder="t('form.fields.description.placeholder')"
          :readonly="form.isReadonly"
        />
        <KInput
          v-model.trim="form.fields.tags"
          autocomplete="off"
          data-testid="vault-form-tags"
          :help="t('form.fields.tags.help')"
          :is-readonly="form.isReadonly"
          :label="t('form.fields.tags.label')"
          :placeholder="t('form.fields.tags.placeholder')"
          type="text"
        />
      </EntityFormSection>

      <EntityFormSection
        :description="t('form.sections.config.description')"
        :title="t('form.sections.config.title')"
      >
        <div class="vault-form-provider-cards-container">
          <KRadio
            v-model="vaultProvider"
            card
            data-testid="vault-form-provider-kong"
            :disabled="vaultProviderDisabled"
            :label="t('form.config.kong.label')"
            :selected-value="VaultProviders.KONG"
          >
            <KIcon
              icon="kong"
              size="46"
            />
          </KRadio>
          <KTooltip
            :disabled="isOtherProvidersSupported"
            :label="t('form.unavailable')"
            placement="top"
          >
            <KRadio
              v-model="vaultProvider"
              card
              data-testid="vault-form-provider-aws"
              :disabled="vaultProviderDisabled || !isOtherProvidersSupported"
              :label="t('form.config.aws.label')"
              :selected-value="VaultProviders.AWS"
            >
              <img
                alt="Amazon Web Services"
                :src="getProviderIconURL(VaultProviders.AWS)"
                width="46"
              >
            </KRadio>
          </KTooltip>
          <KTooltip
            :disabled="isOtherProvidersSupported"
            :label="t('form.unavailable')"
            placement="top"
          >
            <KRadio
              v-model="vaultProvider"
              card
              data-testid="vault-form-provider-gcp"
              :disabled="vaultProviderDisabled || !isOtherProvidersSupported"
              :label="t('form.config.gcp.label')"
              :selected-value="VaultProviders.GCP"
            >
              <img
                alt="Google Cloud"
                :src="getProviderIconURL(VaultProviders.GCP)"
                width="46"
              >
            </KRadio>
          </KTooltip>
          <KTooltip
            :disabled="isOtherProvidersSupported"
            :label="t('form.unavailable')"
            placement="top"
          >
            <KRadio
              v-model="vaultProvider"
              card
              data-testid="vault-form-provider-hcv"
              :disabled="vaultProviderDisabled || !isOtherProvidersSupported"
              :label="t('form.config.hcv.label')"
              :selected-value="VaultProviders.HCV"
            >
              <img
                alt="HashiCorp Vault"
                :src="getProviderIconURL(VaultProviders.HCV)"
                width="46"
              >
            </KRadio>
          </KTooltip>
          <KTooltip
            v-if="config.azureVaultProviderAvailable"
            :disabled="isOtherProvidersSupported"
            :label="t('form.unavailable')"
            placement="top"
          >
            <KRadio
              v-model="vaultProvider"
              card
              data-testid="vault-form-provider-azure"
              :disabled="vaultProviderDisabled || !isOtherProvidersSupported"
              :label="t('form.config.azure.label')"
              :selected-value="VaultProviders.AZURE"
            >
              <img
                alt="Azure"
                :src="getProviderIconURL(VaultProviders.AZURE)"
                width="46"
              >
            </KRadio>
          </KTooltip>
        </div>

        <TransitionGroup name="appear">
          <!-- Kong Vault fields -->
          <div
            v-if="vaultProvider === VaultProviders.KONG"
            key="kong-vault-config-fields"
            class="vault-form-config-fields-container"
          >
            <KInput
              v-model.trim="configFields[VaultProviders.KONG].prefix"
              autocomplete="off"
              data-testid="vault-form-config-kong-prefix"
              :is-readonly="form.isReadonly"
              :label="t('form.config.kong.fields.prefix.label')"
              :label-attributes="{ info: t('form.config.kong.fields.prefix.tooltip') }"
              :placeholder="t('form.config.kong.fields.prefix.placeholder')"
              required
              type="text"
            />
          </div>

          <!-- AWS fields -->
          <div
            v-if="vaultProvider === VaultProviders.AWS"
            :key="`${VaultProviders.AWS}-vault-config-fields`"
            class="vault-form-config-fields-container"
          >
            <KSelect
              v-model="configFields[VaultProviders.AWS].region"
              appearance="select"
              data-testid="vault-form-config-aws-region"
              :items="awsRegions"
              :label="t('form.config.aws.fields.region.label')"
              :label-attributes="{ info: t('form.config.aws.fields.region.tooltip') }"
              :placeholder="t('form.config.aws.fields.region.placeholder')"
              :readonly="form.isReadonly"
              required
              width="100%"
            />
          </div>

          <!-- GCP fields -->
          <div
            v-if="vaultProvider === VaultProviders.GCP"
            :key="`${VaultProviders.GCP}-vault-config-fields`"
            class="vault-form-config-fields-container"
          >
            <KInput
              v-model.trim="configFields[VaultProviders.GCP].project_id"
              autocomplete="off"
              data-testid="vault-form-config-gcp-project-id"
              :is-readonly="form.isReadonly"
              :label="t('form.config.gcp.fields.project_id.label')"
              :placeholder="t('form.config.gcp.fields.project_id.placeholder')"
              required
              type="text"
            >
              <template #label-tooltip>
                <i18nT
                  keypath="form.config.gcp.fields.project_id.tooltip.text"
                  scope="global"
                >
                  <template #italic-text>
                    <em>{{ t('form.config.gcp.fields.project_id.tooltip.italicText') }}</em>
                  </template>
                </i18nT>
              </template>
            </KInput>
          </div>

          <!-- HashiCorp Vault fields -->
          <div
            v-if="vaultProvider === VaultProviders.HCV"
            :key="`${VaultProviders.HCV}-vault-config-fields`"
            class="vault-form-config-fields-container"
          >
            <KSelect
              v-model="configFields[VaultProviders.HCV].protocol"
              appearance="select"
              data-testid="vault-form-config-hcv-protocol"
              :items="protocols"
              :label="t('form.config.hcv.fields.protocol.label')"
              :readonly="form.isReadonly"
              required
              width="100%"
            />
            <KInput
              v-model.trim="configFields[VaultProviders.HCV].host"
              autocomplete="off"
              data-testid="vault-form-config-hcv-host"
              :is-readonly="form.isReadonly"
              :label="t('form.config.hcv.fields.host.label')"
              required
              type="text"
            />
            <KInput
              v-model="configFields[VaultProviders.HCV].port"
              autocomplete="off"
              data-testid="vault-form-config-hcv-port"
              :is-readonly="form.isReadonly"
              :label="t('form.config.hcv.fields.port.label')"
              min="0"
              required
              type="number"
            />
            <KInput
              v-model.trim="configFields[VaultProviders.HCV].mount"
              autocomplete="off"
              data-testid="vault-form-config-hcv-mount"
              :is-readonly="form.isReadonly"
              :label="t('form.config.hcv.fields.mount.label')"
              required
              type="text"
            />
            <KSelect
              v-model="configFields[VaultProviders.HCV].kv"
              appearance="select"
              data-testid="vault-form-config-hcv-kv"
              :items="kvVersions"
              :label="t('form.config.hcv.fields.kv.label')"
              :readonly="form.isReadonly"
              required
              width="100%"
            />
            <KInput
              v-model.trim="configFields[VaultProviders.HCV].namespace"
              autocomplete="off"
              data-testid="vault-form-config-hcv-namespace"
              :is-readonly="form.isReadonly"
              :label="t('form.config.hcv.fields.namespace.label')"
              type="text"
            />
            <KSelect
              v-model="configFields[VaultProviders.HCV].auth_method"
              appearance="select"
              data-testid="vault-form-config-hcv-auth_method"
              :items="[{ label: VaultAuthMethods.TOKEN, value: VaultAuthMethods.TOKEN }, { label: VaultAuthMethods.K8S, value: VaultAuthMethods.K8S}]"
              :label="t('form.config.hcv.fields.auth_method.label')"
              :readonly="form.isReadonly"
              required
              width="100%"
            />
            <div v-if="configFields[VaultProviders.HCV].auth_method === VaultAuthMethods.TOKEN">
              <KInput
                v-model.trim="configFields[VaultProviders.HCV].token"
                autocomplete="off"
                data-testid="vault-form-config-hcv-token"
                :is-readonly="form.isReadonly"
                :label="t('form.config.hcv.fields.token.label')"
                required
                type="text"
              />
            </div>
            <div v-else-if="configFields[VaultProviders.HCV].auth_method === VaultAuthMethods.K8S">
              <KInput
                v-model.trim="configFields[VaultProviders.HCV].kube_role"
                autocomplete="off"
                data-testid="vault-form-config-hcv-kube_role"
                :is-readonly="form.isReadonly"
                :label="t('form.config.hcv.fields.kube_role.label')"
                required
                type="text"
              />
              <KInput
                v-model.trim="configFields[VaultProviders.HCV].kube_api_token_file"
                autocomplete="off"
                data-testid="vault-form-config-hcv-kube_api_token_file"
                :is-readonly="form.isReadonly"
                :label="t('form.config.hcv.fields.kube_api_token_file.label')"
                required
                type="text"
              />
            </div>
          </div>

          <!-- Azure fields -->
          <div
            v-if="vaultProvider === VaultProviders.AZURE"
            :key="`${VaultProviders.HCV}-vault-config-fields`"
            class="vault-form-config-fields-container"
          >
            <KInput
              v-model.trim="configFields[VaultProviders.AZURE].location"
              autocomplete="off"
              data-testid="vault-form-config-azure-location"
              :is-readonly="form.isReadonly"
              :label="t('form.config.azure.fields.location.label')"
              required
              type="text"
            />
            <KInput
              v-model.trim="configFields[VaultProviders.AZURE].vault_uri"
              autocomplete="off"
              data-testid="vault-form-config-azure-uri"
              :is-readonly="form.isReadonly"
              :label="t('form.config.azure.fields.vault_uri.label')"
              required
              type="text"
            />
            <KInput
              v-model.trim="configFields[VaultProviders.AZURE].credentials_prefix"
              autocomplete="off"
              data-testid="vault-form-config-azure-prefix"
              :is-readonly="form.isReadonly"
              :label="t('form.config.azure.fields.credential_prefix.label')"
              required
              type="text"
            />
            <KSelect
              v-model="configFields[VaultProviders.AZURE].type"
              appearance="select"
              data-testid="vault-form-config-azure-type"
              :items="azureTypes"
              :label="t('form.config.azure.fields.type.label')"
              :placeholder="t('form.config.azure.fields.type.placeholder')"
              :readonly="form.isReadonly"
              required
              width="100%"
            />
            <KInput
              v-model.trim="configFields[VaultProviders.AZURE].client_id"
              autocomplete="off"
              data-testid="vault-form-config-azure-client-id"
              :is-readonly="form.isReadonly"
              :label="t('form.config.azure.fields.client_id.label')"
              type="text"
            />
            <KInput
              v-model.trim="configFields[VaultProviders.AZURE].tenant_id"
              autocomplete="off"
              data-testid="vault-form-config-azure-tenant-id"
              :is-readonly="form.isReadonly"
              :label="t('form.config.azure.fields.tenant_id.label')"
              type="text"
            />
          </div>

          <div v-if="config.ttl">
            <KCollapse
              v-if="isAvailableTTLConfig"
              class="advanced-fields-collapse"
              data-testid="advanced-fields-collapse"
              trigger-alignment="leading"
              :trigger-label="t('form.config.advancedFields.title')"
            >
              <div class="wrapper">
                <div class="item-50">
                  <KInput
                    v-model="configFields[vaultProvider as VaultProviders.HCV | VaultProviders.GCP | VaultProviders.AWS].ttl"
                    data-testid="vault-ttl-input"
                    :label="t('form.config.advancedFields.ttl')"
                    :label-attributes="{ info: t('form.config.advancedFields.ttlTooltip') }"
                    type="number"
                  />
                </div>

                <div class="item-50">
                  <KInput
                    v-model="configFields[vaultProvider as VaultProviders.HCV | VaultProviders.GCP | VaultProviders.AWS].neg_ttl"
                    data-testid="vault-neg-ttl-input"
                    :label="t('form.config.advancedFields.negTtl')"
                    :label-attributes="{ info: t('form.config.advancedFields.negTtlTooltip') }"
                    type="number"
                  />
                </div>
              </div>

              <div class="wrapper">
                <div class="item-100">
                  <KInput
                    v-model="configFields[vaultProvider as VaultProviders.HCV | VaultProviders.GCP | VaultProviders.AWS].resurrect_ttl"
                    data-testid="vault-resurrect-ttl-input"
                    :label="t('form.config.advancedFields.resurrectTtl')"
                    :label-attributes="{ info: t('form.config.advancedFields.resurrectTtlTooltip') }"
                    type="number"
                  />
                </div>
              </div>
            </KCollapse>
          </div>
        </TransitionGroup>
      </EntityFormSection>
    </EntityBaseForm>
  </div>
</template>

<script lang="ts" setup>
import {
  useAxios,
  useErrors,
  useGatewayFeatureSupported,
  EntityFormSection,
  EntityBaseForm,
  EntityBaseFormType,
} from '@kong-ui-public/entities-shared'
import composables from '../composables'
import '@kong-ui-public/entities-shared/dist/style.css'
import type { PropType } from 'vue'
import { computed, reactive, ref } from 'vue'
import type {
  KongVaultConfig,
  AWSVaultConfig,
  GCPVaultConfig,
  HCVVaultConfig,
  AzureVaultConfig,
  VaultState,
  VaultStateFields,
  KongManagerVaultFormConfig,
  KonnectVaultFormConfig,
  VaultPayload,
} from '../types'
import {
  VaultProviders,
  VaultAuthMethods,
} from '../types'
import { useRouter } from 'vue-router'
import type { AxiosError, AxiosResponse } from 'axios'
import endpoints from '../vaults-endpoints'

interface ConfigFields {
  [VaultProviders.KONG]: KongVaultConfig
  [VaultProviders.AWS]: AWSVaultConfig
  [VaultProviders.GCP]: GCPVaultConfig
  [VaultProviders.HCV]: HCVVaultConfig
  [VaultProviders.AZURE]: AzureVaultConfig
}

// Component props - This structure must exist in ALL entity components, with the exclusion of unneeded action props (e.g. if you don't need `canDelete`, just exclude it)
const props = defineProps({
  /** The base konnect or kongManger config. Pass additional config props in the shared entity component as needed. */
  config: {
    type: Object as PropType<KonnectVaultFormConfig | KongManagerVaultFormConfig>,
    required: true,
    validator: (config: KonnectVaultFormConfig | KongManagerVaultFormConfig): boolean => {
      if (!config || !['konnect', 'kongManager'].includes(config?.app)) return false
      if (config?.app === 'konnect' && !config?.controlPlaneId) return false
      if (config?.app === 'kongManager' && typeof config?.workspace !== 'string') return false
      if (!config?.cancelRoute) return false
      return true
    },
  },
  /** If a valid vaultId is provided, it will put the form in Edit mode instead of Create */
  vaultId: {
    type: String,
    required: false,
    default: '',
  },
})

const emit = defineEmits<{
  (e: 'update', data: VaultStateFields): void,
  (e: 'error', error: AxiosError): void,
  (e: 'loading', isLoading: boolean): void,
}>()

const { i18nT, i18n: { t } } = composables.useI18n()
const router = useRouter()
const { axiosInstance } = useAxios({
  headers: props.config?.requestHeaders,
})
const { getMessageFromError } = useErrors()

const form = reactive<VaultState>({
  fields: {
    prefix: '',
    description: '',
    tags: '',
  },
  isReadonly: false,
  errorMessage: '',
})

const originalFields = reactive<VaultStateFields>({
  prefix: '',
  description: '',
  tags: '',
})

const vaultProvider = ref<VaultProviders>(VaultProviders.KONG)
const originalVaultProvider = ref<VaultProviders | null>(null)

const isAvailableTTLConfig = computed(() => {
  return [VaultProviders.AWS, VaultProviders.GCP, VaultProviders.HCV, VaultProviders.AZURE].includes(vaultProvider.value)
})

const configFields = reactive<ConfigFields>({
  [VaultProviders.KONG]: {
    prefix: '',
  } as KongVaultConfig,
  [VaultProviders.AWS]: {
    region: '',
  } as AWSVaultConfig,
  [VaultProviders.GCP]: {
    project_id: '',
  } as GCPVaultConfig,
  [VaultProviders.HCV]: {
    protocol: 'http',
    host: '127.0.0.1',
    port: 8200,
    mount: 'secret',
    kv: 'v1',
    namespace: '',
    auth_method: VaultAuthMethods.TOKEN,
    token: '',
    kube_role: '',
    kube_api_token_file: '',
  } as HCVVaultConfig,
  [VaultProviders.AZURE]: {
    location: '',
    vault_uri: '',
    type: 'secrets',
    credentials_prefix: 'AZURE',
    client_id: '',
    tenant_id: '',
  } as AzureVaultConfig,
})

const originalConfigFields = reactive<ConfigFields>({
  [VaultProviders.KONG]: {
    prefix: '',
  } as KongVaultConfig,
  [VaultProviders.AWS]: {
    region: '',
  } as AWSVaultConfig,
  [VaultProviders.GCP]: {
    project_id: '',
  } as GCPVaultConfig,
  [VaultProviders.HCV]: {
    protocol: 'http',
    host: '127.0.0.1',
    port: 8200,
    mount: 'secret',
    kv: 'v1',
    namespace: '',
    auth_method: VaultAuthMethods.TOKEN,
    token: '',
    kube_role: '',
    kube_api_token_file: '',
  } as HCVVaultConfig,
  [VaultProviders.AZURE]: {
    location: '',
    vault_uri: '',
    type: 'secrets',
    credentials_prefix: 'AZURE',
    client_id: '',
    tenant_id: '',
  } as AzureVaultConfig,
})

const awsRegions = [
  { label: `${t('form.config.aws.fields.region.locations.us-east-1.location')} (us-east-1)`, value: 'us-east-1' },
  { label: `${t('form.config.aws.fields.region.locations.us-east-2.location')} (us-east-2)`, value: 'us-east-2' },
  { label: `${t('form.config.aws.fields.region.locations.us-west-1.location')} (us-west-1)`, value: 'us-west-1' },
  { label: `${t('form.config.aws.fields.region.locations.us-west-2.location')} (us-west-2)`, value: 'us-west-2' },
  { label: `${t('form.config.aws.fields.region.locations.af-south-1.location')} (af-south-1)`, value: 'af-south-1' },
  { label: `${t('form.config.aws.fields.region.locations.ap-east-1.location')} (ap-east-1)`, value: 'ap-east-1' },
  { label: `${t('form.config.aws.fields.region.locations.ap-southeast-3.location')} (ap-southeast-3)`, value: 'ap-southeast-3' },
  { label: `${t('form.config.aws.fields.region.locations.ap-south-1.location')} (ap-south-1)`, value: 'ap-south-1' },
  { label: `${t('form.config.aws.fields.region.locations.ap-northeast-1.location')} (ap-northeast-1)`, value: 'ap-northeast-1' },
  { label: `${t('form.config.aws.fields.region.locations.ap-northeast-2.location')} (ap-northeast-2)`, value: 'ap-northeast-2' },
  { label: `${t('form.config.aws.fields.region.locations.ap-northeast-3.location')} (ap-northeast-3)`, value: 'ap-northeast-3' },
  { label: `${t('form.config.aws.fields.region.locations.ap-southeast-1.location')} (ap-southeast-1)`, value: 'ap-southeast-1' },
  { label: `${t('form.config.aws.fields.region.locations.ap-southeast-2.location')} (ap-southeast-2)`, value: 'ap-southeast-2' },
  { label: `${t('form.config.aws.fields.region.locations.ca-central-1.location')} (ca-central-1)`, value: 'ca-central-1' },
  { label: `${t('form.config.aws.fields.region.locations.eu-central-1.location')} (eu-central-1)`, value: 'eu-central-1' },
  { label: `${t('form.config.aws.fields.region.locations.eu-west-1.location')} (eu-west-1)`, value: 'eu-west-1' },
  { label: `${t('form.config.aws.fields.region.locations.eu-west-2.location')} (eu-west-2)`, value: 'eu-west-2' },
  { label: `${t('form.config.aws.fields.region.locations.eu-west-3.location')} (eu-west-3)`, value: 'eu-west-3' },
  { label: `${t('form.config.aws.fields.region.locations.eu-south-1.location')} (eu-south-1)`, value: 'eu-south-1' },
  { label: `${t('form.config.aws.fields.region.locations.eu-north-1.location')} (eu-north-1)`, value: 'eu-north-1' },
  { label: `${t('form.config.aws.fields.region.locations.me-south-1.location')} (me-south-1)`, value: 'me-south-1' },
  { label: `${t('form.config.aws.fields.region.locations.sa-east-1.location')} (sa-east-1)`, value: 'sa-east-1' },
  { label: `${t('form.config.aws.fields.region.locations.us-gov-east-1.location')} (us-gov-east-1)`, value: 'us-gov-east-1' },
  { label: `${t('form.config.aws.fields.region.locations.us-gov-west-1.location')} (us-gov-west-1)`, value: 'us-gov-west-1' },
]

const azureTypes = [{ label: 'secrets', value: 'secrets' }]

const protocols = [{ label: 'http', value: 'http' }, { label: 'https', value: 'https' }]

const kvVersions = [{ label: 'v1', value: 'v1' }, { label: 'v2', value: 'v2' }]

const formType = computed((): EntityBaseFormType => props.vaultId
  ? EntityBaseFormType.Edit
  : EntityBaseFormType.Create)

const fetchUrl = computed<string>(() => endpoints.form[props.config?.app]?.edit)

const vaultProviderDisabled = computed<boolean>(() => formType.value === EntityBaseFormType.Edit && props.config.app === 'kongManager')
const isOtherProvidersSupported = props.config.app === 'konnect' || useGatewayFeatureSupported({
  gatewayInfo: props.config.gatewayInfo,
  // vault name can only be `env` in Gateway Community Edition
  supportedRange: {
    enterprise: [],
  },
})

const cancelHandler = (): void => {
  router.push(props.config?.cancelRoute || { name: 'vault-list' })
}

const loadingHandler = (val: boolean): void => {
  emit('loading', val)
}

const fetchErrorHandler = (err: AxiosError): void => {
  emit('error', err)
}

const getProviderIconURL = (providerName: string) => {
  return new URL(`../assets/images/provider-icons/${providerName}.svg`, import.meta.url).href
}

const updateFormValues = (data: Record<string, any>): void => {
  form.fields.prefix = data?.item?.prefix || data?.prefix || ''
  form.fields.description = data?.item?.description || data?.description || ''

  const tags = data?.item?.tags || data?.tags || []
  form.fields.tags = tags?.join(', ') || ''

  Object.assign(originalFields, form.fields)

  const config = data?.item?.config || data?.config || null
  if (config && Object.keys(config).length) {
    vaultProvider.value = data?.item?.name || data?.name || ''
    originalVaultProvider.value = vaultProvider.value
    Object.assign(configFields[vaultProvider.value], config)

    Object.assign(originalConfigFields[vaultProvider.value], config)
  } else {
    form.errorMessage = 'Error loading vault config'
  }
}

/**
 * Is the form submit button enabled?
 */
const isVaultConfigValid = computed((): boolean => {
  // HashiCorp Vault fields logic
  if (vaultProvider.value === VaultProviders.HCV) {
    return !Object.keys(configFields[VaultProviders.HCV]).filter(key => {
      // namespace and ttl fields are optional
      if (['namespace', 'ttl', 'neg_ttl', 'resurrect_ttl'].includes(key)) {
        return false
      }
      // kube_role and kube_api_token_file are not needed if auth method is token
      if (configFields[VaultProviders.HCV].auth_method === VaultAuthMethods.TOKEN && (key === 'kube_role' || key === 'kube_api_token_file')) {
        return false
      }
      // token is not needed if auth method is kubernetes
      if (configFields[VaultProviders.HCV].auth_method === VaultAuthMethods.K8S && key === 'token') {
        return false
      }
      return !(configFields[vaultProvider.value] as HCVVaultConfig)[key as keyof HCVVaultConfig]
    }).length
  }

  // Azure Vault fields logic
  if (vaultProvider.value === VaultProviders.AZURE) {
    return !Object.keys(configFields[VaultProviders.AZURE]).filter(key => {
      // client_id, tenant_id and ttl fields are optional
      if (['client_id', 'tenant_id', 'ttl', 'neg_ttl', 'resurrect_ttl'].includes(key)) {
        return false
      }
      return !(configFields[vaultProvider.value] as AzureVaultConfig)[key as keyof AzureVaultConfig]
    }).length
  }

  return !Object.keys(configFields[vaultProvider.value]).filter(key => {
    // ttl fields are optional
    if (['ttl', 'neg_ttl', 'resurrect_ttl'].includes(key)) {
      return false
    }
    return !(configFields[vaultProvider.value] as KongVaultConfig | AWSVaultConfig | GCPVaultConfig)[key as keyof (KongVaultConfig | AWSVaultConfig | GCPVaultConfig)]
  }).length
})
const isFormValid = computed((): boolean => !!form.fields.prefix && isVaultConfigValid.value)
const changesExist = computed((): boolean => (JSON.stringify(form.fields) !== JSON.stringify(originalFields)) || (vaultProvider.value !== originalVaultProvider.value || JSON.stringify(configFields[vaultProvider.value]) !== JSON.stringify(originalConfigFields[vaultProvider.value])))

/* ---------------
 * Saving
 * ---------------
 */

/**
 * Build the submit URL
 */
const submitUrl = computed<string>(() => {
  let url = `${props.config.apiBaseUrl}${endpoints.form[props.config.app][formType.value]}`

  if (props.config.app === 'konnect') {
    url = url.replace(/{controlPlaneId}/gi, props.config?.controlPlaneId || '')
  } else if (props.config.app === 'kongManager') {
    url = url.replace(/\/{workspace}/gi, props.config?.workspace ? `/${props.config.workspace}` : '')
  }

  // Always replace the id when editing
  url = url.replace(/{id}/gi, props.vaultId)

  return url
})

const saveFormData = async (): Promise<void> => {
  try {
    form.isReadonly = true

    const hcvConfig = {
      protocol: configFields[VaultProviders.HCV].protocol,
      host: configFields[VaultProviders.HCV].host,
      port: parseInt(configFields[VaultProviders.HCV].port.toString()),
      mount: configFields[VaultProviders.HCV].mount,
      kv: configFields[VaultProviders.HCV].kv,
      namespace: configFields[VaultProviders.HCV].namespace || null,
      auth_method: configFields[VaultProviders.HCV].auth_method,
      ...(configFields[VaultProviders.HCV].auth_method === VaultAuthMethods.TOKEN && { token: configFields[VaultProviders.HCV].token }),
      // For Kong Admin API, when auth_method is kubernetes, token must be in the request body and its value has to be null
      ...(configFields[VaultProviders.HCV].auth_method === VaultAuthMethods.K8S && { kube_role: configFields[VaultProviders.HCV].kube_role, kube_api_token_file: configFields[VaultProviders.HCV].kube_api_token_file, token: null }),
    }

    const azureConfig = {
      ...configFields[vaultProvider.value],
      client_id: (configFields[vaultProvider.value] as AzureVaultConfig).client_id || null,
      tenant_id: (configFields[vaultProvider.value] as AzureVaultConfig).tenant_id || null,
    }

    let config: VaultPayload['config'] = configFields[vaultProvider.value]
    if (vaultProvider.value === VaultProviders.HCV) {
      config = hcvConfig
    } else if (vaultProvider.value === VaultProviders.AZURE) {
      config = azureConfig
    }

    let ttlFields = {}
    if (vaultProvider.value !== VaultProviders.KONG) {
      const fields = configFields[vaultProvider.value as VaultProviders.HCV | VaultProviders.GCP | VaultProviders.AWS | VaultProviders.AZURE]
      const ttl = fields.ttl
      const negTtl = fields.neg_ttl
      const resurrectTtl = fields.resurrect_ttl
      ttlFields = {
        ttl: ttl ? parseInt(ttl.toString(), 10) : null,
        neg_ttl: negTtl ? parseInt(negTtl.toString(), 10) : null,
        resurrect_ttl: resurrectTtl ? parseInt(resurrectTtl.toString(), 10) : null,
      }
    }

    const payload: VaultPayload = {
      prefix: form.fields.prefix,
      description: form.fields.description || null,
      tags: form.fields.tags.split(',')?.map((tag: string) => String(tag || '')
        .trim())?.filter((tag: string) => tag !== ''),
      name: vaultProvider.value,
      config: {
        ...config,
        ...ttlFields,
      },
    }

    let response: AxiosResponse | undefined

    if (formType.value === 'create') {
      response = await axiosInstance.post(submitUrl.value, payload)
    } else if (formType.value === 'edit') {
      response = props.config?.app === 'konnect'
        ? await axiosInstance.put(submitUrl.value, payload)
        : await axiosInstance.patch(submitUrl.value, payload)
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
.kong-ui-entities-vault-form {
  width: 100%;

  .advanced-fields-collapse {
    margin-bottom: 24px;

    .wrapper {
      display: flex;
      gap: 24px;
      margin-bottom: 24px;

      .item-50 {
        width: 50%;
      }

      .item-100 {
        width: 100%;
      }
    }
  }

  .vault-form {
    &-textarea {
      width: 100%;
    }

    &-provider-cards-container {
      column-gap: $kui-space-50;
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      row-gap: $kui-space-50;

      .k-radio-label {
        margin-top: $kui-space-50;
      }

      :deep(.k-radio label) {
        box-sizing: border-box;
      }

      :deep(.k-radio) {
        box-sizing: border-box;
        height: 100%;
        width: 100%;
      }
    }

    &-config-fields-container {
      > *, div > * {
        &:not(:first-child) {
          margin-top: $kui-space-80;
        }
      }
    }
  }
}
</style>
