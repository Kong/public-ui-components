import { describe, expect, it } from 'vitest'
import type { ApiRequestsResult, ExploreResultV4, PlatformTabularResponse } from '@kong-ui-public/analytics-utilities'
import { TILE_DATA_EMPTY, TILE_DATA_LOADING } from '../constants'
import type { SuppliedTileData } from '../types'
import { isApiRequestsResult, isExploreResultV4, isPlatformTabularResponse, resolveSuppliedData } from './supplied-tile-data'

const exploreResult = { data: [], meta: {} } as unknown as ExploreResultV4
const tabularResponse = { records: [], meta: {} } as unknown as PlatformTabularResponse
const requestsResult = { results: [], meta: {} } as unknown as ApiRequestsResult

const resolveExplore = (supplied: SuppliedTileData) => resolveSuppliedData({
  supplied,
  isExpected: isExploreResultV4,
  mismatchMessage: 'mismatch',
})

describe('resolveSuppliedData', () => {
  it('maps TILE_DATA_LOADING, TILE_DATA_EMPTY, and an Error to the loading, empty, and error states', () => {
    expect(resolveExplore(TILE_DATA_LOADING)).toEqual({ status: 'loading' })
    expect(resolveExplore(TILE_DATA_EMPTY)).toEqual({ status: 'empty' })
    expect(resolveExplore(new Error('boom'))).toEqual({ status: 'error', message: 'boom' })
  })

  it('returns the data when its shape matches the tile type', () => {
    expect(resolveExplore(exploreResult)).toEqual({ status: 'success', data: exploreResult })
  })

  it('returns the mismatch error when the shape does not match the tile type', () => {
    expect(resolveExplore(tabularResponse)).toEqual({ status: 'error', message: 'mismatch' })
  })
})

describe('supplied data shape checks', () => {
  it('tells the three response shapes apart', () => {
    expect([exploreResult, tabularResponse, requestsResult].map(isExploreResultV4)).toEqual([true, false, false])
    expect([exploreResult, tabularResponse, requestsResult].map(isPlatformTabularResponse)).toEqual([false, true, false])
    expect([exploreResult, tabularResponse, requestsResult].map(isApiRequestsResult)).toEqual([false, false, true])
  })

  it('rejects a list without a meta object', () => {
    expect(isExploreResultV4({ data: [] })).toBe(false)
    expect(isExploreResultV4({ data: [], meta: [] })).toBe(false)
    expect(isExploreResultV4({ data: {}, meta: {} })).toBe(false)
  })
})
