/**
 * Data for `RedisConfigurationSelector`: partials list + search, Redis-only filter
 * When `isKonnectManagedRedisEnabled` is true (Konnect cloud + FF)- grouped Konnect-managed vs self-managed rows
 * Otherwise (KM/ legacy Konnect)- flat list with type badges on every row
 */
import { computed, inject, onBeforeMount } from 'vue'
import { FORMS_CONFIG } from '@kong-ui-public/forms'
import { getRedisType, inferRedisPartialManagedSource } from '../helpers'
import { useDebouncedFilter, type KongManagerBaseFormConfig, type KonnectBaseFormConfig } from '@kong-ui-public/entities-shared'
import endpoints from '../partials-endpoints'
import { RedisType } from '../types'

import type { RedisConfigurationDTO } from '../types'
import type { SelectEntry, SelectItem } from '@kong/kongponents'
import useI18n from './useI18n'

export function useRedisConfigurationSelector(options: {
  redisType?: 'redis-ce' | 'redis-ee'
  isKonnectManagedRedisEnabled?: boolean
}) {
  const {
    redisType = 'redis-ce',
    isKonnectManagedRedisEnabled = false,
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

  /** KSelect row with extra fields for grouping and Redis typing */
  type RedisSelectItem = SelectItem<string> & {
    type?: string
    source?: 'self-managed' | 'konnect-managed'
    tag?: string
    partial?: RedisConfigurationDTO
  }

  const legacyFlatItems = computed((): Array<SelectItem<string>> => {
    const configs = (redisConfigsResults.value || [])
      .map((row: Record<string, any>) => (row.partial ?? row) as RedisConfigurationDTO & { id: string })
      .filter((partial) => partial.type === 'redis-ce' || partial.type === 'redis-ee')
      .map((el) => ({
        label: el.id,
        name: el.name,
        value: el.id,
        type: el.type,
        tag: typeToDisplayName(getRedisType(el)),
      }))
      .filter((el) => el.type === redisType)

    return configs
  })

  const managedRedisConfigItems = computed((): RedisSelectItem[] => {
    const configs: RedisSelectItem[] = (redisConfigsResults.value || [])
      .filter((row: Record<string, any>) => {
        const partial = (row.partial ?? row) as RedisConfigurationDTO

        return partial.type === 'redis-ce' || partial.type === 'redis-ee'
      })
      .map((row: Record<string, any>) => {
        const partial = (row.partial ?? row) as RedisConfigurationDTO & { id: string }

        const explicitSource = (row.source === 'konnect-managed' || row.source === 'self-managed')
          ? row.source : undefined

        const source = explicitSource ?? inferRedisPartialManagedSource(partial)
        const isKonnectManaged = source === 'konnect-managed'

        return {
          label: partial.id,
          name: partial.name,
          value: partial.id,
          type: partial.type,
          partial,
          source,
          tag: isKonnectManaged ? undefined : typeToDisplayName(getRedisType(partial)),
        }
      })

    return configs
      .filter((item) => item.type === redisType)
      .sort((a, b) => {
        const sourceSortRank = (source?: 'self-managed' | 'konnect-managed'): number => {
          if (source === 'konnect-managed') return 0
          if (source === 'self-managed') return 1
          return 2
        }

        const bySource = sourceSortRank(a.source) - sourceSortRank(b.source)
        if (bySource !== 0) {
          return bySource
        }

        return String(a.name ?? a.label ?? '').localeCompare(String(b.name ?? b.label ?? ''))
      })
  })

  const availableRedisConfigs = computed((): Array<SelectItem<string>> | SelectEntry[] => {
    if (!isKonnectManagedRedisEnabled) {
      return legacyFlatItems.value
    }

    const items = managedRedisConfigItems.value
    const konnectManagedItems = items.filter((item) => item.source === 'konnect-managed')
    const selfManagedItems = items.filter((item) => item.source === 'self-managed')
    const ungroupedItems = items.filter((item) => !item.source)
    const groups: SelectEntry[] = []

    if (konnectManagedItems.length > 0) {
      groups.push({
        label: t('list.source.konnect_managed'),
        items: konnectManagedItems,
      })
    }

    if (selfManagedItems.length > 0) {
      groups.push({
        label: t('list.source.self_managed'),
        items: selfManagedItems,
      })
    }

    return [...groups, ...ungroupedItems]
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
