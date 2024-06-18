import type { RecordItem } from './entity-base-config-card'


export const entityTypes = [
  'api_product',
  'api_product_version',
  'control_plane',
  'control_plane_group',
  'data_plane_node',
  'gateway_service',
  'route',
  'application',
  'consumer',
] as const

export type EntityType = typeof entityTypes[number]

export interface TooltipData {
  items: RecordItem[] | null,
  label: string,
}

export interface EntityTooltipConfig {
  deleted: boolean
  id: string,
  data: () => Promise<TooltipData>
}
