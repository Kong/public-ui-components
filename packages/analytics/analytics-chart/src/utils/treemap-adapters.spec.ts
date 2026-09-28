import type { DisplayBlob, ExploreResultV4, GroupByResult, QueryResponseMeta } from '@kong-ui-public/analytics-utilities'
import { describe, it, expect, vi } from 'vitest'
import { color } from '@kong-ui-public/analytics-utilities'
import { exploreResultToTreemap } from './treemap-adapters'

const TIMESTAMP = '2024-06-16T00:00:00.000Z'

const PROVIDERS = {
  openai: { name: 'OpenAI' },
  anthropic: { name: 'Anthropic' },
}

const MODELS = {
  'gpt-4o': { name: 'gpt-4o' },
  'gpt-4.1': { name: 'gpt-4.1' },
  'claude-opus-4-1': { name: 'claude-opus-4-1' },
}

// Top-level nodes carry the color other charts use for the value; children inherit it
const colored = (id: string, dimension = 'ai_provider') => ({
  itemStyle: { color: color({ dimension, dimensionValue: id }) },
})

const exploreResult = (
  events: Array<GroupByResult['event']>,
  meta: Partial<QueryResponseMeta> = {},
): ExploreResultV4 => ({
  data: events.map((event) => ({ timestamp: TIMESTAMP, event })),
  meta: {
    start: TIMESTAMP,
    end: TIMESTAMP,
    granularity_ms: 86400000,
    display: { ai_provider: PROVIDERS, ai_gateway_model: MODELS },
    metric_names: ['ai_request_count'],
    query_id: '',
    ...meta,
  } as QueryResponseMeta,
})

describe('exploreResultToTreemap', () => {
  it('returns undefined for missing input', () => {
    expect(exploreResultToTreemap(undefined)).toBeUndefined()
  })

  it('returns undefined and logs when the metric or dimension is missing', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(exploreResultToTreemap(exploreResult([], { metric_names: [] }))).toBeUndefined()
    expect(exploreResultToTreemap(exploreResult([], { display: {} }))).toBeUndefined()
    expect(errorSpy).toHaveBeenCalledTimes(2)
    errorSpy.mockRestore()
  })

  it('builds flat nodes for one dimension', () => {
    const result = exploreResultToTreemap(exploreResult([
      { ai_provider: 'openai', ai_request_count: 10 },
      { ai_provider: 'anthropic', ai_request_count: '4' },
    ], { display: { ai_provider: PROVIDERS } }))

    expect(result).toEqual([
      { name: 'OpenAI', value: 10, ...colored('openai') },
      { name: 'Anthropic', value: 4, ...colored('anthropic') },
    ])
  })

  it('nests the second dimension under the first, leaving group values to ECharts', () => {
    const result = exploreResultToTreemap(exploreResult([
      { ai_provider: 'openai', ai_gateway_model: 'gpt-4o', ai_request_count: 10 },
      { ai_provider: 'anthropic', ai_gateway_model: 'claude-opus-4-1', ai_request_count: 3 },
      { ai_provider: 'openai', ai_gateway_model: 'gpt-4.1', ai_request_count: 5 },
    ]))

    expect(result).toEqual([
      { name: 'OpenAI', ...colored('openai'), children: [{ name: 'gpt-4o', value: 10 }, { name: 'gpt-4.1', value: 5 }] },
      { name: 'Anthropic', ...colored('anthropic'), children: [{ name: 'claude-opus-4-1', value: 3 }] },
    ])
  })

  it('sums values for a dimension value spread over several records', () => {
    const result = exploreResultToTreemap(exploreResult([
      { ai_provider: 'openai', ai_gateway_model: 'gpt-4o', ai_request_count: 10 },
      { ai_provider: 'openai', ai_gateway_model: 'gpt-4o', ai_request_count: 5 },
    ]))

    expect(result).toEqual([{ name: 'OpenAI', ...colored('openai'), children: [{ name: 'gpt-4o', value: 15 }] }])
  })

  it('skips records without a numeric value', () => {
    const result = exploreResultToTreemap(exploreResult([
      { ai_provider: 'openai', ai_gateway_model: 'gpt-4o', ai_request_count: null },
      { ai_provider: 'anthropic', ai_gateway_model: 'claude-opus-4-1', ai_request_count: 3 },
    ]))

    expect(result).toEqual([{ name: 'Anthropic', ...colored('anthropic'), children: [{ name: 'claude-opus-4-1', value: 3 }] }])
  })

  it('falls back to the id when the display blob has no name for it', () => {
    const result = exploreResultToTreemap(exploreResult([
      { ai_provider: 'mistral', ai_gateway_model: 'mistral-large', ai_request_count: 1 },
    ]))

    expect(result).toEqual([{ name: 'mistral', ...colored('mistral'), children: [{ name: 'mistral-large', value: 1 }] }])
  })

  it('ignores a `time` key in the display blob', () => {
    const display: DisplayBlob = { time: {}, ai_provider: PROVIDERS }
    const result = exploreResultToTreemap(exploreResult([
      { ai_provider: 'openai', ai_request_count: 1 },
    ], { display }))

    expect(result).toEqual([{ name: 'OpenAI', value: 1, ...colored('openai') }])
  })

  it('gives an empty group the neutral color other charts use', () => {
    const [group] = exploreResultToTreemap(exploreResult([
      { ai_provider: 'empty', ai_gateway_model: 'gpt-4o', ai_request_count: 1 },
    ])) ?? []

    expect(group.itemStyle).toEqual({ color: color({ state: 'empty' }) })
  })
})
