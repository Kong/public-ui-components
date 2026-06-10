import type { TableDataGridFetcherParams } from './index'
import { describe, expect, it } from 'vitest'

describe('TableDataGridFetcherParams', () => {
  it('allows cursor-only infinite request params', () => {
    const params = {
      cursor: 'next-cursor',
      mode: 'infinite',
      pageSize: 25,
    } satisfies TableDataGridFetcherParams

    expect(params).toEqual({
      cursor: 'next-cursor',
      mode: 'infinite',
      pageSize: 25,
    })
  })

  it('allows offset-only infinite request params', () => {
    const params = {
      mode: 'infinite',
      offset: 25,
      pageSize: 25,
    } satisfies TableDataGridFetcherParams

    expect(params).toEqual({
      mode: 'infinite',
      offset: 25,
      pageSize: 25,
    })
  })

  it('does not allow mixed cursor and offset request params', () => {
    const params = {
      cursor: 'next-cursor',
      mode: 'infinite',
      offset: 25,
      pageSize: 25,
    } as const
    // @ts-expect-error cursor and offset are alternative positioning models.
    const typedParams: TableDataGridFetcherParams = params

    expect(typedParams).toEqual({
      cursor: 'next-cursor',
      mode: 'infinite',
      offset: 25,
      pageSize: 25,
    })
  })
})
