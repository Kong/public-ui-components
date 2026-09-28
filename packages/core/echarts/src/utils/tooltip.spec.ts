import { describe, it, expect } from 'vitest'
import { categoryLabel, tooltipItems, tooltipRow } from './tooltip'

describe('tooltip helpers', () => {
  it('tooltipItems lists the hovered items for item and axis triggers', () => {
    const item = { seriesName: 'A' } as any

    expect(tooltipItems(item)).toEqual([item])
    expect(tooltipItems([item, item])).toEqual([item, item])
  })

  it('categoryLabel resolves an index into the labels, and keeps names as-is', () => {
    expect(categoryLabel(1, ['Mon', 'Tue'])).toBe('Tue')
    expect(categoryLabel('Wed', ['Mon', 'Tue'])).toBe('Wed')
    // Falls back to the index when there's no label for it
    expect(categoryLabel(5, ['Mon'])).toBe('5')
  })

  it('tooltipRow uses the item color and formats the value', () => {
    expect(tooltipRow({ color: '#ff0000' } as any, 'gpt-4o', 12.34, (value) => `${value.toFixed(1)}%`)).toEqual({
      color: '#ff0000',
      label: 'gpt-4o',
      value: '12.3%',
    })
    // Non-string colors (e.g. gradients) get no marker color, and values fall back to String()
    expect(tooltipRow({ color: { type: 'linear' } } as any, 'A', 7)).toEqual({ color: undefined, label: 'A', value: '7' })
  })
})
