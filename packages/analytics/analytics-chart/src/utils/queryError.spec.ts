import { describe, it, expect } from 'vitest'

import { handleQueryError } from './queryError'

describe('handleQueryError', () => {
  it('403 to forbidden', () => {
    const res = handleQueryError({ status: 403 })

    expect(res).toMatchObject({ type: 'forbidden', status: 403 })
    expect(res).toHaveProperty('message')
    expect(res).toHaveProperty('details')
  })

  it('408 to timeout', () => {
    const res = handleQueryError({ status: 408 })

    expect(res).toMatchObject({ type: 'timeout', status: 408 })
    expect(res).toHaveProperty('message')
    expect(res).toHaveProperty('details')
  })

  it('tier message to range_exceeded', () => {
    const res = handleQueryError({
      status: 400,
      response: { data: { message: 'Range not allowed for this tier' } },
    })

    expect(res).toMatchObject({ type: 'range_exceeded', status: 400 })
    expect(res).toHaveProperty('message')
    expect(res).toHaveProperty('details')
  })

  it('invalid_parameters to other (joins reasons)', () => {
    const res = handleQueryError({
      status: 400,
      response: {
        data: {
          invalid_parameters: [
            { field: 'foo', reason: 'bar' },
            { field: 'bat', reason: 'baz' },
          ],
        },
      },
    })

    expect(res).toMatchObject({ type: 'other', status: 400 })
    expect(res.message).toBe('Bad request')
    expect(res.details).toBe('bar, baz')
  })

  it('fallback to other (uses error.message)', () => {
    const res = handleQueryError({
      status: 500,
      message: 'fallback details',
      response: { data: {} },
    })

    expect(res).toMatchObject({ type: 'other', status: 500 })
    expect(res.message).toBe('Bad request')
    expect(res.details).toBe('fallback details')
  })
})
