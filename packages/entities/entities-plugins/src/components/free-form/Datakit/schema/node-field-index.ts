import { CONFIG_NODE_TYPES } from '../constants'
import { getDatakitConfigJsonSchema } from './json-schema'

export type FieldIndexEntry = {
  inputs?: string[] | null
  outputs?: string[] | null
}

type FieldIndex = Map<string, FieldIndexEntry>
type JsonSchema = Record<string, any>
type Mode = 'strict' | 'compat'

const CONFIG_NODE_TYPE_SET = new Set<string>(CONFIG_NODE_TYPES)

const cacheByMode: Record<Mode, FieldIndex | null> = {
  strict: null,
  compat: null,
}

function getDefinitions(schema: JsonSchema): Record<string, JsonSchema> {
  if (schema.definitions && typeof schema.definitions === 'object') {
    return schema.definitions as Record<string, JsonSchema>
  }
  if (schema.$defs && typeof schema.$defs === 'object') {
    return schema.$defs as Record<string, JsonSchema>
  }
  return {}
}

function resolveRef(schema: JsonSchema, definitions: Record<string, JsonSchema>): JsonSchema {
  if (schema && typeof schema === 'object' && typeof schema.$ref === 'string') {
    const ref = schema.$ref as string
    const match = ref.match(/^#\/(?:definitions|\$defs)\/(.+)$/)
    const name = match?.[1]
    if (name && definitions[name]) {
      return definitions[name]
    }
  }
  return schema
}

function stripNullish(schema: JsonSchema, definitions: Record<string, JsonSchema>): JsonSchema {
  const resolved = resolveRef(schema, definitions)
  const anyOf = resolved?.anyOf
  const oneOf = resolved?.oneOf
  const union = Array.isArray(anyOf) ? anyOf : Array.isArray(oneOf) ? oneOf : null
  if (!union) return resolved

  const nonNull = union.filter((entry: any) => {
    const s = resolveRef(entry, definitions)
    const t = s?.type
    if (t === 'null') return false
    if (Array.isArray(t) && t.includes('null')) return false
    return true
  })

  if (nonNull.length === 1) {
    return resolveRef(nonNull[0], definitions)
  }

  return resolved
}

function extractStringLiterals(schema: JsonSchema, definitions: Record<string, JsonSchema>): string[] {
  const resolved = stripNullish(schema, definitions)
  if (!resolved || typeof resolved !== 'object') return []

  if (typeof resolved.const === 'string') {
    return [resolved.const]
  }
  if (Array.isArray(resolved.enum)) {
    return resolved.enum.filter((v: unknown) => typeof v === 'string')
  }

  const combinators = ['oneOf', 'anyOf', 'allOf'] as const
  for (const key of combinators) {
    const list = resolved[key]
    if (Array.isArray(list)) {
      const values = list.flatMap((entry) => extractStringLiterals(entry, definitions))
      return Array.from(new Set(values))
    }
  }

  return []
}

function mergeKeys(
  current: string[] | null | undefined,
  next: string[] | null | undefined,
): string[] | null | undefined {
  if (next === undefined) return current
  if (current === null || next === null) return null
  if (!current) return next
  if (!next) return current
  return Array.from(new Set([...current, ...next]))
}

function extractObjectKeys(
  schema: JsonSchema | undefined,
  definitions: Record<string, JsonSchema>,
): string[] | null | undefined {
  if (!schema) return undefined
  const resolved = stripNullish(schema, definitions)
  if (!resolved || typeof resolved !== 'object') return undefined

  const combinators = ['oneOf', 'anyOf', 'allOf'] as const
  for (const key of combinators) {
    const list = resolved[key]
    if (Array.isArray(list)) {
      return list.reduce<string[] | null | undefined>((acc, entry) => {
        return mergeKeys(acc, extractObjectKeys(entry, definitions))
      }, undefined)
    }
  }

  const hasAdditional = Object.prototype.hasOwnProperty.call(resolved, 'additionalProperties')
  const isObjectLike =
    resolved.type === 'object' ||
    !!resolved.properties ||
    hasAdditional

  if (!isObjectLike) return undefined

  const additional = resolved.additionalProperties
  if (additional && additional !== false) {
    return null
  }

  if (resolved.properties && typeof resolved.properties === 'object') {
    return Object.keys(resolved.properties)
  }

  return []
}

function isObjectSchema(schema: JsonSchema): boolean {
  if (!schema || typeof schema !== 'object') return false
  if (schema.type === 'object') return true
  if (schema.properties && typeof schema.properties === 'object') return true
  return false
}

function walkSchema(
  schema: JsonSchema,
  definitions: Record<string, JsonSchema>,
  index: FieldIndex,
  seen: Set<JsonSchema>,
) {
  const resolved = resolveRef(schema, definitions)
  if (!resolved || typeof resolved !== 'object') return
  if (seen.has(resolved)) return
  seen.add(resolved)

  if (isObjectSchema(resolved) && resolved.properties && typeof resolved.properties === 'object') {
    const props = resolved.properties as Record<string, JsonSchema>

    if (props.type && props.name) {
      const nodeTypes = extractStringLiterals(props.type, definitions)
        .filter((t) => CONFIG_NODE_TYPE_SET.has(t))

      if (nodeTypes.length) {
        const inputs = extractObjectKeys(props.inputs, definitions)
        const outputs = extractObjectKeys(props.outputs, definitions)

        for (const t of nodeTypes) {
          const existing = index.get(t) ?? {}
          index.set(t, {
            inputs: mergeKeys(existing.inputs, inputs),
            outputs: mergeKeys(existing.outputs, outputs),
          })
        }
      }
    }

    for (const value of Object.values(props)) {
      walkSchema(value, definitions, index, seen)
    }
  }

  if (resolved.items) {
    walkSchema(resolved.items, definitions, index, seen)
  }

  const combinators = ['oneOf', 'anyOf', 'allOf'] as const
  for (const key of combinators) {
    const list = resolved[key]
    if (Array.isArray(list)) {
      for (const entry of list) {
        walkSchema(entry, definitions, index, seen)
      }
    }
  }

  const additional = resolved.additionalProperties
  if (additional && typeof additional === 'object') {
    walkSchema(additional, definitions, index, seen)
  }
}

export function getNodeFieldIndex(mode: Mode): FieldIndex {
  if (cacheByMode[mode]) {
    return cacheByMode[mode] as FieldIndex
  }

  const schema = getDatakitConfigJsonSchema(mode)
  const definitions = getDefinitions(schema)
  const index: FieldIndex = new Map()
  const seen = new Set<JsonSchema>()

  walkSchema(schema, definitions, index, seen)
  for (const def of Object.values(definitions)) {
    walkSchema(def, definitions, index, seen)
  }

  cacheByMode[mode] = index
  return index
}
