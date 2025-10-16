<template>
  <KPrompt
    :action-button-disabled="!canSubmit || form.isReadonly"
    :action-button-text="t('targets.form.buttons.save')"
    :cancel-button-text="t('targets.form.buttons.cancel')"
    :title="formTitle"
    :visible="isVisible"
    @cancel="onCancel"
    @proceed="saveFormData"
  >
    <template #default>
      <div class="kong-ui-entities-target-form">
        <EntityBaseForm
          :config="config"
          :edit-id="targetId"
          :entity-type="SupportedEntityType.Target"
          :error-message="form.errorMessage"
          :fetch-url="fetchUrl"
          :form-fields="requestBody"
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
              :label-attributes="{
                info: t('targets.form.fields.target.tooltip'),
                tooltipAttributes: { maxWidth: '400' },
              }"
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
              :error="isWeightOutOfRange"
              :error-message="t('targets.errors.weight')"
              :label="t('targets.form.fields.weight.label')"
              :label-attributes="{
                info: t('targets.form.fields.weight.tooltip'),
                tooltipAttributes: { maxWidth: '400' },
              }"
              max="65535"
              min="0"
              :readonly="form.isReadonly"
              required
              type="number"
            />

            <template v-if="failoverEnabled">
              <div
                class="failover-target"
              >
                <KCheckbox
                  v-model="form.fields.failover as boolean"
                  :disabled="failoverUnsupported"
                  :label="t('targets.form.fields.failover.label')"
                  :label-attributes="{
                    info: failoverUnsupported
                      ? t('targets.form.fields.failover.unsupported')
                      : t('targets.form.fields.failover.help'),
                  }"
                />
              </div>
            </template>

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
import { useAxios, useErrors, EntityBaseForm, EntityBaseFormType, SupportedEntityType } from '@kong-ui-public/entities-shared'
import '@kong-ui-public/entities-shared/dist/style.css'

const emit = defineEmits<{
  (e: 'update', target: EntityRow): void
  (e: 'error', error: AxiosError): void
  (e: 'loading', isLoading: boolean): void
  (e: 'cancel'): void
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
  failoverEnabled: {
    type: Boolean,
    required: false,
    default: false,
  },
  failoverUnsupported: {
    type: Boolean,
    required: false,
    default: false,
  },
})

const { i18n: { t } } = composables.useI18n()
const { getMessageFromError } = useErrors()

const { axiosInstance } = useAxios(props.config?.axiosRequestConfig)

const fetchUrl = computed(() => endpoints.form[props.config.app].edit.replace(/{upstreamId}/gi, props.config?.upstreamId || ''))
const formType = computed(() => props.targetId ? EntityBaseFormType.Edit : EntityBaseFormType.Create)
const formTitle = computed(() => formType.value === EntityBaseFormType.Edit ? t('targets.form.edit.title') : t('targets.form.create.title'))

const form = reactive<TargetFormState>({
  fields: {
    target: '',
    weight: 100,
    tags: '',
    failover: false,
  },
  isReadonly: false,
  errorMessage: '',
})

const formFieldsOriginal = reactive<TargetFormFields>({
  target: '',
  weight: 100,
  tags: '',
  failover: false,
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
  if (props.failoverEnabled) {
    form.fields.failover = data?.failover || false
  }

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

const requestBody = computed((): Record<string, any> => {
  return {
    target: form.fields.target,
    weight: parseInt(form.fields.weight as unknown as string),
    tags: form.fields.tags?.split(',')?.map((tag: string) => String(tag || '').trim())?.filter((tag: string) => tag !== ''),
    upstream: { id: props.config.upstreamId },
    ...(props.failoverEnabled ? { failover: form.fields.failover } : {}),
  }
})

const saveFormData = async (): Promise<void> => {
  try {
    form.isReadonly = true
    form.errorMessage = ''

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

watch(() => props.targetId, () => {
  // Reset the form fields
  Object.assign(form.fields, formFieldsInitial)
})
</script>

<style lang="scss" scoped>
:deep(.kong-card) {
  padding: $kui-space-0;

  &.border {
    border: 0 !important;
  }

  &.borderTop {
    border-top: 0 !important;
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
      line-height: $kui-line-height-30;
      margin-bottom: $kui-space-90;
    }

    .target-form-input {
      margin-bottom: $kui-space-90;

      &:last-of-type {
        margin-bottom: $kui-space-0;
      }
    }

    .failover-target {
      display: flex;
      flex-direction: column;
      margin-bottom: $kui-space-90;

      .failover-target-options {
        align-items: center;
        display: flex;
        gap: $kui-space-50;
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

  :deep(.k-card.kong-ui-entity-base-form) {
    background-color: transparent;
    border: none;
    padding: $kui-space-0;
  }
}
</style>
