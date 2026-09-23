import Ajv from 'ajv'
import { describe, expect, it } from 'vitest'
import { dashboardConfigSchema, topTalkersSchema } from './dashboardSchema.v2'

const ajv = new Ajv({ allowUnionTypes: true })
const validateTopTalkers = ajv.compile(topTalkersSchema)
const validateDashboardConfig = ajv.compile(dashboardConfigSchema)

const overviewTile = {
  type: 'chart',
  layout: { position: { col: 0, row: 1 }, size: { cols: 6, rows: 2 } },
  definition: {
    chart: {
      type: 'top_talkers',
      chart_title: 'Top 5 consumers by request',
      size_metric: 'ai_request_count',
      columns: [
        { dimension: 'ai_gateway_model', label: 'Models' },
        { dimension: 'ai_provider', label: 'Providers' },
        { dimension: 'ai_gateway_agent', label: 'Agents' },
        { dimension: 'ai_gateway_consumer', label: 'Users' },
        { dimension: 'ai_gateway_mcp_server', label: 'MCP servers' },
      ],
      column_options: {
        error_rate: { label: 'Error rate', thresholds: [{ type: 'warning', value: 5 }, { type: 'error', value: 15 }] },
        llm_latency_average: { label: 'LLM latency' },
        cost: { label: 'Cost' },
      },
    },
    query: {
      metrics: ['ai_request_count', 'error_rate', 'llm_latency_average', 'cost'],
      filters: [],
      datasource: 'llm_usage',
      limit: 5,
    },
  },
}

describe('top_talkers schema', () => {
  it('accepts the OverviewDash tile definition', () => {
    const ok = validateDashboardConfig({ tile_height: 167, tiles: [overviewTile] })

    // Assert on the errors first -- a bare `false` tells you nothing about why.
    expect(validateDashboardConfig.errors ?? []).toEqual([])
    expect(ok).toBe(true)
  })

  it('requires columns', () => {
    expect(validateTopTalkers({ type: 'top_talkers' })).toBe(false)
  })

  it('rejects unknown chart options', () => {
    expect(validateTopTalkers({ type: 'top_talkers', columns: [{ dimension: 'x' }], bogus: 1 })).toBe(false)
  })

  it('rejects a column without a dimension', () => {
    expect(validateTopTalkers({ type: 'top_talkers', columns: [{ label: 'Models' }] })).toBe(false)
  })

  it('rejects unknown column options', () => {
    expect(validateTopTalkers({ type: 'top_talkers', columns: [{ dimension: 'ai_provider', filterable: false }] })).toBe(false)
  })
})
