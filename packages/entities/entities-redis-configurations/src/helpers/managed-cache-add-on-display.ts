import { assign, isEmpty, isPlainObject as lodashIsPlainObject, mapValues, omit, pickBy } from 'lodash-es'
import type { AddOnRecord, AddOnValue, ManagedCacheAddOn } from '../types/cloud-gateways-add-on'
import { pickCloudAuthFields } from '../helpers'
import { parseManagedAddOnDetailPayload } from './managed-cache-add-on-parse'

// Flatten add-on data for the config card: parse validates the row; this file clones, strips nested auth, and merges rows

type DisplayRecord = AddOnRecord
type DisplayRowValue = AddOnValue | AddOnRecord | AddOnRecord[] | string

const CLOUD_AUTHENTICATION_KEY_PREFIX = 'cloud_authentication_'

// Narrows AddOnValue to a plain record and not an array
const isPlainObject = (value: AddOnValue | undefined): value is AddOnRecord =>
  lodashIsPlainObject(value)

// Values safe to show as single cell text or to copy by value
const isPrimitiveValue = (value: AddOnValue | undefined): boolean =>
  value === null || ['string', 'number', 'boolean'].includes(typeof value)

// Plain object with at least one key (empty {} is treated as absent for display)
const isNonEmptyObject = (value: AddOnValue | undefined): value is AddOnRecord =>
  isPlainObject(value) && !isEmpty(value)

// Strip nested cloud_authentication so auth is not duplicated under DPG/ metadata blobs
const stripCloudAuthenticationKeyDeep = (value: AddOnValue | AddOnRecord): AddOnValue | AddOnRecord => {
  // Arrays- recurse into object elements only
  if (Array.isArray(value)) {
    return value.map((item) =>
      isPlainObject(item) ? stripCloudAuthenticationKeyDeep(item) as AddOnValue : item,
    )
  }

  // Scalars and non-plain values pass through unchanged
  if (!isPlainObject(value)) {
    return value
  }

  // Drop cloud_authentication at this level, then recurse into nested objects and arrays
  return mapValues(omit(value, 'cloud_authentication'), (v) => {
    if (v === null || v === undefined) {
      return v
    }
    if (Array.isArray(v) || isPlainObject(v)) {
      return stripCloudAuthenticationKeyDeep(v as AddOnValue | AddOnRecord) as AddOnValue
    }
    return v
  }) as AddOnRecord
}

// Deep-clone values for the card without mutating cached API data
const cloneValueForDisplay = (value: AddOnValue | undefined): AddOnValue | undefined => {
  if (value === undefined) {
    return undefined
  }

  // null and primitives are already safe to reuse
  if (value === null || isPrimitiveValue(value)) {
    return value
  }

  // Arrays- deep-clone object elements, keep other elements as-is
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

  // Any other object-like value (should be rare for this payload shape)
  return value
}

// Clone one plain object, skip undefined keys, recurse arrays and nested objects
const clonePlainObjectDeep = (obj: AddOnRecord): AddOnRecord => {
  const out: AddOnRecord = {}
  for (const [k, v] of Object.entries(obj)) {
    // Omit undefined so the card does not show empty slots for missing optional keys
    if (v === undefined) {
      continue
    }

    if (isPrimitiveValue(v)) {
      out[k] = v
      continue
    }

    if (Array.isArray(v)) {
      out[k] = cloneValueForDisplay(v) as AddOnValue
      continue
    }

    if (isPlainObject(v)) {
      out[k] = clonePlainObjectDeep(v)
      continue
    }

    // Fallback copy for values that are not plain objects
    out[k] = v
  }
  return out
}

// Primitives-only object for the cloud_authentication row (optional field allowlist when Konnect enables it)
const cloudAuthenticationObjectForDisplay = (
  raw: AddOnRecord,
  cloudAuthAvailable: boolean,
): AddOnRecord | null => {
  let source = raw

  // Konnect can restrict which cloud-auth fields appear in the card
  if (cloudAuthAvailable) {
    const picked = pickCloudAuthFields(raw as NonNullable<Parameters<typeof pickCloudAuthFields>[0]>)
    source = picked !== null ? (picked as AddOnRecord) : raw
  }

  // Card row is flat key/value; drop nested structures
  const primitivesOnly = pickBy(source, (v) => isPrimitiveValue(v as AddOnValue)) as AddOnRecord
  return isEmpty(primitivesOnly) ? null : primitivesOnly
}

// Split state_metadata into cache_state_metadata vs auth bits that feed the merged cloud_authentication row
const normalizeStateMetadataForDisplay = (
  meta: AddOnRecord,
  cloudAuthAvailable: boolean,
): { stateMetadata: AddOnRecord, cloudAuthFields: AddOnRecord } => {
  // Metadata blob for its own card row, without nested cloud_authentication duplication
  const stateMetadata: AddOnRecord = stripCloudAuthenticationKeyDeep({ ...meta }) as AddOnRecord
  const cloudAuthFields: AddOnRecord = {}
  const nestedAuth = meta.cloud_authentication

  if (isPlainObject(nestedAuth)) {
    const primitiveCloudAuth = cloudAuthenticationObjectForDisplay(nestedAuth, cloudAuthAvailable)
    if (primitiveCloudAuth !== null) {
      Object.assign(cloudAuthFields, primitiveCloudAuth)
    }
  }

  return { stateMetadata, cloudAuthFields }
}

// Pick what to show for a DPG state_metadata cell
const stateMetadataValueForDisplay = (value: AddOnValue | undefined): AddOnValue | AddOnRecord | undefined => {
  if (isPlainObject(value)) {
    // Empty object is treated as nothing to show
    return isNonEmptyObject(value) ? { ...value } : undefined
  }
  if (typeof value === 'string') {
    // Single-line string value when not JSON-shaped (handled as plain text)
    return value.trim() !== '' ? value : undefined
  }
  return value === null || value === undefined ? undefined : value
}

// One dpg- strip nested auth, clone fields, handle state_metadata
const dataPlaneGroupItemRecord = (obj: AddOnRecord): AddOnRecord => {
  const cleaned = stripCloudAuthenticationKeyDeep({ ...obj }) as AddOnRecord

  const out: AddOnRecord = {}
  // Copy each field for display; state_metadata uses dedicated shaping rules
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
        // Normalizer returned nothing but the source is still an object: shallow copy for the grid
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

// Shallow-merge nested auth sources (config + state_metadata + prefixed keys), then primitives-only row
const mergeCloudAuthenticationDisplayRecord = (
  cloudAuthFieldsFromPrefixedKeys: AddOnRecord,
  cloudAuthFieldsFromStateMetadata: AddOnRecord,
  nestedCloudAuthentication: AddOnValue | undefined,
  cloudAuthAvailable: boolean,
): AddOnRecord | null => {
  const nestedObject = isPlainObject(nestedCloudAuthentication) ? nestedCloudAuthentication : null
  // Later arguments overwrite earlier keys: nested config, then state_metadata auth, then flattened cloud_authentication_* keys
  const combined = assign(
    {} as AddOnRecord,
    nestedObject && isNonEmptyObject(nestedObject) ? clonePlainObjectDeep(nestedObject) : {},
    isNonEmptyObject(cloudAuthFieldsFromStateMetadata) ? cloudAuthFieldsFromStateMetadata : {},
    isNonEmptyObject(cloudAuthFieldsFromPrefixedKeys) ? cloudAuthFieldsFromPrefixedKeys : {},
  )
  return cloudAuthenticationObjectForDisplay(combined, cloudAuthAvailable)
}

// Read add-on config in card row order and buffer cloud_authentication_* primitives for the final merge
const mergeManagedCacheConfigLikePartialRecord = (
  configRecord: AddOnRecord,
  put: (key: string, value: DisplayRowValue) => void,
  cloudAuthAvailable: boolean,
): void => {
  let dataPlaneGroupsFromConfig: AddOnValue | undefined
  let stateMetadataRaw: AddOnValue | undefined
  let nestedCloudAuthenticationFromConfig: AddOnValue | undefined
  let capacityConfigRaw: AddOnValue | undefined
  const deferredNestedObjectRows: Array<[string, AddOnRecord]> = []
  const cloudAuthFromPrefixedKeysInConfig: AddOnRecord = {}

  // First pass- store reserved keys, emit simple scalars/arrays, defer other objects until after ordered rows
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

    if (v === null || v === undefined) {
      continue
    }

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

  // Emit rows in the order the card schema expects
  if (isNonEmptyObject(capacityConfigRaw)) {
    put('capacity_config', { ...capacityConfigRaw })
  }

  if (dataPlaneGroupsFromConfig !== null && dataPlaneGroupsFromConfig !== undefined) {
    // API may return one object or an array of group objects
    const asList: AddOnValue[] = Array.isArray(dataPlaneGroupsFromConfig)
      ? dataPlaneGroupsFromConfig
      : (isPlainObject(dataPlaneGroupsFromConfig) ? [dataPlaneGroupsFromConfig] : [])
    const records = asList
      .filter((item): item is AddOnRecord => isPlainObject(item))
      .map((item, index) => ({
        ...dataPlaneGroupItemRecord(item),
        // Display-only label; removed again when serializing the DPG JSON snippet in the slot
        name: `Data plane group ${index + 1}`,
      }))

    if (records.length === 1) {
      put('data_plane_groups', records[0])
    }

    if (records.length > 1) {
      put('data_plane_groups', records)
    }
  }

  let cloudAuthFieldsFromStateMetadata: AddOnRecord = {}
  if (isNonEmptyObject(stateMetadataRaw)) {
    const { stateMetadata, cloudAuthFields } = normalizeStateMetadataForDisplay(stateMetadataRaw, cloudAuthAvailable)

    if (!isEmpty(stateMetadata)) {
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

  // Remaining nested objects (shallow row per key)
  for (const [k, v] of deferredNestedObjectRows) {
    put(k, { ...v })
  }
}

// Build ordered key/value rows for the card from an add-on
const displayRecordFromManagedCacheAddOn = (
  addOn: ManagedCacheAddOn,
  cloudAuthAvailable: boolean,
): DisplayRecord => {
  const orderedRows: Array<[string, DisplayRowValue]> = []
  const emittedKeys = new Set<string>()
  const addOnRecord = addOn as Record<string, AddOnValue | undefined>

  const put = (key: string, value: DisplayRowValue) => {
    // Keep id/owner etc order from being overwritten
    if (emittedKeys.has(key)) return
    emittedKeys.add(key)
    orderedRows.push([key, value])
  }

  // Root keys not in the fixed list: scalar, array, or shallow object row
  const putDisplayableValue = (key: string, value: AddOnValue | undefined): void => {
    if (value === undefined || value === null) {
      return
    }

    if (isPrimitiveValue(value)) {
      put(key, value)
      return
    }

    if (Array.isArray(value)) {
      put(key, cloneValueForDisplay(value) as DisplayRowValue)
      return
    }

    if (isNonEmptyObject(value)) {
      // Nested objects at root are shown as a shallow copy in one row
      put(key, { ...value })
    }
  }

  // Stable top-of-card field order
  const preferredRoot = ['id', 'name', 'type', 'tags', 'state', 'entity_version', 'created_at', 'updated_at'] as const
  for (const key of preferredRoot) {
    const rootVal = addOnRecord[key]

    if (rootVal !== null && rootVal !== undefined) {
      put(key, rootVal)
    }
  }

  if (isNonEmptyObject(addOnRecord.owner)) {
    put('owner', { ...addOnRecord.owner })
  }

  const cloudAuthFromPrefixedKeysOnAddOn: AddOnRecord = {}
  const handledRoot = new Set<string>(['config', 'cloud_authentication', ...preferredRoot])
  // Sorted remaining keys: pull cloud_authentication_* aside for merge with config-derived auth
  for (const key of Object.keys(addOnRecord).sort()) {
    if (handledRoot.has(key)) {
      continue
    }
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

  // Nested config rows (capacity, DPG, cache_state_metadata, cloud_authentication..)
  mergeManagedCacheConfigLikePartialRecord(addOn.config as AddOnRecord, put, cloudAuthAvailable)

  let display = Object.fromEntries(orderedRows) as DisplayRecord

  // Add root-level cloud_authentication_* into the same row as config-derived auth
  if (!isEmpty(cloudAuthFromPrefixedKeysOnAddOn)) {
    const mergedCloudAuthenticationRow = mergeCloudAuthenticationDisplayRecord(
      cloudAuthFromPrefixedKeysOnAddOn,
      {},
      display.cloud_authentication,
      cloudAuthAvailable,
    )

    if (mergedCloudAuthenticationRow !== null) {
      display = { ...display, cloud_authentication: mergedCloudAuthenticationRow }
    }
  }

  return display
}

// Parse API payload, then flatten for the card; empty object when the row is not an add-on
export const addOnApiResponseToDisplayRecord = (
  data: AddOnRecord,
  options?: { cloudAuthAvailable?: boolean },
): DisplayRecord => {
  const addOn = parseManagedAddOnDetailPayload(data)
  return displayRecordFromManagedCacheAddOn(addOn, options?.cloudAuthAvailable === true)
}
