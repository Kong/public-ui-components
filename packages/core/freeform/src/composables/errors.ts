import { computed, toValue } from 'vue'
import { get } from 'lodash-es'
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
 * value (e.g. a record that is switched off), or is hidden by a render rule.
 */
export function createFieldErrors(options: {
  errors: MaybeRefOrGetter<FieldError[] | undefined>
  formData: Record<string, any>
  getSchema: (path: string) => UnionFieldSchema | undefined
  getKey: (id: KeyId) => string | undefined
  isFieldHidden: (path: string) => boolean
  /** Called with the errors rewritten after the data's structure changed */
  onChange?: (errors: FieldError[]) => void
}) {
  const { formData, getSchema, getKey, isFieldHidden, onChange } = options

  /**
   * The nearest ancestor of `fieldPath` that is a set or a JSON field
   */
  function findValueField(fieldPath: string): string | null {
    const segments = utils.toArray(fieldPath)
    for (let length = segments.length - 1; length > 0; length--) {
      const path = utils.resolve(...segments.slice(0, length))
      const schema = getSchema(path)
      if (schema) {
        return schema.type === 'set' || schema.type === 'json' ? path : null
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
      // A set or a JSON value is one field: its items and keys have no schema
      // of their own (e.g. `tags.1`), so the field itself shows their errors.
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
      if (isFieldHidden(path)) {
        return null
      }
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
    const errors = toValue(options.errors) ?? []
    const prefix = utils.parseDataPath(toDataPath(containerFieldPath, getKey))
    let changed = false

    const next = errors.flatMap((error) => {
      let segments: string[]
      try {
        segments = utils.parseDataPath(error.path)
      } catch {
        return [error]
      }
      const isUnder = segments.length > prefix.length && prefix.every((segment, i) => segments[i] === segment)
      if (!isUnder) {
        return [error]
      }

      const rest = fn(segments.slice(prefix.length))
      if (!rest) {
        changed = true
        return []
      }
      const path = utils.formatDataPath([...prefix, ...rest])
      if (path === error.path) {
        return [error]
      }
      changed = true
      return [{ ...error, path }]
    })

    if (changed) {
      onChange?.(next)
    }
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
