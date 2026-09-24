import { describe, it, expect } from 'vitest'
import { mergeChartOption } from './mergeChartOption'

describe('mergeChartOption', () => {
  it('deep-merges nested plain objects like deepMerge', () => {
    const base = { tooltip: { trigger: 'axis' }, grid: { top: 40 } }
    const merged = mergeChartOption(base, { grid: { top: 20, left: 10 } })

    expect(merged).toEqual({ tooltip: { trigger: 'axis' }, grid: { top: 20, left: 10 } })
  })

  it('merges the series array by index, keeping generated series data', () => {
    const base = { series: [{ type: 'heatmap', data: [[0, 0, 1]], label: { show: false } }] }
    const merged = mergeChartOption(base, { series: [{ label: { show: true } }] })

    expect(merged.series).toEqual([{ type: 'heatmap', data: [[0, 0, 1]], label: { show: true } }])
  })

  it('keeps base series entries that have no corresponding override entry', () => {
    const base = { series: [{ name: 'a', data: [1] }, { name: 'b', data: [2] }] }
    const merged = mergeChartOption(base, { series: [{ name: 'a2' }] })

    expect(merged.series).toEqual([{ name: 'a2', data: [1] }, { name: 'b', data: [2] }])
  })

  it('appends override series entries beyond the base length', () => {
    const base = { series: [{ name: 'a' }] }
    const merged = mergeChartOption(base, { series: [{ name: 'a2' }, { name: 'c' }] })

    expect(merged.series).toEqual([{ name: 'a2' }, { name: 'c' }])
  })

  it('falls back to array-replace semantics when only one side has a series array', () => {
    const base = { series: [{ name: 'a' }] }
    const merged = mergeChartOption(base, { grid: { top: 10 } })

    expect(merged.series).toEqual([{ name: 'a' }])
    expect(merged.grid).toEqual({ top: 10 })
  })

  it('returns a copy without mutating the base option', () => {
    const base = { series: [{ name: 'a', data: [1] }] }
    mergeChartOption(base, { series: [{ name: 'a2' }] })

    expect(base.series).toEqual([{ name: 'a', data: [1] }])
  })

  it('returns the base option untouched when there is no override', () => {
    const base = { series: [{ name: 'a' }] }

    expect(mergeChartOption(base)).toEqual(base)
  })
})
