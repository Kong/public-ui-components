
import type { FlattendRedisConfigurationFields } from './types'
import type { Field } from '../shared/types'
import type { NamedFieldSchema, UnionFieldSchema } from '../../../types/plugins/form-schema'
import { toValue, type MaybeRefOrGetter } from 'vue'

export function toSelectItems<T extends string | number>(
  items: T[],
): Array<{ value: T, label: `${T}` }> {
  return items.map((item) => ({ value: item, label: `${item}` }))
}

export const arraySymbol = '*'
export const rootSymbol = '$'
export const separator = '.'

export function resolve(...args: string[]): string {
  return args.join(separator)
}

export function resolveRoot(...args: string[]): string {
  return resolve(rootSymbol, ...args)
}

export function isAbsolute(p: string): boolean {
  return p.startsWith(resolve(rootSymbol, ''))
}

export function toArray(p: string): string[] {
  return p.split(separator).filter(n => n !== '')
}

export function getName(p: string): string {
  const arr = toArray(p)
  return arr[arr.length - 1]
}

/**
 * `$.a.b.c` => `a.b.c`
 */
export function removeRootSymbol(path: string) {
  if (path.startsWith(rootSymbol)) {
    path = resolve(...toArray(path).slice(1))
  }
  return path
}

export function useRedisNonstandardFields(
  partialFields: FlattendRedisConfigurationFields,
  redisFields: Field[],
) {
  const redisFieldPattern = /(?<=config-redis-).*/
  const redisLabelPattern = /Config\.Redis.*/
  const nonStandardConfigFields = redisFields.filter((field) => {
    const match = field.model.match(redisFieldPattern)
    return match && !Object.keys(partialFields).includes(match[0])
  })
  return nonStandardConfigFields.map((field) => {
    const labelMatch = field.label.match(redisLabelPattern)
    return {
      label: labelMatch ? labelMatch[0] : field.label,
      key: field.model,
      value: 'N/A',
      type: 'text',
    }
  })
}

export function isTagField(schema: MaybeRefOrGetter<UnionFieldSchema | undefined>): boolean {
  const schemaVal = toValue(schema)
  if (!schemaVal) return false
  return schemaVal.type === 'set'
    && schemaVal.elements.type === 'string'
    && !schemaVal.elements.one_of
}

export function sortFieldsByFieldNames(
  fields: NamedFieldSchema[],
  fieldNames: string[],
): NamedFieldSchema[] {
  return [...fields].sort((a, b) => {
    const aKey = Object.keys(a)[0]
    const bKey = Object.keys(b)[0]

    const aIndex = fieldNames.indexOf(aKey)
    const bIndex = fieldNames.indexOf(bKey)

    if (aIndex === -1 && bIndex === -1) return 0
    if (aIndex === -1) return 1
    if (bIndex === -1) return -1

    return aIndex - bIndex
  })
}

/**
 * Sorts fields based on dependency bundles while preserving original order.
 *
 * Each bundle defines a dependency chain where earlier fields are dependencies
 * for later fields. The function ensures that:
 * 1. Fields maintain their original relative order when possible
 * 2. Bundled fields appear together in sequence
 * 3. Dependencies are satisfied before dependent fields are added
 * 4. Transitive dependencies across bundles are handled correctly
 *
 * Uses a multi-round iteration approach:
 * - Each round processes fields in original order
 * - Adds fields whose dependencies are satisfied
 * - When adding a bundled field, also adds all subsequent fields in that bundle
 * - Repeats until all fields are added or no progress is made
 *
 * @example
 * // Simple bundle - C and B grouped together
 * fields = [A, B, C, D], bundles = [[C, B]]
 * // Result: [A, C, B, D] - A first, then C,B bundle, then D
 *
 * @example
 * // B appears before A, but A depends on nothing in bundle, so B,A grouped at first occurrence
 * fields = [A, B, C, D], bundles = [[B, A]]
 * // Result: [B, A, C, D]
 *
 * @example
 * // Multiple bundles
 * fields = [A, B, C, D], bundles = [[D, A], [C, B]]
 * // A skipped (needs D), B skipped (needs C), C added with B, D added with A
 * // Result: [C, B, D, A]
 *
 * @example
 * // Transitive dependency: A needs B, B needs C
 * fields = [A, B, C, D], bundles = [[C, B], [B, A]]
 * // A skipped (needs B), B skipped (needs C), C triggers B then A, D last
 * // Result: [C, B, A, D]
 */
export function sortFieldsByBundles(
  fields: NamedFieldSchema[],
  bundles: string[][],
): NamedFieldSchema[] {
  // Build lookup maps
  const fieldMap = new Map<string, NamedFieldSchema>()
  fields.forEach(field => {
    const fieldName = Object.keys(field)[0]
    fieldMap.set(fieldName, field)
  })

  // Map each field to its bundles and positions
  const bundleMap = new Map<string, Array<{ bundleIndex: number, position: number }>>()
  bundles.forEach((bundle, bundleIndex) => {
    bundle.forEach((fieldName, position) => {
      if (!bundleMap.has(fieldName)) {
        bundleMap.set(fieldName, [])
      }
      bundleMap.get(fieldName)!.push({ bundleIndex, position })
    })
  })

  const added = new Set<string>()
  const result: NamedFieldSchema[] = []
  const pending = new Set<string>() // Track fields we've seen but couldn't add yet

  // Check if a field's dependencies are satisfied
  const canAdd = (fieldName: string): boolean => {
    const fieldBundles = bundleMap.get(fieldName)
    if (!fieldBundles) return true // Not in any bundle

    // Check all bundles this field appears in
    for (const { bundleIndex, position } of fieldBundles) {
      const bundle = bundles[bundleIndex]
      // Check all fields before this one in the bundle
      for (let i = 0; i < position; i++) {
        const dependency = bundle[i]
        // Only check if dependency exists in fieldMap
        if (fieldMap.has(dependency) && !added.has(dependency)) {
          return false
        }
      }
    }
    return true
  }

  // Add a field and all subsequent fields in its bundles
  // Then recursively check if any pending fields can now be added
  const addField = (fieldName: string) => {
    if (added.has(fieldName)) return

    const field = fieldMap.get(fieldName)
    if (!field) return

    // Add the field
    result.push(field)
    added.add(fieldName)
    pending.delete(fieldName)

    // Add remaining fields in all bundles this field belongs to
    const fieldBundles = bundleMap.get(fieldName)
    if (fieldBundles) {
      for (const { bundleIndex, position } of fieldBundles) {
        const bundle = bundles[bundleIndex]
        for (let i = position + 1; i < bundle.length; i++) {
          const nextFieldName = bundle[i]
          if (!added.has(nextFieldName)) {
            const nextField = fieldMap.get(nextFieldName)
            if (nextField) {
              result.push(nextField)
              added.add(nextFieldName)
              pending.delete(nextFieldName)
            }
          }
        }
      }
    }

    // Cascade: check if newly added fields unlock any pending fields
    // Use Array.from to avoid modifying Set while iterating
    const pendingArray = Array.from(pending)
    for (const pendingFieldName of pendingArray) {
      if (canAdd(pendingFieldName)) {
        addField(pendingFieldName) // Recursive call
      }
    }
  }

  // Main loop: process fields in original order
  for (const field of fields) {
    const fieldName = Object.keys(field)[0]

    if (added.has(fieldName)) continue

    if (canAdd(fieldName)) {
      addField(fieldName)
    } else {
      pending.add(fieldName)
    }
  }

  return result
}
