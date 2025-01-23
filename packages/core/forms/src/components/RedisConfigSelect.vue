<template>
  <div class="redis-config-select">
    <div class="shared-redis-config-title">
      {{ t('redis.shared_configuration.title') }}
    </div>
    <KSelect
      v-model="selectedRedisConfigItem"
      data-testid="redis-config-select"
      enable-filtering
      :filter-function="() => true"
      :items="availableRedisConfigs"
      :loading="loadingRedisConfigs"
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
        <div class="plugin-form-redis-configuration-dropdown-item">
          <span class="select-item-name">{{ item.name }}</span>
          <KBadge
            appearance="info"
            class="select-item-label"
          >
            {{ item.tag }}
          </KBadge>
        </div>
      </template>
      <template #empty>
        <div class="empty-redis-config">
          {{ t('redis.shared_configuration.empty_state') }}
        </div>
      </template>
      <template #dropdown-footer-text>
        <div
          class="new-redis-config-area"
          @click="$emit('showNewPartialModal')"
        >
          <AddIcon :size="KUI_ICON_SIZE_20" />
          <span>{{ t('redis.shared_configuration.create_new_configuration') }}</span>
        </div>
      </template>
    </KSelect>
  </div>
  <RedisConfigCard
    v-if="selectedRedisConfig"
    :config-fields="selectedRedisConfig"
    :plugin-redis-fields="pluginRedisFields"
  />
</template>

<script setup lang="ts">
import { FORMS_CONFIG, REDIS_PARTIAL_FETCHER_KEY } from '../const'
import { onBeforeMount, inject, computed, ref, watch, type Ref } from 'vue'
import {
  useAxios,
  useDebouncedFilter,
  type KongManagerBaseFormConfig,
  type KongManagerBaseTableConfig,
  type KonnectBaseFormConfig,
  type KonnectBaseTableConfig,
} from '@kong-ui-public/entities-shared'
import { AddIcon } from '@kong/icons'
import { KUI_ICON_SIZE_20 } from '@kong/design-tokens'
import { createI18n } from '@kong-ui-public/i18n'
import english from '../locales/en.json'
import { getRedisType, type RedisConfigurationFields } from '../utils/redisPartial'
import type { SelectItem } from '@kong/kongponents/dist/types'
import type { Field } from '../composables/useRedisPartial'
import RedisConfigCard from './RedisConfigCard.vue'

defineEmits<{
  (e: 'showNewPartialModal'): void,
}>()

const { t } = createI18n<typeof english>('en-us', english)

const redisPartialFetcherKey: Ref<number,number> | undefined = inject(REDIS_PARTIAL_FETCHER_KEY)

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
    type: Function,
    required: true,
  },
  pluginRedisFields: {
    type: Array<Field>,
    required: true,
  },
})

const selectedRedisConfigItem = ref(props.defaultRedisConfigItem)
const selectedRedisConfig = ref(null)

const formConfig : KonnectBaseFormConfig | KongManagerBaseFormConfig | KonnectBaseTableConfig | KongManagerBaseTableConfig = inject(FORMS_CONFIG)!
const {
  debouncedQueryChange: debouncedRedisConfigsQuery,
  loading: loadingRedisConfigs,
  // error: redisConfigsFetchError,
  loadItems: loadConfigs,
  results: redisConfigsResults,
} = useDebouncedFilter(formConfig!, endpoints[formConfig!.app].getAll, undefined, {
  fetchedItemsKey: 'data',
  searchKeys: ['id', 'name'],
})

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

const availableRedisConfigs = computed((): SelectItem[] => redisConfigsResults.value?.map((el) => ({ label: el.id, name: el.name, value: el.id, tag: getRedisType(el as RedisConfigurationFields) })) || [])

const { axiosInstance } = useAxios(formConfig?.axiosRequestConfig)

const redisConfigSelected = async (val: string | number | undefined) => {
  // when selector is cleared, do nothing
  if (!val) return

  props.updateRedisModel(val)
  //
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

onBeforeMount(async () => {
  await loadConfigs()
  if (props.defaultRedisConfigItem) {
    redisConfigSelected(props.defaultRedisConfigItem)
  }
})
</script>

<style scoped lang="scss">
.redis-config-select {
  margin: $kui-space-60 0;

  .shared-redis-config-title {
    font-weight: $kui-font-weight-semibold;
    line-height: $kui-line-height-30;
    margin-bottom: $kui-space-40;
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
</style>
