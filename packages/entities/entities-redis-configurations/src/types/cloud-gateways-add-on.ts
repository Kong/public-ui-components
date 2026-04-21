// Add-on lifecycle states used in list/detail UI
export type CloudGatewaysAddOnState = 'initializing' | 'ready' | 'terminating'
export type ManagedCacheAddOn = CloudGatewaysAddOnResponse
export type AddOnPrimitive = string | number | boolean | null
export type AddOnValue = AddOnPrimitive | AddOnRecord | AddOnValue[]
// `undefined` is allowed as some optional API keys are read dynamically and may be absent
export interface AddOnRecord extends Record<string, AddOnValue | undefined> {}

// CP info attached to an add-on owner
export interface ControlPlaneAddOnOwner {
  kind?: string
  control_plane_id?: string
  control_plane_geo?: string
  control_plane_group_id?: string
  control_plane_group_geo?: string
}

// `config.capacity_config` when kind is tiered
export interface ManagedCacheTieredCapacity extends AddOnRecord {
  kind: string
  tier?: string
}

// Config block returned by Cloud Gateways add-on APIs
export interface ManagedCacheAddOnConfig {
  kind: string
  capacity_config?: ManagedCacheTieredCapacity
  // Contains linked partial id + runtime fields used in UI helpers
  state_metadata?: AddOnRecord
  // Keep extra keys so parsing stays forward-compatible with API changes
  [key: string]: AddOnValue | undefined
}

// One add-on row returned by detail endpoint or list `data[]`
export interface CloudGatewaysAddOnResponse {
  id: string
  name?: string
  type?: string
  tags?: string[]
  owner?: ControlPlaneAddOnOwner
  config: ManagedCacheAddOnConfig
  entity_version?: number
  state?: CloudGatewaysAddOnState
  created_at?: string
  updated_at?: string
  [key: string]: AddOnValue | string[] | ControlPlaneAddOnOwner | ManagedCacheAddOnConfig | undefined
}

// Paginated add-ons list response
export interface CloudGatewaysListAddOnsResponse {
  meta?: {
    page?: {
      number?: number
      size?: number
      total_pages?: number
    }
  }
  data: CloudGatewaysAddOnResponse[]
}
