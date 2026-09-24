import { describe, it, expect } from 'vitest'
import { useChartTooltip } from './useChartTooltip'
import type { ChartTooltipContent } from '../types'

describe('useChartTooltip', () => {
  it('renders ChartTooltip synchronously, so ECharts can measure it right away', () => {
    const content: ChartTooltipContent = () => ({ title: 'Jun 16', rows: [{ color: '#ff0000', label: 'gpt-4o', value: '12.5%' }] })
    const formatter = useChartTooltip(() => content)

    const element = formatter({} as any) as HTMLElement

    expect(element.querySelector('.title')?.textContent?.trim()).toBe('Jun 16')
    expect(element.querySelector('.display-value')?.textContent).toBe('12.5%')
  })

  it('updates the same element for the next hovered item', () => {
    const formatter = useChartTooltip(() => (params: any) => ({ title: params.name }))

    const first = formatter({ name: 'Jun 16' } as any) as HTMLElement
    const second = formatter({ name: 'Jun 17' } as any) as HTMLElement

    expect(second).toBe(first)
    expect(second.querySelector('.title')?.textContent?.trim()).toBe('Jun 17')
  })

  it('returns an empty tooltip without content', () => {
    expect(useChartTooltip(() => undefined)({} as any)).toBe('')
  })
})
