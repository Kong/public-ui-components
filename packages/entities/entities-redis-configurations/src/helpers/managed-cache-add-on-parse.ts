import type { AddOnRecord, ManagedCacheAddOn } from '../types/cloud-gateways-add-on'

export const parseManagedAddOn = (plain: ManagedCacheAddOn): ManagedCacheAddOn => {
  const value = plain satisfies ManagedCacheAddOn
  return {
    ...value,
    config: {
      ...value.config,
      kind: value.config.kind,
    } satisfies ManagedCacheAddOn['config'],
  } satisfies ManagedCacheAddOn
}

export const parseManagedAddOnDetailPayload = (data: ManagedCacheAddOn): ManagedCacheAddOn =>
  parseManagedAddOn(data)

// Read linked partial id/`cache_config_id` from object metadata
const readCacheConfigIdFromMetadata = (meta: AddOnRecord | undefined): string | undefined => {
  const raw = meta?.cache_config_id
  return raw == null || raw === '' ? undefined : String(raw)
}

// Extract the Koko partial id linked to a managed-cache add-on
export const getCacheConfigId = (addOn: ManagedCacheAddOn): string | undefined =>
  readCacheConfigIdFromMetadata(addOn.config?.state_metadata)

export const isManagedCacheAddOn = (addOn: ManagedCacheAddOn): addOn is ManagedCacheAddOn =>
  addOn.config.kind === 'managed-cache.v0'
