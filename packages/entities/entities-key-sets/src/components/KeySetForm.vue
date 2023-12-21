<template>
  <div class="kong-ui-entities-key-sets-form">
    <EntityBaseForm
      :can-submit="canSubmit"
      :config="config"
      :edit-id="keySetId"
      :error-message="form.errorMessage"
      :fetch-url="fetchUrl"
      :form-fields="form.fields"
      :is-readonly="form.isReadonly"
      @cancel="handleClickCancel"
      @fetch:error="(err: any) => $emit('error', err)"
      @fetch:success="initForm"
      @loading="(val: boolean) => $emit('loading', val)"
      @submit="saveFormData"
    >
      <EntityFormSection
        :description="t('keySets.form.sections.general.description')"
        has-divider
        :title="t('keySets.form.sections.general.title')"
      >
        <KInput
          v-model.trim="form.fields.name"
          autocomplete="off"
          data-testid="key-set-form-name"
          :label="t('keySets.form.fields.name.label')"
          :placeholder="t('keySets.form.fields.name.placeholder')"
          :readonly="form.isReadonly"
          type="text"
        />

        <KInput
          v-model.trim="form.fields.tags"
          autocomplete="off"
          data-testid="key-set-form-tags"
          :help="t('keySets.form.fields.tags.help')"
          :label="t('keySets.form.fields.tags.label')"
          :label-attributes="{ info: t('keySets.form.fields.tags.tooltip') }"
          :placeholder="t('keySets.form.fields.tags.placeholder')"
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
import {
  useAxios, useErrors, EntityFormSection, EntityBaseForm, EntityBaseFormType,
} from '@kong-ui-public/entities-shared'

import type {
  KonnectKeySetFormConfig,
  KongManagerKeySetFormConfig,
  KeySetFormState,
  KeySetFormFields,
} from '../types'
import endpoints from '../key-sets-endpoints'
import composables from '../composables'

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
    type: Object as PropType<KonnectKeySetFormConfig | KongManagerKeySetFormConfig>,
    required: true,
    validator: (config: KonnectKeySetFormConfig | KongManagerKeySetFormConfig): boolean => {
      if (!config || !['konnect', 'kongManager'].includes(config?.app)) return false
      if (config.app === 'konnect' && !config.controlPlaneId) return false
      if (config.app === 'kongManager' && typeof config.workspace !== 'string') return false
      if (!config.cancelRoute) return false
      return true
    },
  },
  /** If a valid Key Set ID is provided, it will put the form in Edit mode instead of Create */
  keySetId: {
    type: String,
    required: false,
    default: '',
  },
})

const router = useRouter()
const { i18n: { t } } = composables.useI18n()
const { getMessageFromError } = useErrors()

const { axiosInstance } = useAxios({
  headers: props.config?.requestHeaders,
})

const fetchUrl = computed<string>(() => endpoints.form[props.config.app].edit)
const formType = computed((): EntityBaseFormType => props.keySetId ? EntityBaseFormType.Edit : EntityBaseFormType.Create)

const form = reactive<KeySetFormState>({
  fields: {
    name: '',
    tags: '',
  },
  isReadonly: false,
  errorMessage: '',
})

const formFieldsOriginal = reactive<KeySetFormFields>({
  name: '',
  tags: '',
})

/**
 * Is the form submit button enabled?
 * If the form.fields and formFieldsOriginal are equal, always return false
 */
const canSubmit = computed((): boolean => JSON.stringify(form.fields) !== JSON.stringify(formFieldsOriginal) && !!form.fields.name)

const initForm = (data: Record<string, any>): void => {
  form.fields.name = data?.name || ''
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
  url = url.replace(/{id}/gi, props.keySetId)

  return url
})

const saveFormData = async (): Promise<void> => {
  try {
    form.isReadonly = true

    const requestBody: Record<string, any> = {
      name: form.fields.name,
      tags: form.fields.tags?.split(',')?.map((tag: string) => String(tag || '').trim())?.filter((tag: string) => tag !== '') || '',
    }

    let response: AxiosResponse | undefined

    if (formType.value === 'create') {
      response = await axiosInstance.post(submitUrl.value, requestBody)
    } else if (formType.value === 'edit') {
      response = props.config?.app === 'konnect'
        // Note: Konnect currently uses PUT because PATCH is not fully supported in Koko
        //       If this changes, the `edit` form methods should be re-evaluated/updated accordingly
        ? await axiosInstance.put(submitUrl.value, requestBody)
        : await axiosInstance.patch(submitUrl.value, requestBody)
    }

    if (response) {
      const { data } = response

      form.fields.name = data?.name || ''
      form.fields.tags = data?.tags?.join(', ') || ''

      // Set initial state of `formFieldsOriginal` to these values in order to detect changes
      Object.assign(formFieldsOriginal, form.fields)

      // Emit an update event for the host app to respond to
      emit('update', response?.data)
    }
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
.kong-ui-entities-key-sets-form {
  width: 100%;
}
</style>
