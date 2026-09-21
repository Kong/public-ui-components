import { ref } from 'vue'
import type { AxiosInstance } from 'axios'
import endpoints from '../plugins-endpoints'
import type { KongManagerPluginEntityConfig, KonnectPluginEntityConfig } from '../types'

// Plugin association fields whose API value is only `{ id }` - the display name must be fetched separately.
// Add an entry here whenever Kong adds a new entity type plugins can reference (e.g. key, key-set).
export type ReferenceField = 'service' | 'route' | 'consumer' | 'consumer_group'

const REFERENCE_FIELD_CONFIG: Record<ReferenceField, { entityType: string, nameField: string }> = {
  service: { entityType: 'services', nameField: 'name' },
  route: { entityType: 'routes', nameField: 'name' },
  consumer: { entityType: 'consumers', nameField: 'username' },
  consumer_group: { entityType: 'consumer_groups', nameField: 'name' },
}

interface UseReferenceEntityNamesOptions {
  config: KonnectPluginEntityConfig | KongManagerPluginEntityConfig
  axiosInstance: AxiosInstance
  onError: (error: any) => void
}

export function useReferenceEntityNames({ config, axiosInstance, onError }: UseReferenceEntityNamesOptions) {
  const names = ref<Partial<Record<ReferenceField, string>>>({})
  const loading = ref<Partial<Record<ReferenceField, boolean>>>({})

  const buildUrl = (entityType: string, id: string): string => {
    let url = `${config.apiBaseUrl}${endpoints.form[config.app].entityGetOne}`

    if (config.app === 'konnect') {
      url = url.replace(/{controlPlaneId}/gi, config?.controlPlaneId || '')
    }

    return url
      .replace(/\/{workspace}/gi, config?.workspace ? `/${config.workspace}` : '')
      .replace(/{entity}/gi, entityType)
      .replace(/{id}/gi, id)
  }

  const fetchReferenceName = async (field: ReferenceField, id: string): Promise<void> => {
    const { entityType, nameField } = REFERENCE_FIELD_CONFIG[field]

    loading.value[field] = true

    try {
      const { data } = await axiosInstance.get(buildUrl(entityType, id))

      names.value[field] = data?.[nameField] || ''
    } catch (err: any) {
      onError(err)
    } finally {
      loading.value[field] = false
    }
  }

  /** Fetches the display name for every reference field present (as `{ id }`) on the given plugin entity. */
  const resolveReferenceNames = (entity: Record<string, any>): void => {
    (Object.keys(REFERENCE_FIELD_CONFIG) as ReferenceField[]).forEach((field) => {
      const id = entity?.[field]?.id

      if (id) {
        fetchReferenceName(field, id)
      }
    })
  }

  /** The resolved display name for a reference field, once available - undefined until the lookup completes. */
  const getReferenceName = (field: ReferenceField): string | undefined => names.value[field] || undefined

  const isReferenceNameLoading = (field: ReferenceField): boolean => !!loading.value[field]

  return {
    resolveReferenceNames,
    getReferenceName,
    isReferenceNameLoading,
  }
}
