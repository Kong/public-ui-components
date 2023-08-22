<template>
  <KPrompt
    :action-button-text="t('targets.form.buttons.save')"
    :action-pending="!canSubmit || form.isReadonly"
    :cancel-button-text="t('targets.form.buttons.cancel')"
    :is-visible="isVisible"
    :title="formTitle"
    @canceled="onCancel"
    @proceed="saveFormData"
  >
    <template #body-content>
      <div class="kong-ui-entities-target-form">
        <EntityBaseForm
          :config="config"
          :edit-id="targetId"
          :error-message="form.errorMessage"
          :fetch-url="fetchUrl"
          :is-readonly="form.isReadonly"
          @cancel="onCancel"
          @fetch:error="(err: any) => $emit('error', err)"
          @fetch:success="initForm"
          @loading="(val: boolean) => $emit('loading', val)"
        >
          <div class="target-form-container">
            <div
              v-if="$slots.info"
              class="target-form-info"
            >
              <slot name="info" />
            </div>
            <KInput
              v-model.trim="form.fields.target"
              autocomplete="off"
              class="target-form-input"
              data-testid="target-form-target"
              :label="t('targets.form.fields.target.label')"
              :label-attributes="{ info: t('targets.form.fields.target.tooltip') }"
              :placeholder="t('targets.form.fields.target.placeholder')"
              :readonly="form.isReadonly"
              required
              type="text"
            />
            <KInput
              v-model="form.fields.weight"
              autocomplete="off"
              class="target-form-input"
              data-testid="target-form-weight"
              :error-message="t('targets.errors.weight')"
              :has-error="isWeightOutOfRange"
              :label="t('targets.form.fields.weight.label')"
              :label-attributes="{ info: t('targets.form.fields.weight.tooltip') }"
              max="65535"
              min="0"
              :readonly="form.isReadonly"
              required
              type="number"
            />
            <KInput
              v-model.trim="form.fields.tags"
              autocomplete="off"
              class="target-form-input"
              data-testid="target-form-tags"
              :help="t('targets.form.fields.tags.help')"
              :label="t('targets.form.fields.tags.label')"
              :placeholder="t('targets.form.fields.tags.placeholder')"
              :readonly="form.isReadonly"
              type="text"
            />
          </div>
        </EntityBaseForm>
      </div>
    </template>
  </KPrompt>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import { computed, reactive, watch } from 'vue'
import type { AxiosError, AxiosResponse } from 'axios'
import type {
  KonnectTargetFormConfig,
  KongManagerTargetFormConfig,
  TargetFormState,
  TargetFormFields,
  EntityRow,
} from '../types'
import endpoints from '../targets-endpoints'
import composables from '../composables'
import { useAxios, useErrors, EntityBaseForm, EntityBaseFormType } from '@kong-ui-public/entities-shared'
import '@kong-ui-public/entities-shared/dist/style.css'

const emit = defineEmits<{
  (e: 'update', target: EntityRow): void,
  (e: 'error', error: AxiosError): void,
  (e: 'loading', isLoading: boolean): void,
  (e: 'cancel'): void,
}>()

// Component props - This structure must exist in ALL entity components, with the exclusion of unneeded action props (e.g. if you don't need `canDelete`, just exclude it)
const props = defineProps({
  /** The base konnect or kongManger config. Pass additional config props in the shared entity component as needed. */
  config: {
    type: Object as PropType<KonnectTargetFormConfig | KongManagerTargetFormConfig>,
    required: true,
    validator: (config: KonnectTargetFormConfig | KongManagerTargetFormConfig): boolean => {
      if (!config || !['konnect', 'kongManager'].includes(config?.app)) return false
      if (config.app === 'konnect' && !config.controlPlaneId) return false
      if (config.app === 'kongManager' && typeof config.workspace !== 'string') return false
      if (!config.upstreamId) return false
      return true
    },
  },
  // Controls whether the modal is visible or not
  isVisible: {
    type: Boolean,
    required: true,
    default: false,
  },
  /** If a valid Target ID is provided, it will put the form in Edit mode instead of Create */
  targetId: {
    type: String,
    required: false,
    default: '',
  },
})

const { i18n: { t } } = composables.useI18n()
const { getMessageFromError } = useErrors()

const { axiosInstance } = useAxios({
  headers: props.config?.requestHeaders,
})

const fetchUrl = computed<string>(() => endpoints.form[props.config.app].edit.replace(/{upstreamId}/gi, props.config?.upstreamId || ''))
const formType = computed((): EntityBaseFormType => props.targetId ? EntityBaseFormType.Edit : EntityBaseFormType.Create)
const formTitle = computed((): string => formType.value === EntityBaseFormType.Edit ? t('targets.form.edit.title') : t('targets.form.create.title'))

const form = reactive<TargetFormState>({
  fields: {
    target: '',
    weight: 100,
    tags: '',
  },
  isReadonly: false,
  errorMessage: '',
})

const formFieldsOriginal = reactive<TargetFormFields>({
  target: '',
  weight: 100,
  tags: '',
})

const formFieldsInitial: TargetFormFields = {
  target: '',
  weight: 100,
  tags: '',
}

const isWeightOutOfRange = computed((): boolean => {
  const weight = parseInt(form.fields.weight.toString(), 10)
  return weight < 0 || weight > 65535
})

/**
 * Is the form submit button enabled?
 * If the form.fields and formFieldsOriginal are equal, always return false
 */
const canSubmit = computed(
  (): boolean => JSON.stringify(form.fields) !== JSON.stringify(formFieldsOriginal) &&
    !!form.fields.target &&
    !!form.fields.weight &&
    !isWeightOutOfRange.value,
)

const initForm = (data: Record<string, any>): void => {
  form.fields.target = data?.target || ''
  form.fields.weight = data?.weight ?? '' // if weight is 0, it should not be overwritten
  form.fields.tags = data?.tags?.join(', ') || ''

  // Set initial state of `formFieldsOriginal` to these values in order to detect changes
  Object.assign(formFieldsOriginal, form.fields)
}

/* ---------------
 * Cancel
 * ---------------
 */

const onCancel = (): void => {
  form.errorMessage = ''
  emit('cancel')
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
  url = url.replace(/{id}/gi, props.targetId)
  return url
})

/**
 * Build the submit URL
 */
const submitUrl = computed((): string => {
  let url = `${props.config.apiBaseUrl}${endpoints.form[props.config.app][formType.value]}`

  if (props.config.app === 'konnect') {
    url = url.replace(/{controlPlaneId}/gi, props.config?.controlPlaneId || '').replace(/{upstreamId}/gi, props.config?.upstreamId || '')
  } else if (props.config.app === 'kongManager') {
    url = url.replace(/\/{workspace}/gi, props.config?.workspace ? `/${props.config.workspace}` : '').replace(/{upstreamId}/gi, props.config?.upstreamId || '')
  }

  // Replace the id when editing
  url = url.replace(/{id}/gi, props.targetId)

  return url
})

const saveFormData = async (): Promise<void> => {
  try {
    form.isReadonly = true
    form.errorMessage = ''

    const requestBody: Record<string, any> = {
      target: form.fields.target,
      weight: parseInt(form.fields.weight as unknown as string),
      tags: form.fields.tags?.split(',')?.map((tag: string) => String(tag || '').trim())?.filter((tag: string) => tag !== ''),
      upstream: { id: props.config.upstreamId },
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

    if (response) {
      const { data } = response

      form.fields.target = data?.name || ''
      form.fields.weight = data?.weight ?? 100 // if weight is 0, it should not be overwritten
      form.fields.tags = data?.tags?.join(', ') || ''

      // Emit an update event for the host app to respond to
      emit('update', data)

      // Reset the form fields
      Object.assign(form.fields, formFieldsInitial)
    }
  } catch (error: any) {
    form.errorMessage = getMessageFromError(error)
    // Emit the error for the host app
    emit('error', error)
  } finally {
    form.isReadonly = false
  }
}

const loadingSpinnerDisplay = computed((): string => {
  return form.isReadonly ? 'inline-flex' : 'none'
})

watch(() => props.targetId, () => {
  // Reset the form fields
  Object.assign(form.fields, formFieldsInitial)
})
</script>

<style lang="scss" scoped>
:deep(.kong-card) {
  &.border {
    border: 0 !important;
  }

  &.borderTop {
    border-top: 0 !important;
  }

  padding: 0;
}

:deep(.k-prompt-proceed) {
  .kong-icon-spinner {
    display: v-bind('loadingSpinnerDisplay');
  }
}

.kong-ui-entities-target-form {
  width: 100%;

  .target-form-container {
    .target-form-info,
    .target-form-info p,
    .target-form-info :deep(p) {
      color: $kui-color-text;
      font-size: $kui-font-size-30;
      line-height: $kui-space-80;
      margin-bottom: $kui-space-90;
    }

    .target-form-input {
      margin-bottom: $kui-space-90;

      &:last-of-type {
        margin-bottom: 0px;
      }
    }
  }

  :deep(.k-alert) {
    margin-top: 20px;
  }

  :deep(.form-actions) {
    // hide EntityBaseForm default action buttons
    display: none !important;
  }
}
</style>
