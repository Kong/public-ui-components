import type { AddOnRecord, AddOnValue } from '../types/cloud-gateways-add-on'
import { pickCloudAuthFields } from '../helpers'
import { parseManagedAddOnDetailPayload } from './managed-cache-add-on-parse'

type DisplayRecord = AddOnRecord
type DisplayRowValue = AddOnValue | AddOnRecord | AddOnRecord[] | string
// API splits auth across keys like `cloud_authentication_aws_region`, strip prefix to rebuild one object
const CLOUD_AUTHENTICATION_KEY_PREFIX = 'cloud_authentication_'

// True when value is a non-array object record.`AddOnValue` is recursive, arrays are not plain objects here
const isPlainObject = (value: AddOnValue | undefined): value is AddOnRecord =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

// Scalars and null only
const isPrimitiveValue = (value: AddOnValue | undefined): boolean =>
  value === null || ['string', 'number', 'boolean'].includes(typeof value)

// Plain object with at least one key
const isNonEmptyObject = (value: AddOnValue | undefined): value is AddOnRecord =>
  isPlainObject(value) && Object.keys(value).length > 0

// Coerce object/ JSON string to a plain record, otherwise null
const toPlainObject = (value: AddOnValue | undefined): AddOnRecord | null => {
  if (isPlainObject(value)) {
    return value
  }

  if (typeof value === 'string') {
    try {
      // API may send object-shaped JSON as a string
      const parsed = JSON.parse(value)
      return isPlainObject(parsed) ? parsed : null
    } catch {
      return null
    }
  }
  return null
}

// Recursively removes `cloud_authentication` to remove duplication inside nested blobs
const stripCloudAuthenticationKeyDeep = (value: AddOnValue | AddOnRecord): AddOnValue | AddOnRecord => {
  if (Array.isArray(value)) {
    return value.map((item) =>
      isPlainObject(item) ? stripCloudAuthenticationKeyDeep(item) as AddOnValue : item,
    )
  }

  if (!isPlainObject(value)) {
    return value
  }

  const out: AddOnRecord = {}
  for (const [k, v] of Object.entries(value)) {
    if (k === 'cloud_authentication') {
      // Auth is its own card row, not inside DPG/metadata blobs
      continue
    }
    if (v == null) {
      out[k] = v
      continue
    }
    if (Array.isArray(v) || isPlainObject(v)) {
      out[k] = stripCloudAuthenticationKeyDeep(v as AddOnValue | AddOnRecord) as AddOnValue
      continue
    }
    out[k] = v
  }
  return out
}

// Deep-clone structures for the card without mutating cached API data
const cloneValueForDisplay = (value: AddOnValue | undefined): AddOnValue | undefined => {
  if (value === undefined) {
    return undefined
  }

  if (value === null || isPrimitiveValue(value)) {
    return value
  }

  if (Array.isArray(value)) {
    return value.map((item) => {
      if (isPlainObject(item)) {
        return clonePlainObjectDeep(item) as AddOnValue
      }
      return item as AddOnValue
    })
  }

  if (isPlainObject(value)) {
    return clonePlainObjectDeep(value) as AddOnValue
  }

  return value
}

// Loop one plain object, arrays checked with `cloneValueForDisplay` for nesting
const clonePlainObjectDeep = (obj: AddOnRecord): AddOnRecord => {
  const out: AddOnRecord = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) {
      continue
    }

    if (isPrimitiveValue(v)) {
      out[k] = v
      continue
    }

    if (Array.isArray(v)) {
      // Arrays may contain plain objects
      out[k] = cloneValueForDisplay(v) as AddOnValue
      continue
    }

    if (isPlainObject(v)) {
      out[k] = clonePlainObjectDeep(v)
      continue
    }

    out[k] = v
  }
  return out
}

// Keep only primitive cloud-auth fields for the card row, optional allowlist when `cloudAuthAvailable`
const cloudAuthenticationObjectForDisplay = (
  raw: AddOnRecord,
  cloudAuthAvailable: boolean): AddOnRecord | null => {
  let source = raw

  if (cloudAuthAvailable) {
    const picked = pickCloudAuthFields(raw as NonNullable<Parameters<typeof pickCloudAuthFields>[0]>)
    source = picked !== null ? (picked as AddOnRecord) : raw
  }

  const out: AddOnRecord = {}
  for (const [k, v] of Object.entries(source)) {
    // Card row is key/values, not nested blobs
    if (isPrimitiveValue(v)) out[k] = v
  }

  return Object.keys(out).length > 0 ? out : null
}

// Split `state_metadata` into the cache metadata blob vs auth fields we merge into `cloud_authentication`
const normalizeStateMetadataForDisplay = (
  meta: AddOnRecord,
  cloudAuthAvailable: boolean ):
{ stateMetadata: AddOnRecord, cloudAuthFields: AddOnRecord } => {
  const stateMetadata: AddOnRecord = stripCloudAuthenticationKeyDeep({ ...meta }) as AddOnRecord
  const cloudAuthFields: AddOnRecord = {}
  const cloudAuth = meta.cloud_authentication

  const cloudAuthObject = toPlainObject(cloudAuth)
  if (cloudAuthObject) {
    const primitiveCloudAuth = cloudAuthenticationObjectForDisplay(cloudAuthObject, cloudAuthAvailable)

    if (primitiveCloudAuth !== null) {
      // Merge into `cloud_authentication` row
      Object.assign(cloudAuthFields, primitiveCloudAuth)
    }
  }

  return { stateMetadata, cloudAuthFields }
}

// Normalize one DPG `state_metadata` value (object, JSON string, empty) to a display-ready val or undefined
const stateMetadataValueForDisplay = (value: AddOnValue | undefined): AddOnValue | AddOnRecord | undefined => {
  if (isPlainObject(value)) {
    return isNonEmptyObject(value) ? { ...value } : undefined
  }
  if (typeof value === 'string') {
    const parsed = toPlainObject(value as AddOnValue)
    if (parsed) {
      return isNonEmptyObject(parsed) ? parsed : undefined
    }
    // Non-JSON string- show as one line if anything left
    return value.trim() !== '' ? value : undefined
  }
  return value != null ? value : undefined
}

// Shape one dpsp for display- strip nested cloud auth, clone values, special-case `state_metadata`
const dataPlaneGroupItemRecord = (obj: AddOnRecord): AddOnRecord => {
  const cleaned = stripCloudAuthenticationKeyDeep({ ...obj }) as AddOnRecord

  const out: AddOnRecord = {}
  for (const [k, v] of Object.entries(cleaned)) {
    if (v === undefined) {
      continue
    }
    if (v === null) {
      out[k] = null
      continue
    }

    if (k === 'state_metadata') {
      const stateMetadataValue = stateMetadataValueForDisplay(v)
      if (stateMetadataValue !== undefined) {
        out[k] = stateMetadataValue
      } else if (isPlainObject(v)) {
        // Object still exists— keep shallow copy for card
        out[k] = { ...v }
      } else {
        const cloned = cloneValueForDisplay(v as AddOnValue)
        if (cloned !== undefined) {
          out[k] = cloned
        }
      }
      continue
    }
    const cloned = cloneValueForDisplay(v as AddOnValue)
    if (cloned !== undefined) {
      out[k] = cloned
    }
  }
  return out
}

// Combine nested object, state-metadata auth, and prefixed keys into one `cloud_authentication` card value
const mergeCloudAuthenticationDisplayRecord = (
  cloudAuthFieldsFromPrefixedKeys: AddOnRecord,
  cloudAuthFieldsFromStateMetadata: AddOnRecord,
  nestedCloudAuthentication: AddOnValue | undefined,
  cloudAuthAvailable: boolean,
): AddOnRecord | null => {
  const combined: AddOnRecord = {}
  const nestedObject = toPlainObject(nestedCloudAuthentication)
  if (nestedObject && isNonEmptyObject(nestedObject)) {
    // Nested `cloud_authentication` object
    Object.assign(combined, clonePlainObjectDeep(nestedObject))
  }

  if (isNonEmptyObject(cloudAuthFieldsFromStateMetadata)) {
    // Overwrite same keys from nested
    Object.assign(combined, cloudAuthFieldsFromStateMetadata)
  }

  if (isNonEmptyObject(cloudAuthFieldsFromPrefixedKeys)) {
    // Prefixed API keys
    Object.assign(combined, cloudAuthFieldsFromPrefixedKeys)
  }

  return cloudAuthenticationObjectForDisplay(combined, cloudAuthAvailable)
}

// Read `addOn.config` and call `put` for each card row in an order
const mergeManagedCacheConfigLikePartialRecord = (
  configRecord: AddOnRecord,
  put: (key: string, value: DisplayRowValue) => void,
  cloudAuthAvailable: boolean): void => {
  let dataPlaneGroupsFromConfig: AddOnValue | undefined
  let stateMetadataRaw: AddOnValue | undefined
  let nestedCloudAuthenticationFromConfig: AddOnValue | undefined
  let capacityConfigRaw: AddOnValue | undefined
  const deferredNestedObjectRows: Array<[string, AddOnRecord]> = []
  const cloudAuthFromPrefixedKeysInConfig: AddOnRecord = {}

  for (const [k, v] of Object.entries(configRecord)) {
    if (k === 'data_plane_groups' || k === 'data_plane_group') {
      // Shape and emit after capacity, before cloud row
      dataPlaneGroupsFromConfig = v
      continue
    }

    if (k === 'state_metadata') {
      // Split into cache_state_metadata + cloud-auth merge inputs
      stateMetadataRaw = v
      continue
    }

    if (k === 'cloud_authentication') {
      nestedCloudAuthenticationFromConfig = v
      continue
    }

    if (k === 'capacity_config') {
      // Emit before DPG so row order matches card allowlist
      capacityConfigRaw = v
      continue
    }

    if (v == null) continue

    if (isPrimitiveValue(v)) {
      if (k.startsWith(CLOUD_AUTHENTICATION_KEY_PREFIX)) {
        const fieldNameAfterPrefix = k.slice(CLOUD_AUTHENTICATION_KEY_PREFIX.length)

        if (fieldNameAfterPrefix !== '') {
          cloudAuthFromPrefixedKeysInConfig[fieldNameAfterPrefix] = v
        }
        continue
      }
      put(k, v)
      continue
    }

    if (Array.isArray(v)) {
      put(k, cloneValueForDisplay(v) as DisplayRowValue)
      continue
    }

    if (isNonEmptyObject(v)) {
      // After capacity/DPG/cloud_auth/ cache_state_metadata
      deferredNestedObjectRows.push([k, v])
    }
  }

  if (isNonEmptyObject(capacityConfigRaw)) {
    put('capacity_config', { ...capacityConfigRaw })
  }

  if (dataPlaneGroupsFromConfig != null) {
    const asList: AddOnValue[] = Array.isArray(dataPlaneGroupsFromConfig)
      ? dataPlaneGroupsFromConfig
      : (isPlainObject(dataPlaneGroupsFromConfig) ? [dataPlaneGroupsFromConfig] : [])
    const records = asList
      .filter((item): item is AddOnRecord => isPlainObject(item))
      .map((item, index) => ({
        ...dataPlaneGroupItemRecord(item),
        // UI-only- stripped before JSON blob in the card slot
        name: `Data plane group ${index + 1}`,
      }))

    if (records.length === 1) put('data_plane_groups', records[0])
    if (records.length > 1) put('data_plane_groups', records)
  }

  let cloudAuthFieldsFromStateMetadata: AddOnRecord = {}
  if (isNonEmptyObject(stateMetadataRaw)) {
    const { stateMetadata, cloudAuthFields } = normalizeStateMetadataForDisplay(stateMetadataRaw, cloudAuthAvailable)

    if (Object.keys(stateMetadata).length > 0) {
      put('cache_state_metadata', stateMetadata)
    }
    cloudAuthFieldsFromStateMetadata = cloudAuthFields
  }

  const mergedCloudAuthenticationRow = mergeCloudAuthenticationDisplayRecord(
    cloudAuthFromPrefixedKeysInConfig,
    cloudAuthFieldsFromStateMetadata,
    nestedCloudAuthenticationFromConfig,
    cloudAuthAvailable,
  )

  if (mergedCloudAuthenticationRow !== null) {
    put('cloud_authentication', mergedCloudAuthenticationRow)
  }

  for (const [k, v] of deferredNestedObjectRows) {
    put(k, { ...v })
  }
}

// Build the flat record the konnect-managed cache config card
export const addOnApiResponseToDisplayRecord = (
  data: AddOnRecord,
  options?: { cloudAuthAvailable?: boolean }): DisplayRecord => {
  const cloudAuthAvailable = options?.cloudAuthAvailable === true
  const addOn = parseManagedAddOnDetailPayload(data)
  if (addOn === null) return {}

  const orderedRows: Array<[string, DisplayRowValue]> = []
  const emittedKeys = new Set<string>()
  const addOnRecord = addOn as Record<string, AddOnValue | undefined>

  // Append one row if that key has not been set yet
  const put = (key: string, value: DisplayRowValue) => {
    // Keep id/owner etc order from being overwritten
    if (emittedKeys.has(key)) return
    emittedKeys.add(key)
    orderedRows.push([key, value])
  }

  // Emit a leftover root key as scalar, cloned array, or shallow object
  const putDisplayableValue = (key: string, value: AddOnValue | undefined): void => {
    if (value === undefined || value == null) return
    if (isPrimitiveValue(value)) {
      put(key, value)
      return
    }
    if (Array.isArray(value)) {
      put(key, cloneValueForDisplay(value) as DisplayRowValue)
      return
    }
    if (isNonEmptyObject(value)) {
      // Shallow object rows only here
      put(key, { ...value })
    }
  }

  const preferredRoot = ['id', 'name', 'type', 'tags', 'state', 'entity_version', 'created_at', 'updated_at'] as const
  for (const key of preferredRoot) {
    if (addOnRecord[key] != null) put(key, addOnRecord[key])
  }

  if (isNonEmptyObject(addOnRecord.owner)) {
    put('owner', { ...addOnRecord.owner })
  }

  const cloudAuthFromPrefixedKeysOnAddOn: AddOnRecord = {}
  const handledRoot = new Set<string>(['config', 'cloud_authentication', ...preferredRoot])
  for (const key of Object.keys(addOnRecord).sort()) {
    if (handledRoot.has(key)) continue
    const val = addOnRecord[key]
    if (isPrimitiveValue(val) && key.startsWith(CLOUD_AUTHENTICATION_KEY_PREFIX)) {
      const fieldNameAfterPrefix = key.slice(CLOUD_AUTHENTICATION_KEY_PREFIX.length)

      if (fieldNameAfterPrefix !== '') {
        // Merged into `cloud_authentication` after config runs
        cloudAuthFromPrefixedKeysOnAddOn[fieldNameAfterPrefix] = val
      }
      continue
    }
    putDisplayableValue(key, val)
  }

  if (isPlainObject(addOn.config)) {
    mergeManagedCacheConfigLikePartialRecord(addOn.config, put, cloudAuthAvailable)
  }

  let display = Object.fromEntries(orderedRows) as DisplayRecord

  if (Object.keys(cloudAuthFromPrefixedKeysOnAddOn).length > 0) {
    const mergedCloudAuthenticationRow = mergeCloudAuthenticationDisplayRecord(
      cloudAuthFromPrefixedKeysOnAddOn,
      {},
      display.cloud_authentication,
      cloudAuthAvailable,
    )

    if (mergedCloudAuthenticationRow !== null) {
      // Merge top-level `cloud_authentication_*` into nested row
      display = { ...display, cloud_authentication: mergedCloudAuthenticationRow }
    }
  }

  return display
}
