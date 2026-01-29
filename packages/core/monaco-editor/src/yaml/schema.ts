import type { JsonSchema, SchemaView, SchemaKind } from './types'

type ResolvedSchema = JsonSchema

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function getTypeSet(schema: JsonSchema): Set<string> | null {
  const type = schema.type
  if (typeof type === 'string') {
    return new Set([type])
  }
  if (Array.isArray(type)) {
    return new Set(type.filter((t): t is string => typeof t === 'string'))
  }
  return null
}

function hasPrimitiveType(schema: JsonSchema, root: JsonSchema): boolean {
  const resolved = deref(schema, root)
  const typeSet = getTypeSet(resolved)
  if (typeSet) {
    for (const entry of typeSet) {
      if (entry !== 'object' && entry !== 'array') {
        return true
      }
    }
  }

  const unions = [
    ...(Array.isArray(resolved.anyOf) ? resolved.anyOf : []),
    ...(Array.isArray(resolved.oneOf) ? resolved.oneOf : []),
    ...(Array.isArray(resolved.allOf) ? resolved.allOf : []),
  ]
  for (const entry of unions) {
    if (!isObject(entry)) continue
    if (hasPrimitiveType(entry as JsonSchema, root)) return true
  }
  return false
}

function isObjectSchema(schema: JsonSchema, root?: JsonSchema): boolean {
  const resolvedRoot = root ?? schema
  const resolved = deref(schema, resolvedRoot)
  const typeSet = getTypeSet(resolved)
  if (typeSet?.has('object')) return true
  if (isObject(resolved.properties) || isObject(resolved.additionalProperties)) return true

  const unions = [
    ...(Array.isArray(resolved.anyOf) ? resolved.anyOf : []),
    ...(Array.isArray(resolved.oneOf) ? resolved.oneOf : []),
    ...(Array.isArray(resolved.allOf) ? resolved.allOf : []),
  ]
  for (const entry of unions) {
    if (!isObject(entry)) continue
    if (isObjectSchema(entry as JsonSchema, resolvedRoot)) return true
  }
  return false
}

function isArraySchema(schema: JsonSchema, root?: JsonSchema): boolean {
  const resolvedRoot = root ?? schema
  const resolved = deref(schema, resolvedRoot)
  const typeSet = getTypeSet(resolved)
  if (typeSet?.has('array')) return true
  if (resolved.items) return true

  const unions = [
    ...(Array.isArray(resolved.anyOf) ? resolved.anyOf : []),
    ...(Array.isArray(resolved.oneOf) ? resolved.oneOf : []),
    ...(Array.isArray(resolved.allOf) ? resolved.allOf : []),
  ]
  for (const entry of unions) {
    if (!isObject(entry)) continue
    if (isArraySchema(entry as JsonSchema, resolvedRoot)) return true
  }
  return false
}

function resolveRef(root: JsonSchema, ref: string): JsonSchema | null {
  const resolvePath = (path: string): JsonSchema | null => {
    const parts = path.slice(2).split('/')
    let current: unknown = root
    for (const part of parts) {
      if (!isObject(current)) return null
      current = current[part]
    }
    return isObject(current) ? (current as JsonSchema) : null
  }

  if (ref.startsWith('#/')) {
    return resolvePath(ref)
  }

  const hashIndex = ref.indexOf('#/')
  if (hashIndex !== -1) {
    const fragment = ref.slice(hashIndex)
    return resolvePath(fragment)
  }

  return null
}

function deref(schema: JsonSchema, root: JsonSchema, seen = new Set<JsonSchema>()): ResolvedSchema {
  if (seen.has(schema)) return schema
  seen.add(schema)

  if (typeof schema.$ref === 'string') {
    const resolved = resolveRef(root, schema.$ref)
    if (resolved) {
      return deref(resolved, root, seen)
    }
  }

  if (Array.isArray(schema.allOf) && schema.allOf.length > 0) {
    const merged: JsonSchema = { ...schema }
    delete merged.allOf
    for (const part of schema.allOf) {
      if (!isObject(part)) continue
      const resolved = deref(part as JsonSchema, root, seen)
      if (resolved.type && !merged.type) {
        merged.type = resolved.type
      }
      if (isObject(resolved.properties)) {
        merged.properties = {
          ...(isObject(merged.properties) ? merged.properties : {}),
          ...resolved.properties,
        }
      }
      if (Array.isArray(resolved.required)) {
        merged.required = Array.from(new Set([...(merged.required as string[] | undefined) ?? [], ...resolved.required]))
      }
      if (resolved.items && !merged.items) {
        merged.items = resolved.items
      }
      if (resolved.additionalProperties && !merged.additionalProperties) {
        merged.additionalProperties = resolved.additionalProperties
      }
    }
    return merged
  }

  return schema
}

function getAllowedValues(schema: JsonSchema, root: JsonSchema): Array<string | number | boolean | null> {
  const resolved = deref(schema, root)
  const direct: Array<string | number | boolean | null> = []
  if (Object.prototype.hasOwnProperty.call(resolved, 'const')) {
    direct.push(resolved.const as any)
  }
  if (Array.isArray(resolved.enum)) {
    direct.push(...(resolved.enum as Array<string | number | boolean | null>))
  }

  const typeSet = getTypeSet(resolved)
  if (typeSet?.has('boolean')) {
    direct.push(true, false)
  }
  if (typeSet?.has('null')) {
    direct.push(null)
  }

  const union = [
    ...(Array.isArray(resolved.anyOf) ? resolved.anyOf : []),
    ...(Array.isArray(resolved.oneOf) ? resolved.oneOf : []),
    ...(Array.isArray(resolved.allOf) ? resolved.allOf : []),
  ]
  for (const entry of union) {
    if (!isObject(entry)) continue
    direct.push(...getAllowedValues(entry as JsonSchema, root))
  }

  return direct
}

function getDiscriminatorCandidates(
  schema: JsonSchema,
  root: JsonSchema,
): Array<{ key: string; allowed: Array<string | number | boolean | null> }> {
  const resolved = deref(schema, root)
  const props = isObject(resolved.properties) ? resolved.properties : {}
  const entries: Array<{ key: string; allowed: Array<string | number | boolean | null> }> = []
  for (const [key, value] of Object.entries(props)) {
    if (!isObject(value)) continue
    const allowed = getAllowedValues(value as JsonSchema, root)
    if (allowed.length) {
      entries.push({ key, allowed })
    }
  }
  return entries
}

function getRequiredKeys(schema: JsonSchema, root: JsonSchema): Set<string> {
  const resolved = deref(schema, root)
  const required = Array.isArray(resolved.required)
    ? resolved.required.filter((key): key is string => typeof key === 'string')
    : []
  return new Set(required)
}

function pickDiscriminatorKey(
  branches: JsonSchema[],
  root: JsonSchema,
): string | null {
  const total = branches.length
  const stats = new Map<string, {
    present: number
    required: number
    totalValues: number
    distinct: Set<string | number | boolean | null>
  }>()

  for (const branch of branches) {
    const resolved = deref(branch, root)
    const props = isObject(resolved.properties) ? (resolved.properties as Record<string, JsonSchema>) : {}
    const required = getRequiredKeys(resolved, root)
    for (const [key, value] of Object.entries(props)) {
      if (!isObject(value)) continue
      const allowed = getAllowedValues(value as JsonSchema, root)
      if (allowed.length === 0) continue
      const entry = stats.get(key) ?? {
        present: 0,
        required: 0,
        totalValues: 0,
        distinct: new Set(),
      }
      entry.present += 1
      if (required.has(key)) entry.required += 1
      entry.totalValues += allowed.length
      for (const v of allowed) {
        entry.distinct.add(v)
      }
      stats.set(key, entry)
    }
  }

  let bestKey: string | null = null
  let bestScore = -1
  let bestCoverage = 0
  let bestDistinctRatio = 0

  for (const [key, entry] of stats) {
    if (entry.present < 2) continue
    const coverage = entry.present / total
    const requiredCoverage = entry.required / total
    const distinctRatio = entry.totalValues > 0 ? entry.distinct.size / entry.totalValues : 0
    const score = coverage * 10 + requiredCoverage * 2 + distinctRatio * 5
    if (
      score > bestScore ||
      (score === bestScore && coverage > bestCoverage) ||
      (score === bestScore && coverage === bestCoverage && distinctRatio > bestDistinctRatio)
    ) {
      bestKey = key
      bestScore = score
      bestCoverage = coverage
      bestDistinctRatio = distinctRatio
    }
  }

  return bestKey
}

function branchMatches(
  schema: JsonSchema,
  data: unknown,
  root: JsonSchema,
  discriminatorKey: string | null,
): boolean {
  if (!isObject(data)) return false
  if (discriminatorKey) {
    if (!(discriminatorKey in data)) return false
    const allowed = getPropertyAllowedValues(schema, root, discriminatorKey)
    if (!allowed.length) return false
    const value = (data as Record<string, unknown>)[discriminatorKey]
    return allowed.includes(value as any)
  }

  const candidates = getDiscriminatorCandidates(schema, root)
  if (candidates.length === 0) return false
  let matched = false
  for (const candidate of candidates) {
    if (!(candidate.key in data)) continue
    const value = (data as Record<string, unknown>)[candidate.key]
    if (candidate.allowed.includes(value as any)) {
      matched = true
    } else {
      return false
    }
  }
  return matched
}

function getPropertyAllowedValues(
  schema: JsonSchema,
  root: JsonSchema,
  key: string,
): Array<string | number | boolean | null> {
  const resolved = deref(schema, root)
  const props = isObject(resolved.properties) ? (resolved.properties as Record<string, JsonSchema>) : {}
  const prop = props[key]
  if (!prop || !isObject(prop)) return []
  return getAllowedValues(prop as JsonSchema, root)
}

function getPropertySchema(
  schema: JsonSchema,
  root: JsonSchema,
  key: string,
): JsonSchema | null {
  const resolved = deref(schema, root)
  const props = isObject(resolved.properties) ? (resolved.properties as Record<string, JsonSchema>) : {}
  const prop = props[key]
  if (!prop || !isObject(prop)) return null
  return prop as JsonSchema
}

function inferEnumType(values: Array<string | number | boolean | null>): string | undefined {
  const types = new Set(values.map((value) => (value === null ? 'null' : typeof value)))
  if (types.size !== 1) return undefined
  const [only] = Array.from(types)
  return only
}

function collectObjectSchema(
  schema: JsonSchema,
  root: JsonSchema,
  data: unknown,
  opts: { discriminatedUnion: 'intersection-until-narrowed' },
): { properties: Record<string, JsonSchema>; required: Set<string> } {
  const resolved = deref(schema, root)
  const baseProps = isObject(resolved.properties) ? (resolved.properties as Record<string, JsonSchema>) : {}
  const baseRequired = new Set(Array.isArray(resolved.required) ? resolved.required.filter((r): r is string => typeof r === 'string') : [])

  const union = Array.isArray(resolved.oneOf) ? resolved.oneOf : Array.isArray(resolved.anyOf) ? resolved.anyOf : null
  if (union && union.length > 0 && opts.discriminatedUnion === 'intersection-until-narrowed') {
    const branches = union.filter(isObject) as JsonSchema[]
    const objectBranches = branches.filter((branch) => isObjectSchema(deref(branch, root), root))
    if (objectBranches.length === 0) {
      return { properties: baseProps, required: baseRequired }
    }

    const discriminatorKey = pickDiscriminatorKey(objectBranches, root)
    const matching = objectBranches.filter((branch) => branchMatches(branch, data, root, discriminatorKey))
    if (matching.length === 1) {
      const branch = matching[0]
      const branchInfo = collectObjectSchema(branch, root, data, opts)
      return {
        properties: { ...baseProps, ...branchInfo.properties },
        required: new Set([...baseRequired, ...branchInfo.required]),
      }
    }

    const branchProps = objectBranches.map((branch) => collectObjectSchema(branch, root, data, opts).properties)
    const intersectionKeys = branchProps.length
      ? branchProps.reduce<Set<string>>((acc, props) => {
        const keys = new Set(Object.keys(props))
        if (!acc) return keys
        return new Set(Array.from(acc).filter((key) => keys.has(key)))
      }, new Set(Object.keys(branchProps[0] ?? {})))
      : new Set<string>()

    const intersected: Record<string, JsonSchema> = {}
    intersectionKeys.forEach((key) => {
      const source = branchProps.find((props) => key in props)
      if (source) intersected[key] = source[key]
    })

    const mergedProps: Record<string, JsonSchema> = { ...baseProps, ...intersected }

    intersectionKeys.forEach((key) => {
      const branchKinds = objectBranches
        .map((branch) => getPropertySchema(branch, root, key))
        .map((propSchema) => (propSchema ? getSchemaKind(propSchema, root) : 'unknown'))
      if (branchKinds.some((kind) => kind === 'object' || kind === 'array')) {
        return
      }
      const allowed = Array.from(new Set(
        objectBranches.flatMap((branch) => getPropertyAllowedValues(branch, root, key)),
      ))
      if (allowed.length === 0) return
      const type = inferEnumType(allowed)
      mergedProps[key] = type ? { type, enum: allowed } : { enum: allowed }
    })

    return {
      properties: mergedProps,
      required: baseRequired,
    }
  }

  return { properties: baseProps, required: baseRequired }
}

export function getSchemaView(
  schema: JsonSchema,
  root: JsonSchema,
  data: unknown,
  opts: { discriminatedUnion: 'intersection-until-narrowed' },
): SchemaView {
  const resolved = deref(schema, root)

  if (isObjectSchema(resolved, root)) {
    const { properties, required } = collectObjectSchema(resolved, root, data, opts)
    return {
      schema: resolved,
      kind: 'object',
      properties,
      required,
    }
  }

  if (isArraySchema(resolved, root)) {
    return {
      schema: resolved,
      kind: 'array',
      itemSchema: isObject(resolved.items) ? (resolved.items as JsonSchema) : undefined,
    }
  }

  const enumValues = getAllowedValues(resolved, root)
  const kind: SchemaKind = hasPrimitiveType(resolved, root) || enumValues.length > 0 ? 'scalar' : 'unknown'

  return {
    schema: resolved,
    kind,
    enumValues: enumValues.length ? enumValues : undefined,
  }
}

export function getSchemaAtPath(
  root: JsonSchema,
  path: Array<string | number> | null,
  data: unknown,
  opts: { discriminatedUnion: 'intersection-until-narrowed' },
): JsonSchema {
  let schema: JsonSchema = root
  let cursorData: unknown = data

  if (!path || path.length === 0) {
    return deref(schema, root)
  }

  for (const part of path) {
    schema = deref(schema, root)

    if (typeof part === 'number') {
      if (isObject(schema.items)) {
        schema = schema.items as JsonSchema
      }
      if (Array.isArray(cursorData)) {
        cursorData = cursorData[part]
      }
      continue
    }

    const view = getSchemaView(schema, root, cursorData, opts)
    if (view.kind === 'object' && view.properties && part in view.properties) {
      schema = view.properties[part]
      if (isObject(cursorData)) {
        cursorData = (cursorData as Record<string, unknown>)[part]
      }
      continue
    }

    if (isObject(schema.additionalProperties)) {
      schema = schema.additionalProperties as JsonSchema
      if (isObject(cursorData)) {
        cursorData = (cursorData as Record<string, unknown>)[part]
      }
      continue
    }
  }

  return deref(schema, root)
}

export function getSchemaKind(schema: JsonSchema, root?: JsonSchema): SchemaKind {
  const resolvedRoot = root ?? schema
  if (isObjectSchema(schema, resolvedRoot)) {
    return 'object'
  }
  if (isArraySchema(schema, resolvedRoot)) {
    return 'array'
  }
  return hasPrimitiveType(schema, resolvedRoot) || getAllowedValues(schema, resolvedRoot).length > 0
    ? 'scalar'
    : 'unknown'
}
