import { describe, expect, it } from 'vitest'
import { filterableExploreDimensions, queryableExploreDimensions } from './advanced'
import { filterableAgenticExploreDimensions, queryableAgenticExploreDimensions } from './agentic'
import { filterableAiExploreDimensions, queryableAiExploreDimensions } from './ai'
import {
  filterableRequestDimensions,
  filterableRequestWildcardDimensions,
  queryableRequestDimensions,
  queryableRequestWildcardDimensions,
} from './requests'

describe('authenticated_entity', () => {
  it.each([
    ['API Usage', queryableExploreDimensions, filterableExploreDimensions],
    ['LLM Usage', queryableAiExploreDimensions, filterableAiExploreDimensions],
    ['Agentic Usage', queryableAgenticExploreDimensions, filterableAgenticExploreDimensions],
  ])('is queryable and filterable for %s', (_datasource, queryableDimensions, filterableDimensions) => {
    expect(queryableDimensions).toContain('authenticated_entity')
    expect(filterableDimensions).toContain('authenticated_entity')
  })

  it('supports API Request string and wildcard filters', () => {
    expect(queryableRequestDimensions).toContain('authenticated_entity')
    expect(filterableRequestDimensions).toContain('authenticated_entity')
    expect(queryableRequestWildcardDimensions).toContain('authenticated_entity')
    expect(filterableRequestWildcardDimensions).toContain('authenticated_entity')
  })
})
