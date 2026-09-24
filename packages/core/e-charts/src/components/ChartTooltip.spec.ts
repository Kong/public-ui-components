import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ChartTooltip from './ChartTooltip.vue'

describe('<ChartTooltip />', () => {
  it('renders the title and a row per value', () => {
    const wrapper = mount(ChartTooltip, {
      props: {
        title: 'Jun 16',
        rows: [
          { color: '#ff0000', label: 'gpt-4o', value: '12.5%' },
          { color: '#00ff00', label: 'claude-sonnet-4', value: '4.1%' },
        ],
      },
    })

    expect(wrapper.find('.title').text()).toBe('Jun 16')

    const rows = wrapper.findAll('li')

    expect(rows).toHaveLength(2)
    expect(rows[0].find('.display-label').text()).toBe('gpt-4o')
    expect(rows[0].find('.display-value').text()).toBe('12.5%')
    expect(rows[0].find('.square-marker').attributes('style')).toContain('background: rgb(255, 0, 0)')
  })

  it('shows the subtitle only with a context or metric', () => {
    expect(mount(ChartTooltip, { props: { title: 'Jun 16' } }).find('.subtitle').exists()).toBe(false)

    const wrapper = mount(ChartTooltip, { props: { title: 'Jun 16', context: 'Model', metric: 'Error rate' } })

    expect(wrapper.find('.subtitle .context').text()).toBe('Model')
    expect(wrapper.find('.subtitle .metric').text()).toBe('Error rate')
  })
})
