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

export const PLATFORM_DATASOURCES = ['platform', 'platform_usage'] as const
export type PlatformDatasource = typeof PLATFORM_DATASOURCES[number]

export const isPlatformDatasource = (datasource: unknown): datasource is PlatformDatasource =>
  (PLATFORM_DATASOURCES as readonly unknown[]).includes(datasource)

export type PlatformTabularRecord = Record<string, string | number | boolean | null>

export interface PlatformTabularResponseMeta {
  query_id: string
  entity: string
  columns: string[]
  page_size: number
  display: DisplayBlob
  cursor?: string
  /** @deprecated Will be `platform_usage` in future responses. */
  datasource?: 'platform' | 'platform_usage'
}

export interface PlatformTabularResponse {
  records: PlatformTabularRecord[]
  meta: PlatformTabularResponseMeta
}
