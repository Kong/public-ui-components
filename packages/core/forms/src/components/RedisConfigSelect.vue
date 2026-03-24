<template>
  <div
    class="redis-config-select"
    data-testid="redis-config-select"
  >
    <KLabel
      :info="isCustomPlugin ? t('redis.custom_plugin.tooltip') : t('redis.shared_configuration.tooltip', { type: getPartialTypeDisplay(redisType as PartialType) })"
      :tooltip-attributes="{
        maxWidth: '300',
        placement: 'top',
      }"
    >
      {{ t('redis.shared_configuration.title') }}
    </KLabel>
    <div class="shared-redis-config-title" />
    <!-- TODO: Refactor this select to use the packages/entities/entities-redis-configurations/src/components/RedisConfigurationSelector.vue -->
    <KSelect
      class="redis-config-select-trigger"
      data-testid="redis-config-select-trigger"
      enable-filtering
      :filter-function="() => true"
      :items="availableRedisConfigs"
      :loading="loadingRedisConfigs"
      :model-value="defaultRedisConfigItem"
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
          @click="$emit('showNewPartialModal')"
        >
          <AddIcon :size="KUI_ICON_SIZE_20" />
          <span>{{ t('redis.shared_configuration.create_new_configuration', { type: getPartialTypeDisplay(redisType as PartialType) }) }}</span>
        </div>
      </template>
    </KSelect>
  </div>
  <RedisConfigCard
    v-if="selectedRedisConfig"
    :config-fields="selectedRedisConfig"
    :plugin-redis-fields="pluginRedisFields"
  />
  <p
    v-if="sharedRedisConfigFetchError"
    class="redis-shared-config-error-message"
    data-testid="redis-config-fetch-error"
  >
    {{ sharedRedisConfigFetchError || t('redis.shared_configuration.error') }}
  </p>
</template>

<script setup lang="ts">
import { FORMS_CONFIG, REDIS_PARTIAL_FETCHER_KEY } from '../const'
import { onBeforeMount, inject, computed, ref, watch, type Ref, type PropType } from 'vue'
import {
  useAxios,
  useDebouncedFilter,
  useErrors,
  type KongManagerBaseFormConfig,
  type KongManagerBaseTableConfig,
  type KonnectBaseFormConfig,
  type KonnectBaseTableConfig,
} from '@kong-ui-public/entities-shared'
import { AddIcon } from '@kong/icons'
import { KUI_ICON_SIZE_20 } from '@kong/design-tokens'
import { createI18n } from '@kong-ui-public/i18n'
import english from '../locales/en.json'
import { getRedisType, getPartialTypeDisplay } from '../utils/redisPartial'
import type { PartialType, RedisConfigurationFields } from '../types'
import type { SelectItem } from '@kong/kongponents'
import type { Field } from '../composables/useRedisPartial'
import RedisConfigCard from './RedisConfigCard.vue'

defineEmits<{
  (e: 'showNewPartialModal'): void
}>()

const { t } = createI18n<typeof english>('en-us', english)

const redisPartialFetcherKey: Ref<number, number> | undefined = inject(REDIS_PARTIAL_FETCHER_KEY)

const endpoints = {
  konnect: {
    getOne: '/v2/control-planes/{controlPlaneId}/core-entities/partials/{id}',
    getAll: '/v2/control-planes/{controlPlaneId}/core-entities/partials',
  },
  kongManager: {
    getOne: '/{workspace}/partials/{id}',
    getAll: '/{workspace}/partials',
  },
}

const props = defineProps({
  defaultRedisConfigItem: {
    type: String,
    required: false,
    default: '',
  },
  updateRedisModel: {
    type: Function as PropType<(val: string | number) => void>,
    required: true,
  },
  pluginRedisFields: {
    type: Array<Field>,
    required: true,
  },
  redisType: {
    type: String,
    default: 'all',
  },
  isCustomPlugin: {
    type: Boolean,
    default: false,
  },
})

const selectedRedisConfig = ref(null)
const { getMessageFromError } = useErrors()

const formConfig : KonnectBaseFormConfig | KongManagerBaseFormConfig | KonnectBaseTableConfig | KongManagerBaseTableConfig = inject(FORMS_CONFIG)!
const pageSize = '1000' // the API returns all partials, so we have to set a high page size to filter them on the frontend
const {
  debouncedQueryChange: debouncedRedisConfigsQuery,
  loading: loadingRedisConfigs,
  error: redisConfigsFetchError,
  loadItems: loadConfigs,
  results: redisConfigsResults,
} = useDebouncedFilter(formConfig!, endpoints[formConfig!.app].getAll, pageSize, {
  fetchedItemsKey: 'data',
  searchKeys: ['id', 'name'],
})

const sharedRedisConfigFetchError = computed(() => redisConfigsFetchError.value ? getMessageFromError(redisConfigsFetchError.value) : '')

/**
 * Build URL of getting one partial
 */
const getOnePartialUrl = (partialId: string | number): string => {
  let url = `${formConfig.apiBaseUrl}${endpoints[formConfig.app].getOne}`

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
    .map((el) => ({ label: el.id, name: el.name, value: el.id, type: el.type, tag: getRedisType(el as RedisConfigurationFields) }))
    // filter out non-redis configs
    // this is needed because the API returns all partials, not just redis configurations.
    .filter(partial => partial.type === 'redis-ce' || partial.type === 'redis-ee')

  if (props.redisType !== 'all') {
    // filter redis configs by redis type supported by the plugin
    return configs.filter((el) => el.type === props.redisType)
  }
  return configs
})

const { axiosInstance } = useAxios(formConfig?.axiosRequestConfig)

const redisConfigSelected = async (val: string | number | undefined) => {
  // when selector is cleared, do nothing
  if (!val) return

  props.updateRedisModel(val)
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

// if a new key is passed by the consuming app, reload the configs
watch(() => redisPartialFetcherKey?.value, async (key) => {
  if (key)
    await loadConfigs()
})

onBeforeMount(() => {
  // load config should not block selecting a default config
  loadConfigs()
  if (props.defaultRedisConfigItem) {
    redisConfigSelected(props.defaultRedisConfigItem)
  }
})
</script>

<style scoped lang="scss">
.redis-config-select {
  margin: var(--kui-space-60, $kui-space-60) 0;

  :deep(.k-label) {
    margin-top: 0;
  }

  .shared-redis-config-title {
    font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
    line-height: var(--kui-line-height-30, $kui-line-height-30);
    margin-bottom: var(--kui-space-40, $kui-space-40);
  }

  .empty-redis-config {
    color: var(--kui-color-text-neutral, $kui-color-text-neutral);
  }

  .new-redis-config-area {
    align-items: center;
    color: var(--kui-color-text-primary, $kui-color-text-primary);
    cursor: pointer;
    display: flex;
    gap: var(--kui-space-10, $kui-space-10);
    pointer-events: auto;
  }

  .plugin-form-redis-configuration-dropdown-item {
    align-items: center;
    display: flex;
    gap: var(--kui-space-60, $kui-space-60);

    .select-item-name {
      color: var(--kui-color-text-neutral-stronger, $kui-color-text-neutral-stronger);
      line-height: var(--kui-line-height-40, $kui-line-height-40);
    }
  }

  .selected-redis-config {
    font-weight: var(--kui-font-weight-bold, $kui-font-weight-bold);
    line-height: var(--kui-line-height-40, $kui-line-height-40);
  }

  .plugin-form-selected-redis-config {
    font-weight: var(--kui-font-weight-bold, $kui-font-weight-bold);
    line-height: var(--kui-line-height-40, $kui-line-height-40);
  }
}

.redis-shared-config-error-message {
  color: var(--kui-color-text-danger, $kui-color-text-danger);
}
</style>
