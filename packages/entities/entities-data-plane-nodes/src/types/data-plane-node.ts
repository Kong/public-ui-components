export interface DataPlaneNodeCommon {
  id: string
  hostname: string
}

export interface KonnectRuntimeInstance extends DataPlaneNodeCommon {
  version: string
  last_ping: number
  type: string
  created_at: number
  updated_at: number
  config_hash: string
  compatibility_status: {
    state: string
    issues?: Array<{
      affected_resources: Array<{
        id: string
        type: string
      }>
      code: string
      description: string
      documentation_url: string
      resolution: string
      severity: string
    }>
    config_hash?: string
  }
  data_plane_cert_id: string
  labels?: Record<string, string>
  process_conf: {
    plugins: string[]
    cluster_max_payload: number
    lmdb_map_size: string
    router_flavor: string
  }
  connection_state: {
    is_connected: boolean
  }
  errors?: Array<{
    name: string
    config_hash: string
    flattened_errors: Array<{
      entity_id: string
      entity_name: string
      errors: Array<{
        error_message: string
        type: string
        field: string
      }>
      entity_type: string
    }>
    code: number
    source: string
  }>
  connected?: string
  total_traffic: number | null
  error_rate: number | null
  status?: string
}
