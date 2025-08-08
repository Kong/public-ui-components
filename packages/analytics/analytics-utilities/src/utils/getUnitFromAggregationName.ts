import type { AllAggregations } from '../types/explore/all'

export enum AggregationUnit {
  ms = 'ms',
  bytes = 'bytes',
  countPerMinute = 'count/minute',
  tokenCount = 'token count',
  usd = 'usd',
  count = 'count',
}

export const getUnitFromAggregationName = (name: AllAggregations): AggregationUnit => {
  const lower = name.toLowerCase()

  if (lower.includes('latency')) {
    return AggregationUnit.ms
  }

  if (lower.includes('size')) {
    return AggregationUnit.bytes
  }

  if (lower.includes('perminute') || lower.includes('per_minute')) {
    return AggregationUnit.countPerMinute
  }

  if (lower.includes('token')) {
    return AggregationUnit.tokenCount
  }

  if (lower.includes('cost')) {
    return AggregationUnit.usd
  }

  return AggregationUnit.count
}
