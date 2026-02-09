import type { Document } from 'yaml'
import type { YamlPath } from './yaml-path-index'
import { findPathAtOffset } from './yaml-cursor'

export type SchemaObject = Record<string, any>
export type JsonSchema = Record<string, unknown>
export type ExpectedKind = 'object' | 'array' | 'scalar' | 'unknown'

export type SchemaContext = {
  path: YamlPath
  inKey: boolean
  inValue: boolean
  schema: SchemaObject | null
  parentSchema: SchemaObject | null
  data: unknown
  parentData: unknown
  expectedKind: ExpectedKind
}

function getDefinitions(schema: SchemaObject): Record<string, SchemaObject> {
  if (schema.definitions && typeof schema.definitions === 'object') {
    return schema.definitions as Record<string, SchemaObject>
  }
  if (schema.$defs && typeof schema.$defs === 'object') {
    return schema.$defs as Record<string, SchemaObject>
  }
  return {}
}

function resolveRef(schema: SchemaObject, definitions: Record<string, SchemaObject>): SchemaObject {
  if (schema && typeof schema.$ref === 'string') {
    const ref = schema.$ref
    const match = ref.match(/^#\/(?:definitions|\$defs)\/(.+)$/)
    const name = match?.[1]
    if (name && definitions[name]) {
      return definitions[name]
    }
  }
  return schema
}

function stripNullish(schema: SchemaObject, definitions: Record<string, SchemaObject>): SchemaObject {
  if (!schema || typeof schema !== 'object') return schema

  const list = Array.isArray(schema.anyOf)
    ? schema.anyOf
    : Array.isArray(schema.oneOf)
      ? schema.oneOf
      : null
  if (!list) return schema

  const nonNull = list
    .map((entry: SchemaObject) => resolveRef(entry, definitions))
    .filter((entry: SchemaObject) => {
      const type = entry?.type
      if (type === 'null') return false
      if (Array.isArray(type) && type.includes('null')) return false
      return true
    })

  if (nonNull.length === 1) {
    return nonNull[0]
  }

  return schema
}

function mergeArrays(a?: unknown[], b?: unknown[]): string[] | undefined {
  const items = new Set<string>()
  if (Array.isArray(a)) {
    a.forEach((item) => {
      if (typeof item === 'string') items.add(item)
    })
  }
  if (Array.isArray(b)) {
    b.forEach((item) => {
      if (typeof item === 'string') items.add(item)
    })
  }
  return items.size ? Array.from(items) : undefined
}

function mergeSchemas(base: SchemaObject, extra: SchemaObject): SchemaObject {
  const next: SchemaObject = { ...base, ...extra }

  const baseProps = base.properties && typeof base.properties === 'object' ? base.properties : undefined
  const extraProps = extra.properties && typeof extra.properties === 'object' ? extra.properties : undefined
  if (baseProps || extraProps) {
    next.properties = {
      ...(baseProps || {}),
      ...(extraProps || {}),
    }
  }

  const required = mergeArrays(base.required, extra.required)
  if (required) {
    next.required = required
  }

  if (!next.items && extra.items) {
    next.items = extra.items
  }

  return next
}

function getDiscriminatorValues(schema: SchemaObject, definitions: Record<string, SchemaObject>): string[] {
  const resolved = resolveRef(schema, definitions)
  const props = resolved?.properties
  if (!props || typeof props !== 'object') return []
  const typeSchema = resolveRef(props.type ?? {}, definitions)
  if (typeof typeSchema?.const === 'string') {
    return [typeSchema.const]
  }
  if (Array.isArray(typeSchema?.enum)) {
    return typeSchema.enum.filter((value: unknown) => typeof value === 'string')
  }
  return []
}

function matchVariantByDiscriminator(
  variants: SchemaObject[],
  data: unknown,
  definitions: Record<string, SchemaObject>,
): SchemaObject | null {
  if (!data || typeof data !== 'object') return null
  const typeValue = (data as Record<string, unknown>).type
  if (typeof typeValue !== 'string') return null

  for (const variant of variants) {
    const values = getDiscriminatorValues(variant, definitions)
    if (values.includes(typeValue)) return variant
  }
  return null
}

function intersection(values: string[][]): string[] {
  if (values.length === 0) return []
  const [first, ...rest] = values
  return first.filter((item) => rest.every((list) => list.includes(item)))
}

function intersectObjectSchemas(
  variants: SchemaObject[],
  definitions: Record<string, SchemaObject>,
): SchemaObject {
  const propertyLists = variants.map((variant) => {
    const resolved = resolveRef(variant, definitions)
    const props = resolved?.properties
    return props && typeof props === 'object' ? Object.keys(props) : []
  })

  const commonKeys = intersection(propertyLists)
  const baseProps: Record<string, SchemaObject> = {}
  const firstResolved = resolveRef(variants[0], definitions)
  const firstProps = (firstResolved?.properties && typeof firstResolved.properties === 'object')
    ? firstResolved.properties as Record<string, SchemaObject>
    : {}

  for (const key of commonKeys) {
    if (key in firstProps) {
      baseProps[key] = firstProps[key]
    }
  }

  const discriminatorValues = Array.from(new Set(
    variants.flatMap((variant) => getDiscriminatorValues(variant, definitions)),
  ))

  if (discriminatorValues.length) {
    baseProps.type = {
      type: 'string',
      enum: discriminatorValues,
    }
  }

  const requiredLists = variants.map((variant) =>
    Array.isArray(variant.required)
      ? variant.required.filter((key: unknown) => typeof key === 'string')
      : [],
  )
  const baseRequired = intersection(requiredLists)

  const result: SchemaObject = {
    type: 'object',
    properties: baseProps,
  }

  if (baseRequired.length > 0) {
    result.required = baseRequired
  }

  return result
}

function mergeAllOf(schema: SchemaObject, data: unknown, definitions: Record<string, SchemaObject>): SchemaObject {
  const entries = Array.isArray(schema.allOf) ? schema.allOf : []
  const base = { ...schema }
  delete base.allOf

  let merged = base

  for (const entry of entries) {
    const resolved = resolveRef(entry, definitions)
    if (resolved?.if && resolved?.then) {
      if (matchesIfSchema(resolved.if, data, definitions)) {
        merged = mergeSchemas(merged, resolveRef(resolved.then, definitions))
      }
      continue
    }
    merged = mergeSchemas(merged, resolved)
  }

  return merged
}

function matchesIfSchema(
  schema: SchemaObject | boolean,
  data: unknown,
  definitions: Record<string, SchemaObject>,
): boolean {
  if (schema === true) return true
  if (schema === false) return false
  if (!data || typeof data !== 'object') return false

  const resolved = resolveRef(schema as SchemaObject, definitions)

  if (schema.required && Array.isArray(schema.required)) {
    for (const key of schema.required) {
      if (typeof key !== 'string') continue
      if (!(key in (data as Record<string, unknown>))) return false
    }
  }

  if (resolved.properties && typeof resolved.properties === 'object') {
    for (const [key, propSchema] of Object.entries(resolved.properties)) {
      const value = (data as Record<string, unknown>)[key]
      if (!matchesIfSchema(propSchema as SchemaObject, value, definitions)) return false
    }
  }

  if (resolved.const !== undefined) {
    return valueEquals(resolved.const, data)
  }
  if (Array.isArray(resolved.enum)) {
    return resolved.enum.some((entry: unknown) => valueEquals(entry, data))
  }
  if (typeof resolved.type === 'string') {
    return matchesType(resolved.type, data)
  }

  return true
}

function matchesType(type: string, data: unknown): boolean {
  if (type === 'null') return data === null
  if (type === 'array') return Array.isArray(data)
  if (type === 'object') return !!data && typeof data === 'object' && !Array.isArray(data)
  if (type === 'string') return typeof data === 'string'
  if (type === 'number') return typeof data === 'number'
  if (type === 'integer') return typeof data === 'number' && Number.isInteger(data)
  if (type === 'boolean') return typeof data === 'boolean'
  return false
}

function valueEquals(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (Number.isNaN(a) && Number.isNaN(b)) return true
  return false
}

function resolveUnion(schema: SchemaObject, data: unknown, definitions: Record<string, SchemaObject>): SchemaObject {
  const base = { ...schema }
  delete base.oneOf
  delete base.anyOf

  const list = Array.isArray(schema.oneOf)
    ? schema.oneOf
    : Array.isArray(schema.anyOf)
      ? schema.anyOf
      : []

  const variants = list
    .map((entry: SchemaObject) => resolveRef(entry, definitions))
    .filter((entry: SchemaObject) => entry && typeof entry === 'object')

  if (variants.length === 0) return base

  const match = matchVariantByDiscriminator(variants, data, definitions)
  if (match) {
    return mergeSchemas(base, match)
  }

  const objectVariants = variants.filter((variant) => {
    const resolved = resolveRef(variant, definitions)
    return resolved.type === 'object' || (resolved.properties && typeof resolved.properties === 'object')
  })

  if (objectVariants.length) {
    const intersectionSchema = intersectObjectSchemas(objectVariants, definitions)
    return mergeSchemas(base, intersectionSchema)
  }

  const enumValues = variants.flatMap((variant) => {
    if (typeof variant.const !== 'undefined') return [variant.const]
    if (Array.isArray(variant.enum)) return variant.enum
    return []
  })

  if (enumValues.length) {
    return { ...base, enum: Array.from(new Set(enumValues)) }
  }

  return base
}

function resolveSchema(schema: SchemaObject | null, data: unknown, definitions: Record<string, SchemaObject>): SchemaObject | null {
  if (!schema || typeof schema !== 'object') return null

  let resolved = resolveRef(schema, definitions)
  resolved = stripNullish(resolved, definitions)

  if (resolved.allOf) {
    resolved = mergeAllOf(resolved, data, definitions)
  }

  if (resolved.oneOf || resolved.anyOf) {
    resolved = resolveUnion(resolved, data, definitions)
  }

  return resolved
}

export function getSchemaAtPath(
  rootSchema: SchemaObject,
  data: unknown,
  path: YamlPath,
): { schema: SchemaObject | null, data: unknown } {
  const definitions = getDefinitions(rootSchema)
  let schema: SchemaObject | null = rootSchema
  let currentData: unknown = data

  schema = resolveSchema(schema, currentData, definitions)

  for (const part of path) {
    if (!schema) break
    const resolved = resolveSchema(schema, currentData, definitions)
    if (!resolved) break

    if (typeof part === 'string') {
      const props = resolved.properties
      const propSchema = props && typeof props === 'object' ? (props as Record<string, SchemaObject>)[part] : undefined
      schema = propSchema ? resolveSchema(propSchema, currentData ? (currentData as any)[part] : undefined, definitions) : null
      currentData = currentData && typeof currentData === 'object' ? (currentData as any)[part] : undefined
      continue
    }

    if (typeof part === 'number') {
      const items = resolved.items
      if (items) {
        schema = resolveSchema(items as SchemaObject, Array.isArray(currentData) ? currentData[part] : undefined, definitions)
      } else {
        schema = null
      }
      currentData = Array.isArray(currentData) ? currentData[part] : undefined
      continue
    }
  }

  return { schema, data: currentData }
}

export function getObjectProperties(
  schema: SchemaObject | null,
  data: unknown,
  rootSchema?: SchemaObject,
): { properties: Record<string, SchemaObject>, required: string[] } | null {
  if (!schema) return null
  const definitions = getDefinitions(rootSchema ?? schema)
  const resolved = resolveSchema(schema, data, definitions)
  if (!resolved) return null

  if (resolved.type !== 'object' && !(resolved.properties && typeof resolved.properties === 'object')) {
    return null
  }

  const props = resolved.properties && typeof resolved.properties === 'object'
    ? resolved.properties as Record<string, SchemaObject>
    : {}
  const required = Array.isArray(resolved.required)
    ? resolved.required.filter((key: unknown) => typeof key === 'string')
    : []

  return { properties: props, required }
}

export function getExpectedKind(schema: SchemaObject | null): ExpectedKind {
  if (!schema) return 'unknown'
  if (schema.type === 'object' || (schema.properties && typeof schema.properties === 'object')) return 'object'
  if (schema.type === 'array' || schema.items) return 'array'
  if (schema.enum || typeof schema.const !== 'undefined') return 'scalar'
  if (schema.type === 'string' || schema.type === 'number' || schema.type === 'integer' || schema.type === 'boolean') {
    return 'scalar'
  }
  return 'unknown'
}

export function getSchemaContext(
  doc: Document,
  rootSchema: SchemaObject,
  offset: number,
): SchemaContext | null {
  const yamlContext = findPathAtOffset(doc.contents, offset)
  if (!yamlContext) return null

  const data = doc.toJS()
  const path = yamlContext.path

  const valuePath = path
  const parentPath = path.slice(0, -1)

  const { schema, data: valueData } = getSchemaAtPath(rootSchema, data, valuePath)
  const { schema: parentSchema, data: parentData } = getSchemaAtPath(rootSchema, data, parentPath)

  return {
    path,
    inKey: yamlContext.inKey,
    inValue: yamlContext.inValue,
    schema,
    parentSchema,
    data: valueData,
    parentData,
    expectedKind: getExpectedKind(schema),
  }
}
