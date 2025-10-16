<template>
  <div class="kong-ui-entities-ca-certificates-form">
    <EntityBaseForm
      :can-submit="canSubmit"
      :config="config"
      :edit-id="certificateId"
      :entity-type="SupportedEntityType.CaCertificate"
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
      <EntityFormSection
        :description="t('ca-certificates.form.sections.cert.description')"
        :title="t('ca-certificates.form.sections.cert.title')"
      >
        <KTextArea
          v-model.trim="form.fields.cert"
          :character-limit="false"
          class="certificate-form-textarea"
          data-testid="ca-certificate-form-cert"
          :label="t('ca-certificates.form.fields.cert.label')"
          :label-attributes="{
            info: t('ca-certificates.form.fields.cert.tooltip'),
            tooltipAttributes: { maxWidth: '400' },
          }"
          :readonly="form.isReadonly"
          required
        />

        <KInput
          v-model.trim="form.fields.certDigest"
          autocomplete="off"
          data-testid="ca-certificate-form-cert-digest"
          :label="t('ca-certificates.form.fields.cert_digest.label')"
          :readonly="form.isReadonly"
          type="text"
        />
      </EntityFormSection>

      <EntityFormSection
        :description="t('ca-certificates.form.sections.general.description')"
        :title="t('ca-certificates.form.sections.general.title')"
      >
        <KInput
          v-model.trim="form.fields.tags"
          autocomplete="off"
          data-testid="ca-certificate-form-tags"
          :help="t('ca-certificates.form.fields.tags.help')"
          :label="t('ca-certificates.form.fields.tags.label')"
          :label-attributes="{
            info: t('ca-certificates.form.fields.tags.tooltip'),
            tooltipAttributes: { maxWidth: '400' },
          }"
          :placeholder="t('ca-certificates.form.fields.tags.placeholder')"
          :readonly="form.isReadonly"
          type="text"
        />
      </EntityFormSection>
    </EntityBaseForm>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import { computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import type { AxiosError, AxiosResponse } from 'axios'
import type {
  KonnectCertificateFormConfig,
  KongManagerCertificateFormConfig,
  CACertificateFormState,
  CACertificateFormFields,
} from '../types'
import endpoints from '../ca-certificates-endpoints'
import composables from '../composables'
import {
  useAxios,
  useErrors,
  EntityFormSection,
  EntityBaseForm,
  EntityBaseFormType,
  SupportedEntityType,
} from '@kong-ui-public/entities-shared'
import '@kong-ui-public/entities-shared/dist/style.css'

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
    type: String,
    required: false,
    default: '',
  },
})

const router = useRouter()
const { i18n: { t } } = composables.useI18n()
const { getMessageFromError } = useErrors()

const { axiosInstance } = useAxios(props.config?.axiosRequestConfig)

const fetchUrl = computed<string>(() => endpoints.form[props.config.app].edit)
const formType = computed((): EntityBaseFormType => props.certificateId ? EntityBaseFormType.Edit : EntityBaseFormType.Create)

const form = reactive<CACertificateFormState>({
  fields: {
    cert: '',
    certDigest: '',
    tags: '',
  },
  isReadonly: false,
  errorMessage: '',
})

const formFieldsOriginal = reactive<CACertificateFormFields>({
  cert: '',
  certDigest: '',
  tags: '',
})

/**
 * Is the form submit button enabled?
 * If the form.fields and formFieldsOriginal are equal, always return false
 */
const canSubmit = computed((): boolean => (formType.value === EntityBaseFormType.Create || JSON.stringify(form.fields) !== JSON.stringify(formFieldsOriginal)) && !!form.fields.cert)

const initForm = (data: Record<string, any>): void => {
  form.fields.cert = data?.cert || ''
  form.fields.certDigest = data?.cert_digest || ''
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

const requestBody = computed((): Record<string, any> => {
  return {
    cert: form.fields.cert,
    cert_digest: form.fields.certDigest || null,
    tags: form.fields.tags.split(',')?.map((tag: string) => String(tag || '').trim())?.filter((tag: string) => tag !== ''),
  }
})

const saveFormData = async (): Promise<void> => {
  try {
    form.isReadonly = true

    let response: AxiosResponse | undefined

    if (formType.value === 'create') {
      response = await axiosInstance.post(submitUrl.value, requestBody.value)
    } else if (formType.value === 'edit') {
      response = props.config?.app === 'konnect'
        // Note: Konnect currently uses PUT because PATCH is not fully supported in Koko
        //       If this changes, the `edit` form methods should be re-evaluated/updated accordingly
        ? await axiosInstance.put(submitUrl.value, requestBody.value)
        : await axiosInstance.patch(submitUrl.value, requestBody.value)
    }

    form.fields.cert = response?.data?.cert || ''
    form.fields.certDigest = response?.data?.cert_digest || ''
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
.kong-ui-entities-ca-certificates-form {
  width: 100%;

  .certificate-form-textarea {
    width: 100%;
  }
}
</style>
