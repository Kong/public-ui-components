
import type { FlattendRedisConfigurationFields } from './types'
import type { Field } from '../shared/types'
import type { NamedFieldSchema, UnionFieldSchema } from '../../../types/plugins/form-schema'
import { toValue, type MaybeRefOrGetter } from 'vue'
import { isEqual } from 'lodash-es'

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
  fields = fields.sort((a, b) => {
    const aKey = Object.keys(a)[0]
    const bKey = Object.keys(b)[0]

    const aIndex = fieldNames.indexOf(aKey)
    const bIndex = fieldNames.indexOf(bKey)

    if (aIndex === -1 && bIndex === -1) return 0
    if (aIndex === -1) return 1
    if (bIndex === -1) return -1

    return aIndex - bIndex
  })
  return fields
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
 * Algorithm:
 * - Iterates through fields in original order
 * - Skips bundled fields if their dependencies aren't satisfied yet
 * - When a field's dependencies are met, adds it along with all subsequent
 *   fields in the same bundle
 * - Triggers cascade checking to handle transitive dependencies across bundles
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
  interface BundleInfo {
    bundleIndex: number
    positionInBundle: number
  }

  // Build lookup maps for O(1) access
  // Support fields appearing in multiple bundles
  const bundleMap = new Map<string, BundleInfo[]>()
  bundles.forEach((bundle, bundleIndex) => {
    bundle.forEach((fieldName, positionInBundle) => {
      if (!bundleMap.has(fieldName)) {
        bundleMap.set(fieldName, [])
      }
      bundleMap.get(fieldName)!.push({ bundleIndex, positionInBundle })
    })
  })

  const fieldMap = new Map<string, NamedFieldSchema>()
  fields.forEach(field => {
    const fieldName = Object.keys(field)[0]
    fieldMap.set(fieldName, field)
  })

  // Track processing state
  const addedFields = new Set<string>()
  const result: NamedFieldSchema[] = []
  const skippedFields = new Set<string>() // Track fields we've seen but skipped due to dependencies

  // Helper: Get field name from NamedFieldSchema
  const getFieldName = (field: NamedFieldSchema): string => Object.keys(field)[0]

  // Helper: Check if all dependencies for a field are satisfied
  // A field's dependencies are satisfied if ALL its bundle dependencies are satisfied
  const areDependenciesSatisfied = (fieldName: string): boolean => {
    const bundleInfos = bundleMap.get(fieldName)
    if (!bundleInfos || bundleInfos.length === 0) return true

    // Check all bundles this field appears in
    for (const bundleInfo of bundleInfos) {
      const bundle = bundles[bundleInfo.bundleIndex]
      // All fields before this one in this bundle must be added
      // BUT only check dependencies that exist in fieldMap
      for (let i = 0; i < bundleInfo.positionInBundle; i++) {
        const dependencyField = bundle[i]
        // Only check dependency if it exists in the fields list
        if (fieldMap.has(dependencyField) && !addedFields.has(dependencyField)) {
          return false
        }
      }
    }
    return true
  }

  // Helper: Add field and cascade to dependent fields
  const addFieldWithCascade = (fieldName: string, shouldCascade: boolean = true) => {
    if (addedFields.has(fieldName)) return

    const field = fieldMap.get(fieldName)
    if (!field) return

    const bundleInfos = bundleMap.get(fieldName)

    // Add current field
    result.push(field)
    addedFields.add(fieldName)

    // Add remaining fields in all bundles this field appears in
    if (bundleInfos) {
      for (const bundleInfo of bundleInfos) {
        const bundle = bundles[bundleInfo.bundleIndex]
        for (let i = bundleInfo.positionInBundle + 1; i < bundle.length; i++) {
          const nextFieldName = bundle[i]
          if (!addedFields.has(nextFieldName)) {
            const nextField = fieldMap.get(nextFieldName)
            if (nextField) {
              result.push(nextField)
              addedFields.add(nextFieldName)
            }
          }
        }
      }
    }

    // Cascade: check if newly added fields unlock other bundles
    // Only cascade if requested and only check previously skipped fields
    if (shouldCascade) {
      let hasNewAdditions = true
      while (hasNewAdditions) {
        hasNewAdditions = false

        // Only check fields that we've already encountered and skipped
        for (const candidateFieldName of skippedFields) {
          if (addedFields.has(candidateFieldName)) {
            skippedFields.delete(candidateFieldName)
            continue
          }

          if (areDependenciesSatisfied(candidateFieldName)) {
            const candidateField = fieldMap.get(candidateFieldName)
            if (!candidateField) continue

            const candidateBundleInfos = bundleMap.get(candidateFieldName)
            if (!candidateBundleInfos) continue

            hasNewAdditions = true
            result.push(candidateField)
            addedFields.add(candidateFieldName)
            skippedFields.delete(candidateFieldName)

            // Add remaining fields in all bundles
            for (const candidateBundleInfo of candidateBundleInfos) {
              const bundle = bundles[candidateBundleInfo.bundleIndex]
              for (let i = candidateBundleInfo.positionInBundle + 1; i < bundle.length; i++) {
                const nextFieldName = bundle[i]
                if (!addedFields.has(nextFieldName)) {
                  const nextField = fieldMap.get(nextFieldName)
                  if (nextField) {
                    result.push(nextField)
                    addedFields.add(nextFieldName)
                    skippedFields.delete(nextFieldName)
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  // Main loop: process fields in original order
  for (const field of fields) {
    const fieldName = getFieldName(field)

    if (addedFields.has(fieldName)) {
      continue
    }

    const bundleInfos = bundleMap.get(fieldName)

    if (!bundleInfos || bundleInfos.length === 0) {
      // Not in any bundle - add directly without cascading
      addFieldWithCascade(fieldName, false)
    } else {
      // In a bundle - check dependencies first
      if (areDependenciesSatisfied(fieldName)) {
        // Only cascade for bundled fields (to handle transitive deps)
        addFieldWithCascade(fieldName, true)
      } else {
        // Mark as skipped so cascade can process it later
        skippedFields.add(fieldName)
      }
    }
  }

  return result
}

export function filterByDependencies(
  fields: NamedFieldSchema[],
  dependencies: Record<string, [string, any]>,
  fieldValueGetter: (key: string) => any,
): NamedFieldSchema[] {
  return fields.filter(field => {
    const fieldName = Object.keys(field)[0]
    const dependency = dependencies[fieldName]

    if (!dependency) return true

    const [depField, expectedValue] = dependency
    const actualValue = fieldValueGetter(depField)

    return isEqual(actualValue, expectedValue)
  })
}
