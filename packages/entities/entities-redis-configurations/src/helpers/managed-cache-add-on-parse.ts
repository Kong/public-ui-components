import type { AddOnRecord, ManagedCacheAddOn } from '../types/cloud-gateways-add-on'

/**
 * Parse helpers for managed-cache add-ons
 * Keeps payload normalization in one place so list/detail stay aligned.
 * Assumes current Add-On API shape and extracts linked `cache_config_id`
 */

// Expected payload shape is known, but values are still checked before reading fields
const isPlainObject = (value: unknown): value is AddOnRecord =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

const asNonEmptyString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.length > 0 ? value : undefined

const asFiniteNumber = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) ? value : undefined

const asStringArray = (value: unknown): string[] | undefined =>
  Array.isArray(value) && value.every((v) => typeof v === 'string') ? value : undefined

const asAddOnState = (value: unknown): ManagedCacheAddOn['state'] | undefined =>
  value === 'initializing' || value === 'ready' || value === 'terminating'
    ? value : undefined

const normalizeStateMetadata = (value: unknown): AddOnRecord | undefined =>
  isPlainObject(value) ? value : undefined

// Parse one add-on into the shape list/detail code expects.
// Unknown so we validate runtime payloads before using typed fields
export const parseManagedAddOn = (plain: unknown): ManagedCacheAddOn | null => {
  if (!isPlainObject(plain)) return null

  const id = asNonEmptyString(plain.id)
  if (!id) return null

  const configSource = isPlainObject(plain.config) ? plain.config : null
  if (!configSource) return null

  const kind = asNonEmptyString(configSource.kind)
  if (!kind) return null

  const stateMetadata = normalizeStateMetadata(configSource.state_metadata)

  const addOn: ManagedCacheAddOn = {
    id,
    config: ({
      ...configSource,
      kind,
      ...(stateMetadata ? { state_metadata: stateMetadata } : {}),
    }) as ManagedCacheAddOn['config'],
  }

  const name = asNonEmptyString(plain.name)
  if (name) addOn.name = name

  const type = asNonEmptyString(plain.type)
  if (type) addOn.type = type

  const tags = asStringArray(plain.tags)
  if (tags) addOn.tags = tags

  const ownerSource = isPlainObject(plain.owner) ? plain.owner : undefined

  if (ownerSource) {
    const owner: ManagedCacheAddOn['owner'] = {}
    const ownerKind = asNonEmptyString(ownerSource.kind)
    const controlPlaneId = asNonEmptyString(ownerSource.control_plane_id)
    const controlPlaneGeo = asNonEmptyString(ownerSource.control_plane_geo)

    if (ownerKind) owner.kind = ownerKind
    if (controlPlaneId) owner.control_plane_id = controlPlaneId
    if (controlPlaneGeo) owner.control_plane_geo = controlPlaneGeo
    if (Object.keys(owner).length) addOn.owner = owner
  }

  const entityVersion = asFiniteNumber(plain.entity_version)
  if (entityVersion != null) addOn.entity_version = entityVersion

  const state = asAddOnState(plain.state)
  if (state) addOn.state = state

  const createdAt = asNonEmptyString(plain.created_at)
  if (createdAt) addOn.created_at = createdAt

  const updatedAt = asNonEmptyString(plain.updated_at)
  if (updatedAt) addOn.updated_at = updatedAt

  return addOn
}

// Detail endpoint payload is expected to be an add-on object.
export const parseManagedAddOnDetailPayload = (data: unknown): ManagedCacheAddOn | null =>
  parseManagedAddOn(data)

// Read linked partial id/`cache_config_id` from object metadata.
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
