import { it, expect } from 'vitest'
import { formatISOTimeWithTZ } from './format'
import { runNonUtcTest, runUtcTest } from './specUtils'

runNonUtcTest('date formatting, non-UTC', () => {
  it('formatISOTimeWithTZ should work', () => {
    const pattern = /20\d{2}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d\d\d[+-]\d\d?:\d\d/
    const date = new Date('2021-01-01T06:02:03.000Z')
    expect(formatISOTimeWithTZ(date)).toMatch(pattern)
    expect(formatISOTimeWithTZ(date)).toMatch(pattern)
  })
})

runUtcTest('date formatting in UTC', () => {
  it('formatISOTimeWithTZ should work', () => {
    const str = '2020-01-01T01:02:03.000Z'
    const date = new Date(str)
    expect(formatISOTimeWithTZ(date)).toBe(str)
    expect(formatISOTimeWithTZ(date)).toBe(str)
  })
})
