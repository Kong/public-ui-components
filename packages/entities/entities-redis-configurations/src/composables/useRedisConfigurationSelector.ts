/**
 * Extract from packages/entities/entities-plugins/src/components/free-form/shared/RedisSelector.vue
 */
import { computed, inject, onBeforeMount } from 'vue'
import { FORMS_CONFIG } from '@kong-ui-public/forms'
import { getRedisType } from '../helpers'
import { useDebouncedFilter, type KongManagerBaseFormConfig, type KonnectBaseFormConfig } from '@kong-ui-public/entities-shared'
import endpoints from '../partials-endpoints'
import { RedisType } from '../types'

import type { RedisConfigurationDTO } from '../types'
import type { SelectItem } from '@kong/kongponents'
import useI18n from './useI18n'

export function useRedisConfigurationSelector(options: {
  redisType?: 'redis-ce' | 'redis-ee'
}) {
  const {
    redisType = 'redis-ce',
  } = options

  const pageSize = '1000' // the API returns all partials, so we have to set a high page size to filter them on the frontend
  const formConfig = inject<KonnectBaseFormConfig | KongManagerBaseFormConfig>(FORMS_CONFIG)
  const { i18n: { t } } = useI18n()

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

  const typeToDisplayName = (redisType: RedisType): string => {
    switch (redisType) {
      case RedisType.CLUSTER:
        return t('form.options.type.cluster')
      case RedisType.HOST_PORT_CE:
        return t('form.options.type.host_port')
      case RedisType.SENTINEL:
        return t('form.options.type.sentinel')
      case RedisType.HOST_PORT_EE:
        return `${t('form.options.type.host_port')} (${t('form.options.type.enterprise')})`
    }
  }

  const availableRedisConfigs = computed((): Array<SelectItem<string>> => {
    const configs = (redisConfigsResults.value || [])
      // filter out non-redis configs
      // this is needed because the API returns all partials, not just redis configurations.
      .filter(partial => partial.type === 'redis-ce' || partial.type === 'redis-ee')
      .map((el) => ({ label: el.id, name: el.name, value: el.id, type: el.type, tag: typeToDisplayName(getRedisType(el as RedisConfigurationDTO)) }))

    // filter redis configs by redis type supported by the plugin
    return configs.filter((el) => el.type === redisType)
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
