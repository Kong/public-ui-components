import { describe, it, expect } from 'vitest'
import { zDashboardConfig } from '@kong-ui-public/analytics-utilities'

const validate = (data: unknown) => {
  const result = zDashboardConfig.safeParse(data)
  return result
}

describe('Dashboard schemas', () => {
  it('successfully validates bar chart schemas', () => {
    const definition: any = {
      tiles: [
        {
          type: 'chart',
          definition: {
            chart: {
              type: 'horizontal_bar',
            },
            query: {
              datasource: 'basic',
            },
          },
          layout: {
            position: {
              col: 1,
              row: 1,
            },
            size: {
              cols: 1,
              rows: 1,
            },
          },
        },
      ],
    }
    expect(validate(definition).success).toBe(true)
  })

  it('successfully validates gauge chart schemas', () => {
    const definition: any = {
      tiles: [
        {
          type: 'chart',
          definition: {
            chart: {
              type: 'gauge',
              metric_display: 'full',
              reverse_dataset: true,
              numerator: 0,
            },
            query: {
              datasource: 'basic',
            },
          },
          layout: {
            position: {
              col: 1,
              row: 1,
            },
            size: {
              cols: 1,
              rows: 1,
            },
          },
        },
      ],
    }

    expect(validate(definition).success).toBe(true)
  })

  it('rejects bad gauge chart schemas', () => {
    const definition1: any = {
      tiles: [
        {
          type: 'chart',
          chart: {
            type: 'gauge',
            blah: 'arrgh',
          },
          query: {},
        },
      ],
    }

    expect(validate(definition1).success).toBe(false)

    const definition2: any = {
      tiles: [
        {
          chart: {
            type: 'gauge',
            metricDisplay: 'arrgh',
          },
          query: {},
        },
      ],
    }

    expect(validate(definition2).success).toBe(false)
  })
})
