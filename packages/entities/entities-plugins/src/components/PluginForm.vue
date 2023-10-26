<template>
  <div class="kong-ui-entities-plugin-form">
    <EntityBaseForm
      :can-submit="canSubmit"
      :config="config"
      :edit-id="pluginId"
      :error-message="form.errorMessage"
      :fetch-url="fetchUrl"
      :is-readonly="form.isReadonly"
      @cancel="handleClickCancel"
      @fetch:error="(err: any) => $emit('error', err)"
      @fetch:success="initForm"
      @loading="(val: boolean) => $emit('loading', val)"
      @submit="saveFormData"
    >
      <!-- <EntityFormSection
        :description="t('form.sections.general.description')"
        :title="t('form.sections.general.title')"
      >
        <KInput
          v-model.trim="form.fields.name"
          autocomplete="off"
          data-testid="plugin-form-name"
          :label="t('form.fields.name.label')"
          :placeholder="t('form.fields.name.placeholder')"
          :readonly="form.isReadonly"
          required
          type="text"
        />

        <KInput
          v-model.trim="form.fields.tags"
          autocomplete="off"
          data-testid="plugin-form-tags"
          :help="t('form.fields.tags.help')"
          :label="t('form.fields.tags.label')"
          :label-attributes="{ help: t('form.fields.tags.tooltip') }"
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
        <p>
          content
        </p>
      </EntityFormSection> -->
    </EntityBaseForm>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import { computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import type { AxiosError, AxiosResponse } from 'axios'
import type {
  KonnectPluginFormConfig,
  KongManagerPluginFormConfig,
  PluginFormState,
  PluginFormFields,
} from '../types'
import endpoints from '../plugins-endpoints'
// import composables from '../composables'
import { useAxios, useErrors, /* EntityFormSection, */ EntityBaseForm, EntityBaseFormType } from '@kong-ui-public/entities-shared'
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
    type: Object as PropType<KonnectPluginFormConfig | KongManagerPluginFormConfig>,
    required: true,
    validator: (config: KonnectPluginFormConfig | KongManagerPluginFormConfig): boolean => {
      if (!config || !['konnect', 'kongManager'].includes(config?.app)) return false
      if (config.app === 'konnect' && !config.controlPlaneId) return false
      if (config.app === 'kongManager' && typeof config.workspace !== 'string') return false
      if (!config.cancelRoute) return false
      return true
    },
  },
  /** If a valid Plugin ID is provided, it will put the form in Edit mode instead of Create */
  pluginId: {
    type: String,
    required: false,
    default: '',
  },
})

const router = useRouter()
// const { i18n: { t } } = composables.useI18n()
const { getMessageFromError } = useErrors()

const { axiosInstance } = useAxios({
  headers: props.config?.requestHeaders,
})

const fetchUrl = computed<string>(() => endpoints.form[props.config.app].edit)
const formType = computed((): EntityBaseFormType => props.pluginId ? EntityBaseFormType.Edit : EntityBaseFormType.Create)

const form = reactive<PluginFormState>({
  fields: {
    name: '',
    tags: '',
    entity_id: '',
  },
  isReadonly: false,
  errorMessage: '',
})

const formFieldsOriginal = reactive<PluginFormFields>({
  name: '',
  tags: '',
  entity_id: '',
})

/**
 * Is the form submit button enabled?
 * If the form.fields and formFieldsOriginal are equal, always return false
 */
const canSubmit = computed((): boolean => JSON.stringify(form.fields) !== JSON.stringify(formFieldsOriginal) && !!form.fields.name)

const initForm = (data: Record<string, any>): void => {
  form.fields.name = data?.name || ''
  form.fields.tags = data?.tags?.join(', ') || ''
  // TODO:
  // form.fields.entity_id = data?.certificate?.id || ''

  // Set initial state of `formFieldsOriginal` to these values in order to detect changes
  Object.assign(formFieldsOriginal, form.fields)
}

const handleClickCancel = (): void => {
  if (props.config.cancelRoute) {
    router.push(props.config.cancelRoute)
  }
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
  url = url.replace(/{id}/gi, props.pluginId)
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
  url = url.replace(/{id}/gi, props.pluginId)

  return url
})

const saveFormData = async (): Promise<void> => {
  try {
    form.isReadonly = true

    const requestBody: Record<string, any> = {
      name: form.fields.name,
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

    form.fields.name = response?.data?.name || ''
    form.fields.tags = response?.data?.tags?.join(', ') || ''
    // TODO:
    // form.fields.entity_id = response?.data?.certificate?.id || ''

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
.kong-ui-entities-plugin-form {
  width: 100%;
}
</style>
