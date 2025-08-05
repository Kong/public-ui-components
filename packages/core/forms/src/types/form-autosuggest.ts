import type { AxiosResponse } from 'axios'
import type { SelectItem } from '@kong/kongponents'

export interface EntityData {
  [key: string]: any
  id: string
}

export interface EntityResponse {
  data: EntityData[]
  next?: string
  offset?: string
}

export interface AutoSuggestInjection {
  getAll: (query: string, signal?: AbortSignal) => Promise<EntityData[]>
  getPartial: (size: number) => Promise<AxiosResponse<EntityResponse>>
  getOne: (id: string) => Promise<AxiosResponse<EntityData>>
}

export type AutoSuggestItemTransformer = (item: EntityData) => SelectItem<string>
