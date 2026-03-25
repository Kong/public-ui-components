import type { BasicExploreQuery } from './basic'

export interface PlatformExploreInFilterV2 {
  operator: string
  field: string
  value: Array<string | number | null>
}

export interface PlatformExploreEmptyFilterV2 {
  operator: string
  field: string
}

export type PlatformExploreFilterAll = PlatformExploreInFilterV2 | PlatformExploreEmptyFilterV2

export interface PlatformExploreQuery extends Omit<BasicExploreQuery, 'metrics' | 'dimensions' | 'filters'> {
  metrics?: string[]
  dimensions?: string[]
  filters?: PlatformExploreFilterAll[]
}
