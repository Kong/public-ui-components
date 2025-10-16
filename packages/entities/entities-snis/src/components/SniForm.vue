<template>
  <div class="kong-ui-entities-snis-form">
    <EntityBaseForm
      :can-submit="canSubmit"
      :config="config"
      :edit-id="sniId"
      :entity-type="SupportedEntityType.SNI"
      :error-message="form.errorMessage || fetchCertsErrorMessage"
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
        :description="t('form.sections.general.description')"
        :title="t('form.sections.general.title')"
      >
        <KInput
          v-model.trim="form.fields.name"
          autocomplete="off"
          data-testid="sni-form-name"
          :label="t('form.fields.name.label')"
          :placeholder="t('form.fields.name.placeholder')"
          :readonly="form.isReadonly"
          required
          type="text"
        />

        <KInput
          v-model.trim="form.fields.tags"
          autocomplete="off"
          data-testid="sni-form-tags"
          :help="t('form.fields.tags.help')"
          :label="t('form.fields.tags.label')"
          :label-attributes="{
            info: t('form.fields.tags.tooltip'),
            tooltipAttributes: { maxWidth: '400' },
          }"
          :placeholder="t('form.fields.tags.placeholder')"
          :readonly="form.isReadonly"
          type="text"
        />
      </EntityFormSection>

      <EntityFormSection
        :description="t('form.sections.certificate.description')"
        has-divider
        :title="t('form.sections.certificate.title')"
      >
        <KInput
          v-if="certificateId"
          data-testid="sni-form-certificate-id"
          :label="t('form.fields.certificate_id.label')"
          :model-value="certificateId"
          readonly
          required
          width="100%"
        />
        <KSelect
          v-else
          v-model="form.fields.certificate_id"
          clearable
          data-testid="sni-form-certificate-id"
          :dropdown-footer-text="additionalRecordsExist ? t('form.fields.certificate_id.footer') : undefined"
          enable-filtering
          :filter-function="() => true"
          :items="availableCertificates"
          :label="t('form.fields.certificate_id.label')"
          :loading="loadingCertificates"
          :placeholder="t('form.fields.certificate_id.placeholder')"
          :readonly="form.isReadonly"
          required
          width="100%"
          @query-change="debouncedCertificateQueryChange"
        >
          <template #loading>
            <div>{{ t('actions.loading') }}</div>
          </template>
          <template #empty>
            <div data-testid="no-search-results">
              {{ t('search.no_results') }}
            </div>
          </template>
        </KSelect>
        <p
          v-if="certificateErrorMessage"
          class="invalid-certificate-message"
          data-testid="invalid-certificate-message"
        >
          {{ certificateErrorMessage }}
        </p>
      </EntityFormSection>
    </EntityBaseForm>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import { computed, ref, reactive, watch, onBeforeMount } from 'vue'
import { useRouter } from 'vue-router'
import type { AxiosError, AxiosResponse } from 'axios'
import type {
  KonnectSniFormConfig,
  KongManagerSniFormConfig,
  SniFormState,
  SniFormFields,
  SelectItem,
} from '../types'
import endpoints from '../snis-endpoints'
import composables from '../composables'
import {
  useAxios,
  useErrors,
  useDebouncedFilter,
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
    type: Object as PropType<KonnectSniFormConfig | KongManagerSniFormConfig>,
    required: true,
    validator: (config: KonnectSniFormConfig | KongManagerSniFormConfig): boolean => {
      if (!config || !['konnect', 'kongManager'].includes(config?.app)) return false
      if (config.app === 'konnect' && !config.controlPlaneId) return false
      if (config.app === 'kongManager' && typeof config.workspace !== 'string') return false
      if (!config.cancelRoute) return false
      return true
    },
  },
  /** If a valid SNI ID is provided, it will put the form in Edit mode instead of Create */
  sniId: {
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
const formType = computed((): EntityBaseFormType => props.sniId ? EntityBaseFormType.Edit : EntityBaseFormType.Create)
const certificateId = computed((): string => props.config.certificateId && formType.value === EntityBaseFormType.Create ? props.config.certificateId : '')

const form = reactive<SniFormState>({
  fields: {
    name: '',
    tags: '',
    certificate_id: '',
  },
  isReadonly: false,
  errorMessage: '',
})

const formFieldsOriginal = reactive<SniFormFields>({
  name: '',
  tags: '',
  certificate_id: '',
})

/**
 * Is the form submit button enabled?
 * If the form.fields and formFieldsOriginal are equal, always return false
 */
const canSubmit = computed((): boolean => JSON.stringify(form.fields) !== JSON.stringify(formFieldsOriginal) && !!form.fields.name && !!(form.fields.certificate_id || certificateId.value))

const initForm = (data: Record<string, any>): void => {
  form.fields.name = data?.name || ''
  form.fields.tags = data?.tags?.join(', ') || ''
  form.fields.certificate_id = data?.certificate?.id || ''

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
  url = url.replace(/{id}/gi, props.sniId)

  return url
})

const requestBody = computed((): Record<string, any> => {
  return {
    name: form.fields.name,
    tags: form.fields.tags.split(',')?.map((tag: string) => String(tag || '').trim())?.filter((tag: string) => tag !== ''),
    certificate: { id: certificateId.value || form.fields.certificate_id },
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

    form.fields.name = response?.data?.name || ''
    form.fields.tags = response?.data?.tags?.join(', ') || ''
    form.fields.certificate_id = response?.data?.certificate?.id || ''

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

/* ---------------
 * Certificate Handling
 * ---------------
 */

const {
  debouncedQueryChange,
  loading: loadingCertificates,
  allRecords: allCertificates,
  error,
  validationError,
  loadItems,
  results,
} = useDebouncedFilter(props.config, endpoints.form[props.config.app].certificates)

const debouncedCertificateQueryChange = (query: string) => {
  debouncedQueryChange(query)
}

const fetchCertsErrorMessage = computed((): string => error.value ? t('errors.certificates.fetch') : '')
const certificateErrorMessage = computed((): string => validationError.value ? t('errors.certificates.invalid') : '')

const certificateSelectKey = ref<number>(0)
// this will only be defined if we were able to initially fetch ALL available records
const additionalRecordsExist = computed((): boolean => allCertificates.value === undefined)

// Create a ref to store valid certificate ids
const existingCertificates = ref<Set<string>>(new Set())
const availableCertificates = computed((): SelectItem[] => {
  const certs = Array.from(existingCertificates.value)
  return certs.map((certId: string) => ({
    label: certId,
    value: certId,
    selected: form.fields.certificate_id === certId,
  }))
})

const setCertIds = (data: Array<Record<string, any>>) => {
  // Clear the set
  existingCertificates.value.clear()

  // Loop through the existing certs and add them to the Set
  let cert: Record<string, any>
  for (cert of data) {
    existingCertificates.value.add(cert.id)
  }
}

watch(results, (val) => {
  setCertIds(val)
}, { immediate: true, deep: true })

watch(availableCertificates, () => {
  certificateSelectKey.value++
}, { immediate: true, deep: true })

onBeforeMount(async () => {
  // load certificates for filtering
  await loadItems()
})
</script>

<style lang="scss" scoped>
.kong-ui-entities-snis-form {
  width: 100%;

  .invalid-certificate-message {
    color: $kui-color-text-danger;
    font-size: 11px;
    font-weight: 500;
    margin-top: 3px !important;
  }
}
</style>
