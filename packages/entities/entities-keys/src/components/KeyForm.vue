<template>
  <div class="kong-ui-entities-keys-form">
    <EntityBaseForm
      :can-submit="canSubmit"
      :config="config"
      :edit-id="keyId"
      :entity-type="SupportedEntityType.Key"
      :error-message="form.errorMessage || fetchKeySetsErrorMessage"
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
        :description="t('keys.form.sections.general.description')"
        :title="t('keys.form.sections.general.title')"
      >
        <KInput
          v-model.trim="form.fields.key_id"
          autocomplete="off"
          data-testid="key-form-id"
          :help="t('keys.form.fields.id.help')"
          :label="t('keys.form.fields.id.label')"
          :label-attributes="{
            info: t('keys.form.fields.id.tooltip'),
            tooltipAttributes: { maxWidth: '400' },
          }"
          :placeholder="t('keys.form.fields.id.placeholder')"
          :readonly="form.isReadonly"
          required
          type="text"
        />

        <KInput
          v-if="showx5t"
          v-model.trim="form.fields.x5t"
          autocomplete="off"
          data-testid="key-form-x5t"
          :help="t('keys.form.fields.x5t.help')"
          :label="t('keys.form.fields.x5t.label')"
          :label-attributes="{
            info: t('keys.form.fields.x5t.tooltip'),
            tooltipAttributes: { maxWidth: '400' },
          }"
          :placeholder="t('keys.form.fields.x5t.placeholder')"
          :readonly="form.isReadonly"
          type="text"
        />

        <KInput
          v-model.trim="form.fields.name"
          autocomplete="off"
          data-testid="key-form-name"
          :label="t('keys.form.fields.name.label')"
          :placeholder="t('keys.form.fields.name.placeholder')"
          :readonly="form.isReadonly"
          type="text"
        />

        <KSelect
          v-model="form.fields.key_set"
          :clearable="isKeySetFieldClearable"
          data-testid="key-form-key-set"
          :dropdown-footer-text="keySetDropdownFooterText"
          enable-filtering
          :filter-function="() => true"
          :items="availableKeySets"
          :label="t('keys.form.fields.key_set.label')"
          :loading="loadingKeySets"
          :placeholder="t('keys.form.fields.key_set.placeholder')"
          :readonly="isKeySetFieldReadonly"
          width="100%"
          @query-change="debouncedKeySetQueryChange"
        >
          <template #loading>
            <div>{{ t('keys.actions.loading') }}</div>
          </template>
          <template #empty>
            <div data-testid="no-search-results">
              {{ t('keys.search.no_results') }}
            </div>
          </template>
          <template #selected-item-template="{ item }">
            <div>
              {{ (item as SelectItem).name }}
            </div>
          </template>
          <template #item-template="{ item }">
            <div class="select-item-container">
              <div class="select-item-label">
                {{ (item as SelectItem).name }}
              </div>
              <div class="select-item-description">
                {{ item.value }}
              </div>
            </div>
          </template>
        </KSelect>
        <p
          v-if="keySetErrorMessage"
          class="invalid-key-set-message"
          data-testid="invalid-key-set-message"
        >
          {{ keySetErrorMessage }}
        </p>

        <KInput
          v-model.trim="form.fields.tags"
          autocomplete="off"
          data-testid="key-form-tags"
          :help="t('keys.form.fields.tags.help')"
          :label="t('keys.form.fields.tags.label')"
          :label-attributes="{
            info: t('keys.form.fields.tags.tooltip'),
            tooltipAttributes: { maxWidth: '400' },
          }"
          :placeholder="t('keys.form.fields.tags.placeholder')"
          :readonly="form.isReadonly"
          type="text"
        />
      </EntityFormSection>

      <EntityFormSection
        :description="t('keys.form.sections.keys.description')"
        has-divider
        :title="t('keys.form.sections.keys.title')"
      >
        <div data-testid="key-format-container">
          <KSelect
            v-model="form.fields.key_format"
            data-testid="key-form-key-format"
            :items="keyFormatItems"
            :label="t('keys.form.fields.key_format.label')"
            :readonly="form.isReadonly"
            required
            width="100%"
          />
        </div>

        <KTextArea
          v-if="form.fields.key_format === 'jwk'"
          v-model.trim="form.fields.jwk"
          :character-limit="false"
          class="key-form-textarea"
          data-testid="key-form-jwk"
          :label="t('keys.form.fields.jwk.label')"
          :label-attributes="{
            info: t('keys.form.fields.jwk.tooltip'),
            tooltipAttributes: { maxWidth: '400' },
          }"
          :placeholder="t('keys.form.fields.jwk.placeholder')"
          :readonly="form.isReadonly"
          required
        />

        <KTextArea
          v-if="form.fields.key_format === 'pem'"
          v-model.trim="form.fields.private_key"
          :character-limit="false"
          class="key-form-textarea"
          data-testid="key-form-private-key"
          :label="t('keys.form.fields.private_key.label')"
          :placeholder="t('keys.form.fields.private_key.placeholder')"
          :readonly="form.isReadonly"
          required
        />

        <KTextArea
          v-if="form.fields.key_format === 'pem'"
          v-model.trim="form.fields.public_key"
          :character-limit="false"
          class="key-form-textarea"
          data-testid="key-form-public-key"
          :label="t('keys.form.fields.public_key.label')"
          :placeholder="t('keys.form.fields.public_key.placeholder')"
          :readonly="form.isReadonly"
          required
        />
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
  KonnectKeyFormConfig,
  KongManagerKeyFormConfig,
  KeyFormState,
  KeyFormFields,
  SelectItem,
} from '../types'
import endpoints from '../keys-endpoints'
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
    type: Object as PropType<KonnectKeyFormConfig | KongManagerKeyFormConfig>,
    required: true,
    validator: (config: KonnectKeyFormConfig | KongManagerKeyFormConfig): boolean => {
      if (!config || !['konnect', 'kongManager'].includes(config?.app)) return false
      if (config.app === 'konnect' && !config.controlPlaneId) return false
      if (config.app === 'kongManager' && typeof config.workspace !== 'string') return false
      if (!config.cancelRoute) return false
      return true
    },
  },
  /** If a valid Key ID is provided, it will put the form in Edit mode instead of Create */
  keyId: {
    type: String,
    required: false,
    default: '',
  },
  /** Specific the keyset Id if the key entity is a scoped entity [both create and edit form] */
  keySetId: {
    type: String as PropType<string | null>,
    required: false,
    default: null,
  },
  /** Pre-select the Key Set field and mark it as read-only [create form only] */
  fixedKeySetId: {
    type: String,
    required: false,
    default: '',
  },
  /** Whether to provide x5t field in key form */
  showx5t: {
    type: Boolean,
    required: false,
    default: false,
  },
})

const router = useRouter()
const { i18n: { t } } = composables.useI18n()
const { getMessageFromError } = useErrors()

const { axiosInstance } = useAxios(props.config?.axiosRequestConfig)

const fetchUrl = computed<string>(() => {
  return props.keySetId
    ? endpoints.form[props.config.app].edit.forKeySet.replace(/{keySetId}/gi, props.keySetId)
    : endpoints.form[props.config.app].edit.all
})
const formType = computed((): EntityBaseFormType => props.keyId ? EntityBaseFormType.Edit : EntityBaseFormType.Create)

const form = reactive<KeyFormState>({
  fields: {
    /**
    * Generates a unique key name using the current timestamp.
    * The name format is "new-key-" followed by numbers from the ISO timestamp.
    *
    * Example output: "new-key-20250307123045789"
    */
    name: formType.value === EntityBaseFormType.Create
      ? `new-key-${new Date().toISOString().replace(/\D/g, '').slice(0, 17)}`
      : '',
    tags: '',
    key_id: '',
    key_format: 'jwk',
    key_set: '',
    jwk: '',
    private_key: '',
    public_key: '',
    ...(props.showx5t ? { x5t: '' } : {}),
  },
  isReadonly: false,
  errorMessage: '',
})

const formFieldsOriginal = reactive<KeyFormFields>({
  name: '',
  tags: '',
  key_id: '',
  key_format: 'jwk',
  key_set: '',
  jwk: '',
  private_key: '',
  public_key: '',
})

const keyFormatItems = [
  {
    label: t('keys.form.fields.key_format.options.jwk'),
    value: 'jwk',
  },
  {
    label: t('keys.form.fields.key_format.options.pem'),
    value: 'pem',
  },
]

const isKeySetFieldReadonly = computed<boolean>(() => {
  return form.isReadonly || (formType.value === EntityBaseFormType.Create && !!props.fixedKeySetId)
})

// a workaround for `clearable` prop can reset a `readonly` select
const isKeySetFieldClearable = computed<boolean>(() => !isKeySetFieldReadonly.value)

// In create form, set new props.fixedKeySetId to form.fields.key_set to apply the change and mark the field as read-only
watch(() => props.fixedKeySetId, (newVal) => {
  if (formType.value === EntityBaseFormType.Create) {
    form.fields.key_set = newVal
  }
}, { immediate: true })

/**
 * Is the form submit button enabled?
 * If the form.fields and formFieldsOriginal are equal, always return false
 */
const canSubmit = computed((): boolean => JSON.stringify(form.fields) !== JSON.stringify(formFieldsOriginal) && !!form.fields.key_id && !!form.fields.key_format &&
  ((form.fields.key_format === 'jwk' && !!form.fields.jwk) || (form.fields.key_format === 'pem' && !!form.fields.private_key && !!form.fields.public_key)))

const initForm = (data: Record<string, any>): void => {
  form.fields.key_id = data?.kid || ''
  form.fields.name = data?.name || ''
  form.fields.tags = data?.tags?.join(', ') || ''
  form.fields.key_set = data?.set?.id || ''
  form.fields.key_format = data?.pem ? 'pem' : 'jwk'
  form.fields.jwk = data?.jwk || ''
  form.fields.private_key = data?.pem?.private_key || ''
  form.fields.public_key = data?.pem?.public_key || ''
  if (props.showx5t) {
    form.fields.x5t = data?.x5t || ''
  }

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
  let url = `${props.config.apiBaseUrl}${endpoints.form[props.config.app][formType.value][props.keySetId ? 'forKeySet' : 'all']}`

  if (props.config.app === 'konnect') {
    url = url.replace(/{controlPlaneId}/gi, props.config?.controlPlaneId || '')
  } else if (props.config.app === 'kongManager') {
    url = url.replace(/\/{workspace}/gi, props.config?.workspace ? `/${props.config.workspace}` : '')
  }

  // Always replace the id when editing
  url = url.replace(/{id}/gi, props.keyId)
    .replace(/{keySetId}/gi, props.keySetId || '')

  return url
})

const requestBody = computed((): Record<string, any> => {
  return {
    kid: form.fields.key_id,
    ...(props.showx5t ? { x5t: form.fields.x5t || null } : {}),
    name: form.fields.name || null,
    tags: form.fields.tags?.split(',')?.map((tag: string) => String(tag || '').trim())?.filter((tag: string) => tag !== '') || [],
    set: form.fields.key_set ? { id: form.fields.key_set } : null,
    jwk: form.fields.key_format === 'jwk' ? form.fields.jwk : null,
    pem: form.fields.key_format === 'pem' ? { private_key: form.fields.private_key, public_key: form.fields.public_key } : null,
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

    if (response) {
      const { data } = response

      form.fields.key_id = data?.kid || ''
      form.fields.name = data?.name || ''
      form.fields.tags = data?.tags?.join(', ') || ''
      form.fields.key_set = data?.set?.id || ''
      form.fields.key_format = data?.pem ? 'pem' : 'jwk'
      form.fields.jwk = data?.jwk || ''
      form.fields.private_key = data?.pem?.private_key || ''
      form.fields.public_key = data?.pem?.public_key || ''
      if (props.showx5t) {
        form.fields.x5t = data?.x5t || ''
      }

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

/* ---------------
 * Key Set Handling
 * ---------------
 */

const {
  debouncedQueryChange,
  loading: loadingKeySets,
  allRecords: allKeySets,
  error,
  validationError,
  loadItems,
  results,
} = useDebouncedFilter(props.config, endpoints.form[props.config.app].keySets, undefined, {
  fetchedItemsKey: 'data',
  searchKeys: ['id', 'name'],
})

const debouncedKeySetQueryChange = (query: string) => {
  // - always search if the query is empty, we need to reset the results list
  // - don't search if query matches the current selected id
  //    this happens when the user clicks an item in the KSelect and collapses the dropdown, displaying their selection in the input
  // - don't search if query matches the original form value
  //    this happens on load when editing
  if (!query || (query !== form.fields.key_set && query !== formFieldsOriginal.key_set)) {
    debouncedQueryChange(query)
  }
}

const fetchKeySetsErrorMessage = computed((): string => error.value ? t('keys.errors.key_sets.fetch') : '')
const keySetErrorMessage = computed((): string => validationError.value ? t('keys.errors.key_sets.invalid') : '')

const keySetsSelectKey = ref<number>(0)
// this will only be defined if we were able to initially fetch ALL available records
const additionalRecordsExist = computed((): boolean => allKeySets.value === undefined)
const keySetDropdownFooterText = computed(() => {
  if (!additionalRecordsExist.value) {
    return undefined
  }

  return props.config.app === 'konnect' ? t('keys.form.fields.key_set.footer') : undefined
})

// Create a ref to store valid key set ids
const existingKeySets = ref<Set<Record<string, any>>>(new Set())
const availableKeySets = computed((): SelectItem[] => {
  const keySets = Array.from(existingKeySets.value)
  return keySets.map((keySet: Record<string, any>) => ({
    name: keySet.name || '', // can't use name for label or it tries to search => 404
    label: '', // leave it blank so no flicker when used with selected-item-template
    value: keySet.id,
    selected: form.fields.key_set === keySet.id,
  }))
})

const setKeySets = (data: Array<Record<string, any>>) => {
  // Clear the set
  existingKeySets.value.clear()

  // Loop through the existing key sets and add them to the Set
  let keySet: Record<string, any>
  for (keySet of data) {
    existingKeySets.value.add(keySet)
  }
}

watch(results, (val) => {
  setKeySets(val)
}, { immediate: true, deep: true })

watch(availableKeySets, () => {
  keySetsSelectKey.value++
}, { immediate: true, deep: true })

onBeforeMount(async () => {
  // load key sets for filtering
  await loadItems()
})
</script>

<style lang="scss" scoped>
.kong-ui-entities-keys-form {
  width: 100%;

  .key-form-textarea {
    width: 100%;
  }

  .invalid-key-set-message {
    color: $kui-color-text-danger;
    font-size: 11px;
    font-weight: 500;
    margin-top: 3px !important;
  }

  :deep(.k-select) {
    .custom-selected-item {
      left: 0;
    }
  }

  .select-item-container {
    .select-item-label {
      font-weight: $kui-font-weight-semibold;
    }

    .select-item-description {
      color: $kui-color-text-neutral;
      font-size: $kui-font-size-20;
    }
  }
}
</style>
