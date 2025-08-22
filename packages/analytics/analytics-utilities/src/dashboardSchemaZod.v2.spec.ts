import { describe, expect, it } from 'vitest'
import { zDashboardConfig } from './dashboardSchemaZod.v2'
import type { DashboardConfig } from './dashboardSchemaZod.v2'

describe('Dashboard schemas', () => {
  it('successfully validates dashboard config schema', () => {
    const definition: DashboardConfig = {
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
    const result = zDashboardConfig.safeParse(definition)

    expect(result.success).toBe(true)
  })

  it('dashboard validation fails for dashboard with invalid filter', () => {
    const definition: DashboardConfig = {
      tiles: [
        {
          type: 'chart',
          definition: {
            chart: {
              type: 'horizontal_bar',
            },
            query: {
              datasource: 'api_usage',
              filters: [
                {
                  field: 'invalid_dimension',
                  operator: 'in',
                  value: ['value'],
                },
              ],
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
    const result = zDashboardConfig.safeParse(definition)

    expect(result.success).toBe(false)
    expect(result.error?.issues).toHaveLength(1)
    expect(result.error?.issues[0].code).toBe('invalid_value')
    expect(result.error?.issues[0].message).toContain('Invalid option')
    expect(result.error?.issues[0].path).toEqual(['tiles', 0, 'definition', 'query', 'filters', 0, 'field'])
  })
})
