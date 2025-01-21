<template>
  <component
    :is="wrapperComponent"
    class="kong-ui-entity-base-form"
  >
    <!-- Loading -->
    <KSkeleton
      v-if="isLoading"
      type="form"
    />

    <!-- Error fetching record for edit -->
    <KEmptyState
      v-else-if="fetchDetailsError"
      :action-button-text="t('baseForm.actions.back')"
      data-testid="form-fetch-error"
      icon-variant="error"
      @click-action="handleErrorCtaClick"
    >
      <template #default>
        <h3>{{ fetchErrorMessage }}</h3>
      </template>
    </KEmptyState>

    <!-- Form content -->
    <form
      v-else
      data-testid="form-content"
      :novalidate="props.noValidate"
      @reset.prevent="handleClickCancel"
      @submit.prevent="handleClickSave"
    >
      <slot />

      <!-- Form error -->
      <KAlert
        v-if="errorMessage"
        appearance="danger"
        data-testid="form-error"
        :message="errorMessage"
      />

      <!-- Form actions -->
      <div
        class="form-actions"
        data-testid="form-actions"
      >
        <slot name="form-actions">
          <KButton
            appearance="tertiary"
            :data-testid="`${entityType}-${isEditing ? 'edit' : 'create'}-form-view-configuration`"
            @click="toggle()"
          >
            {{ t('baseForm.actions.viewConfiguration') }}
          </KButton>
          <KButton
            appearance="secondary"
            :data-testid="`${entityType}-${isEditing ? 'edit' : 'create'}-form-cancel`"
            :disabled="isReadonly"
            type="reset"
          >
            {{ t('baseForm.actions.cancel') }}
          </KButton>
          <KButton
            appearance="primary"
            :data-testid="`${entityType}-${isEditing ? 'edit' : 'create'}-form-submit`"
            :disabled="disableSave"
            type="submit"
          >
            {{ t('baseForm.actions.save') }}
          </KButton>
        </slot>
      </div>
    </form>
    <KSlideout
      :close-on-blur="false"
      data-testid="form-view-configuration-slideout"
      :has-overlay="false"
      :offset-top="60"
      :title="t('baseForm.configuration.title')"
      :visible="isToggled"
      @close="toggle()"
    >
      <div>
        {{ t('baseForm.configuration.message') }}
      </div>
      <KTabs
        data-testid="form-view-configuration-slideout-tabs"
        :tabs="tabs"
      >
        <template #json>
          <JsonCodeBlock
            :config="config"
            :entity-record="props.formFields"
            :fetcher-url="fetcherUrl"
            :request-method="props.editId ? 'put' : 'post'"
          />
        </template>
        <template #yaml>
          <YamlCodeBlock :entity-record="props.formFields" />
        </template>
        <template #terraform>
          <TerraformCodeBlock
            :entity-record="props.formFields"
            :entity-type="entityType"
          />
        </template>
      </KTabs>
    </KSlideout>
  </component>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import { computed, ref, onBeforeMount, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { AxiosError } from 'axios'
import type { KonnectBaseFormConfig, KongManagerBaseFormConfig } from '../../types'
import { SupportedEntityTypesArray, SupportedEntityType } from '../../types'
import composables from '../../composables'
import type { Tab } from '@kong/kongponents'
import JsonCodeBlock from '../common/JsonCodeBlock.vue'
import YamlCodeBlock from '../common/YamlCodeBlock.vue'
import TerraformCodeBlock from '../common/TerraformCodeBlock.vue'

const emit = defineEmits<{
  (e: 'loading', isLoading: boolean): void,
  (e: 'fetch:success', data: Record<string, any>): void,
  (e: 'fetch:error', error: AxiosError): void,
  (e: 'submit'): void,
  (e: 'cancel'): void,
}>()

// Component props - This structure must exist in ALL entity components, with the exclusion of unneeded action props (e.g. if you don't need `canDelete`, just exclude it)
const props = defineProps({
  /** The base konnect or kongManger config. Pass additional config props in the shared entity component as needed. */
  config: {
    type: Object as PropType<KonnectBaseFormConfig | KongManagerBaseFormConfig>,
    required: true,
    validator: (config: KonnectBaseFormConfig | KongManagerBaseFormConfig): boolean => {
      if (!config || !['konnect', 'kongManager'].includes(config?.app)) return false
      if (config.app === 'konnect' && !config.controlPlaneId) return false
      if (config.app === 'kongManager' && typeof config.workspace !== 'string') return false
      return true
    },
  },
  /** If a valid edit ID is provided, it will put the form in Edit mode instead of Create */
  editId: {
    type: String,
    required: false,
    default: '',
  },
  /**
   * Entity type, required to generate terraform code
   */
  entityType: {
    type: String as PropType<SupportedEntityType>,
    required: true,
    validator: (val: SupportedEntityType) => SupportedEntityTypesArray.includes(val),
  },
  /**
   * Fetch url for the item to edit. We will handle the replacement of {controlPlaneId}, {workspace}, and {id}.
   * Value should NOT contain config.apiBaseUrl, as we auto include this. Typically this will just an entry from
   * the endpoints file.
   * Required if `editId` is specified.
   *
   * ex. `/v2/control-planes/{controlPlaneId}/core-entities/snis/{id}`
   */
  fetchUrl: {
    type: String,
    required: false,
    default: '',
  },
  /** Set this prop to true during Save action. Disables save and cancel buttons */
  isReadonly: {
    type: Boolean,
    required: false,
    default: false,
  },
  /** Used to track form validation, disables save button when false */
  canSubmit: {
    type: Boolean,
    required: false,
    default: undefined,
  },
  /** If form submission fails, this is the error message to display */
  errorMessage: {
    type: String,
    required: false,
    default: '',
  },
  /** Used to populate the Configuration JSON/YAML code blocks */
  formFields: {
    type: Object as PropType<Record<string, any>>,
    required: true,
  },
  /**
   * Set true to disable the form validation upon submission.
   */
  noValidate: {
    type: Boolean,
    default: false,
  },
  /**
   * Wrapper component to use at component's root level.
   */
  wrapperComponent: {
    type: String,
    default: 'KCard',
  },
})

const router = useRouter()
const { i18n: { t } } = composables.useI18n()
const { getMessageFromError } = composables.useErrors()

const { axiosInstance } = composables.useAxios(props.config?.axiosRequestConfig)

const isLoading = ref(false)
const isEditing = computed(() => !!props.editId)
const fetchDetailsError = ref(false)
const fetchErrorMessage = ref('')
const disableSave = computed((): boolean => props.canSubmit === false || props.isReadonly)
const isToggled = ref(false)

/**
 * Build the fetcher URL
 */
const fetcherUrl = computed<string>(() => {
  let url = `${props.config.apiBaseUrl}${props.fetchUrl}`

  if (props.config.app === 'konnect') {
    url = url.replace(/{controlPlaneId}/gi, props.config?.controlPlaneId || '')
  } else if (props.config.app === 'kongManager') {
    url = url.replace(/\/{workspace}/gi, props.config?.workspace ? `/${props.config.workspace}` : '')
  }

  if (!props.editId) {
    // strip placeholder /{id}/ from  post request url
    url = url.replace(/\/{id}/gi, '')
    return url
  }

  // Always replace the id for editing
  url = url.replace(/{id}/gi, props.editId)

  return url
})

const toggle = (): void => {
  isToggled.value = !isToggled.value
}

const handleErrorCtaClick = (): void => {
  if (props.config.cancelRoute) {
    router.push(props.config.cancelRoute)
  } else {
    handleClickCancel()
  }
}

const handleClickCancel = (): void => {
  // Emit a cancel event for the entity component to respond to
  emit('cancel')
}

const handleClickSave = (): void => {
  if (disableSave.value) {
    return
  }

  // Emit a save event for the entity component to respond to
  emit('submit')
}

const tabs = ref<Tab[]>([
  {
    title: t('baseForm.configuration.json'),
    hash: '#json',
  },
  {
    title: t('baseForm.configuration.yaml'),
    hash: '#yaml',
  },
])

// terraform is only available for konnect entities and non-Other entity types
if (props.config.app === 'konnect' && props.entityType !== SupportedEntityType.Other) {
  // insert terraform as the third option
  tabs.value.splice(1, 0, {
    title: t('baseForm.configuration.terraform'),
    hash: '#terraform',
  })
}

watch(() => isLoading.value, (val: boolean) => {
  // Emit the loading state for the host app
  emit('loading', val)
}, { immediate: true })

onBeforeMount(async () => {
  // If props.editId is provided, fetch the entity details for the edit form
  if (props.editId) {
    try {
      fetchDetailsError.value = false
      isLoading.value = true

      const { data }: Record<string, any> = await axiosInstance.get(fetcherUrl.value)

      emit('fetch:success', data)
    } catch (error: any) {
      const parsedError = getMessageFromError(error)
      // Custom logic here for 404 - if error message is `code 5` fallback to edit error message
      fetchErrorMessage.value = !parsedError.startsWith('code') ? parsedError : t('baseForm.errors.edit')
      fetchDetailsError.value = true
      // Emit the error for the host app
      emit('fetch:error', error)
    } finally {
      isLoading.value = false
    }
  }
})
</script>

<style lang="scss" scoped>
.kong-ui-entity-base-form {
  box-sizing: border-box;
  max-width: $kui-breakpoint-desktop;
  width: 100%;

  & :deep(.k-slideout-title) {
    color: $kui-color-text !important;
    font-size: $kui-font-size-70 !important;
    font-weight: $kui-font-weight-bold !important;
    line-height: $kui-line-height-60 !important;
    margin-bottom: $kui-space-60 !important;
  }

  & :deep(.k-card.content-card) {
    padding: $kui-space-0 $kui-space-60 !important;
  }

  & :deep(.tab-item > div.tab-link.has-panels) {
    color: $kui-color-text-neutral !important;
    font-size: $kui-font-size-30 !important;
    font-weight: $kui-font-weight-bold !important;
    line-height: $kui-line-height-40 !important;
  }

  & :deep(.tab-item.active > div.tab-link.has-panels) {
    color: $kui-color-text !important;
    font-weight: $kui-font-weight-semibold !important;
  }
}

.form-actions {
  align-items: center;
  display: flex;
  justify-content: flex-end;
  margin-top: $kui-space-80;

  :deep(.k-button) {
    &:last-of-type,
    &:nth-last-of-type(2) {
      margin-left: $kui-space-60;
    }
  }
}
</style>
