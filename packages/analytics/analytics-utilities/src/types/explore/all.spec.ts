import { it, describe, expect } from 'vitest'
import { stripUnknownFilters } from './all'

describe('stripUnknownFilters', () => {
  const unknownFilter = {
    operator: 'in',
    field: 'not_real_field',
    value: ['foo'],
  }

  // a filter that's in both the basic datasource and the api_usage datasource
  const basicFilter = {
    operator: 'in',
    field: 'api',
    value: ['foo'],
  }

  // a filter that's only in the api_usage datasource
  const advancedFilter = {
    operator: 'in',
    field: 'upstream_status_code',
    value: ['foo'],
  }

  // a filter that's only in the llm_usage datasource
  const llmFilter = {
    operator: 'in',
    field: 'ai_provider',
    value: ['foo'],
  }

  // a filter that's only in the agentic_usage datasource
  const mcpFilter = {
    operator: 'in',
    field: 'mcp_tool_name',
    value: ['foo'],
  }

  // AIGW1 consumer group — valid in api_usage, but deliberately not supported in llm_usage or
  // agentic_usage (those only support the AIGW2 equivalent, ai_gateway_consumer_group).
  const consumerGroupFilter = {
    operator: 'in',
    field: 'consumer_group',
    value: ['foo'],
  }

  // AIGW2 consumer group — valid in api_usage, llm_usage, and agentic_usage.
  const aiGatewayConsumerGroupFilter = {
    operator: 'in',
    field: 'ai_gateway_consumer_group',
    value: ['foo'],
  }

  // a filter that is valid for the platform datasource but not scoped elsewhere
  const platformFilter = {
    operator: 'in',
    field: 'custom_platform_field',
    value: ['foo'],
  }

  // a filter that's only in the managed_cache_usage datasource
  const managedCacheFilter = {
    operator: 'in',
    field: 'provider_region',
    value: ['foo'],
  }

  it.each([
    ['basic', [basicFilter]],
    ['api_usage', [basicFilter, advancedFilter, consumerGroupFilter, aiGatewayConsumerGroupFilter]],
    ['llm_usage', [llmFilter, aiGatewayConsumerGroupFilter]],
    ['agentic_usage', [basicFilter, advancedFilter, mcpFilter, aiGatewayConsumerGroupFilter]],
    ['managed_cache_usage', [managedCacheFilter]],
  ])('Strips only unknown filters for datasource "%s"', (datasource, expected) => {
    // @ts-ignore these are the correct strings to use
    const result = stripUnknownFilters(datasource, [
      unknownFilter, basicFilter, advancedFilter, llmFilter, mcpFilter, managedCacheFilter,
      consumerGroupFilter, aiGatewayConsumerGroupFilter,
    ])
    expect(result).toEqual(expected)
  })

  it('excludes consumer_group (AIGW1) from llm_usage and agentic_usage specifically', () => {
    // @ts-ignore these are the correct strings to use
    expect(stripUnknownFilters('llm_usage', [consumerGroupFilter])).toEqual([])
    // @ts-ignore these are the correct strings to use
    expect(stripUnknownFilters('agentic_usage', [consumerGroupFilter])).toEqual([])
    // @ts-ignore these are the correct strings to use
    expect(stripUnknownFilters('api_usage', [consumerGroupFilter])).toEqual([consumerGroupFilter])
  })

  it('keeps all filters for platform', () => {
    const result = stripUnknownFilters('platform', [unknownFilter, basicFilter, advancedFilter, llmFilter, mcpFilter, platformFilter])
    expect(result).toEqual([unknownFilter, basicFilter, advancedFilter, llmFilter, mcpFilter, platformFilter])
  })

  it('Keeps all filters if the datasource starts with "goap"', () => {
    // @ts-ignore these are the correct strings to use
    const result = stripUnknownFilters('goap_test', [unknownFilter, basicFilter, advancedFilter, llmFilter])
    expect(result).toEqual([unknownFilter, basicFilter, advancedFilter, llmFilter])
  })
})
