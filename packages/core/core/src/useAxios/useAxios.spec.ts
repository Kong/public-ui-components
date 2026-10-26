import { describe, it, expect } from 'vitest'
import useAxios from './index'

describe('getTraceIdFromError()', () => {
  const { getTraceIdFromError } = useAxios()

  it('should prefer the x-trace-id header when both headers are present', () => {
    expect(getTraceIdFromError({ response: { headers: { 'x-trace-id': 'trace-id', 'x-datadog-trace-id': 'datadog-id' } } })).toEqual('trace-id')
  })

  it('should fall back to the x-datadog-trace-id header when x-trace-id is missing', () => {
    expect(getTraceIdFromError({ response: { headers: { 'x-datadog-trace-id': 'datadog-id' } } })).toEqual('datadog-id')
  })

  it('should return the x-trace-id header when it is the only header present', () => {
    expect(getTraceIdFromError({ response: { headers: { 'x-trace-id': 'trace-id' } } })).toEqual('trace-id')
  })

  it('should return an empty string when neither header is present', () => {
    expect(getTraceIdFromError({ response: { headers: {} } })).toEqual('')
    expect(getTraceIdFromError({ response: {} })).toEqual('')
  })

  it('should handle undefined', () => {
    // @ts-ignore: allow undefined for test value
    expect(getTraceIdFromError(undefined)).toEqual('')
  })

  it('should handle null', () => {
    // @ts-ignore: allow null for test value
    expect(getTraceIdFromError(null)).toEqual('')
  })
})
