import { describe, it, expect } from 'vitest'
import Ajv from 'ajv'
import { dashboardConfigSchema } from '@kong-ui-public/analytics-utilities'

const ajv = new Ajv({ allowUnionTypes: true })
const validate = ajv.compile(dashboardConfigSchema)

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

    expect(validate(definition)).toBe(true)
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

    expect(validate(definition)).toBe(true)
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

    expect(validate(definition1)).toBe(false)

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

    expect(validate(definition2)).toBe(false)

    // Note: Error messages aren't great right now because FromSchema doesn't understand
    // the `discriminator` field, and AJV has limited support for it.
  })
})
