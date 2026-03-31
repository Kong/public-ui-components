import type { AddOnRecord, AddOnValue } from '../types/cloud-gateways-add-on'
import { pickCloudAuthFields } from '../helpers'
import { parseManagedAddOnDetailPayload } from './managed-cache-add-on-parse'

/**
 * Display-shaping helper for the Konnect-managed add-on config card
 * Flattens add-on payloads into stable rows
 */

type DisplayRecord = AddOnRecord
type DisplayRowValue = AddOnValue | AddOnRecord | AddOnRecord[] | string

const isPlainObject = (value: unknown): value is AddOnRecord =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

const isPrimitiveValue = (value: unknown): boolean =>
  value === null || ['string', 'number', 'boolean'].includes(typeof value)

// If empty objects, skip them
const isNonEmptyObject = (value: unknown): value is AddOnRecord =>
  isPlainObject(value) && Object.keys(value).length > 0

// Converts supported values into a plain object when possible as API payloads may send object-like JSON strings that need updates
const toPlainObject = (value: AddOnValue | undefined): AddOnRecord | null => {
  if (isPlainObject(value)) {
    return value
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return isPlainObject(parsed) ? parsed : null
    } catch {
      return null
    }
  }
  return null
}

// Recursively removes `cloud_authentication` keys from nested structures. Cloud-auth fields are displayed separately, should not duplicate in metadata rows
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


// Builds a compact single-line summary from an object b/c nested object values need a readable fallback when shown in card row
const summarizeObjectOneLine = (obj: AddOnRecord): string =>
  Object.entries(obj)
    .filter(([, v]) => v != null && v !== '')
    .map(([k, v]) => {
      if (isPrimitiveValue(v)) return `${k}: ${String(v)}`
      if (Array.isArray(v)) return `${k}: [${v.length}]`
      if (isPlainObject(v)) return `${k}: {…}`
      return `${k}: ${String(v)}`
    })
    .join(', ')

// Formats a dpg object into a label as they are shown in compact row text
const formatDataPlaneGroupRow = (dpg: AddOnRecord): string => {
  const name = dpg.name ?? dpg.data_plane_group_name ?? dpg.label
  const state = dpg.state ?? dpg.status ?? dpg.data_plane_group_state
  const id = dpg.id ?? dpg.data_plane_group_id
  const geo = dpg.control_plane_geo ?? dpg.geo
  const segments: string[] = []

  if (name != null && String(name) !== '') segments.push(String(name))
  if (state != null && String(state) !== '') segments.push(String(state))
  if (geo != null && String(geo) !== '') segments.push(String(geo))
  if (id != null && String(id) !== '' && String(id) !== String(name)) segments.push(`id ${String(id)}`)
  return segments.length > 0 ? segments.join(' — ') : summarizeObjectOneLine(dpg)
}

// Converts arrays into display text for a single row as Card rows are string-like content
const stringifyArrayForRow = (arr: AddOnValue[]): string => {
  if (arr.length === 0) return ''
  if (arr.every(item => isPrimitiveValue(item))) return arr.map(String).join(', ')

  return arr
    .map((item) => {
      if (isPlainObject(item)) return formatDataPlaneGroupRow(item) || summarizeObjectOneLine(item)
      return String(item)
    })
    .join('; ')
}

// Cloud-authentication record for display as UI only needs primitive cloud-auth fields
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
    if (isPrimitiveValue(v)) out[k] = v
  }

  return Object.keys(out).length > 0 ? out : null
}

// plits state metadata into non-cloud metadata and cloud-auth fields
const normalizeStateMetadataForDisplay = (
  meta: AddOnRecord,
  cloudAuthAvailable: boolean ):
{ stateMetadata: AddOnRecord, cloudAuthFields: AddOnRecord } => {
  const out: AddOnRecord = stripCloudAuthenticationKeyDeep({ ...meta }) as AddOnRecord
  const cloudAuthFields: AddOnRecord = {}
  const cloudAuth = meta.cloud_authentication

  const cloudAuthObject = toPlainObject(cloudAuth)
  if (cloudAuthObject) {
    const primitiveCloudAuth = cloudAuthenticationObjectForDisplay(cloudAuthObject, cloudAuthAvailable)

    if (primitiveCloudAuth !== null) {
      Object.assign(cloudAuthFields, primitiveCloudAuth)
    }
  }

  return { stateMetadata: out, cloudAuthFields }
}

// Normalizes `state_metadata` values from mixed API shapes as this field can be object/string/null and should be a consistent display-ready val
const stateMetadataValueForDisplay = (value: AddOnValue | undefined): AddOnValue | AddOnRecord | undefined => {
  if (isPlainObject(value)) {
    return isNonEmptyObject(value) ? { ...value } : undefined
  }
  if (typeof value === 'string') {
    const parsed = toPlainObject(value as AddOnValue)
    if (parsed) {
      return isNonEmptyObject(parsed) ? parsed : undefined
    }
    return value.trim() !== '' ? value : undefined
  }
  return value != null ? value : undefined
}

// Transforms one dpg item into flat key/value pairs as nested DPG payloads need flattening to render in rows
const dataPlaneGroupItemRecord = (obj: AddOnRecord): AddOnRecord => {
  const out: AddOnRecord = {}
  for (const [k, v] of Object.entries(obj)) {
    if (k === 'state_metadata') {
      const stateMetadataValue = stateMetadataValueForDisplay(v)
      if (stateMetadataValue !== undefined) out[k] = stateMetadataValue
      continue
    }

    if (isPrimitiveValue(v)) {
      out[k] = v
      continue
    }

    if (v == null) continue

    if (Array.isArray(v)) {
      out[k] = stringifyArrayForRow(v)
      continue
    }

    if (isPlainObject(v)) {
      const inner = Object.entries(v)
      if (inner.length === 0) continue
      const allPrimitive = inner.every(([, iv]) => isPrimitiveValue(iv))
      if (allPrimitive) {
        for (const [nk, nv] of inner) out[`${k}_${nk}`] = nv
      } else {
        out[k] = summarizeObjectOneLine(v)
      }
    }
  }
  return out
}

// Merges managed-cache config fields into ordered display rows as config has diff sections (DPG, metadata, cloud auth) that require custom handling
const mergeManagedCacheConfigLikePartialRecord = (
  configRecord: AddOnRecord,
  put: (key: string, value: DisplayRowValue) => void,
  cloudAuthAvailable: boolean): void => {
  // Config sections that are rendered separately
  let dpgRaw: AddOnValue | undefined
  let stateMetadataRaw: AddOnValue | undefined
  let cloudAuthRaw: AddOnValue | undefined
  let capacityConfigRaw: AddOnValue | undefined
  let hasFlattenedCloudAuthenticationFields = false
  const objectRows: Array<[string, AddOnRecord]> = []

  for (const [k, v] of Object.entries(configRecord)) {
    if (k === 'data_plane_groups' || k === 'data_plane_group') {
      dpgRaw = v
      continue
    }

    if (k === 'state_metadata') {
      stateMetadataRaw = v
      continue
    }

    if (k === 'cloud_authentication') {
      cloudAuthRaw = v
      continue
    }

    if (k === 'capacity_config') {
      capacityConfigRaw = v
      continue
    }

    if (v == null) continue

    if (isPrimitiveValue(v)) {
      if (k.startsWith('cloud_authentication_')) {
        hasFlattenedCloudAuthenticationFields = true
      }
      put(k, v)
      continue
    }

    if (Array.isArray(v)) {
      put(k, stringifyArrayForRow(v))
      continue
    }

    if (isNonEmptyObject(v)) {
      objectRows.push([k, v])
    }
  }

  if (isNonEmptyObject(capacityConfigRaw)) {
    put('capacity_config', { ...capacityConfigRaw })
  }

  if (dpgRaw != null) {
    const asList: AddOnValue[] = Array.isArray(dpgRaw) ? dpgRaw : (isPlainObject(dpgRaw) ? [dpgRaw] : [])
    const records = asList
      .filter((item): item is AddOnRecord => isPlainObject(item))
      .map((item, index) => ({
        ...dataPlaneGroupItemRecord(item),
        name: `Data plane group ${index + 1}`,
      }))

    if (records.length === 1) put('data_plane_groups', records[0])
    if (records.length > 1) put('data_plane_groups', records)
  }

  if (isNonEmptyObject(stateMetadataRaw)) {
    const { stateMetadata, cloudAuthFields } = normalizeStateMetadataForDisplay(stateMetadataRaw, cloudAuthAvailable)
    if (Object.keys(stateMetadata).length > 0) {
      put('cache_state_metadata', stateMetadata)
    }

    if (!hasFlattenedCloudAuthenticationFields && Object.keys(cloudAuthFields).length > 0) {
      put('cloud_authentication', cloudAuthFields)
    }
  }

  const cloudAuthRawObject = toPlainObject(cloudAuthRaw)
  if (cloudAuthRawObject && !hasFlattenedCloudAuthenticationFields) {
    const grouped = cloudAuthenticationObjectForDisplay(cloudAuthRawObject, cloudAuthAvailable)

    if (grouped !== null) {
      put('cloud_authentication', grouped)
    }
  }

  for (const [k, v] of objectRows) {
    put(k, { ...v })
  }
}

export const addOnApiResponseToDisplayRecord = (
  data: AddOnRecord,
  options?: { cloudAuthAvailable?: boolean }): DisplayRecord => {
  const cloudAuthAvailable = options?.cloudAuthAvailable === true
  const addOn = parseManagedAddOnDetailPayload(data)
  if (addOn === null) return {}

  const orderedRows: Array<[string, DisplayRowValue]> = []
  const emittedKeys = new Set<string>()
  const addOnRecord = addOn as unknown as Record<string, AddOnValue | undefined>

  // Inserts a row once while preserving first-write order as this ordering prevents later keys from overwriting preferred earlier fields
  const put = (key: string, value: DisplayRowValue) => {
    if (emittedKeys.has(key)) return
    emittedKeys.add(key)
    orderedRows.push([key, value])
  }

  const putDisplayableValue = (key: string, value: AddOnValue | undefined): void => {
    if (value === undefined || value == null) return
    if (isPrimitiveValue(value)) {
      put(key, value)
      return
    }
    if (Array.isArray(value)) {
      put(key, stringifyArrayForRow(value))
      return
    }
    if (isNonEmptyObject(value)) {
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

  const handledRoot = new Set<string>(['config', 'cloud_authentication', ...preferredRoot])
  for (const key of Object.keys(addOnRecord).sort()) {
    if (handledRoot.has(key)) continue
    putDisplayableValue(key, addOnRecord[key])
  }

  if (isPlainObject(addOn.config)) {
    mergeManagedCacheConfigLikePartialRecord(addOn.config, put, cloudAuthAvailable)
  }

  return Object.fromEntries(orderedRows)
}

