import { describe, it, expect } from 'vitest'
import useFetchUrlBuilder from '../useFetchUrlBuilder'

import type { FetcherParams, KongManagerConfig, KonnectConfig } from 'src/types'

describe('useFetchUrlBuilder()', () => {
  it('should apply correct query schema for kongManager when isExactMatch is not activated', () => {
    const config = {
      apiBaseUrl: '/',
      app: 'kongManager',
      workspace: 'default',
      isExactMatch: false,
    } as KongManagerConfig

    const builder = useFetchUrlBuilder(config, 'http://foo.bar/entity')

    const query: FetcherParams = {
      page: 1,
      pageSize: 10,
      offset: 0,
      sortColumnKey: 'name',
      sortColumnOrder: 'asc',
      query: 'name=baz',
    }

    expect(builder(query)).toBe('http://foo.bar/entity?name=baz&sort_by=name&size=10')
  })

  it('should apply correct query schema for kongManager when isExactMatch activated', () => {
    const config = {
      apiBaseUrl: '/',
      app: 'kongManager',
      workspace: 'default',
      isExactMatch: true,
    } as KongManagerConfig

    const builder = useFetchUrlBuilder(config, 'http://foo.bar/entity')

    const query: FetcherParams = {
      page: 1,
      pageSize: 10,
      offset: 0,
      sortColumnKey: 'name',
      sortColumnOrder: 'asc',
      query: 'testQuery',
    }

    expect(builder(query)).toBe('http://foo.bar/entity/testQuery/')
  })

  it('should apply correct query schema for konnect when isExactMatch is not activated', () => {
    const config = {
      apiBaseUrl: '/',
      app: 'konnect',
      controlPlaneId: 'default',
    } as KonnectConfig

    const builder = useFetchUrlBuilder(config, 'http://foo.bar/entity')

    const query: FetcherParams = {
      page: 1,
      pageSize: 10,
      offset: 0,
      sortColumnKey: 'name',
      sortColumnOrder: 'asc',
      query: 'testQuery',
    }

    expect(builder(query)).toBe('http://foo.bar/entity?filter[name][contains]=testQuery')
  })

  it('should apply correct query schema for konnect when isExactMatch activated', () => {
    const config = {
      apiBaseUrl: '/',
      app: 'konnect',
      controlPlaneId: 'default',
      isExactMatch: true,
    } as KonnectConfig

    const builder = useFetchUrlBuilder(config, 'http://foo.bar/entity')

    const query: FetcherParams = {
      page: 1,
      pageSize: 10,
      offset: 0,
      sortColumnKey: 'name',
      sortColumnOrder: 'asc',
      query: 'testQuery',
    }

    expect(builder(query)).toBe('http://foo.bar/entity/testQuery/')
  })
})
