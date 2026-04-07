import type { AddOnRecord, ManagedCacheAddOn } from '../types/cloud-gateways-add-on'

const isPlainObject = (value: unknown): value is AddOnRecord =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

export const parseManagedAddOn = (plain: unknown): ManagedCacheAddOn | null => {
  if (!isPlainObject(plain)) return null

  const id = plain.id
  if (typeof id !== 'string' || !id) return null

  const configSource = isPlainObject(plain.config) ? plain.config : null
  if (!configSource) return null

  const kind = configSource.kind
  if (typeof kind !== 'string' || !kind) return null

  const addOn: ManagedCacheAddOn = {
    id,
    config: {
      ...configSource,
      kind,
    } as ManagedCacheAddOn['config'],
  }

  if (typeof plain.name === 'string') addOn.name = plain.name
  if (typeof plain.type === 'string') addOn.type = plain.type
  if (Array.isArray(plain.tags) && plain.tags.every((v) => typeof v === 'string')) {
    addOn.tags = plain.tags
  }

  if (isPlainObject(plain.owner)) {
    const o = plain.owner
    const owner: ManagedCacheAddOn['owner'] = {}
    if (typeof o.kind === 'string') owner.kind = o.kind
    if (typeof o.control_plane_id === 'string') owner.control_plane_id = o.control_plane_id
    if (typeof o.control_plane_geo === 'string') owner.control_plane_geo = o.control_plane_geo
    if (Object.keys(owner).length) addOn.owner = owner
  }

  if (typeof plain.entity_version === 'number' && Number.isFinite(plain.entity_version)) {
    addOn.entity_version = plain.entity_version
  }

  if (plain.state === 'initializing' || plain.state === 'ready' || plain.state === 'terminating') {
    addOn.state = plain.state
  }

  if (typeof plain.created_at === 'string') addOn.created_at = plain.created_at
  if (typeof plain.updated_at === 'string') addOn.updated_at = plain.updated_at

  return addOn
}

export const parseManagedAddOnDetailPayload = (data: unknown): ManagedCacheAddOn | null =>
  parseManagedAddOn(data)

// Read linked partial id/`cache_config_id` from object metadata
const readCacheConfigIdFromMetadata = (meta: unknown): string | undefined => {
  if (!isPlainObject(meta)) return undefined
  const raw = meta.cache_config_id
  return raw == null || raw === '' ? undefined : String(raw)
}

// Extract the Koko partial id linked to a managed-cache add-on
export const getCacheConfigId = (addOn: ManagedCacheAddOn): string | undefined =>
  readCacheConfigIdFromMetadata(addOn.config?.state_metadata)

// Type guard entrypoint accepts unknown because host pass raw network responses
export const isManagedCacheAddOn = (addOn: unknown): addOn is ManagedCacheAddOn => {
  const parsedAddOn = parseManagedAddOn(addOn)
  return !!parsedAddOn && parsedAddOn.config.kind === 'managed-cache.v0'
}
