import type { AddOnRecord, ManagedCacheAddOn } from '../types/cloud-gateways-add-on'

export const parseManagedAddOn = (plain: ManagedCacheAddOn | AddOnRecord): ManagedCacheAddOn => {
  const value = plain as ManagedCacheAddOn
  return {
    ...value,
    id: value.id,
    config: {
      ...value.config,
      kind: value.config.kind,
    } satisfies ManagedCacheAddOn['config'],
  } satisfies ManagedCacheAddOn
}

export const parseManagedAddOnDetailPayload = (data: ManagedCacheAddOn | AddOnRecord): ManagedCacheAddOn =>
  parseManagedAddOn(data)

// Read linked partial id/`cache_config_id` from object metadata
const readCacheConfigIdFromMetadata = (meta: AddOnRecord | undefined): string | undefined => {
  const raw = meta?.cache_config_id
  return raw == null || raw === '' ? undefined : String(raw)
}

// Extract the Koko partial id linked to a managed-cache add-on
export const getCacheConfigId = (addOn: ManagedCacheAddOn): string | undefined =>
  readCacheConfigIdFromMetadata(addOn.config?.state_metadata)

export const isManagedCacheAddOn = (addOn: ManagedCacheAddOn | AddOnRecord): addOn is ManagedCacheAddOn =>
  parseManagedAddOn(addOn).config.kind === 'managed-cache.v0'
