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

const buildThreeDimensionResult = (
  records: Array<[provider: string, model: string, consumer: string, requests: number]>,
  // The query's dimensions, which set the column order
  dimensions: string[] = ['ai_provider', 'ai_gateway_model', 'oidc_credential'],
): ExploreResultV4 => {
  const display: Record<string, Record<string, { name: string, is_other_group?: boolean }>> = {
    ai_provider: Object.fromEntries(records.map(([provider]) => [provider, provider === OTHER ? { name: OTHER, is_other_group: true } : { name: provider }])),
    ai_gateway_model: Object.fromEntries(records.map(([, model]) => [model, { name: model }])),
    oidc_credential: Object.fromEntries(records.map(([, , consumer]) => [consumer, { name: consumer }])),
  }

  return {
    data: records.map(([provider, model, consumer, requests]) => ({
      timestamp: '2026-11-11T00:00:00Z',
      event: { ai_provider: provider, ai_gateway_model: model, oidc_credential: consumer, ai_request_count: requests },
    })),
    meta: {
      start: '2026-11-11T00:00:00Z',
      end: '2026-11-18T00:00:00Z',
      granularity_ms: 604800000,
      query_id: 'query',
      metric_names: ['ai_request_count'],
      display: Object.fromEntries(dimensions.map((dimension) => [dimension, display[dimension]])),
    },
  }
}

/** Nodes as `[id, name, depth, total]`, without their colors */
const nodeSummary = (result: ReturnType<typeof exploreResultToSankey>) => (
  result?.nodes.map(({ id, name, depth, total }) => [id, name, depth, total])
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

  describe('node colors', () => {
    const fiveModels: Array<[string, string, number]> = ['a', 'b', 'c', 'd', 'e'].map((model, index) => [model, `user-${model}`, 50 - index])

    it('gives first-dimension nodes different colors without a coordinator', () => {
      const sankey = exploreResultToSankey(buildResult(fiveModels))
      const modelColors = sankey?.nodes.filter(({ depth }) => depth === 0).map(({ itemStyle }) => itemStyle?.color)

      expect(new Set(modelColors).size).toBe(5)
    })

    it('resolves the first-dimension colors through the coordinator', () => {
      const resolveDiscriminator = vi.fn(({ order }: { order?: number }) => order ?? 0)

      exploreResultToSankey(buildResult([
        ['gpt', 'alex', 30],
        ['claude', 'sam', 20],
      ]), { coordinator: { resolveDiscriminator, reset: vi.fn() }, chartUuid: 'chart-1' })

      expect(resolveDiscriminator.mock.calls.map(([args]) => args)).toEqual([
        expect.objectContaining({ name: 'ai_gateway_modelgpt', order: 0, chartUuid: 'chart-1' }),
        expect.objectContaining({ name: 'ai_gateway_modelclaude', order: 1, chartUuid: 'chart-1' }),
      ])
    })
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

  it('gives first-dimension nodes their full total, including values left out of the links', () => {
    const sankey = exploreResultToSankey(buildResult([
      ['gpt', 'alex', 30],
      ['gpt', 'sam', 20],
      ['gpt', OTHER, 100],
    ], { withOther: true }), { limit: 1 })

    expect(nodeSummary(sankey)?.[0]).toEqual(['ai_gateway_model:gpt', 'GPT', 0, 150])
    // No `value`, so the node is only as tall as its links
    expect(sankey?.nodes[0].value).toBeUndefined()
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

describe('exploreResultToSankey with three dimensions', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  const usage: Array<[provider: string, model: string, consumer: string, requests: number]> = [
    ['openai', 'gpt', 'alex', 30],
    ['openai', 'mini', 'alex', 20],
    ['anthropic', 'claude', 'alex', 10],
    ['openai', 'gpt', 'sam', 5],
    ['meta', 'llama', 'kim', 1],
  ]

  it('ranks the first column and breaks each value down into its own top values in the other columns', () => {
    const sankey = exploreResultToSankey(buildThreeDimensionResult(usage), { limit: 1 })

    expect(nodeSummary(sankey)).toEqual([
      ['ai_provider:openai', 'openai', 0, 55],
      ['ai_gateway_model:gpt', 'gpt', 1, undefined],
      ['oidc_credential:alex', 'alex', 2, undefined],
    ])
    // Openai's top model, then the part of it that comes from openai's top user
    expect(linkSummary(sankey)).toEqual([
      'ai_provider:openai -> ai_gateway_model:gpt: 35',
      'ai_gateway_model:gpt -> oidc_credential:alex: 30',
    ])
  })

  it('links the other two columns only through the values picked for each first-column value', () => {
    const sankey = exploreResultToSankey(buildThreeDimensionResult(usage, ['oidc_credential', 'ai_provider', 'ai_gateway_model']), { limit: 2 })

    expect(nodeSummary(sankey)).toEqual([
      ['oidc_credential:alex', 'alex', 0, 60],
      ['oidc_credential:sam', 'sam', 0, 5],
      ['ai_provider:openai', 'openai', 1, undefined],
      ['ai_provider:anthropic', 'anthropic', 1, undefined],
      ['ai_gateway_model:gpt', 'gpt', 2, undefined],
      ['ai_gateway_model:mini', 'mini', 2, undefined],
    ])
    // Claude isn't one of alex's top 2 models, so anthropic links to no model
    expect(linkSummary(sankey)).toEqual([
      'oidc_credential:alex -> ai_provider:openai: 50',
      'oidc_credential:alex -> ai_provider:anthropic: 10',
      'oidc_credential:sam -> ai_provider:openai: 5',
      'ai_provider:openai -> ai_gateway_model:gpt: 35',
      'ai_provider:openai -> ai_gateway_model:mini: 20',
    ])
  })

  it('picks the last column\'s values only through the middle values picked, so each one has a link', () => {
    // A's top model is gpt, but its top user overall, kim, only uses mini
    const sankey = exploreResultToSankey(buildThreeDimensionResult([
      ['A', 'gpt', 'alex', 10],
      ['A', 'gpt', 'sam', 5],
      ['A', 'mini', 'kim', 12],
    ]), { limit: 1 })

    expect(linkSummary(sankey)).toEqual([
      'ai_provider:A -> ai_gateway_model:gpt: 15',
      'ai_gateway_model:gpt -> oidc_credential:alex: 10',
    ])
    expect(nodeSummary(sankey)?.map(([id]) => id)).toEqual(['ai_provider:A', 'ai_gateway_model:gpt', 'oidc_credential:alex'])
  })

  it('leaves out an Other group in a later column, but counts it in the first column\'s totals', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const sankey = exploreResultToSankey(buildThreeDimensionResult([
      ['openai', 'gpt', 'alex', 10],
      [OTHER, 'gpt', 'alex', 40],
    ], ['oidc_credential', 'ai_provider', 'ai_gateway_model']))

    expect(nodeSummary(sankey)?.slice(0, 2)).toEqual([
      ['oidc_credential:alex', 'alex', 0, 50],
      ['ai_provider:openai', 'openai', 1, undefined],
    ])
  })

  describe('colors', () => {
    // Alex sends the most through openai -> gpt, sam through openai -> mini
    const sankey = exploreResultToSankey(buildThreeDimensionResult([
      ['openai', 'gpt', 'alex', 30],
      ['openai', 'mini', 'alex', 10],
      ['openai', 'mini', 'sam', 20],
    ], ['oidc_credential', 'ai_provider', 'ai_gateway_model']))
    const colorOf = (id: string) => sankey?.nodes.find((node) => node.id === id)?.itemStyle?.color
    const alex = colorOf('oidc_credential:alex')
    const sam = colorOf('oidc_credential:sam')

    it('gives each first-column value its own color', () => {
      expect(alex).toEqual(expect.any(String))
      expect(sam).toEqual(expect.any(String))
      expect(alex).not.toBe(sam)
    })

    it('colors each link like the first-column value that sends the most through it', () => {
      expect(sankey?.links.map(({ source, target, lineStyle }) => [`${source} -> ${target}`, lineStyle?.color])).toEqual([
        ['oidc_credential:alex -> ai_provider:openai', alex],
        ['oidc_credential:sam -> ai_provider:openai', sam],
        ['ai_provider:openai -> ai_gateway_model:gpt', alex],
        ['ai_provider:openai -> ai_gateway_model:mini', sam],
      ])
    })

    it('stacks the colors of the links arriving at a later node, in their sources\' order', () => {
      expect(colorOf('ai_provider:openai')).toEqual({
        type: 'linear',
        x: 0,
        y: 0,
        x2: 0,
        y2: 1,
        colorStops: [
          { offset: 0, color: alex },
          { offset: 40 / 60, color: alex },
          { offset: 40 / 60, color: sam },
          { offset: 1, color: sam },
        ],
      })
    })

    it('gives a later node one color when its links share it', () => {
      expect(colorOf('ai_gateway_model:gpt')).toBe(alex)
      expect(colorOf('ai_gateway_model:mini')).toBe(sam)
    })

    it('resolves only the first-column colors through the coordinator', () => {
      const resolveDiscriminator = vi.fn(({ order }: { order?: number }) => order ?? 0)

      exploreResultToSankey(buildThreeDimensionResult([['openai', 'gpt', 'alex', 10]]), { coordinator: { resolveDiscriminator, reset: vi.fn() } })

      expect(resolveDiscriminator.mock.calls.map(([{ name }]) => name)).toEqual(['ai_provideropenai'])
    })
  })
})

describe('isSankeyCompatible', () => {
  it.each([
    ['ai_request_count', ['ai_gateway_model', 'oidc_credential'], true],
    [undefined, ['ai_gateway_model', 'oidc_credential'], true],
    ['ai_request_count', ['ai_gateway_model'], false],
    ['ai_request_count', ['ai_provider', 'ai_gateway_model', 'oidc_credential'], true],
    ['ai_request_count', ['ai_provider', 'ai_gateway_model', 'oidc_credential', 'status_code_grouped'], false],
    ['ai_request_count', ['time', 'ai_gateway_model'], false],
    ['llm_latency_average', ['ai_gateway_model', 'oidc_credential'], false],
    ['error_rate', ['ai_gateway_model', 'oidc_credential'], false],
  ])('%s grouped by %j: %s', (metric, dimensions, expected) => {
    expect(isSankeyCompatible(metric, dimensions)).toBe(expected)
  })
})
