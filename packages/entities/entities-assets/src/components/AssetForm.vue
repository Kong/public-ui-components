<template>
  <div class="kong-ui-entities-asset-form">
    <EntityBaseForm
      :can-submit="isFormValid && changesExist"
      :config="config"
      :edit-id="assetId"
      :error-message="state.errorMessage"
      :fetch-url="fetchUrl"
      :form-fields="formModel"
      :is-readonly="state.readonly"
      @cancel="cancelHandler"
      @fetch:error="fetchErrorHandler($event)"
      @fetch:success="updateFormValues"
      @loading="loadingHandler($event)"
      @submit="submitData"
    >
      <div>
        <EntityFormSection
          :description="t('assets.form.info.description')"
          has-divider
          :title="t('assets.form.info.title')"
        >
          <KInput
            v-model.trim="state.fields.name"
            autocomplete="off"
            class="name-field"
            data-testid="asset-form-name"
            :label="t('assets.fields.name.label')"
            :label-attributes="{
              tooltipAttributes: { maxWidth: '250' }
            }"
            :placeholder="t('assets.fields.name.placeholder')"
            :readonly="state.readonly"
            type="text"
          />

          <KFileUpload
            :label="t('assets.fields.content.label')"
            @file-added="(file: File) => state.fields.file = file"
            @file-removed="() => state.fields.file = null"
          />
        </EntityFormSection>
      </div>
    </EntityBaseForm>
  </div>
</template>

<script lang="ts" setup>
import { EntityBaseForm, EntityBaseFormType, EntityFormSection, useAxios, useErrors } from '@kong-ui-public/entities-shared'
import '@kong-ui-public/entities-shared/dist/style.css'
import type { AxiosError, AxiosResponse } from 'axios'
import type { PropType } from 'vue'
import { computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import endpoints from '../assets-endpoints'
import composables from '../composables'
import type {
  AssetFormState,
  AssetFormFields,
  KongManagerAssetFormConfig,
  KonnectAssetFormConfig,
} from '../types'

const props = defineProps({
  /** The base konnect or kongManger config. Pass additional config props in the shared entity component as needed. */
  config: {
    type: Object as PropType<KonnectAssetFormConfig | KongManagerAssetFormConfig>,
    required: true,
    validator: (config: KonnectAssetFormConfig | KongManagerAssetFormConfig): boolean => {
      if (!config || !['konnect', 'kongManager'].includes(config?.app)) return false
      if (config?.app === 'konnect' && !config?.controlPlaneId) return false
      if (config?.app === 'kongManager' && typeof config?.workspace !== 'string') return false
      if (!config?.cancelRoute) return false
      return true
    },
  },
  /** If a valid assetId is provided, it will put the form in Edit mode instead of Create */
  assetId: {
    type: String,
    required: false,
    default: '',
  },
})

const emit = defineEmits<{
  (e: 'update', data: AssetFormFields): void,
  (e: 'error', error: AxiosError): void,
  (e: 'loading', isLoading: boolean): void,
}>()

const { i18n: { t } } = composables.useI18n()
const router = useRouter()
const { axiosInstance } = useAxios({
  headers: props.config?.requestHeaders,
})
const { getMessageFromError } = useErrors()

const state = reactive<AssetFormState>({
  fields: {
    name: '',
    file: null,
  },
  readonly: false,
  errorMessage: '',
})

const originalFields = reactive<AssetFormFields>({
  name: '',
  file: null,
})

const fetchUrl = computed<string>(() => endpoints.form[props.config?.app]?.edit)

const cancelHandler = (): void => {
  router.push(props.config?.cancelRoute || { name: 'asset-list' })
}

const loadingHandler = (val: boolean): void => {
  emit('loading', val)
}

const fetchErrorHandler = (err: AxiosError): void => {
  emit('error', err)
}

const updateFormValues = (data: Record<string, any>): void => {
  state.fields.name = data?.item?.name || data?.name || ''

  Object.assign(originalFields, state.fields)
}

const formType = computed((): EntityBaseFormType => props.assetId
  ? EntityBaseFormType.Edit
  : EntityBaseFormType.Create)

const getUrl = (action: 'validate' | 'create' | 'edit'): string => {
  let url = `${props.config?.apiBaseUrl}${endpoints.form[props.config?.app][action]}`

  if (props.config?.app === 'konnect') {
    url = url.replace(/{controlPlaneId}/gi, props.config?.controlPlaneId || '')
  } else if (props.config?.app === 'kongManager') {
    url = url.replace(/\/{workspace}/gi, props.config?.workspace ? `/${props.config.workspace}` : '')
  }

  url = url.replace(/{id}/gi, props.assetId)

  return url
}

const formModel = computed(() => ({
  name: state.fields.name,
}))

const isFormValid = computed((): boolean => !!state.fields.name)
const changesExist = computed((): boolean => JSON.stringify(state.fields) !== JSON.stringify(originalFields))

const submitData = async (): Promise<void> => {
  try {
    state.readonly = true

    let response: AxiosResponse | undefined

    const formData = new FormData()
    formData.append('name', state.fields.name)
    formData.append('content', state.fields.file as File)

    // FIXME: Skipping the validation. Do we really need this?
    // await axiosInstance.post(getUrl('validate'), formData)

    if (formType.value === 'create') {
      response = await axiosInstance.post(getUrl('create'), formData)
    } else if (formType.value === 'edit') {
      throw new Error('stub')
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
.kong-ui-entities-asset-form {
  width: 100%;

  @media screen and (min-width: $kui-breakpoint-laptop) {
    &:deep(.form-section-wrapper) {
      column-gap: $kui-space-130;
    }
  }
}
.fields-group {
  &-title {
    color: $kui-color-text-neutral-strongest;
    font-size: $kui-font-size-40;
    font-weight: 600;
    line-height: 20px;
    margin-bottom: 4px;
    margin-top: 0;
  }
  &-text {
    color: rgba(0, 0, 0, 0.45);
    font-size: $kui-font-size-30;
    line-height: 20px;
    margin-bottom: 0;
    margin-top: 0;
  }
}

.username-field {
  margin-bottom: 16px;
}
</style>
