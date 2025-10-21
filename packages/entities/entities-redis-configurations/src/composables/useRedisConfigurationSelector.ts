/**
 * Extract from packages/entities/entities-plugins/src/components/free-form/shared/RedisSelector.vue
 */
import { computed, inject, onBeforeMount } from 'vue'
import { FORMS_CONFIG } from '@kong-ui-public/forms'
import { getRedisType } from '../helpers'
import { useDebouncedFilter, type KongManagerBaseFormConfig, type KonnectBaseFormConfig } from '@kong-ui-public/entities-shared'
import endpoints from '../partials-endpoints'

import type { RedisConfigurationDTO } from '../types'
import type { SelectItem } from '@kong/kongponents'

export function useRedisConfigurationSelector(options: {
  redisType?: 'redis-ce' | 'redis-ee' | 'all' // q: is the `all` option needed?
}) {
  const {
    redisType = 'all',
  } = options

  const pageSize = '1000' // the API returns all partials, so we have to set a high page size to filter them on the frontend
  const formConfig = inject<KonnectBaseFormConfig | KongManagerBaseFormConfig>(FORMS_CONFIG)

  if (!formConfig) {
    throw new Error('FORMS_CONFIG must be provided')
  }

  const {
    debouncedQueryChange: debouncedRedisConfigsQuery,
    loading: loadingRedisConfigs,
    error: redisConfigsFetchError,
    loadItems,
    results: redisConfigsResults,
  } = useDebouncedFilter(formConfig, endpoints.list[formConfig.app], pageSize, {
    fetchedItemsKey: 'data',
    searchKeys: ['id', 'name'],
  })

  const availableRedisConfigs = computed((): Array<SelectItem<string>> => {
    const configs = (redisConfigsResults.value || [])
      .map((el) => ({ label: el.id, name: el.name, value: el.id, type: el.type, tag: getRedisType(el as RedisConfigurationDTO) }))
      // filter out non-redis configs
      // this is needed because the API returns all partials, not just redis configurations.
      .filter(partial => partial.type === 'redis-ce' || partial.type === 'redis-ee')

    if (redisType !== 'all') {
      // filter redis configs by redis type supported by the plugin
      return configs.filter((el) => el.type === redisType)
    }
    return configs
  })

  onBeforeMount(() => {
    loadItems()
  })

  return {
    items: availableRedisConfigs,
    loading: loadingRedisConfigs,
    onQueryChange: debouncedRedisConfigsQuery,
    error: redisConfigsFetchError,
    loadItems,
  }
}
