import type {
  ApiRequestsResult,
  ExploreResultV4,
  PlatformTabularResponse,
} from '@kong-ui-public/analytics-utilities'
import type { SuppliedTileData, TileData } from '../types'

/** The state a tile loader shows for host-supplied data. */
export type SuppliedDataState<T extends TileData> =
  | { status: 'loading' }
  | { status: 'empty' }
  | { status: 'error', message: string }
  | { status: 'success', data: T }

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

// Checks only the top-level shape: an array under `listKey` and a `meta` object.
const hasListAndMeta = (value: unknown, listKey: string): boolean =>
  isRecord(value) && Array.isArray(value[listKey]) && isRecord(value.meta)

export const isExploreResultV4 = (value: unknown): value is ExploreResultV4 => hasListAndMeta(value, 'data')

export const isPlatformTabularResponse = (value: unknown): value is PlatformTabularResponse => hasListAndMeta(value, 'records')

export const isApiRequestsResult = (value: unknown): value is ApiRequestsResult => hasListAndMeta(value, 'results')

/**
 * Maps host-supplied tile data to the state a tile loader shows.
 *
 * @param options - Resolver options.
 * @param options.supplied - The host-supplied data wrapper.
 * @param options.isExpected - Checks that the data has the shape this tile type renders.
 * @param options.mismatchMessage - Error message when the data has the wrong shape.
 * @returns `loading` for `undefined`, `empty` for `null`, `error` for an `Error` or a shape mismatch, otherwise `success`.
 */
export const resolveSuppliedData = <T extends TileData>({
  supplied,
  isExpected,
  mismatchMessage,
}: {
  supplied: SuppliedTileData
  isExpected: (value: unknown) => value is T
  mismatchMessage: string
}): SuppliedDataState<T> => {
  const { value } = supplied

  if (value === undefined) {
    return { status: 'loading' }
  }

  if (value === null) {
    return { status: 'empty' }
  }

  if (value instanceof Error) {
    return { status: 'error', message: value.message }
  }

  if (!isExpected(value)) {
    return { status: 'error', message: mismatchMessage }
  }

  return { status: 'success', data: value }
}
