import { isAxiosError } from 'axios'
import type { CloudGatewaysListAddOnsResponse, ManagedCacheAddOn } from '../types/cloud-gateways-add-on'
import type { RedisConfigurationResponse } from '../types/redis-configuration'
import { PartialType } from '../types/redis-configuration'
import { isManagedCacheAddOn, parseManagedAddOn, parseManagedAddOnDetailPayload } from './managed-cache-add-on-parse'

/** Konnect managed redis add-on + partial fetches. Returns null when not found */

const ADD_ONS_PAGE_SIZE = 100
const MAX_ADD_ON_PAGES_FALLBACK = 1000

// Only `get` is used, narrow type keeps mocks simple and reduces Axios's generic `get` issue
type ManagedCacheApiClient = {
  get: (url: string, config?: { params?: Record<string, unknown> }) => Promise<{ data: unknown }>
}

const extractListMeta = (
  payload: CloudGatewaysListAddOnsResponse,
): { items: CloudGatewaysListAddOnsResponse['data'], totalPages?: number } => {
  const totalPages = payload.meta?.page?.total_pages
  return {
    items: payload.data,
    totalPages: typeof totalPages === 'number' && Number.isFinite(totalPages) ? totalPages : undefined,
  }
}

export const fetchManagedCacheAddOnById = async (
  axiosInstance: ManagedCacheApiClient,
  cloudGatewaysBase: string,
  addOnId: string,
  controlPlaneId: string,
): Promise<ManagedCacheAddOn | null> => {
  // Direct add-on lookup by id
  const url = `${cloudGatewaysBase}/v2/cloud-gateways/add-ons/${encodeURIComponent(addOnId)}`

  try {
    const { data } = await axiosInstance.get(url)
    const parsed = parseManagedAddOnDetailPayload(data)
    if (parsed === null || !isManagedCacheAddOn(parsed)) return null

    const addOnControlPlaneId = parsed.owner?.control_plane_id
    if (addOnControlPlaneId != null && addOnControlPlaneId !== controlPlaneId) return null

    return parsed
  } catch (error: any) {
    if (isAxiosError(error) && error.response?.status === 404) return null

    throw error
  }
}

export const fetchAllManagedCacheAddOns = async (
  axiosInstance: ManagedCacheApiClient,
  cloudGatewaysBase: string,
  controlPlaneId: string,
  controlPlaneGeo?: string,
): Promise<ManagedCacheAddOn[]> => {
  // Paginated add-ons list scoped to cp
  const addOnsUrl = `${cloudGatewaysBase}/v2/cloud-gateways/add-ons`
  const allAddOns: ManagedCacheAddOn[] = []
  let pageNumber = 1
  let totalPagesFromMeta: number | null = null

  while (pageNumber <= MAX_ADD_ON_PAGES_FALLBACK) {
    const { data } = await axiosInstance.get(addOnsUrl, {
      params: {
        'page[size]': ADD_ONS_PAGE_SIZE,
        'page[number]': pageNumber,
        'config.kind': 'managed-cache.v0',
        'owner.control_plane_id': controlPlaneId,
        ...(controlPlaneGeo ? { 'owner.control_plane_geo': controlPlaneGeo } : {}),
      },
    })

    const { items, totalPages } = extractListMeta(data as CloudGatewaysListAddOnsResponse)
    const pageItems = items
      .map((item) => parseManagedAddOn(item))
      .filter((row): row is ManagedCacheAddOn => row !== null)
    allAddOns.push(...pageItems)

    if (typeof totalPages === 'number' && Number.isFinite(totalPages) && totalPages > 0) {
      totalPagesFromMeta = totalPages
    }

    // Stop at known total pages, or when page is short
    if ((totalPagesFromMeta !== null && pageNumber >= totalPagesFromMeta) || items.length < ADD_ONS_PAGE_SIZE) {
      break
    }

    pageNumber++
  }

  return allAddOns
}

export const fetchRedisPartialForConfigCard = async (
  axiosInstance: ManagedCacheApiClient,
  apiBaseUrl: string,
  controlPlaneId: string,
  partialId: string,
): Promise<RedisConfigurationResponse | null> => {
  // Same partial-by-id endpoint used by list + detail flows
  const url = `${apiBaseUrl}/v2/control-planes/${encodeURIComponent(controlPlaneId)}/core-entities/partials/${encodeURIComponent(partialId)}`

  try {
    const { data } = await axiosInstance.get(url)
    const maybe = (data as { data?: RedisConfigurationResponse }).data

    if (maybe == null) return null
    return maybe.type === PartialType.REDIS_CE || maybe.type === PartialType.REDIS_EE ? maybe : null
  } catch (error: any) {
    if (isAxiosError(error) && error.response?.status === 404) return null
    throw error
  }
}
