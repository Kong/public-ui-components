<template>
  <EntityBaseForm
    :can-submit="isFormValid && changesExist"
    :config="config"
    :edit-id="secretId"
    :entity-type="SupportedEntityType.Other"
    :error-message="state.errorMessage"
    :fetch-url="fetchUrl"
    :form-fields="payload"
    :is-readonly="state.readonly"
    @cancel="cancelHandler"
    @fetch:error="fetchErrorHandler"
    @fetch:success="updateFormValues"
    @loading="loadingHandler"
    @submit="submitData"
  >
    <div>
      <EntityFormSection
        :description="t('secrets.form.info.description')"
        has-divider
        :title="t('secrets.form.info.title')"
      >
        <KInput
          v-model.trim="state.fields.key"
          autocomplete="off"
          class="key-field"
          data-testid="secret-form-key"
          :disabled="formType === EntityBaseFormType.Edit"
          :label="t('secrets.form.fields.key.label')"
          :placeholder="t('secrets.form.fields.key.placeholder')"
          :readonly="state.readonly"
          required
          type="text"
        />
        <KTextArea
          v-model.trim="state.fields.value"
          autocomplete="off"
          :character-limit="false"
          data-testid="secret-form-value"
          :label="t('secrets.form.fields.value.label')"
          :placeholder="t('secrets.form.fields.value.placeholder')"
          :readonly="state.readonly"
          required
          resizable
          type="text"
        />
        <KAlert
          appearance="warning"
          :message="t('secrets.form.hint')"
        />
      </EntityFormSection>
    </div>
  </EntityBaseForm>
</template>

<script lang="ts" setup>
import {
  useAxios,
  useErrors,
  EntityFormSection,
  EntityBaseForm,
  EntityBaseFormType,
  SupportedEntityType,
} from '@kong-ui-public/entities-shared'
import composables from '../composables'
import '@kong-ui-public/entities-shared/dist/style.css'
import type { PropType } from 'vue'
import { computed, reactive } from 'vue'
import type {
  SecretState,
  SecretStateFields,
  KonnectSecretFormConfig,
} from '../types'
import { useRouter } from 'vue-router'
import type { AxiosError, AxiosResponse } from 'axios'
import endpoints from '../secrets-endpoints'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps({
  /** The base konnect or kongManger config. Pass additional config props in the shared entity component as needed. */
  config: {
    type: Object as PropType<KonnectSecretFormConfig>,
    required: true,
    validator: (config: KonnectSecretFormConfig): boolean => {
      if (!config || config.app !== 'konnect') return false
      if (!config.controlPlaneId || !config.cancelRoute) return false
      return true
    },
  },
  /** Current config store ID */
  configStoreId: {
    type: String,
    required: true,
  },
  /** If a valid secretId is provided, it will put the form in Edit mode instead of Create */
  secretId: {
    type: String,
    required: false,
    default: '',
  },
})

const emit = defineEmits<{
  (e: 'update', data: SecretStateFields): void
  (e: 'error', error: AxiosError): void
  (e: 'loading', isLoading: boolean): void
}>()

const { i18n: { t } } = composables.useI18n()
const router = useRouter()
const { axiosInstance } = useAxios(props.config?.axiosRequestConfig)
const { getMessageFromError } = useErrors()

const state = reactive<SecretState>({
  fields: {
    key: '',
    value: '',
  },
  readonly: false,
  errorMessage: '',
})

const originalFields = reactive<SecretStateFields>({
  key: '',
  value: '',
})

const fetchUrl = computed<string>(() => endpoints.form[props.config?.app]?.edit
  .replace(/{id}/gi, props.configStoreId)
  .replace(/{secretId}/gi, props.secretId),
)

const cancelHandler = (): void => {
  router.push(props.config?.cancelRoute || { name: 'secret-list' })
}

const loadingHandler = (val: boolean): void => {
  emit('loading', val)
}

const fetchErrorHandler = (err: AxiosError): void => {
  emit('error', err)
}

const updateFormValues = (data: Record<string, any>): void => {
  state.fields.key = data?.item?.key || data?.key || ''
  state.fields.value = data?.item?.value || data?.value || ''

  Object.assign(originalFields, state.fields)
}

const formType = computed((): EntityBaseFormType => props.secretId
  ? EntityBaseFormType.Edit
  : EntityBaseFormType.Create)

const submitUrl = computed<string>(() => {
  return `${props.config.apiBaseUrl}${endpoints.form[props.config.app][formType.value]}`
    .replace(/{controlPlaneId}/gi, props.config?.controlPlaneId || '')
    .replace(/{id}/gi, props.configStoreId)
    .replace(/{secretId}/gi, props.secretId)
})

const isFormValid = computed((): boolean => !!state.fields.key && !!state.fields.value)
const changesExist = computed((): boolean => JSON.stringify(state.fields) !== JSON.stringify(originalFields))

const payload = computed((): SecretStateFields => {
  return {
    key: state.fields.key,
    value: state.fields.value,
  }
})

const submitData = async (): Promise<void> => {
  try {
    state.readonly = true

    let response: AxiosResponse | undefined

    if (formType.value === 'create') {
      response = await axiosInstance.post(submitUrl.value, payload.value)
    } else if (formType.value === 'edit') {
      response = await axiosInstance.put(submitUrl.value, payload.value)
    }

    updateFormValues(response?.data)

    emit('update', response?.data)
  } catch (error: any) {
    state.errorMessage = getMessageFromError(error)
    emit('error', error as AxiosError)
  } finally {
    state.readonly = false
  }
}
</script>

<style lang="scss" scoped>
@media screen and (min-width: $kui-breakpoint-laptop) {
  :deep(.form-section-wrapper) {
    column-gap: var(--kui-space-130, $kui-space-130);
  }
}
</style>
