import type { RouteLocationRaw } from 'vue-router'
import type { Field, KongManagerConfig, KonnectConfig } from './index'

export interface KonnectBaseTableConfig extends KonnectConfig {}

export interface KongManagerBaseTableConfig extends KongManagerConfig {
  /** Whether to use exact match or not */
  isExactMatch?: boolean;
  /** Whether to disable table sorting */
  disableSorting?: boolean;
}

export interface BaseTableHeaders {
  [key: string]: Field
}

export interface EmptyStateOptions {
  ctaPath?: RouteLocationRaw
  ctaText?: string
  message: string
  title: string
  showCta?: boolean
}

export interface FetcherParams {
  page: number
  pageSize: number
  offset: number
  sortColumnKey: string
  sortColumnOrder: 'asc' | 'desc'
  query: string
}

export interface FetcherResponse {
  data: any[]
  total?: number
  pagination?: {
    offset?: string | null
    next?: string | null
  }
}

export enum FetcherStatus {
  Loading,
  Idle,
  NoResults,
  Error,
}

export interface FetcherState {
  status: FetcherStatus;
  response?: FetcherResponse;
  error?: any;
}

interface InternalHeaderForFields {
  key: string
  label: string
  sortable: boolean
}

interface InternalHeaderForActions {
  key: string
  hideLabel: boolean
}

export type InternalHeader = InternalHeaderForFields | InternalHeaderForActions

export interface TableSortParams {
  prevKey: string
  sortColumnKey: string
  sortColumnOrder: 'asc' | 'desc'
}
