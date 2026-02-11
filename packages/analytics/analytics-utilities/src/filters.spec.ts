import type { AllFilterableDimensionsAndMetrics } from './types'

import { it, describe, expect } from 'vitest'

import { getFieldDataSources } from './filters'

describe('getFieldDataSources', () => {
  it.each([
    ['mcp_tool_name'],
    ['mcp_method'],
    ['mcp_session_id'],
    ['mcp_error'],
  ])('returns mcp_usage and requests for MCP dimension "%s"', (dimension) => {
    const result = getFieldDataSources(dimension as AllFilterableDimensionsAndMetrics)
    expect(result).toEqual(['mcp_usage', 'requests'])
  })

  it.each([
    ['api'],
    ['gateway_service'],
    ['route'],
    ['status_code'],
  ])('includes basic, api_usage, mcp_usage, and requests for shared dimension "%s"', (dimension) => {
    const result = getFieldDataSources(dimension as AllFilterableDimensionsAndMetrics)
    expect(result).toContain('basic')
    expect(result).toContain('api_usage')
    expect(result).toContain('mcp_usage')
    expect(result).toContain('requests')
  })

  it.each([
    ['upstream_status_code'],
    ['consumer'],
    ['application'],
  ])('includes api_usage, mcp_usage, and requests for advanced dimension "%s"', (dimension) => {
    const result = getFieldDataSources(dimension as AllFilterableDimensionsAndMetrics)
    expect(result).not.toContain('basic')
    expect(result).toContain('api_usage')
    expect(result).toContain('mcp_usage')
    expect(result).toContain('requests')
  })

  it.each([
    ['ai_provider'],
    ['ai_response_model'],
    ['ai_request_model'],
  ])('does not include mcp_usage for AI dimension "%s"', (dimension) => {
    const result = getFieldDataSources(dimension as AllFilterableDimensionsAndMetrics)
    expect(result).toContain('llm_usage')
    expect(result).not.toContain('mcp_usage')
  })
})
