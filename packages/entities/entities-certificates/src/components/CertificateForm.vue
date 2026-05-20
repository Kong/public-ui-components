<template>
  <div class="kong-ui-entities-certificates-form">
    <EntityBaseForm
      :align-action-button-to-left="config.azureCertsVaultAvailable"
      :can-submit="canSubmit"
      :config="config"
      :edit-id="certificateId"
      :entity-type="SupportedEntityType.Certificate"
      :error-message="form.errorMessage"
      :fetch-url="fetchUrl"
      :form-fields="requestBody"
      :is-readonly="form.isReadonly"
      @cancel="handleClickCancel"
      @fetch:error="(err: any) => $emit('error', err)"
      @fetch:success="initForm"
      @loading="(val: boolean) => $emit('loading', val)"
      @submit="saveFormData"
    >
      <!-- Multi-step layout (vault available) -->
      <template v-if="config.azureCertsVaultAvailable">
        <EntityFormBlock
          :step="1"
          :title="t('certificates.form.sections.certificate_config.title')"
        >
          <div class="certificate-source-selector">
            <KLabel>{{ t('certificates.form.source_type.question') }}</KLabel>
            <div class="certificate-source-options">
              <KRadio
                v-model="sourceType"
                card
                card-orientation="vertical"
                data-testid="certificate-source-type-azure"
                :description="t('certificates.form.source_type.azure.description')"
                :label="t('certificates.form.source_type.azure.label')"
                :readonly="form.isReadonly"
                selected-value="azure"
              >
                <AzureIcon />
              </KRadio>
              <KRadio
                v-model="sourceType"
                card
                card-orientation="vertical"
                data-testid="certificate-source-type-ssl"
                :description="t('certificates.form.source_type.ssl.description')"
                :label="t('certificates.form.source_type.ssl.label')"
                :readonly="form.isReadonly"
                selected-value="ssl"
              >
                <KongIcon />
              </KRadio>
            </div>
          </div>

          <template v-if="sourceType === 'ssl'">
            <KTextArea
              v-model.trim="form.fields.cert"
              :character-limit="false"
              class="certificate-form-textarea"
              data-testid="certificate-form-cert"
              :label="t('certificates.form.fields.cert.label')"
              :label-attributes="{ tooltipAttributes: { maxWidth: '400' } }"
              :readonly="form.isReadonly"
              required
            >
              <template #label-tooltip>
                <i18nT
                  keypath="certificates.form.fields.cert.tooltip"
                  scope="global"
                >
                  <template #emphasis>
                    <em>{{ t('certificates.form.fields.cert.emphasis') }}</em>
                  </template>
                </i18nT>
              </template>
            </KTextArea>

            <KTextArea
              v-model.trim="form.fields.key"
              :character-limit="false"
              class="certificate-form-textarea"
              data-testid="certificate-form-key"
              :label="t('certificates.form.fields.key.label')"
              :label-attributes="{ tooltipAttributes: { maxWidth: '400' } }"
              :readonly="form.isReadonly"
              required
            >
              <template #label-tooltip>
                <i18nT
                  keypath="certificates.form.fields.key.tooltip"
                  scope="global"
                >
                  <template #emphasis>
                    <em>{{ t('certificates.form.fields.key.emphasis') }}</em>
                  </template>
                </i18nT>
              </template>
            </KTextArea>

            <KTextArea
              v-model.trim="form.fields.certAlt"
              :character-limit="false"
              class="certificate-form-textarea"
              data-testid="certificate-form-cert-alt"
              :label="t('certificates.form.fields.cert_alt.label')"
              :label-attributes="{ tooltipAttributes: { maxWidth: '400' } }"
              :readonly="form.isReadonly"
            >
              <template #label-tooltip>
                <i18nT
                  keypath="certificates.form.fields.cert_alt.tooltip"
                  scope="global"
                >
                  <template #emphasis>
                    <em>{{ t('certificates.form.fields.cert_alt.emphasis') }}</em>
                  </template>
                </i18nT>
              </template>
            </KTextArea>

            <KTextArea
              v-model.trim="form.fields.keyAlt"
              :character-limit="false"
              class="certificate-form-textarea"
              data-testid="certificate-form-key-alt"
              :label="t('certificates.form.fields.key_alt.label')"
              :label-attributes="{ tooltipAttributes: { maxWidth: '400' } }"
              :readonly="form.isReadonly"
            >
              <template #label-tooltip>
                <i18nT
                  keypath="certificates.form.fields.key_alt.tooltip"
                  scope="global"
                >
                  <template #emphasis>
                    <em>{{ t('certificates.form.fields.key_alt.emphasis') }}</em>
                  </template>
                </i18nT>
              </template>
            </KTextArea>
          </template>

          <template v-else>
            <div>
              <KInput
                v-model.trim="form.fields.vault"
                autocomplete="off"
                class="certificate-form-vault-input"
                data-testid="certificate-form-vault"
                :label="t('certificates.form.fields.vault.label')"
                :placeholder="t('certificates.form.fields.vault.placeholder')"
                :readonly="form.isReadonly"
                required
              />
              <VaultSecretPickerProvider
                :disabled="form.isReadonly"
                :update="(v: string) => form.fields.vault = v"
                :value="form.fields.vault"
                @open="(value, update) => setUpVaultSecretPicker(value, update)"
              />
            </div>

            <div>
              <KInput
                v-model.trim="form.fields.vaultAlt"
                autocomplete="off"
                class="certificate-form-vault-input"
                data-testid="certificate-form-vault-alt"
                :label="t('certificates.form.fields.vault_alt.label')"
                :placeholder="t('certificates.form.fields.vault_alt.placeholder')"
                :readonly="form.isReadonly"
              />
              <VaultSecretPickerProvider
                :disabled="form.isReadonly"
                :update="(v: string) => form.fields.vaultAlt = v"
                :value="form.fields.vaultAlt"
                @open="(value, update) => setUpVaultSecretPicker(value, update)"
              />
            </div>
          </template>

          <CertificateFormSniField
            v-if="showSnisField && config.sniListRoute"
            v-model="form.fields.snis"
            :is-editing="formType === EntityBaseFormType.Edit"
            :sni-list-route="config.sniListRoute"
            @add="handleAddSni"
            @remove="(index: number) => handleRemoveSni(index)"
          />
        </EntityFormBlock>

        <EntityFormBlock
          :description="t('certificates.form.sections.general.description')"
          :step="2"
          :title="t('certificates.form.sections.general.title')"
        >
          <KCollapse
            v-model="tagsCollapseOpen"
            :trigger-label="t('certificates.form.fields.tags.show_label')"
          >
            <KInput
              v-model.trim="form.fields.tags"
              autocomplete="off"
              data-testid="certificate-form-tags"
              :help="t('certificates.form.fields.tags.help')"
              :label="t('certificates.form.fields.tags.label')"
              :label-attributes="{
                info: t('certificates.form.fields.tags.tooltip'),
                tooltipAttributes: { maxWidth: '400' },
              }"
              :placeholder="t('certificates.form.fields.tags.placeholder')"
              :readonly="form.isReadonly"
              type="text"
            />
          </KCollapse>
        </EntityFormBlock>
      </template>

      <!-- Single-section layout (vault not available) -->
      <template v-else>
        <EntityFormSection
          :description="t('certificates.form.sections.ssl.description')"
          :title="t('certificates.form.sections.ssl.title')"
        >
          <KTextArea
            v-model.trim="form.fields.cert"
            :character-limit="false"
            class="certificate-form-textarea"
            data-testid="certificate-form-cert"
            :label="t('certificates.form.fields.cert.label')"
            :label-attributes="{ tooltipAttributes: { maxWidth: '400' } }"
            :readonly="form.isReadonly"
            required
          >
            <template #label-tooltip>
              <i18nT
                keypath="certificates.form.fields.cert.tooltip"
                scope="global"
              >
                <template #emphasis>
                  <em>{{ t('certificates.form.fields.cert.emphasis') }}</em>
                </template>
              </i18nT>
            </template>
          </KTextArea>

          <KTextArea
            v-model.trim="form.fields.key"
            :character-limit="false"
            class="certificate-form-textarea"
            data-testid="certificate-form-key"
            :label="t('certificates.form.fields.key.label')"
            :label-attributes="{ tooltipAttributes: { maxWidth: '400' } }"
            :readonly="form.isReadonly"
            required
          >
            <template #label-tooltip>
              <i18nT
                keypath="certificates.form.fields.key.tooltip"
                scope="global"
              >
                <template #emphasis>
                  <em>{{ t('certificates.form.fields.key.emphasis') }}</em>
                </template>
              </i18nT>
            </template>
          </KTextArea>

          <KTextArea
            v-model.trim="form.fields.certAlt"
            :character-limit="false"
            class="certificate-form-textarea"
            data-testid="certificate-form-cert-alt"
            :label="t('certificates.form.fields.cert_alt.label')"
            :label-attributes="{ tooltipAttributes: { maxWidth: '400' } }"
            :readonly="form.isReadonly"
          >
            <template #label-tooltip>
              <i18nT
                keypath="certificates.form.fields.cert_alt.tooltip"
                scope="global"
              >
                <template #emphasis>
                  <em>{{ t('certificates.form.fields.cert_alt.emphasis') }}</em>
                </template>
              </i18nT>
            </template>
          </KTextArea>

          <KTextArea
            v-model.trim="form.fields.keyAlt"
            :character-limit="false"
            class="certificate-form-textarea"
            data-testid="certificate-form-key-alt"
            :label="t('certificates.form.fields.key_alt.label')"
            :label-attributes="{ tooltipAttributes: { maxWidth: '400' } }"
            :readonly="form.isReadonly"
          >
            <template #label-tooltip>
              <i18nT
                keypath="certificates.form.fields.key_alt.tooltip"
                scope="global"
              >
                <template #emphasis>
                  <em>{{ t('certificates.form.fields.key_alt.emphasis') }}</em>
                </template>
              </i18nT>
            </template>
          </KTextArea>

          <CertificateFormSniField
            v-if="showSnisField && config.sniListRoute"
            v-model="form.fields.snis"
            :is-editing="formType === EntityBaseFormType.Edit"
            :sni-list-route="config.sniListRoute"
            @add="handleAddSni"
            @remove="(index: number) => handleRemoveSni(index)"
          />
        </EntityFormSection>

        <EntityFormSection
          :description="t('certificates.form.sections.general.description')"
          :title="t('certificates.form.sections.general.title')"
        >
          <KInput
            v-model.trim="form.fields.tags"
            autocomplete="off"
            data-testid="certificate-form-tags"
            :help="t('certificates.form.fields.tags.help')"
            :label="t('certificates.form.fields.tags.label')"
            :label-attributes="{
              info: t('certificates.form.fields.tags.tooltip'),
              tooltipAttributes: { maxWidth: '400' },
            }"
            :placeholder="t('certificates.form.fields.tags.placeholder')"
            :readonly="form.isReadonly"
            type="text"
          />
        </EntityFormSection>
      </template>
    </EntityBaseForm>

    <VaultSecretPicker
      v-if="config.azureCertsVaultAvailable"
      :allowed-providers="[VaultProviders.AZURE_CERTS]"
      :config="config"
      :setup="vaultSecretPickerSetup"
      :show-secret-key="false"
      @cancel="() => vaultSecretPickerSetup = false"
      @proceed="handleVaultSecretPickerAutofill"
    />
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { AxiosError, AxiosResponse } from 'axios'
import type {
  KonnectCertificateFormConfig,
  KongManagerCertificateFormConfig,
  CertificateFormState,
  CertificateFormFields,
} from '../types'
import endpoints from '../certificates-endpoints'
import composables from '../composables'
import CertificateFormSniField from './CertificateFormSniField.vue'
import {
  useAxios,
  useErrors,
  EntityFormSection,
  EntityFormBlock,
  EntityBaseForm,
  EntityBaseFormType,
  SupportedEntityType,
} from '@kong-ui-public/entities-shared'
import '@kong-ui-public/entities-shared/dist/style.css'
import { VaultSecretPicker, VaultSecretPickerProvider, VaultProviders } from '@kong-ui-public/entities-vaults'
import '@kong-ui-public/entities-vaults/dist/style.css'
import { AzureIcon, KongIcon } from '@kong/icons'

const emit = defineEmits<{
  (e: 'update', data: Record<string, any>): void
  (e: 'error', error: AxiosError): void
  (e: 'loading', isLoading: boolean): void
}>()

// Component props - This structure must exist in ALL entity components, with the exclusion of unneeded action props (e.g. if you don't need `canDelete`, just exclude it)
const props = defineProps({
  /** The base konnect or kongManger config. Pass additional config props in the shared entity component as needed. */
  config: {
    type: Object as PropType<KonnectCertificateFormConfig | KongManagerCertificateFormConfig>,
    required: true,
    validator: (config: KonnectCertificateFormConfig | KongManagerCertificateFormConfig): boolean => {
      if (!config || !['konnect', 'kongManager'].includes(config?.app)) return false
      if (config.app === 'konnect' && !config.controlPlaneId) return false
      if (config.app === 'kongManager' && typeof config.workspace !== 'string') return false
      if (!config.cancelRoute) return false
      return true
    },
  },
  /** If a valid certificate ID is provided, it will put the form in Edit mode instead of Create */
  certificateId: {
    type: String as PropType<string | null>,
    required: false,
    default: null,
  },
  /** If true, the SNI field will be shown */
  showSnisField: {
    type: Boolean,
    required: false,
    default: false,
  },
})

const router = useRouter()
const { i18nT, i18n: { t } } = composables.useI18n()
const { getMessageFromError } = useErrors()

const { axiosInstance } = useAxios(props.config?.axiosRequestConfig)

const fetchUrl = computed<string>(() => endpoints.form[props.config.app].edit)
const formType = computed((): EntityBaseFormType => props.certificateId ? EntityBaseFormType.Edit : EntityBaseFormType.Create)

// Vault secret picker state (inlined from useVaultSecretPicker)
const vaultSecretPickerSetup = ref<string | false>(false)
const vaultSecretPickerAutofillAction = ref<((secretRef: string) => void) | undefined>()

const setUpVaultSecretPicker = (setupValue: string, autofillAction: (secretRef: string) => void): void => {
  vaultSecretPickerSetup.value = setupValue ?? ''
  vaultSecretPickerAutofillAction.value = autofillAction
}

const handleVaultSecretPickerAutofill = (secretRef: string): void => {
  vaultSecretPickerAutofillAction.value?.(secretRef)
  vaultSecretPickerSetup.value = false
}

// Source type for the multi-step layout ('ssl' = direct cert/key, 'azure' = vault reference)
const sourceType = ref<'ssl' | 'azure'>('ssl')

// Collapse state for the tags section in the multi-step layout
const tagsCollapseOpen = ref(false)

// Strip the trailing key segment: {vault://prefix/name/cert} → {vault://prefix/name}
const stripKeySegment = (vaultRef: string): string =>
  vaultRef.replace(/^(\{vault:\/\/[^/]+\/[^/}]+)(?:\/[^}]*)?\}$/, '$1}')

// Append a key segment: {vault://prefix/name} → {vault://prefix/name/cert}
const withKeySeg = (vaultRef: string, seg: string): string =>
  `${stripKeySegment(vaultRef).slice(0, -1)}/${seg}}`


// Returns true only when cert+key are both azure-managed vault refs pointing to the same resource,
// and alt fields (if present) satisfy the same condition.
const isAzureManagedCert = (cert: string, key: string, certAlt?: string, keyAlt?: string): boolean => {
  const certPattern = /^\{vault:\/\/([^/]+\/[^/]+)\/cert\}$/
  const keyPattern = /^\{vault:\/\/([^/]+\/[^/]+)\/key\}$/

  const certMatch = cert.match(certPattern)
  const keyMatch = key.match(keyPattern)
  if (!certMatch || !keyMatch || certMatch[1] !== keyMatch[1]) return false

  if (certAlt || keyAlt) {
    const certAltMatch = certAlt?.match(certPattern)
    const keyAltMatch = keyAlt?.match(keyPattern)
    if (!certAltMatch || !keyAltMatch || certAltMatch[1] !== keyAltMatch[1]) return false
  }

  return true
}

const form = reactive<CertificateFormState>({
  fields: {
    cert: '',
    key: '',
    certAlt: '',
    keyAlt: '',
    vault: '',
    vaultAlt: '',
    snis: [''],
    tags: '',
  },
  isReadonly: false,
  errorMessage: '',
})

const formFieldsOriginal = reactive<CertificateFormFields>({
  cert: '',
  key: '',
  certAlt: '',
  keyAlt: '',
  vault: '',
  vaultAlt: '',
  snis: [''],
  tags: '',
})

/**
 * Is the form submit button enabled?
 * If the form.fields and formFieldsOriginal are equal, always return false
 */
const canSubmit = computed((): boolean => {
  const changed = formType.value === EntityBaseFormType.Create || JSON.stringify(form.fields) !== JSON.stringify(formFieldsOriginal)
  if (props.config.azureCertsVaultAvailable && sourceType.value === 'azure') {
    return changed && !!form.fields.vault
  }
  return changed && !!form.fields.cert && !!form.fields.key
})

const initForm = (data: Record<string, any>): void => {
  form.fields.cert = data?.cert || ''
  form.fields.key = data?.key || ''
  form.fields.certAlt = data?.cert_alt || ''
  form.fields.keyAlt = data?.key_alt || ''
  form.fields.snis = data?.snis?.length ? data.snis : ['']
  form.fields.tags = data?.tags?.join(', ') || ''

  if (props.config.azureCertsVaultAvailable && isAzureManagedCert(form.fields.cert, form.fields.key, form.fields.certAlt, form.fields.keyAlt)) {
    sourceType.value = 'azure'
    form.fields.vault = stripKeySegment(form.fields.cert)
    form.fields.vaultAlt = form.fields.certAlt ? stripKeySegment(form.fields.certAlt) : ''
    form.fields.cert = ''
    form.fields.key = ''
    form.fields.certAlt = ''
    form.fields.keyAlt = ''
  } else {
    sourceType.value = 'ssl'
    form.fields.vault = ''
    form.fields.vaultAlt = ''
  }

  Object.assign(formFieldsOriginal, form.fields)
}

const handleClickCancel = (): void => {
  router.push(props.config.cancelRoute)
}

const handleAddSni = (): void => {
  form.fields.snis.push('')
}

const handleRemoveSni = (index: number): void => {
  form.fields.snis.splice(index, 1)
}

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
  }

  return url
    .replace(/\/{workspace}/gi, props.config?.workspace ? `/${props.config.workspace}` : '')
    .replace(/{id}/gi, props.certificateId ?? '') // Always replace the id when editing
})

const requestBody = computed((): Record<string, any> => {
  if (props.config.azureCertsVaultAvailable && sourceType.value === 'azure') {
    return {
      cert: withKeySeg(form.fields.vault, 'cert'),
      key: withKeySeg(form.fields.vault, 'key'),
      cert_alt: form.fields.vaultAlt ? withKeySeg(form.fields.vaultAlt, 'cert') : null,
      key_alt: form.fields.vaultAlt ? withKeySeg(form.fields.vaultAlt, 'key') : null,
      ...(props.showSnisField ? { snis: form.fields.snis.filter(Boolean) } : {}),
      tags: form.fields.tags.split(',')?.map((tag: string) => String(tag || '').trim())?.filter((tag: string) => tag !== ''),
    }
  }
  return {
    cert: form.fields.cert,
    key: form.fields.key,
    cert_alt: form.fields.certAlt || null,
    key_alt: form.fields.keyAlt || null,
    ...(props.showSnisField ? { snis: form.fields.snis.filter(Boolean) } : {}),
    tags: form.fields.tags.split(',')?.map((tag: string) => String(tag || '').trim())?.filter((tag: string) => tag !== ''),
  }
})

const saveFormData = async (): Promise<void> => {
  try {
    form.isReadonly = true

    let response: AxiosResponse | undefined

    // For azure mode, submit the vault shorthand so the backend validates the ref and expands it.
    // requestBody uses cert/key expansion for the view-config codeblock display.
    const submitPayload = (props.config.azureCertsVaultAvailable && sourceType.value === 'azure')
      ? {
        ...requestBody.value,
        vault: form.fields.vault || null,
        vault_alt: form.fields.vaultAlt || null,
      }
      : requestBody.value

    if (formType.value === 'create') {
      response = await axiosInstance.post(submitUrl.value, submitPayload)
    } else if (formType.value === 'edit') {
      response = props.config?.app === 'konnect'
        // Note: Konnect currently uses PUT because PATCH is not fully supported in Koko
        //       If this changes, the `edit` form methods should be re-evaluated/updated accordingly
        ? await axiosInstance.put(submitUrl.value, submitPayload)
        : await axiosInstance.patch(submitUrl.value, submitPayload)
    }

    if (props.config.azureCertsVaultAvailable && sourceType.value === 'azure') {
      form.fields.vault = response?.data?.cert ? stripKeySegment(response.data.cert) : ''
      form.fields.vaultAlt = response?.data?.cert_alt ? stripKeySegment(response.data.cert_alt) : ''
      form.fields.cert = ''
      form.fields.key = ''
      form.fields.certAlt = ''
      form.fields.keyAlt = ''
    } else {
      form.fields.cert = response?.data?.cert || ''
      form.fields.key = response?.data?.key || ''
      form.fields.certAlt = response?.data?.cert_alt || ''
      form.fields.keyAlt = response?.data?.key_alt || ''
      form.fields.vault = ''
      form.fields.vaultAlt = ''
    }
    form.fields.snis = response?.data?.snis?.length ? response.data.snis : ['']
    form.fields.tags = response?.data?.tags?.join(', ') || ''

    // Set initial state of `formFieldsOriginal` to these values in order to detect changes
    Object.assign(formFieldsOriginal, form.fields)

    // Emit an update event for the host app to respond to
    emit('update', response?.data)
  } catch (error: any) {
    form.errorMessage = getMessageFromError(error)
    // Emit the error for the host app
    emit('error', error)
  } finally {
    form.isReadonly = false
  }
}
</script>

<style lang="scss" scoped>
.kong-ui-entities-certificates-form {
  width: 100%;

  .certificate-form-textarea {
    width: 100%;

    :deep(.k-tooltip) {
      max-width: 300px;
    }
  }

  .certificate-form-vault-input {
    width: 100%;
  }

  :deep(.kong-ui-entity-form-block:not(:last-child)) {
    margin-bottom: var(--kui-space-70, $kui-space-70);
  }

  .certificate-source-selector {
    .certificate-source-options {
      display: flex;
      gap: var(--kui-space-70, $kui-space-70);
    }
  }
}
</style>
