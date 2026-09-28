import { describe, it, expect } from 'vitest'
import { defaultTooltipContent, useChartTooltip } from './useChartTooltip'

describe('useChartTooltip', () => {
  it('renders ChartTooltip synchronously, so ECharts can measure it right away', () => {
    const formatter = useChartTooltip(() => () => ({ title: 'Jun 16', rows: [{ color: '#ff0000', label: 'gpt-4o', value: '12.5%' }] }))

    const element = formatter({} as any)

    expect(element.querySelector('.title')?.textContent?.trim()).toBe('Jun 16')
    expect(element.querySelector('.display-value')?.textContent).toBe('12.5%')
  })

  it('updates the same element for the next hovered item', () => {
    const formatter = useChartTooltip(() => (params: any) => ({ title: params.name }))

    const first = formatter({ name: 'Jun 16' } as any)
    const second = formatter({ name: 'Jun 17' } as any)

    expect(second).toBe(first)
    expect(second.querySelector('.title')?.textContent?.trim()).toBe('Jun 17')
  })

  it('falls back to the default content', () => {
    const formatter = useChartTooltip(() => undefined)
    const element = formatter({ name: 'Jun 16', seriesName: 'openai', color: '#ff0000', value: 1417 } as any)

    expect(element.querySelector('.context')?.textContent?.trim()).toBe('Jun 16')
    expect(element.querySelector('.display-value')?.textContent).toBe('1417')
  })
})

describe('defaultTooltipContent', () => {
  it('shows a row for the hovered item', () => {
    expect(defaultTooltipContent({ name: 'Jun 16', seriesName: 'Requests', color: '#ff0000', value: 12 } as any)).toEqual({
      context: 'Jun 16',
      rows: [{ color: '#ff0000', label: 'Requests', value: '12' }],
    })
  })

  it('shows a row per series for axis tooltips, using the last value of multi-dimensional data', () => {
    const content = defaultTooltipContent([
      { axisValueLabel: 'Mon', seriesName: 'A', color: '#111111', value: [0, 5] },
      { axisValueLabel: 'Mon', seriesName: 'B', color: '#222222', value: [0, 7] },
    ] as any)

    expect(content).toEqual({
      context: 'Mon',
      rows: [
        { color: '#111111', label: 'A', value: '5' },
        { color: '#222222', label: 'B', value: '7' },
      ],
    })
  })
})
