<template>
  <div class="kong-ui-entities-consumer-group-form">
    <EntityBaseForm
      :can-submit="isFormValid && changesExist"
      :config="config"
      :edit-id="consumerGroupId"
      :entity-type="SupportedEntityType.ConsumerGroup"
      :error-message="state.errorMessage || fetchError || preValidateErrorMessage"
      :fetch-url="fetchUrl"
      :form-fields="getPayload"
      :is-readonly="state.readonly"
      @cancel="cancelHandler"
      @fetch:error="fetchErrorHandler($event)"
      @fetch:success="updateFormValues"
      @loading="loadingHandler($event)"
      @submit="submitData"
    >
      <EntityFormSection
        :description="t('consumer_groups.form.general_info.description')"
        :title="t('consumer_groups.form.general_info.title')"
      >
        <KInput
          v-model.trim="state.fields.name"
          autocomplete="off"
          data-testid="consumer-group-form-name"
          :label="t('consumer_groups.form.fields.name.label')"
          :placeholder="t('consumer_groups.form.fields.name.placeholder')"
          required
          type="text"
        />

        <KInput
          v-model.trim="state.fields.tags"
          autocomplete="off"
          data-testid="consumer-group-form-tags"
          :help="t('consumer_groups.form.fields.tags.help')"
          :label="t('consumer_groups.form.fields.tags.label')"
          :label-attributes="{
            info: t('consumer_groups.form.fields.tags.tooltip'),
            tooltipAttributes: { maxWidth: '400' } }"
          :placeholder="t('consumer_groups.form.fields.tags.placeholder')"
          type="text"
        />
      </EntityFormSection>

      <EntityFormSection
        v-if="!hideConsumers"
        :description="t('consumer_groups.form.consumers.description')"
        has-divider
        :title="t('consumer_groups.form.consumers.title')"
      >
        <KMultiselect
          v-model="state.fields.consumers"
          appearance="select"
          autosuggest
          :items="displayedConsumers"
          :label="t('consumer_groups.form.fields.consumers.label')"
          :loading="loading"
          :placeholder="t('consumer_groups.form.fields.consumers.placeholder')"
          width="auto"
          @query-change="debouncedQueryChange"
        >
          <template #item-template="{ item }: { item: any }">
            <div class="select-item-container">
              <div class="select-item-label">
                {{ item.label }}
              </div>
              <div
                v-if="item?.data?.username && item?.data?.custom_id"
                class="select-item-description"
              >
                {{ item?.data?.custom_id }}
              </div>
            </div>
          </template>
        </KMultiselect>
      </EntityFormSection>
    </EntityBaseForm>
  </div>
</template>

<script lang="ts" setup>
import {
  EntityBaseForm,
  EntityBaseFormType,
  EntityFormSection,
  SupportedEntityType,
  useAxios,
  useDebouncedFilter,
  useErrors,
  useValidators,
} from '@kong-ui-public/entities-shared'
import '@kong-ui-public/entities-shared/dist/style.css'
import composables from '../composables'
import type { PropType } from 'vue'
import { computed, onBeforeMount, reactive } from 'vue'
import type {
  ConsumerGroupActions,
  ConsumerGroupFields,
  ConsumerGroupPayload,
  ConsumerGroupState,
  Consumer,
  KongManagerConsumerGroupFormConfig,
  KonnectConsumerGroupFormConfig, ConsumerGroupData,
} from '../types'
import endpoints from '../consumer-groups-endpoints'
import type { MultiselectItem } from '@kong/kongponents'
import { useRouter } from 'vue-router'
import type { AxiosError } from 'axios'

const props = defineProps({
  /** The base konnect or kongManger config. Pass additional config props in the shared entity component as needed. */
  config: {
    type: Object as PropType<KonnectConsumerGroupFormConfig | KongManagerConsumerGroupFormConfig>,
    required: true,
    validator: (config: KonnectConsumerGroupFormConfig | KongManagerConsumerGroupFormConfig): boolean => {
      if (!config || !['konnect', 'kongManager'].includes(config?.app)) return false
      if (config?.app === 'konnect' && !config?.controlPlaneId) return false
      if (config?.app === 'kongManager' && typeof config?.workspace !== 'string') return false
      if (!config?.cancelRoute) return false
      return true
    },
  },
  /** If a valid consumerGroupId is provided, it will put the form in Edit mode instead of Create */
  consumerGroupId: {
    type: String,
    required: false,
    default: '',
  },
  hideConsumers: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits<{
  (e: 'update', data: ConsumerGroupData): void
  (e: 'error', error: AxiosError): void
  (e: 'loading', isLoading: boolean): void
}>()

const { i18n: { t } } = composables.useI18n()
const router = useRouter()

const state = reactive<ConsumerGroupState>({
  fields: {
    name: '',
    tags: '',
    consumers: [],
  },
  errorMessage: '',
  readonly: false,
})

const originalFields = reactive<ConsumerGroupFields>({
  name: '',
  tags: '',
  consumers: [],
})

const {
  debouncedQueryChange,
  loading,
  error: fetchError,
  loadItems,
  results,
} = useDebouncedFilter(props.config, endpoints.form[props.config?.app]?.consumersList, '', {
  fetchedItemsKey: 'data',
  searchKeys: ['username', 'custom_id', 'id'],
})

const { axiosInstance } = useAxios(props.config?.axiosRequestConfig)
const { getMessageFromError } = useErrors()
const validators = useValidators()

const displayedConsumers = computed((): MultiselectItem[] => {
  return results.value.map((record: Record<string, any>) => ({
    label: record.username || record.custom_id,
    value: record.id,
    selected: state.fields.consumers.includes(record.id),
    data: record, // we need this to determine whether or not to show the description text
  }))
})

const fetchUrl = computed<string>(() => endpoints.form[props.config?.app]?.edit)

const formType = computed((): EntityBaseFormType => props.consumerGroupId
  ? EntityBaseFormType.Edit
  : EntityBaseFormType.Create)

const isFormValid = computed((): boolean => !!state.fields.name && !preValidateErrorMessage.value)
const changesExist = computed((): boolean => JSON.stringify(state.fields) !== JSON.stringify(originalFields))

const getUrl = (action: ConsumerGroupActions, groupId = '', consumerId = ''): string => {
  let url = `${props.config?.apiBaseUrl}${endpoints.form[props.config?.app][action]}`

  if (props.config?.app === 'konnect') {
    url = url.replace(/{controlPlaneId}/gi, props.config?.controlPlaneId || '')
  } else if (props.config?.app === 'kongManager') {
    url = url.replace(/\/{workspace}/gi, props.config?.workspace ? `/${props.config.workspace}` : '')
  }

  url = url.replace(/{id}/gi, groupId || props.consumerGroupId)

  if (action === 'addConsumer' || action === 'removeConsumer') {
    url = url.replace(/{consumerId}/gi, consumerId)
  }

  return url
}

const cancelHandler = (): void => {
  router.push(props.config?.cancelRoute || { name: 'consumer-group-list' })
}

const fetchErrorHandler = (err: AxiosError): void => {
  emit('error', err)
}

const loadingHandler = (val: boolean): void => {
  emit('loading', val)
}

const updateFormValues = async (data: Record<string, any>): Promise<void> => {
  state.fields.name = data?.item?.name || data?.consumer_group?.name || data?.name || ''

  const tags = data?.item?.tags || data?.consumer_group.tags || data?.tags || []
  state.fields.tags = tags?.join(', ') || ''

  if ('consumers' in data) {
    state.fields.consumers = data?.consumers?.map((el: Consumer) => el.id) || []
  } else {
    try {
      const { data: consumers } = await axiosInstance.get(getUrl('getConsumers'))

      state.fields.consumers = ('consumers' in consumers)
        ? consumers?.consumers?.map((el: Consumer) => el.id)
        : []
    } catch (e) {
      emitError(e as AxiosError)
    }
  }

  Object.assign(originalFields, state.fields)
}

const preValidateErrorMessage = computed(() => validators.utf8Name(state.fields.name))

const getPayload = computed((): ConsumerGroupPayload => {
  return {
    name: state.fields.name,
    tags: state.fields.tags.split(',')?.map((tag: string) => String(tag || '')
      .trim())?.filter((tag: string) => tag !== ''),
  }
})

const addConsumer = async (consumerId: string, groupId = ''): Promise<void> => {
  return await axiosInstance.post(getUrl('addConsumer', groupId, consumerId), { consumer: consumerId })
}

const removeConsumer = async (consumerId: string, groupId = ''): Promise<void> => {
  return await axiosInstance.delete(getUrl('removeConsumer', groupId, consumerId))
}

const emitError = (e: AxiosError): void => {
  state.errorMessage = getMessageFromError(e)
  emit('error', e as AxiosError)
}

const emitUpdate = (id = props.consumerGroupId): void => {
  Object.assign(originalFields, state.fields)

  emit('update', { ...state.fields, id })
}

const handleConsumers = (results: any[] | undefined, message: string, groupId = props.consumerGroupId): void => {
  const failed = results?.find(result => result.status !== 'fulfilled')
  if (failed) {
    emitError({
      code: failed.status,
      message,
    } as AxiosError)
  } else {
    emitUpdate(groupId)
  }
}

const createGroup = async (): Promise<void> => {
  let newGroupId = ''
  try {
    const { data } = await axiosInstance.post(getUrl('create'), getPayload.value)

    newGroupId = ('item' in data) ? data.item.id : data.id
  } catch (e) {
    emitError(e as AxiosError)
  }

  if (state.fields.consumers.length > 0 && newGroupId) {
    try {
      const bulkActions = state.fields.consumers.map(el => addConsumer(el, newGroupId))

      const results = await Promise.allSettled(bulkActions)

      handleConsumers(results, t('consumer_groups.errors.add_consumer'), newGroupId)
    } catch (e) {
      emitError(e as AxiosError)
    }
  } else if (state.fields.consumers.length === 0 && newGroupId) {
    emitUpdate(newGroupId)
  }
}

const updateGroup = async (): Promise<void> => {
  try {
    if (props.config?.app === 'konnect') {
      await axiosInstance.put(getUrl('edit'), getPayload.value)
    } else {
      await axiosInstance.patch(getUrl('edit'), getPayload.value)
    }
  } catch (e) {
    emitError(e as AxiosError)
  }

  const consumersToAdd = state.fields.consumers.filter(x => !originalFields.consumers.includes(x))
  const consumersToRemove = originalFields.consumers.filter(x => !state.fields.consumers.includes(x))

  if (consumersToRemove.length === 0 && consumersToAdd.length === 0) {
    emitUpdate()
  } else {
    if (consumersToRemove.length > 0) {
      try {
        const bulkRemoveActions = consumersToRemove.map(el => removeConsumer(el))

        const results = await Promise.allSettled(bulkRemoveActions)

        handleConsumers(results, t('consumer_groups.errors.remove_consumer'))
      } catch (e) {
        emitError(e as AxiosError)
      }
    }

    if (consumersToAdd.length > 0) {
      try {
        const bulkActions = consumersToAdd.map(el => addConsumer(el))

        const results = await Promise.allSettled(bulkActions)

        handleConsumers(results, t('consumer_groups.errors.add_consumer'))
      } catch (e) {
        emitError(e as AxiosError)
      }
    }
  }
}

const submitData = async (): Promise<void> => {
  try {
    state.readonly = true

    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    formType.value === EntityBaseFormType.Create ? await createGroup() : await updateGroup()
  } finally {
    state.readonly = false
  }
}

onBeforeMount(async () => {
  // when we hides the consumers selection field, there were no need to load the data
  if (!props.hideConsumers) {
    await loadItems()
  }
})
</script>

<style lang="scss" scoped>
.kong-ui-entities-consumer-group-form {
  width: 100%;

  @media screen and (min-width: $kui-breakpoint-laptop) {
    &:deep(.form-section-wrapper) {
      column-gap: var(--kui-space-130, $kui-space-130);
    }
  }

  .select-item-container {
    .select-item-label {
      font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
    }

    .select-item-description {
      color: var(--kui-color-text-neutral, $kui-color-text-neutral);
      font-size: var(--kui-font-size-20, $kui-font-size-20);
    }
  }
}
</style>
