import { computed, toRaw, toValue, watch } from 'vue'
import { cloneDeep, get, isEqual } from 'lodash-es'
import * as utils from '../utils'
import { isKid } from './key-id-map'
import { toDataPath, toFieldPath } from './reveal'

import type { MaybeRefOrGetter } from 'vue'
import type { FieldError, KeyId } from '../types'
import type { UnionFieldSchema } from '../form-schema'

/**
 * Matches the errors a form is given to the fields that show them.
 *
 * An error is matched when a field can show it in the current state. It is
 * unmatched when its path is malformed or not in the schema, names a map key
 * that isn't in the data, sits under a record or array item that has no
 * value (e.g. a record that is switched off), is hidden by a render rule, or
 * no mounted field renders it (e.g. it is left out with `omit` everywhere).
 *
 * An error is dropped once the value of a field it is about changes (see
 * `FieldError.fields`), whatever the new value is.
 */
export function createFieldErrors(options: {
  errors: MaybeRefOrGetter<FieldError[] | undefined>
  formData: Record<string, any>
  /**
   * The form data with map entries keyed by their names, which stay the same when
   * the data is set again. Without it, errors are not dropped as values change.
   */
  getData?: () => Record<string, any>
  getSchema: (path: string) => UnionFieldSchema | undefined
  getKey: (id: KeyId) => string | undefined
  isFieldHidden: (path: string) => boolean
  /**
   * Whether a mounted field shows the field at a path, now or once expanded.
   * Without it, every field in the schema counts as rendered.
   */
  isFieldRendered?: (fieldPath: string) => boolean
  /** Called with the errors rewritten after the data's structure changed */
  onChange?: (errors: FieldError[]) => void
}) {
  const { formData, getData, getSchema, getKey, isFieldHidden, isFieldRendered, onChange } = options

  /**
   * The errors the form last emitted, until the host passes them back: the data
   * may change before it does, e.g. as an array item is removed
   */
  let emitted: FieldError[] | undefined

  function getErrors(): FieldError[] {
    return emitted ?? toValue(options.errors) ?? []
  }

  function emitErrors(errors: FieldError[]) {
    emitted = errors
    onChange?.(errors)
  }

  /**
   * The nearest ancestor of `fieldPath` that is a set, a JSON or a foreign field
   */
  function findValueField(fieldPath: string): string | null {
    const segments = utils.toArray(fieldPath)
    for (let length = segments.length - 1; length > 0; length--) {
      const path = utils.resolve(...segments.slice(0, length))
      const schema = getSchema(path)
      if (schema) {
        return schema.type === 'set' || schema.type === 'json' || schema.type === 'foreign' ? path : null
      }
    }
    return null
  }

  /**
   * The field path an error belongs to, or `null` when no field can show it
   */
  function matchFieldPath(error: FieldError): string | null {
    let segments: string[]
    try {
      segments = utils.parseDataPath(error.path)
    } catch {
      return null
    }
    if (!segments.length) {
      return null
    }

    let fieldPath = toFieldPath(segments, options)
    if (!getSchema(fieldPath)) {
      // A set, a JSON or a foreign value is one field: its items and keys have
      // no schema of their own (e.g. `tags.1`, `service.id`), so the field
      // itself shows their errors.
      const owner = findValueField(fieldPath)
      if (!owner) {
        return null
      }
      fieldPath = owner
    }

    const fieldSegments = utils.toArray(fieldPath)
    for (let length = 1; length <= fieldSegments.length; length++) {
      const path = utils.resolve(...fieldSegments.slice(0, length))
      const parentSchema = length > 1 ? getSchema(utils.resolve(...fieldSegments.slice(0, length - 1))) : undefined

      // `toFieldPath` keeps a map key that isn't in the data as is
      if (parentSchema?.type === 'map' && !isKid(fieldSegments[length - 1])) {
        return null
      }
      if (length < fieldSegments.length && get(formData, fieldSegments.slice(0, length)) == null) {
        return null
      }
      // The last segment too, when it is an array index: no item, no field to show it
      if (parentSchema?.type === 'array') {
        const items = get(formData, fieldSegments.slice(0, length - 1))
        if (!Array.isArray(items) || Number(fieldSegments[length - 1]) >= items.length) {
          return null
        }
      }
      if (isFieldHidden(path)) {
        return null
      }
    }

    // The schema has it, but a custom form may still render it nowhere, e.g.
    // CommonForm splits `config` into two records that `omit` each other's
    // fields, and a field both leave out shows in neither
    if (isFieldRendered && !isFieldRendered(fieldPath)) {
      return null
    }

    return fieldPath
  }

  const matched = computed(() => {
    const byFieldPath = new Map<string, FieldError[]>()
    const unmatched: FieldError[] = []

    for (const error of toValue(options.errors) ?? []) {
      const fieldPath = matchFieldPath(error)
      if (fieldPath == null) {
        unmatched.push(error)
        continue
      }
      const list = byFieldPath.get(fieldPath)
      if (list) {
        list.push(error)
      } else {
        byFieldPath.set(fieldPath, [error])
      }
    }

    return { byFieldPath, unmatched }
  })

  /**
   * The errors of the field at `fieldPath`, and with `deep` of the fields
   * below it too
   */
  function getFieldErrors(fieldPath: string, deep = true): FieldError[] {
    if (!deep) {
      return matched.value.byFieldPath.get(fieldPath) ?? []
    }
    const result: FieldError[] = []
    for (const [path, errors] of matched.value.byFieldPath) {
      if (utils.isWithinPath(path, fieldPath)) {
        result.push(...errors)
      }
    }
    return result
  }

  /**
   * The errors no field can show in the current state, for the host to show
   * elsewhere
   */
  const unmatchedErrors = computed(() => matched.value.unmatched)

  /**
   * Rewrites the errors under a container after its structure changed: `fn`
   * gets the segments of an error's path below the container, and returns new
   * ones, or `null` to drop the error. Errors on the container itself and
   * elsewhere are kept as they are.
   */
  function rewriteErrorsUnder(containerFieldPath: string, fn: (rest: string[]) => string[] | null) {
    const prefix = utils.parseDataPath(toDataPath(containerFieldPath, getKey))

    function rewrite(path: string): string | null {
      let segments: string[]
      try {
        segments = utils.parseDataPath(path)
      } catch {
        return path
      }
      const isUnder = segments.length > prefix.length && prefix.every((segment, i) => segments[i] === segment)
      if (!isUnder) {
        return path
      }
      const rest = fn(segments.slice(prefix.length))
      return rest && utils.formatDataPath([...prefix, ...rest])
    }

    let changed = false

    const next = getErrors().flatMap((error) => {
      const path = rewrite(error.path)
      const fields = error.fields?.map(rewrite)
      // A field the error is about is gone, so its value changed
      if (path == null || fields?.includes(null)) {
        changed = true
        return []
      }
      if (path === error.path && (fields ?? []).every((field, i) => field === error.fields![i])) {
        return [error]
      }
      changed = true
      return [{ ...error, path, ...(fields && { fields: fields as string[] }) }]
    })

    if (changed) {
      emitErrors(next)
    }
  }

  /**
   * The data path segments of the values an error is about: those of its
   * `fields`, or else of its `path`. An error inside a set, a JSON or a foreign
   * value is about the whole field.
   */
  function getValueSegments(error: FieldError): string[][] {
    return (error.fields ?? [error.path]).flatMap((path) => {
      let segments: string[]
      try {
        segments = utils.parseDataPath(path)
      } catch {
        return []
      }
      if (!segments.length) {
        return [segments]
      }
      const fieldPath = toFieldPath(segments, options)
      const owner = getSchema(fieldPath) ? null : findValueField(fieldPath)
      return [owner ? segments.slice(0, utils.toArray(owner).length) : segments]
    })
  }

  /** The values the errors are about, as each error first saw them */
  const snapshots = new WeakMap<FieldError, unknown[]>()

  /**
   * Drops the errors a value they are about changed for. An error seen for the
   * first time keeps the values as they are now, to compare with later.
   */
  function dropEditedErrors(data: Record<string, any>) {
    let changed = false

    const next = getErrors().filter((error) => {
      const values = getValueSegments(error).map(segments => segments.length ? get(data, segments) : data)
      const snapshot = snapshots.get(toRaw(error))
      if (!snapshot) {
        snapshots.set(toRaw(error), cloneDeep(values))
        return true
      }
      if (isEqual(snapshot, values)) {
        return true
      }
      changed = true
      return false
    })

    if (changed) {
      emitErrors(next)
    }
  }

  if (getData) {
    // `post`: a host may pass new data with the errors, and the form applies it in
    // the pre queue, so the snapshots wait for it. Their order there follows the
    // order the props are set in.
    watch(() => toValue(options.errors), () => {
      emitted = undefined
      dropEditedErrors(getData())
    }, { immediate: true, flush: 'post' })
    watch(getData, dropEditedErrors)
  }

  /**
   * Drops the errors of a removed array item, and moves the errors of the
   * items after it to their new index, so no error lands on another item.
   * Call before the item's index is reused.
   */
  function onArrayItemRemoved(arrayFieldPath: string, index: number) {
    rewriteErrorsUnder(arrayFieldPath, ([itemIndex, ...rest]) => {
      const current = Number(itemIndex)
      if (current === index) return null
      return current > index ? [String(current - 1), ...rest] : [itemIndex, ...rest]
    })
  }

  /**
   * Moves the errors of a map entry along when its key is renamed
   */
  function onMapKeyRenamed(mapFieldPath: string, from: string, to: string) {
    rewriteErrorsUnder(mapFieldPath, ([key, ...rest]) => key === from ? [to, ...rest] : [key, ...rest])
  }

  /**
   * Drops the errors of a removed map entry
   */
  function onMapKeyRemoved(mapFieldPath: string, key: string) {
    rewriteErrorsUnder(mapFieldPath, rest => rest[0] === key ? null : rest)
  }

  return {
    getFieldErrors,
    unmatchedErrors,
    onArrayItemRemoved,
    onMapKeyRenamed,
    onMapKeyRemoved,
  }
}
