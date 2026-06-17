import type { BasicExploreQuery } from './basic'
import type { DisplayBlob } from './result'

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

export interface PlatformTabularQuery {
  entity?: string
  columns?: string[]
  filters?: PlatformExploreFilterAll[]
  cursor?: string
  page_size?: number
}

export type PlatformTabularRecord = Record<string, string | number | boolean | null>

export interface PlatformTabularResponseMeta {
  query_id: string
  entity?: string
  columns?: string[]
  page_size?: number
  cursor?: string
  datasource?: 'platform'
  display: DisplayBlob
}

export interface PlatformTabularResponse {
  records: PlatformTabularRecord[]
  meta: PlatformTabularResponseMeta
}
