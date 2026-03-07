import { uniqueId } from 'lodash-es'
import { toRef, ref, watch, useAttrs, toValue, onBeforeUnmount } from 'vue'
import { useField, useFieldAttrs } from '../composables'
import { useFormShared } from '../composables/form-context'

import type { LabelAttributes } from '@kong/kongponents'
import type { EmitFn, Ref } from 'vue'
import type { BaseFieldProps } from '../types'

export interface KeyValueFieldProps<TKey extends string = string, TValue = unknown> extends BaseFieldProps {
  initialValue?: Record<TKey, TValue> | null
  label?: string
  keyPlaceholder?: string
  valuePlaceholder?: string
  defaultKey?: TKey
  defaultValue?: TValue
  labelAttributes?: LabelAttributes
  showVaultSecretPicker?: boolean
  // Specify the order of keys in the field.
  // If not provided, the order will be based on the order of object keys (which is not guaranteed when having numeric keys).
  keyOrder?: TKey[]
}

export interface KeyValueFieldEmits<TKey extends string = string, TValue = unknown> {
  change: [Record<TKey, TValue> | null]
}

export interface KVEntry<TKey extends string = string, TValue = unknown> {
  id: string
  key: TKey
  /**
   * Only populated when `syncToFieldValue` is `false` (local-only mode).
   * When `syncToFieldValue` is `true`, values live in formData at ID-keyed paths.
   * Use `getEntryValue(entry.id)` / `setEntryValue(entry.id, val)` instead.
   */
  value?: TValue
}

/**
 * Headless composable for implementing a key-value field.
 *
 * When `syncToFieldValue` is `true` (default), values are stored in formData at stable
 * ID-keyed paths. This decouples user-editable keys from internal data addressing,
 * preventing data loss when keys are renamed or entries are added.
 *
 * When `syncToFieldValue` is `false`, entries carry their own `value` property
 * and the composable does not sync to formData.
 */
export function useKeyValueField<
  TKey extends string = string,
  TValue = unknown,
>(
  props: KeyValueFieldProps<TKey, TValue>,
  emit: EmitFn<KeyValueFieldEmits>,
  syncToFieldValue = true,
) {
  type KVEntries = Array<KVEntry<TKey, TValue>>

  const { value: rawFieldValue, emptyOrDefaultValue, ...field } = useField<Record<string, TValue> | null>(toRef(props, 'name'))
  const fieldAttrs = useFieldAttrs(field.path!, toRef({ ...props, ...useAttrs() }))

  function generateId() {
    return uniqueId('ff-kv-field-')
  }

  /**
   * Compare function for sorting items based on a keyOrder array
   */
  function compareByKeyOrder<T extends string>(a: T, b: T, keyOrder: T[]): number {
    const indexA = keyOrder.indexOf(a)
    const indexB = keyOrder.indexOf(b)
    if (indexA === -1 && indexB === -1) return 0 // both keys not in order
    if (indexA === -1) return 1 // a comes after b
    if (indexB === -1) return -1 // b comes after a
    return indexA - indexB // sort by order in keyOrder
  }

  // ─── syncToFieldValue=false: Legacy mode (entries carry their own value) ───

  if (!syncToFieldValue) {
    return useLegacyMode()
  }

  // ─── syncToFieldValue=true: ID-based mode (values in formData at ID paths) ───

  const { registerValueTransform, unregisterValueTransform } = useFormShared()

  /**
   * Reference to the last object we wrote to rawFieldValue.
   * Used to distinguish our own writes from external updates (form reset, code editor).
   * We compare by object identity (===), not deep equality.
   */
  let lastWrittenRef: unknown = undefined

  /**
   * Initialize entries from user-keyed data, converting to ID-keyed in formData.
   */
  function initFromUserKeys(userKeyed: Record<TKey, TValue> | null | undefined): KVEntries {
    if (!userKeyed) return []
    const newEntries: KVEntries = []
    const idKeyed: Record<string, TValue> = {}

    const keys = Object.keys(userKeyed) as TKey[]
    const orderedKeys = props.keyOrder
      ? [...keys].sort((a, b) => compareByKeyOrder(a, b, props.keyOrder!))
      : keys

    for (const key of orderedKeys) {
      const id = generateId()
      newEntries.push({ id, key })
      idKeyed[id] = userKeyed[key]
    }

    // Write ID-keyed data to formData
    rawFieldValue!.value = idKeyed as Record<string, TValue>
    lastWrittenRef = rawFieldValue!.value
    return newEntries
  }

  const entries = ref(initFromUserKeys(
    props.initialValue ?? toValue(rawFieldValue) as Record<TKey, TValue> | null,
  )) as Ref<KVEntries>

  /**
   * Translate ID-keyed formData to user-keyed output.
   * Used both for `getValue()` transform and for `emit('change')`.
   */
  function translateIdToUserKeys(raw: unknown): Record<TKey, TValue> | null {
    if (raw == null || typeof raw !== 'object') return null
    const result: Record<string, unknown> = {}
    for (const entry of entries.value) {
      if (entry.key && entry.id in (raw as Record<string, unknown>)) {
        result[entry.key] = (raw as Record<string, unknown>)[entry.id]
      }
    }
    if (Object.keys(result).length === 0) {
      // No entries with keys — return schema-aware empty/default
      return (emptyOrDefaultValue?.value ?? null) as Record<TKey, TValue> | null
    }
    return result as Record<TKey, TValue>
  }

  // Register transform so getValue() returns user-keyed data
  registerValueTransform(field.path!.value, translateIdToUserKeys)
  onBeforeUnmount(() => {
    unregisterValueTransform(field.path!.value)
  })

  // ── Change detection: emit translated value when entries or formData changes ──
  watch(
    [entries, () => rawFieldValue?.value],
    () => {
      if (!syncToFieldValue) return
      const translated = translateIdToUserKeys(rawFieldValue?.value)
      emit('change', translated)
    },
    { deep: true },
  )

  // ── Reverse watch: detect external writes (user-keyed data from form reset, code editor) ──
  watch(
    () => rawFieldValue?.value,
    (newRaw) => {
      // Our writes mutate or set the same object reference
      if (newRaw === lastWrittenRef) return
      // External write: new object reference with user keys (from form reset, code editor, etc.)
      rebuildEntriesFromUserKeys(newRaw as Record<TKey, TValue> | null)
    },
    { deep: true },
  )

  /**
   * Rebuild entries and convert user-keyed data to ID-keyed format.
   * Called when external code writes user-keyed data to formData.
   */
  function rebuildEntriesFromUserKeys(userKeyed: Record<TKey, TValue> | null | undefined) {
    if (!userKeyed || typeof userKeyed !== 'object') {
      entries.value = []
      return
    }

    // Match user keys to existing entries where possible (preserves entry IDs for stable rendering)
    const keyToEntry = new Map<TKey, KVEntry<TKey, TValue>>()
    for (const entry of entries.value) {
      if (entry.key) {
        keyToEntry.set(entry.key, entry)
      }
    }

    const newEntries: KVEntries = []
    const idKeyed: Record<string, TValue> = {}

    const keys = Object.keys(userKeyed) as TKey[]
    const orderedKeys = props.keyOrder
      ? [...keys].sort((a, b) => compareByKeyOrder(a, b, props.keyOrder!))
      : keys

    for (const key of orderedKeys) {
      const existing = keyToEntry.get(key)
      if (existing) {
        // Reuse existing entry ID for stable rendering
        newEntries.push(existing)
        idKeyed[existing.id] = userKeyed[key]
      } else {
        // New key: create fresh entry
        const id = generateId()
        newEntries.push({ id, key })
        idKeyed[id] = userKeyed[key]
      }
    }

    entries.value = newEntries
    rawFieldValue!.value = idKeyed as Record<string, TValue>
    lastWrittenRef = rawFieldValue!.value
  }

  // ── Entry value helpers ──

  /**
   * Read an entry's value from formData (ID-keyed path).
   */
  function getEntryValue(entryId: string): TValue | undefined {
    const raw = rawFieldValue?.value as Record<string, TValue> | null | undefined
    return raw?.[entryId]
  }

  /**
   * Write an entry's value to formData (ID-keyed path).
   */
  function setEntryValue(entryId: string, value: TValue) {
    if (!rawFieldValue!.value) {
      rawFieldValue!.value = {} as Record<string, TValue>
      lastWrittenRef = rawFieldValue!.value
    }
    ;(rawFieldValue!.value as Record<string, TValue>)[entryId] = value
  }

  function addEntry(): KVEntry<TKey, TValue> {
    const entry: KVEntry<TKey, TValue> = {
      id: generateId(),
      key: props.defaultKey || ('' as TKey),
    }
    entries.value.push(entry)

    // Initialize value in formData at ID path
    if (!rawFieldValue!.value) {
      rawFieldValue!.value = {} as Record<string, TValue>
    }
    ;(rawFieldValue!.value as Record<string, TValue>)[entry.id] = (props.defaultValue ?? null) as TValue
    lastWrittenRef = rawFieldValue!.value

    return entry
  }

  function removeEntry(id: string) {
    const index = entries.value.findIndex((entry) => entry.id === id)
    if (index !== -1) {
      entries.value.splice(index, 1)
      // Clean up formData
      if (rawFieldValue!.value && typeof rawFieldValue!.value === 'object') {
        delete (rawFieldValue!.value as Record<string, TValue>)[id]
      }
      lastWrittenRef = rawFieldValue!.value
    }
  }

  function reset() {
    const userKeyed = props.initialValue
    entries.value = initFromUserKeys(userKeyed)
  }

  function setValue(value: Record<TKey, TValue> | null | undefined) {
    entries.value = initFromUserKeys(value)
  }

  return {
    entries,
    addEntry,
    removeEntry,
    reset,
    setValue,
    labelAttrs: fieldAttrs,
    field,
    /**
     * Read an entry's value from formData (ID-keyed path).
     */
    getEntryValue,
    /**
     * Write an entry's value to formData (ID-keyed path).
     */
    setEntryValue,
  }

  // ─── Legacy mode implementation (syncToFieldValue=false) ───

  function useLegacyMode() {
    type LegacyKVEntries = Array<KVEntry<TKey, TValue> & { value: TValue }>

    function getLegacyEntries(value: Record<TKey, TValue> | null | undefined, keyOrder?: TKey[]): LegacyKVEntries {
      if (!value) return []
      const entries = Object.entries(value).map(([key, value]) => ({
        id: generateId(),
        key: key as TKey,
        value: value as TValue,
      }))
      if (keyOrder) {
        entries.sort((a, b) => compareByKeyOrder(a.key, b.key, keyOrder))
      }
      return entries
    }

    const legacyEntries = ref(getLegacyEntries(
      props.initialValue ?? toValue(rawFieldValue) as Record<TKey, TValue> | null,
      props.keyOrder,
    )) as Ref<LegacyKVEntries>

    function addEntry(): KVEntry<TKey, TValue> {
      const entry = {
        id: generateId(),
        key: props.defaultKey || ('' as TKey),
        value: (props.defaultValue ?? null) as TValue,
      }
      legacyEntries.value.push(entry)
      return entry
    }

    function removeEntry(id: string) {
      const index = legacyEntries.value.findIndex((entry) => entry.id === id)
      if (index !== -1) {
        legacyEntries.value.splice(index, 1)
      }
    }

    function reset() {
      legacyEntries.value = getLegacyEntries(props.initialValue, props.keyOrder)
    }

    function setValue(value: Record<TKey, TValue> | null | undefined) {
      legacyEntries.value = getLegacyEntries(value, props.keyOrder)
    }

    // No-op helpers for legacy mode (values are on entries)
    function getEntryValue(entryId: string): TValue | undefined {
      return legacyEntries.value.find(e => e.id === entryId)?.value
    }

    function setEntryValue(entryId: string, value: TValue) {
      const entry = legacyEntries.value.find(e => e.id === entryId)
      if (entry) {
        entry.value = value
      }
    }

    return {
      entries: legacyEntries as Ref<KVEntries>,
      addEntry,
      removeEntry,
      reset,
      setValue,
      labelAttrs: fieldAttrs,
      field,
      getEntryValue,
      setEntryValue,
    }
  }
}
