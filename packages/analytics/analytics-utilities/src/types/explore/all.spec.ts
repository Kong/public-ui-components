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

  // a filter that's only in the mcp_usage datasource
  const mcpFilter = {
    operator: 'in',
    field: 'mcp_tool_name',
    value: ['foo'],
  }

  it.each([
    ['basic', [basicFilter]],
    ['api_usage', [basicFilter, advancedFilter]],
    ['llm_usage', [llmFilter]],
    ['mcp_usage', [basicFilter, advancedFilter, mcpFilter]],
  ])('Strips only unknown filters for datasource "%s"', (datasource, expected) => {
    // @ts-ignore these are the correct strings to use
    const result = stripUnknownFilters(datasource, [unknownFilter, basicFilter, advancedFilter, llmFilter, mcpFilter])
    expect(result).toEqual(expected)
  })

  it('Keeps all filters if the datasource starts with "goap"', () => {
    // @ts-ignore these are the correct strings to use
    const result = stripUnknownFilters('goap_test', [unknownFilter, basicFilter, advancedFilter, llmFilter])
    expect(result).toEqual([unknownFilter, basicFilter, advancedFilter, llmFilter])
  })
})
