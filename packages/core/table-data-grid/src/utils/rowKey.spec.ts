import { describe, expect, it } from 'vitest'
import { getRowKeyValue } from './rowKey'

describe('rowKey utils', () => {
  it('coerces row key values to AG Grid string ids', () => {
    expect(getRowKeyValue({ id: 123, name: 'Gateway' }, 'id')).toBe('123')
  })

  it('uses an empty string for missing row key values', () => {
    expect(getRowKeyValue({ id: null, name: 'Gateway' }, 'id')).toBe('')
  })
})
