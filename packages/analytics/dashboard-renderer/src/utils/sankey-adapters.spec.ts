import type { ExploreResultV4 } from '@kong-ui-public/analytics-utilities'

import { afterEach, describe, expect, it, vi } from 'vitest'
import { exploreResultToSankey, isSankeyCompatible } from './sankey-adapters'

const OTHER = '____OTHER____'

const buildResult = (
  records: Array<[model: string, consumer: string, requests: number | null]>,
  { metric = 'ai_request_count', withOther = false }: { metric?: string, withOther?: boolean } = {},
): ExploreResultV4 => ({
  data: records.map(([model, consumer, requests]) => ({
    timestamp: '2026-11-11T00:00:00Z',
    event: { ai_gateway_model: model, oidc_credential: consumer, [metric]: requests },
  })),
  meta: {
    start: '2026-11-11T00:00:00Z',
    end: '2026-11-18T00:00:00Z',
    granularity_ms: 604800000,
    query_id: 'query',
    metric_names: [metric] as ExploreResultV4['meta']['metric_names'],
    display: {
      ai_gateway_model: Object.fromEntries(records.map(([model]) => [model, { name: model.toUpperCase() }])),
      oidc_credential: {
        ...Object.fromEntries(records.map(([, consumer]) => [consumer, { name: consumer }])),
        ...(withOther ? { [OTHER]: { name: OTHER, is_other_group: true } } : {}),
      },
    },
  },
})

/** Nodes as `[id, name, depth, value]`, without their colors */
const nodeSummary = (result: ReturnType<typeof exploreResultToSankey>) => (
  result?.nodes.map(({ id, name, depth, value }) => [id, name, depth, value])
)

/** Links as `source -> target: value` */
const linkSummary = (result: ReturnType<typeof exploreResultToSankey>) => (
  result?.links.map(({ source, target, value }) => `${source} -> ${target}: ${value}`)
)

describe('exploreResultToSankey', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('links first-dimension nodes to second-dimension nodes, named from the display', () => {
    const sankey = exploreResultToSankey(buildResult([
      ['gpt', 'alex', 30],
      ['gpt', 'sam', 10],
      ['claude', 'sam', 20],
    ]))

    expect(nodeSummary(sankey)).toEqual([
      ['ai_gateway_model:gpt', 'GPT', 0, 40],
      ['ai_gateway_model:claude', 'CLAUDE', 0, 20],
      ['oidc_credential:alex', 'alex', 1, undefined],
      ['oidc_credential:sam', 'sam', 1, undefined],
    ])
    expect(linkSummary(sankey)).toEqual([
      'ai_gateway_model:gpt -> oidc_credential:alex: 30',
      'ai_gateway_model:gpt -> oidc_credential:sam: 10',
      'ai_gateway_model:claude -> oidc_credential:sam: 20',
    ])
  })

  it('colors every node', () => {
    const sankey = exploreResultToSankey(buildResult([['gpt', 'alex', 30]]))

    expect(sankey?.nodes.every(({ itemStyle }) => typeof itemStyle?.color === 'string')).toBe(true)
  })

  it('keeps the top first-dimension values, ranked by their total', () => {
    const sankey = exploreResultToSankey(buildResult([
      ['a', 'x', 5],
      ['b', 'x', 50],
      ['c', 'x', 20],
      ['c', 'y', 20],
    ]), { limit: 2 })

    expect(sankey?.nodes.filter(({ depth }) => depth === 0).map(({ id }) => id)).toEqual(['ai_gateway_model:b', 'ai_gateway_model:c'])
  })

  it('links each first-dimension value to its own top second-dimension values', () => {
    const sankey = exploreResultToSankey(buildResult([
      ['gpt', 'alex', 30],
      ['gpt', 'sam', 20],
      ['gpt', 'kim', 1],
      ['claude', 'kim', 9],
      ['claude', 'lee', 8],
      ['claude', 'alex', 2],
    ]), { limit: 2 })

    expect(linkSummary(sankey)).toEqual([
      'ai_gateway_model:gpt -> oidc_credential:alex: 30',
      'ai_gateway_model:gpt -> oidc_credential:sam: 20',
      'ai_gateway_model:claude -> oidc_credential:kim: 9',
      'ai_gateway_model:claude -> oidc_credential:lee: 8',
    ])
  })

  it('shows a second-dimension value shared by several first-dimension values once', () => {
    const sankey = exploreResultToSankey(buildResult([
      ['gpt', 'alex', 30],
      ['claude', 'alex', 10],
    ]))

    expect(sankey?.nodes.filter(({ id }) => id === 'oidc_credential:alex')).toHaveLength(1)
    expect(sankey?.links).toHaveLength(2)
  })

  it('sizes first-dimension nodes by their full total, including values left out of the links', () => {
    const sankey = exploreResultToSankey(buildResult([
      ['gpt', 'alex', 30],
      ['gpt', 'sam', 20],
      ['gpt', OTHER, 100],
    ], { withOther: true }), { limit: 1 })

    expect(nodeSummary(sankey)?.[0]).toEqual(['ai_gateway_model:gpt', 'GPT', 0, 150])
    expect(linkSummary(sankey)).toEqual(['ai_gateway_model:gpt -> oidc_credential:alex: 30'])
  })

  it('leaves out the Other group and warns that top values may be missing', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const sankey = exploreResultToSankey(buildResult([
      ['gpt', 'alex', 30],
      ['gpt', OTHER, 100],
    ], { withOther: true }))

    expect(sankey?.nodes.map(({ id }) => id)).toEqual(['ai_gateway_model:gpt', 'oidc_credential:alex'])
    expect(warn).toHaveBeenCalledOnce()
  })

  it('doesn\'t warn without an Other group', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    exploreResultToSankey(buildResult([['gpt', 'alex', 30]]))

    expect(warn).not.toHaveBeenCalled()
  })

  it('keeps the same value in both dimensions as two nodes', () => {
    const sankey = exploreResultToSankey(buildResult([['shared', 'shared', 5]]))

    expect(sankey?.nodes.map(({ id }) => id)).toEqual(['ai_gateway_model:shared', 'oidc_credential:shared'])
  })

  it('sums values when a pair spans several records, and skips records without a value', () => {
    const sankey = exploreResultToSankey(buildResult([
      ['gpt', 'alex', 30],
      ['gpt', 'alex', 5],
      ['gpt', 'sam', null],
    ]))

    expect(linkSummary(sankey)).toEqual(['ai_gateway_model:gpt -> oidc_credential:alex: 35'])
  })

  it('keeps the top 5 by default', () => {
    const records = Array.from({ length: 7 }, (_, index): [string, string, number] => [`m${index}`, `c${index}`, 100 - index])
    const sankey = exploreResultToSankey(buildResult(records))

    expect(sankey?.nodes.filter(({ depth }) => depth === 0)).toHaveLength(5)
  })

  it('returns undefined without a result', () => {
    expect(exploreResultToSankey(undefined)).toBeUndefined()
  })

  it('returns undefined for a metric that doesn\'t add up', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(exploreResultToSankey(buildResult([['gpt', 'alex', 30]], { metric: 'llm_latency_p95' }))).toBeUndefined()
    expect(error).toHaveBeenCalledOnce()
  })
})

describe('isSankeyCompatible', () => {
  it.each([
    ['ai_request_count', ['ai_gateway_model', 'oidc_credential'], true],
    [undefined, ['ai_gateway_model', 'oidc_credential'], true],
    ['ai_request_count', ['ai_gateway_model'], false],
    ['ai_request_count', ['ai_provider', 'ai_gateway_model', 'oidc_credential'], false],
    ['ai_request_count', ['time', 'ai_gateway_model'], false],
    ['llm_latency_average', ['ai_gateway_model', 'oidc_credential'], false],
    ['error_rate', ['ai_gateway_model', 'oidc_credential'], false],
  ])('%s grouped by %j: %s', (metric, dimensions, expected) => {
    expect(isSankeyCompatible(metric, dimensions)).toBe(expected)
  })
})
