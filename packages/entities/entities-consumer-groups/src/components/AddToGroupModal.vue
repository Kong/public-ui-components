<template>
  <KPrompt
    :action-button-disabled="isPending"
    class="kong-ui-entities-add-to-groups-modal"
    data-testid="add-to-group-modal"
    :title="t('consumer_groups.consumers.add.title')"
    :visible="visible"
    @cancel="cancel"
    @proceed="addToConsumerGroups"
  >
    <template #default>
      <div class="add-to-group-form-container">
        <p class="add-to-group-cta-text">
          {{ t('consumer_groups.consumers.add.ctaText') }}
        </p>
        <KMultiselect
          v-model="selectedConsumerGroups"
          autosuggest
          data-testid="add-to-groups-multiselect"
          :dropdown-footer-text="additionalRecordsExist ? t('consumer_groups.consumers.add.footer') : undefined"
          :items="availableConsumerGroups"
          :label="t('consumer_groups.consumers.add.consumer_groups_label')"
          :loading="loading"
          :placeholder="t('consumer_groups.consumers.add.consumer_group_placeholder')"
          :readonly="isPending"
          required
          width="100%"
          @query-change="debouncedQueryChange"
        />
        <div
          v-if="error || fetchErrorMessage || errorArray.length"
          class="kong-ui-entity-add-to-groups-error"
        >
          <KAlert appearance="danger">
            <template #default>
              <p>{{ t('consumer_groups.errors.add') }}</p>
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
  KongManagerConsumerGroupListConfig,
  KonnectConsumerGroupListConfig,
} from '../types'
import { useDebouncedFilter, useAxios } from '@kong-ui-public/entities-shared'
import composables from '../composables'
import endpoints from '../consumer-groups-endpoints'
import type { MultiselectItem } from '@kong/kongponents'

const { i18n: { t } } = composables.useI18n()

const props = defineProps({
  /** The base konnect or kongManger config. Pass additional config props in the shared entity component as needed. */
  config: {
    type: Object as PropType<KonnectConsumerGroupListConfig | KongManagerConsumerGroupListConfig>,
    required: true,
    validator: (config: KonnectConsumerGroupListConfig | KongManagerConsumerGroupListConfig): boolean => {
      if (!config || !['konnect', 'kongManager'].includes(config?.app)) return false
      if (!config.consumerId) return false
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
const selectedConsumerGroups = ref<string[]>([])
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
    searchKeys: ['name', 'id'],
  },
)

const fetchErrorMessage = computed((): string => fetchError.value ? t('consumer_groups.errors.general') : '')
const consumerGroupsSelectKey = ref<number>(0)
// this will only be defined if we were able to initially fetch ALL available records
const additionalRecordsExist = computed((): boolean => allRecords.value === undefined)

const availableConsumerGroups = computed((): MultiselectItem[] => {
  return results.value.map((record: Record<string, any>) => ({
    label: record.name,
    value: record.id,
    selected: selectedConsumerGroups.value.includes(record.id),
    data: record, // we need this to determine whether or not to show the description text
  }))
})

const getConsumerGroupIdentifier = (consumerGroupId: string): string => {
  const consumerGroup = additionalRecordsExist.value
    ? results.value.find(con => con.id === consumerGroupId)
    : allRecords.value?.find(con => con.id === consumerGroupId)

  if (consumerGroup) {
    return consumerGroup.name
  }

  return consumerGroupId
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
const addToConsumerGroups = async (): Promise<void> => {
  if (!selectedConsumerGroups.value.length) {
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
    const bulkOperation = selectedConsumerGroups.value.map(consumerGroupId => addConsumerToGroup(consumerGroupId))

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
      emit('add:success', selectedConsumerGroups.value)
      selectedConsumerGroups.value = []
    } else {
      if (successArray.value.length) {
        emit('add:partial-success', successArray.value)
      }

      selectedConsumerGroups.value = []
      handleBulkError(results)
    }
  } catch (_err: any) {
    error.value = t('consumer_groups.errors.add')

    // Emit the error event for the host app
    emit('error', error.value)
  } finally {
    isPending.value = false
  }
}

const submitUrl = computed((): string => {
  let url = `${props.config.apiBaseUrl}${endpoints.list[props.config.app].forConsumer}`

  if (props.config.app === 'konnect') {
    url = url
      .replace(/{controlPlaneId}/gi, props.config?.controlPlaneId || '')
      .replace(/{consumerId}/gi, props.config?.consumerId || '')
  } else if (props.config.app === 'kongManager') {
    url = url
      .replace(/\/{workspace}/gi, props.config?.workspace ? `/${props.config.workspace}` : '')
      .replace(/{consumerId}/gi, props.config?.consumerId || '')
  }

  return url
})

const addConsumerToGroup = async (consumerGroupId: string): Promise<any> => {
  const payload = {
    group: consumerGroupId,
  }
  try {
    const res = await axiosInstance.post(submitUrl.value, payload)

    successArray.value.push(consumerGroupId)

    return res
  } catch (error: any) {
    let msg = `${getConsumerGroupIdentifier(consumerGroupId)} - ${error.message}`

    if (error.response.status === 409) {
      msg = `${getConsumerGroupIdentifier(consumerGroupId)} - ${t('consumer_groups.errors.already_added')}`
    }

    return Promise.reject(Error(msg))
  }
}

const errorArray = ref<string[]>([])
const handleBulkError = (array: any[]): void => {
  errorArray.value = array.map(err => err.reason?.message).filter(Boolean)
}

watch(availableConsumerGroups, () => {
  consumerGroupsSelectKey.value++
}, { immediate: true, deep: true })

watch(() => props.visible, () => {
  if (props.visible) {
    loadItems() // load consumer groups
  }
}, { immediate: true })
</script>

<style lang="scss" scoped>
.kong-ui-entities-add-to-groups-modal {
  .add-to-group-cta-text {
    margin-top: 0;
  }

  .add-to-group-form-container {
    margin-bottom: 20px;

    .kong-ui-entity-add-to-groups-error {
      margin-top: 16px;
    }
  }
}
</style>
