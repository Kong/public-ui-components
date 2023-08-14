<template>
  <div class="kong-ui-entities-certificates-form">
    <EntityBaseForm
      :can-submit="canSubmit"
      :config="config"
      :edit-id="certificateId"
      :error-message="form.errorMessage"
      :fetch-url="fetchUrl"
      :is-readonly="form.isReadonly"
      @cancel="handleClickCancel"
      @fetch:error="(err: any) => $emit('error', err)"
      @fetch:success="initForm"
      @loading="(val: boolean) => $emit('loading', val)"
      @submit="saveFormData"
    >
      <EntityFormSection
        :description="t('certificates.form.sections.ssl.description')"
        :title="t('certificates.form.sections.ssl.title')"
      >
        <KTextArea
          v-model.trim="form.fields.cert"
          class="certificate-form-textarea"
          data-testid="certificate-form-cert"
          disable-character-limit
          :label="t('certificates.form.fields.cert.label')"
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
          class="certificate-form-textarea"
          data-testid="certificate-form-key"
          disable-character-limit
          :label="t('certificates.form.fields.key.label')"
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

        <KInput
          v-model.trim="form.fields.certAlt"
          autocomplete="off"
          data-testid="certificate-form-cert-alt"
          :label="t('certificates.form.fields.cert_alt.label')"
          :readonly="form.isReadonly"
          type="text"
        />

        <KInput
          v-model.trim="form.fields.keyAlt"
          autocomplete="off"
          data-testid="certificate-form-key-alt"
          :label="t('certificates.form.fields.key_alt.label')"
          :readonly="form.isReadonly"
          type="text"
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
          :label-attributes="{ info: t('certificates.form.fields.tags.tooltip') }"
          :placeholder="t('certificates.form.fields.tags.placeholder')"
          :readonly="form.isReadonly"
          type="text"
        />
      </EntityFormSection>
    </EntityBaseForm>
  </div>
</template>

<script setup lang="ts">
import { computed, PropType, reactive } from 'vue'
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
import { useAxios, useErrors, EntityFormSection, EntityBaseForm, EntityBaseFormType } from '@kong-ui-public/entities-shared'
import '@kong-ui-public/entities-shared/dist/style.css'

const emit = defineEmits<{
  (e: 'update', data: Record<string, any>): void,
  (e: 'error', error: AxiosError): void,
  (e: 'loading', isLoading: boolean): void,
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
    type: String,
    required: false,
    default: '',
  },
})

const router = useRouter()
const { i18nT, i18n: { t } } = composables.useI18n()
const { getMessageFromError } = useErrors()

const { axiosInstance } = useAxios({
  headers: props.config?.requestHeaders,
})

const fetchUrl = computed<string>(() => endpoints.form[props.config.app].edit)
const formType = computed((): EntityBaseFormType => props.certificateId ? EntityBaseFormType.Edit : EntityBaseFormType.Create)

const form = reactive<CertificateFormState>({
  fields: {
    cert: '',
    key: '',
    certAlt: '',
    keyAlt: '',
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
  tags: '',
})

/**
 * Is the form submit button enabled?
 * If the form.fields and formFieldsOriginal are equal, always return false
 */
const canSubmit = computed((): boolean => (formType.value === EntityBaseFormType.Create || JSON.stringify(form.fields) !== JSON.stringify(formFieldsOriginal)) && !!form.fields.cert && !!form.fields.key)

const initForm = (data: Record<string, any>): void => {
  form.fields.cert = data?.cert || ''
  form.fields.key = data?.key || ''
  form.fields.certAlt = data?.cert_alt || ''
  form.fields.keyAlt = data?.key_alt || ''
  form.fields.tags = data?.tags?.join(', ') || ''

  // Set initial state of `formFieldsOriginal` to these values in order to detect changes
  Object.assign(formFieldsOriginal, form.fields)
}

const handleClickCancel = (): void => {
  router.push(props.config.cancelRoute)
}

/* ---------------
 * Saving
 * ---------------
 */
/**
 * Build the validate and submit URL
 */
const validateSubmitUrl = computed((): string => {
  let url = `${props.config.apiBaseUrl}${endpoints.form[props.config.app].validate}`

  if (props.config.app === 'konnect') {
    url = url.replace(/{controlPlaneId}/gi, props.config?.controlPlaneId || '')
  } else if (props.config.app === 'kongManager') {
    url = url.replace(/\/{workspace}/gi, props.config?.workspace ? `/${props.config.workspace}` : '')
  }
  // Always replace the id when editing
  url = url.replace(/{id}/gi, props.certificateId)
  return url
})

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
  url = url.replace(/{id}/gi, props.certificateId)

  return url
})

const saveFormData = async (): Promise<void> => {
  try {
    form.isReadonly = true

    const requestBody: Record<string, any> = {
      cert: form.fields.cert,
      key: form.fields.key,
      cert_alt: form.fields.certAlt || null,
      key_alt: form.fields.keyAlt || null,
      tags: form.fields.tags.split(',')?.map((tag: string) => String(tag || '').trim())?.filter((tag: string) => tag !== ''),
    }

    let response: AxiosResponse | undefined

    await axiosInstance.post(validateSubmitUrl.value, requestBody)

    if (formType.value === 'create') {
      response = await axiosInstance.post(submitUrl.value, requestBody)
    } else if (formType.value === 'edit') {
      response = props.config?.app === 'konnect'
        // Note: Konnect currently uses PUT because PATCH is not fully supported in Koko
        //       If this changes, the `edit` form methods should be re-evaluated/updated accordingly
        ? await axiosInstance.put(submitUrl.value, requestBody)
        : await axiosInstance.patch(submitUrl.value, requestBody)
    }

    form.fields.cert = response?.data?.cert || ''
    form.fields.key = response?.data?.key || ''
    form.fields.certAlt = response?.data?.cert_alt || ''
    form.fields.keyAlt = response?.data?.key_alt || ''
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
}
</style>
