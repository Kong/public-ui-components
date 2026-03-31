import type { AxiosInstance } from 'axios'
import { isAxiosError } from 'axios'
import type { AddOnRecord, ManagedCacheAddOn } from '../types/cloud-gateways-add-on'
import type { RedisConfigurationResponse } from '../types/redis-configuration'
import { PartialType } from '../types/redis-configuration'
import { isManagedCacheAddOn, parseManagedAddOn, parseManagedAddOnDetailPayload } from './managed-cache-add-on-parse'

/**
 * API helpers for konnect-managed cache add-ons.
 * One place for add-on and partial fetches used by list + detail
 * Return `null` for not-found cases so host can safely fall back
 */

// Cloud Gateways list endpoint page size
const ADD_ONS_PAGE_SIZE = 100
// Safety limit if pagination metadata is broken
const MAX_ADD_ON_PAGES_FALLBACK = 1000

// Expected response shape is stable, but values are still validated before use
const isPlainObject = (value: unknown): value is AddOnRecord =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

// List endpoint may return partial/malformed payloads; parse from unknown
const extractListMeta = (payload: unknown): { items: unknown[], totalPages?: number } => {
  if (!isPlainObject(payload)) return { items: [] }

  const items = Array.isArray(payload.data) ? payload.data as unknown[] : []
  if (!isPlainObject(payload.meta) || !isPlainObject(payload.meta.page)) return { items }

  const totalPages = payload.meta.page.total_pages
  return {
    items,
    totalPages: typeof totalPages === 'number' && Number.isFinite(totalPages) ? totalPages : undefined,
  }
}

export const fetchManagedCacheAddOnById = async (
  axiosInstance: AxiosInstance,
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
  axiosInstance: AxiosInstance,
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

    const { items, totalPages } = extractListMeta(data)
    // Parse raw rows and drop invalid entries
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
  axiosInstance: AxiosInstance,
  apiBaseUrl: string,
  controlPlaneId: string,
  partialId: string,
): Promise<RedisConfigurationResponse | null> => {
  // Same partial-by-id endpoint used by list + detail flows
  const url = `${apiBaseUrl}/v2/control-planes/${encodeURIComponent(controlPlaneId)}/core-entities/partials/${encodeURIComponent(partialId)}`

  try {
    const { data } = await axiosInstance.get(url)
    const unwrapped = (data?.data ?? data) as unknown
    const entityFromResponse = Array.isArray(unwrapped) ? unwrapped[0] : unwrapped
    if (!isPlainObject(entityFromResponse)) return null

    const maybe = entityFromResponse as RedisConfigurationResponse
    return maybe.type === PartialType.REDIS_CE || maybe.type === PartialType.REDIS_EE ? maybe : null
  } catch (error: any) {
    if (isAxiosError(error) && error.response?.status === 404) return null
    throw error
  }
}
