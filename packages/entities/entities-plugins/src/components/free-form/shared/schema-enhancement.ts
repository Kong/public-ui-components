import type { FieldRules } from '../../../types'
import type {
  AtLeastOneOfEntityCheck,
  EntityCheck,
  FormSchema,
  MutuallyExclusiveEntityCheck,
  MutuallyRequiredEntityCheck,
  RecordFieldSchema,
} from '../../../types/plugins/form-schema'
import { PLUGIN_METADATA } from '../../../definitions/metadata'
import { toArray, resolve, separator } from './utils'

type SupportedEntityCheck =
  | AtLeastOneOfEntityCheck
  | MutuallyRequiredEntityCheck
  | MutuallyExclusiveEntityCheck

/**
 * Calculate the Lowest Common Ancestor (LCA) of multiple field paths
 * Returns empty string if no common ancestor (keep in place)
 * @example
 * getLCA(['a.b.c', 'a.b.d']) => 'a.b'
 * getLCA(['a.b.c', 'a.c.d']) => 'a'
 * getLCA(['a.b.c', 'b.c.d']) => ''
 */
function getLCA(paths: string[]): string {
  if (paths.length === 0) return ''
  if (paths.length === 1) {
    const parts = toArray(paths[0])
    return resolve(...parts.slice(0, -1))
  }

  const splitPaths = paths.map(p => toArray(p))
  const minLen = Math.min(...splitPaths.map(p => p.length))

  const lcaParts: string[] = []
  for (let i = 0; i < minLen - 1; i++) {
    const segment = splitPaths[0][i]
    if (splitPaths.every(p => p[i] === segment)) {
      lcaParts.push(segment)
    } else {
      break
    }
  }

  return resolve(...lcaParts)
}

/**
 * Extract field paths from a supported entity check
 * Returns null for unsupported check types
 */
function getFieldsFromCheck(check: EntityCheck): string[] | null {
  if ('at_least_one_of' in check) return check.at_least_one_of
  if ('mutually_required' in check) return check.mutually_required
  if ('mutually_exclusive' in check) return check.mutually_exclusive
  return null
}

/**
 * Strip a prefix from all paths
 * @example
 * stripPrefix(['a.b.c', 'a.b.d'], 'a.b') => ['c', 'd']
 */
function stripPrefix(paths: string[], prefix: string): string[] {
  if (!prefix) return paths
  const prefixWithDot = prefix + separator
  return paths.map(p => p.startsWith(prefixWithDot)
    ? p.slice(prefixWithDot.length)
    : p,
  )
}

/**
 * Create a relocated check with stripped path prefix
 */
function relocateCheck(check: SupportedEntityCheck, prefix: string): SupportedEntityCheck {
  const fields = getFieldsFromCheck(check)!
  const newFields = stripPrefix(fields, prefix)

  if ('at_least_one_of' in check) return { at_least_one_of: newFields }
  if ('mutually_required' in check) return { mutually_required: newFields }
  return { mutually_exclusive: newFields }
}

interface CheckDistribution {
  keep: EntityCheck[]
  move: Map<string, EntityCheck[]>
}

/**
 * Analyze entity checks and determine which should be moved to child levels
 */
function analyzeChecks(checks: EntityCheck[]): CheckDistribution {
  const keep: EntityCheck[] = []
  const move = new Map<string, EntityCheck[]>()

  for (const check of checks) {
    const fields = getFieldsFromCheck(check)

    // Unsupported type, keep in place
    if (!fields) {
      keep.push(check)
      continue
    }

    const lca = getLCA(fields)

    // No common ancestor, keep in place
    if (!lca) {
      keep.push(check)
      continue
    }

    // Move to LCA level
    const relocated = relocateCheck(check as SupportedEntityCheck, lca)
    if (!move.has(lca)) {
      move.set(lca, [])
    }
    move.get(lca)!.push(relocated)
  }

  return { keep, move }
}

/**
 * Inject entity checks at a specific path in the schema tree
 */
function injectChecksAtPath(
  schema: RecordFieldSchema,
  path: string,
  checks: EntityCheck[],
): void {
  const parts = path.split('.')
  let current: RecordFieldSchema = schema

  for (const part of parts) {
    const fieldDef = current.fields.find(f => Object.keys(f)[0] === part)
    if (!fieldDef) return // Path doesn't exist, skip

    const fieldSchema = fieldDef[part]
    if (fieldSchema.type !== 'record') return // Not a record type, skip

    current = fieldSchema as RecordFieldSchema
  }

  // Inject at target level
  current.entity_checks = [
    ...(current.entity_checks || []),
    ...checks,
  ]
}

/**
 * Recursively process a record schema and distribute entity checks
 */
function processRecordSchema(schema: RecordFieldSchema): void {
  if (schema.entity_checks?.length) {
    const { keep, move } = analyzeChecks(schema.entity_checks)
    schema.entity_checks = keep.length ? keep : undefined

    // Inject to child levels
    for (const [path, checks] of move) {
      injectChecksAtPath(schema, path, checks)
    }
  }

  // Recursively process child records
  for (const fieldDef of schema.fields) {
    const fieldSchema = Object.values(fieldDef)[0]
    if (fieldSchema.type === 'record') {
      processRecordSchema(fieldSchema as RecordFieldSchema)
    }
  }
}

/**
 * Distribute entity checks to their appropriate levels based on field path LCA
 * @param schema - The form schema to process
 * @returns A new schema with entity checks distributed to appropriate levels
 */
export function distributeEntityChecks(schema: FormSchema): FormSchema {
  // Deep clone to avoid mutating the original schema
  const cloned = JSON.parse(JSON.stringify(schema)) as FormSchema

  // Treat FormSchema as a record structure
  const rootRecord: RecordFieldSchema = {
    type: 'record',
    fields: cloned.fields,
  }

  processRecordSchema(rootRecord)

  cloned.fields = rootRecord.fields

  return cloned
}

/**
 * Append entity checks from the legacy plugin metadata to the schema
 * All entity checks will be appended to the `config` field
 * @param pluginName - The key of PLUGIN_METADATA
 * @param schema - The original form schema
 */
export function appendEntityChecksFromMetadata(
  pluginName: string,
  schema: FormSchema,
): FormSchema {
  const metadata = PLUGIN_METADATA[pluginName]
  if (!metadata || !metadata.fieldRules) {
    return schema
  }
  const additionalEntityChecks = transformFieldRulesToEntityChecks(metadata.fieldRules)

  const enhancedSchema: FormSchema = { ...schema }

  enhancedSchema.fields = enhancedSchema.fields.map(field => {
    const fieldName = Object.keys(field)[0]
    if (fieldName === 'config') {
      return {
        config: {
          ...field.config,
          entity_checks: [
            ...(field.config.entity_checks || []),
            ...additionalEntityChecks,
          ],
        },
      }
    }
    return field
  })

  return enhancedSchema
}

export function transformFieldRulesToEntityChecks(fieldRules: FieldRules): EntityCheck[] {
  const entityChecks: EntityCheck[] = []

  // Helper function to remove 'config.' prefix from field names
  const removeConfigPrefix = (field: string): string => {
    return field.startsWith('config.') ? field.substring(7) : field
  }

  // Transform atLeastOneOf to at_least_one_of entity checks
  if (fieldRules.atLeastOneOf) {
    fieldRules.atLeastOneOf.forEach(fields => {
      entityChecks.push({
        at_least_one_of: fields.map(removeConfigPrefix),
      })
    })
  }

  // Transform onlyOneOf to mutually_exclusive entity checks
  if (fieldRules.onlyOneOf) {
    fieldRules.onlyOneOf.forEach(fields => {
      entityChecks.push({
        mutually_exclusive: fields.map(removeConfigPrefix),
      })
    })
  }

  // Transform mutuallyRequired to mutually_required entity checks
  if (fieldRules.mutuallyRequired) {
    fieldRules.mutuallyRequired.forEach(fields => {
      entityChecks.push({
        mutually_required: fields.map(removeConfigPrefix),
      })
    })
  }

  // Transform onlyOneOfMutuallyRequired to a combination of entity checks
  // For each rule, we need to ensure only one group is provided and all fields in that group are required
  // Example: [['http_proxy_host', 'http_proxy_port'], ['https_proxy_host', 'https_proxy_port']]
  // Results in:
  //   - mutually_required: [http_proxy_host, http_proxy_port]
  //   - mutually_required: [https_proxy_host, https_proxy_port]
  //   - mutually_exclusive: [http_proxy_host, https_proxy_host]
  //   - mutually_exclusive: [http_proxy_host, https_proxy_port]
  //   - mutually_exclusive: [http_proxy_port, https_proxy_host]
  //   - mutually_exclusive: [http_proxy_port, https_proxy_port]
  if (fieldRules.onlyOneOfMutuallyRequired) {
    fieldRules.onlyOneOfMutuallyRequired.forEach(rule => {
      // Add mutually_required check for each group
      rule.forEach(group => {
        entityChecks.push({
          mutually_required: group.map(removeConfigPrefix),
        })
      })

      // Add mutually_exclusive checks between fields from different groups
      // This ensures only one group is provided
      if (rule.length > 1) {
        // For each pair of groups, make their fields mutually exclusive
        for (let i = 0; i < rule.length; i++) {
          for (let j = i + 1; j < rule.length; j++) {
            const group1Fields = rule[i].map(removeConfigPrefix)
            const group2Fields = rule[j].map(removeConfigPrefix)

            // Add mutual exclusion between all fields of the two groups
            // This prevents mixing fields from different groups
            group1Fields.forEach(field1 => {
              group2Fields.forEach(field2 => {
                entityChecks.push({
                  mutually_exclusive: [field1, field2],
                })
              })
            })
          }
        }
      }
    })
  }

  return entityChecks
}
