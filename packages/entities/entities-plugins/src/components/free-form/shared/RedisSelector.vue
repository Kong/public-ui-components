<template>
  <KCard
    v-if="useRedisPartial"
    class="redis-config-card"
    data-testid="redis-config-card"
    :title="t('redis.title')"
  >
    <div
      class="redis-config-radio-group"
      data-testid="redis-config-radio-group"
    >
      <KRadio
        v-model="usePartial"
        card
        card-orientation="horizontal"
        data-testid="shared-redis-config-radio"
        :description="t('redis.shared_configuration.description')"
        :label="t('redis.shared_configuration.label')"
        :selected-value="true"
      >
        <KBadge appearance="success">
          {{ t('redis.shared_configuration.badge') }}
        </KBadge>
      </KRadio>
      <KRadio
        v-model="usePartial"
        card
        card-orientation="horizontal"
        data-testid="dedicated-redis-config-radio"
        :description="t('redis.dedicated_configuration.description')"
        :label="t('redis.dedicated_configuration.label')"
        :selected-value="false"
      />
    </div>

    <div
      v-if="usePartial"
      class="shared-redis-config"
    >
      <div class="shared-redis-config-title">
        {{ t('redis.shared_configuration.title') }}
      </div>
      <div
        class="redis-config-select"
        data-testid="redis-config-select"
      >
        <KSelect
          class="redis-config-select-trigger"
          data-testid="redis-config-select-trigger"
          enable-filtering
          :filter-function="() => true"
          :items="availableRedisConfigs"
          :loading="loadingRedisConfigs"
          :model-value="selectedRedisConfigItem"
          :placeholder="t('redis.shared_configuration.selector.placeholder')"
          @change="(item) => redisConfigSelected(item?.value)"
          @query-change="debouncedRedisConfigsQuery"
        >
          <template #selected-item-template="{ item }">
            <div class="selected-redis-config">
              {{ (item as SelectItem).name }}
            </div>
          </template>
          <template #item-template="{ item }">
            <div
              class="plugin-form-redis-configuration-dropdown-item"
              :data-testid="`redis-configuration-dropdown-item-${item.name}`"
            >
              <span
                class="select-item-name"
                data-testid="selected-redis-config"
              >{{ item.name }}</span>
              <KBadge
                appearance="info"
                class="select-item-label"
              >
                {{ item.tag }}
              </KBadge>
            </div>
          </template>
          <template #empty>
            <div
              class="empty-redis-config"
              data-testid="empty-redis-config"
            >
              {{ t('redis.shared_configuration.empty_state') }}
            </div>
          </template>
          <template #dropdown-footer-text>
            <div
              class="new-redis-config-area"
              data-testid="new-redis-config-area"
              @click="() => redisPartialModalVisible = true"
            >
              <AddIcon :size="KUI_ICON_SIZE_20" />
              <span>{{ t('redis.shared_configuration.create_new_configuration', { type: getPartialTypeDisplay(redisType as RedisPartialType) }) }}</span>
            </div>
          </template>
        </KSelect>
      </div>
      <RedisConfigCard
        v-if="selectedRedisConfig"
        :config-fields="selectedRedisConfig"
      />
      <p
        v-if="sharedRedisConfigFetchError"
        class="redis-shared-config-error-message"
        data-testid="redis-config-fetch-error"
      >
        {{ sharedRedisConfigFetchError || t('redis.shared_configuration.error') }}
      </p>
    </div>
    <ObjectField
      v-else
      v-bind="props"
      as-child
      :fields-order="fieldsOrder"
      :name="formRedisPath"
      reset-label-path="reset"
    />
    <NewRedisPartialModal
      :partial-type="redisType"
      :visible="redisPartialModalVisible"
      @modal-close="redisPartialModalVisible = false"
      @partial-update-failed="onPartialUpdateFailed"
      @partial-updated="onPartialUpdated"
    />
  </KCard>
  <ObjectField
    v-else
    v-bind="props"
    :fields-order="fieldsOrder"
    hide-required-asterisk
    :name="formRedisPath"
  />
</template>

<script setup lang="ts">
import ObjectField from '../shared/ObjectField.vue'
import RedisConfigCard from './RedisConfigCard.vue'
import NewRedisPartialModal from './NewRedisPartialModal.vue'
import { onBeforeMount, inject, computed, ref, watch } from 'vue'
import english from '../../../locales/en.json'
import { createI18n } from '@kong-ui-public/i18n'
import { KUI_ICON_SIZE_20 } from '@kong/design-tokens'
import { FORMS_CONFIG } from '@kong-ui-public/forms'
import { AddIcon } from '@kong/icons'
import type { SelectItem } from '@kong/kongponents'
import { useAxios, useDebouncedFilter, useErrors, type KongManagerBaseFormConfig, type KonnectBaseFormConfig } from '@kong-ui-public/entities-shared'
import type { RedisConfig, RedisPartialType, Redis, PartialNotification, GlobalAction } from './types'
import { partialEndpoints, fieldsOrder, REDIS_PARTIAL_INFO } from './const'
import { getRedisType, getPartialTypeDisplay } from './utils'
import { useField, useFormData } from './composables'
const emit = defineEmits<{
  (e: 'showNewPartialModal'): void
  (e: 'globalAction', action: GlobalAction, payload?: PartialNotification): void
}>()

const { t } = createI18n<typeof english>('en-us', english)

interface RedisSelectorProps {
  defaultRedisConfigItem?: string
  redisType?: RedisPartialType
  redisPath?: string
}

type PartialArray = Array<{ id: string | number, path?: string | undefined }>

const props = defineProps<RedisSelectorProps>()

const redisPartialInfo = inject(REDIS_PARTIAL_INFO)
const isFormEditing = redisPartialInfo?.isEditing || false
const formRedisPath = computed(() => {
  if (props.redisPath) {
    return props.redisPath
  }
  if (redisPartialInfo?.redisPath?.value) {
    return '$.' + redisPartialInfo.redisPath.value
  }
  return '$.config.redis'
})
const redisType = props.redisType || redisPartialInfo?.redisType?.value || 'all'
// controls the visibility of the redis partial selector
const useRedisPartial = computed(() => !!redisPartialInfo?.redisType?.value)
const redisPartialModalVisible = ref(false)
const selectedRedisConfig = ref(null)
const usePartial = ref(!isFormEditing)
const { getMessageFromError } = useErrors()

const selectedRedisConfigItem = ref<string | number | undefined>(props.defaultRedisConfigItem)
// cache redis partial/redis fields in edition
// so that they are reusable when the user switches between partials
const redisFieldsSaved = ref<Redis>({})
const partialsSaved = ref<PartialArray | undefined>()

const { value: redisFieldsValue, ...field } = useField<Redis | undefined>(formRedisPath)

if (field.error) {
  throw new Error(field.error.message)
}

// initialize getter and setter for redis partial/redis fields
const { value: partialValue } = useFormData<PartialArray | null | undefined>('$.partials', field.instanceId)

const formConfig : KonnectBaseFormConfig | KongManagerBaseFormConfig = inject(FORMS_CONFIG)!
const pageSize = '1000' // the API returns all partials, so we have to set a high page size to filter them on the frontend
const {
  debouncedQueryChange: debouncedRedisConfigsQuery,
  loading: loadingRedisConfigs,
  error: redisConfigsFetchError,
  loadItems: loadConfigs,
  results: redisConfigsResults,
} = useDebouncedFilter(formConfig!, partialEndpoints[formConfig!.app].getAll, pageSize, {
  fetchedItemsKey: 'data',
  searchKeys: ['id', 'name'],
})

const sharedRedisConfigFetchError = computed(() => redisConfigsFetchError.value ? getMessageFromError(redisConfigsFetchError.value) : '')

/**
 * Build URL of getting one partial
 */
const getOnePartialUrl = (partialId: string | number): string => {
  let url = `${formConfig.apiBaseUrl}${partialEndpoints[formConfig.app].getOne}`

  if (formConfig.app === 'konnect') {
    url = url.replace(/{controlPlaneId}/gi, formConfig?.controlPlaneId || '')
  } else if (formConfig.app === 'kongManager') {
    url = url.replace(/\/{workspace}/gi, formConfig?.workspace ? `/${formConfig.workspace}` : '')
  }
  // Always replace the id when editing
  url = url.replace(/{id}/gi, String(partialId))
  return url
}

const availableRedisConfigs = computed((): SelectItem[] => {
  const configs = (redisConfigsResults.value || [])
    .map((el) => ({ label: el.id, name: el.name, value: el.id, type: el.type, tag: getRedisType(el as RedisConfig) }))
    // filter out non-redis configs
    // this is needed because the API returns all partials, not just redis configurations.
    .filter(partial => partial.type === 'redis-ce' || partial.type === 'redis-ee')

  if (redisType !== 'all') {
    // filter redis configs by redis type supported by the plugin
    return configs.filter((el) => el.type === redisType)
  }
  return configs
})

const { axiosInstance } = useAxios(formConfig?.axiosRequestConfig)

/**
 * When redis partial is selected, update the form field
 */
const handleFormRedisPartialData = () => {
  if (usePartial.value) {
    // when redis partial is selected, update the form field
    if (partialsSaved.value) {
      partialValue!.value = partialsSaved.value
      selectedRedisConfigItem.value = partialsSaved.value[0].id
      // unset redis fields in the form
      redisFieldsValue!.value = undefined
    }
    // save redis Fields
    if (redisFieldsValue?.value) {
      redisFieldsSaved.value = redisFieldsValue.value
    }
  } else {
    if (Object.keys(redisFieldsSaved.value).length) {
      redisFieldsValue!.value = redisFieldsSaved.value
    }
    // save redis partial
    if (partialValue?.value) {
      partialsSaved.value = partialValue.value as PartialArray
    }
    // unset redis partial value in the form
    partialValue!.value = isFormEditing ? null : undefined
  }
}

const onPartialUpdated = (payload: PartialNotification) => {
  // reload configs after partial is created
  loadConfigs()
  emit('globalAction', 'notify', payload)
}

const onPartialUpdateFailed = (payload: PartialNotification) => {
  emit('globalAction', 'notify', payload)
}

const redisConfigSelected = async (val: string | number | undefined) => {
  // when selector is cleared, do nothing
  if (!val) return

  selectedRedisConfigItem.value = val
  partialValue!.value = [{ id: val }]
  partialsSaved.value = [{ id: val }]

  // unset redis fields in the form
  redisFieldsValue!.value = undefined
  // show all fields in the same level
  try {
    const configRes = await axiosInstance.get(getOnePartialUrl(val))
    if (configRes.data.config) {
      const flattenedConfigRes = Object.assign(configRes.data, configRes.data.config)
      delete flattenedConfigRes.config
      selectedRedisConfig.value = flattenedConfigRes
    }
  } catch (error) {
    console.error(error)
  }
}

watch(() => usePartial.value, () => {
  handleFormRedisPartialData()
})

onBeforeMount(() => {
  // load config should not block selecting a default config
  loadConfigs()
  if (props.defaultRedisConfigItem || partialValue?.value) {
    const defaultRedisConfigItem = props.defaultRedisConfigItem || partialValue?.value?.[0].id
    redisConfigSelected(defaultRedisConfigItem)
    usePartial.value = true
  } else if (redisFieldsValue?.value) {
    redisFieldsSaved.value = redisFieldsValue.value
  }
})
</script>

<style lang="scss" scoped>
.redis-config-card {
  margin-bottom: $kui-space-60;

  :deep(.form-group:last-child) {
    margin-bottom: 0;
  }
}

.dedicated-redis-config {
  margin-top: $kui-space-60;

  .dedicated-redis-config-title {
    font-size: $kui-font-size-40;
    font-weight: $kui-font-weight-bold;
    line-height: $kui-line-height-30;
    margin-bottom: $kui-space-60;
  }
}

.shared-redis-config-title {
  font-weight: $kui-font-weight-semibold;
  line-height: $kui-line-height-30;
  margin-bottom: $kui-space-40;
}

.redis-config-radio-group {
  box-sizing: border-box;
  display: flex;
  gap: $kui-space-40;
  margin-bottom: $kui-space-40;
}

.redis-config-select {
  margin: $kui-space-60 0;

  :deep(.k-label) {
    margin-top: 0;
  }

  .empty-redis-config {
    color: $kui-color-text-neutral;
  }

  .new-redis-config-area {
    align-items: center;
    color: $kui-color-text-primary;
    cursor: pointer;
    display: flex;
    gap: $kui-space-10;
    pointer-events: auto;
  }

  .plugin-form-redis-configuration-dropdown-item {
    align-items: center;
    display: flex;
    gap: $kui-space-60;

    .select-item-name {
      color: $kui-color-text-neutral-stronger;
      line-height: $kui-line-height-40;
    }
  }

  .selected-redis-config {
    font-weight: $kui-font-weight-bold;
    line-height: $kui-line-height-40;
  }

  .plugin-form-selected-redis-config {
    font-weight: $kui-font-weight-bold;
    line-height: $kui-line-height-40;
  }
}

.redis-shared-config-error-message {
  color: $kui-color-text-danger;
}
</style>

