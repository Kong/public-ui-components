<template>
  <KPrompt
    :action-pending="isPending"
    class="kong-ui-entities-add-consumers-modal"
    data-testid="add-consumer-modal"
    :is-visible="visible"
    :title="t('consumers.consumer_groups.add.title')"
    @canceled="cancel"
    @proceed="addConsumers"
  >
    <template #body-content>
      <div class="add-consumer-form-container">
        <p class="add-consumer-form-cta">
          {{ t('consumers.consumer_groups.add.ctaText') }}
        </p>
        <KMultiselect
          v-model="selectedConsumers"
          autosuggest
          data-testid="add-consumers-multiselect"
          :dropdown-footer-text="additionalRecordsExist ? t('consumers.consumer_groups.add.footer') : undefined"
          :items="availableConsumers"
          :label="t('consumers.consumer_groups.add.consumers_label')"
          :loading="loading"
          :placeholder="t('consumers.consumer_groups.add.consumer_placeholder')"
          :readonly="isPending"
          required
          width="100%"
          @query-change="debouncedQueryChange"
        >
          <template #item-template="{ item }">
            <div class="select-item-label">
              {{ item.label }}
            </div>
            <div
              v-if="getGeneric(item).data.username && getGeneric(item).data.custom_id"
              class="select-item-desc"
            >
              {{ getGeneric(item).data.custom_id }}
            </div>
          </template>
        </KMultiselect>
        <div
          v-if="error || fetchErrorMessage || errorArray.length"
          class="kong-ui-entity-add-consumers-error"
        >
          <KAlert appearance="danger">
            <template #alertMessage>
              <p>{{ t('consumers.errors.add') }}</p>
              <ul v-if="errorArray.length">
                <li
                  v-for="(err, idx) in errorArray"
                  :key="idx"
                >
                  {{ err }}
                </li>
              </ul>
              <div>
                {{ error || fetchErrorMessage }}
              </div>
            </template>
          </KAlert>
        </div>
      </div>
    </template>
  </KPrompt>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import { computed, ref, watch } from 'vue'
import type {
  KongManagerConsumerListConfig,
  KonnectConsumerListConfig,
} from '../types'
import { useDebouncedFilter, useAxios } from '@kong-ui-public/entities-shared'
import composables from '../composables'
import endpoints from '../consumers-endpoints'
import type { MultiselectItem } from '@kong/kongponents'

const { i18n: { t } } = composables.useI18n()

const props = defineProps({
  /** The base konnect or kongManger config. Pass additional config props in the shared entity component as needed. */
  config: {
    type: Object as PropType<KonnectConsumerListConfig | KongManagerConsumerListConfig>,
    required: true,
    validator: (config: KonnectConsumerListConfig | KongManagerConsumerListConfig): boolean => {
      if (!config || !['konnect', 'kongManager'].includes(config?.app)) return false
      if (!config.consumerGroupId) return false
      return true
    },
  },
  visible: {
    type: Boolean,
    required: true,
    default: false,
  },
})

const emit = defineEmits<{
  (e: 'cancel'): void
  (e: 'add:success', consumers: string[]): void
  (e: 'add:partial-success', consumers: string[]): void
  (e: 'error', msg: string): void
}>()

const { axiosInstance } = useAxios({
  headers: props.config?.requestHeaders,
})

/**
 * ------------------------------
 * Consumer Handling
 * ------------------------------
 */
// Multiselect
const selectedConsumers = ref<string[]>([])
const {
  debouncedQueryChange,
  loading,
  allRecords,
  error: fetchError,
  loadItems,
  results,
} = useDebouncedFilter(
  props.config,
  endpoints.list[props.config.app].all,
  '',
  {
    fetchedItemsKey: 'data',
    searchKeys: ['username', 'id'],
  },
)
// generic typing to get around `MultiselectItem` type being too strict to allow
// a `data` key
const getGeneric = (item: MultiselectItem) => {
  return item as unknown as any
}

const fetchErrorMessage = computed((): string => fetchError.value ? t('consumers.errors.general') : '')
const consumersSelectKey = ref<number>(0)
// this will only be defined if we were able to initially fetch ALL available records
const additionalRecordsExist = computed((): boolean => allRecords.value === undefined)

const availableConsumers = computed((): MultiselectItem[] => {
  return results.value.map((record: Record<string, any>) => ({
    label: record.username || record.customId,
    value: record.id,
    selected: selectedConsumers.value.includes(record.id),
    data: record, // we need this to determine whether or not to show the description text
  }))
})

const getConsumerIdentifier = (consumerId: string): string => {
  const consumer = additionalRecordsExist.value ? results.value.find(con => con.id === consumerId) : allRecords.value?.find(con => con.id === consumerId)

  if (consumer) {
    return consumer.username || consumer.custom_id
  }

  return consumerId
}

const cancel = () => {
  error.value = ''
  successArray.value = []
  errorArray.value = []
  emit('cancel')
}

// Add
const successArray = ref<string[]>([])
const isPending = ref(false)
const error = ref('')
const addConsumers = async (): Promise<void> => {
  if (!selectedConsumers.value.length) {
    error.value = ''
    errorArray.value = []
    emit('cancel')
    return
  }

  isPending.value = true
  error.value = ''
  successArray.value = []
  errorArray.value = []

  try {
    const bulkOperation = selectedConsumers.value.map(consumerId => addConsumerToGroup(consumerId))

    const results = await Promise.allSettled(bulkOperation)

    let allPass = true

    results.forEach(result => {
      if (result.status !== 'fulfilled') {
        allPass = false
      }
    })

    if (allPass) {
      successArray.value = []
      errorArray.value = []
      // Emit the success event for the host app
      emit('add:success', selectedConsumers.value)
      selectedConsumers.value = []
    } else {
      if (successArray.value.length) {
        emit('add:partial-success', successArray.value)
      }

      selectedConsumers.value = []
      handleBulkError(results)
    }
  } catch (_err: any) {
    error.value = t('consumers.errors.add')

    // Emit the error event for the host app
    emit('error', error.value)
  } finally {
    isPending.value = false
  }
}

const submitUrl = computed((): string => {
  let url = `${props.config.apiBaseUrl}${endpoints.list[props.config.app].forConsumerGroup}`

  if (props.config.app === 'konnect') {
    url = url
      .replace(/{controlPlaneId}/gi, props.config?.controlPlaneId || '')
      .replace(/{consumerGroupId}/gi, props.config?.consumerGroupId || '')
  } else if (props.config.app === 'kongManager') {
    url = url
      .replace(/\/{workspace}/gi, props.config?.workspace ? `/${props.config.workspace}` : '')
      .replace(/{consumerGroupId}/gi, props.config?.consumerGroupId || '')
  }

  return url
})

const addConsumerToGroup = async (consumerId: string): Promise<any> => {
  const payload = {
    consumer: consumerId,
  }
  try {
    const res = await axiosInstance.post(submitUrl.value, payload)

    successArray.value.push(consumerId)

    return res
  } catch (error: any) {
    let msg = `${getConsumerIdentifier(consumerId)} - ${error.message}`

    if (error.response.status === 409) {
      msg = `${getConsumerIdentifier(consumerId)} - ${t('consumers.errors.already_added')}`
    }

    return Promise.reject(Error(msg))
  }
}

const errorArray = ref<string[]>([])
const handleBulkError = (array: any[]): void => {
  errorArray.value = array.map(err => err.reason?.message).filter(Boolean)
}

watch(availableConsumers, () => {
  consumersSelectKey.value++
}, { immediate: true, deep: true })

watch(() => props.visible, () => {
  if (props.visible) {
    loadItems() // load consumers
  }
}, { immediate: true })
</script>

<style lang="scss" scoped>
.kong-ui-entities-add-consumers-modal {
  .add-consumer-form-cta {
    margin-top: 0;
  }

  .add-consumer-form-container {
    margin-bottom: 20px;

    .kong-ui-entity-add-consumers-error {
      margin-top: 16px;
    }
  }
}
</style>
