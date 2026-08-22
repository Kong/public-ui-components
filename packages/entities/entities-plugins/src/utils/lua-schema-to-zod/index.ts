import { z } from 'zod'
import { translateLuaPattern } from './lua-pattern'

/**
 * A Kong plugin config field, as dumped by the Admin API. Deliberately typed
 * loosely (not as the stricter `FormSchema`/`UnionFieldSchema` in
 * `../../types/plugins/form-schema`): this compiler consumes live
 * `JSON.parse()`'d Admin API output, which was never going to satisfy a
 * hand-maintained literal-union type at the TS level anyway, and the DSL has
 * more optional keys (e.g. `uuid`, `gt`, `starts_with`) than that type
 * currently models.
 */
type LuaField = Record<string, any> & { type: string }
// `| undefined`: TS infers sibling keys as `?: undefined` when it widens a
// heterogeneous array of `{ fieldName: LuaField }` objects into a union.
type LuaNamedField = Record<string, LuaField | undefined>
type LuaFormSchema = { fields: LuaNamedField[] }

/**
 * POC: compile a Kong plugin config JSON schema (as dumped by the Admin API)
 * into a Zod schema for frontend runtime validation.
 *
 * Scope, on purpose (see feasibility discussion):
 * - Only field-level constraints are compiled (type, required, default,
 *   one_of/not_one_of, between, gt, len_min/len_max, match*, starts_with,
 *   uuid, referenceable).
 * - `entity_checks` (mutually_exclusive, conditional, at_least_one_of, ...)
 *   are intentionally NOT compiled here - cross-field rules are a separate
 *   layer and were explicitly descoped for this POC.
 * - `custom_entity_check` / `custom_validator` / `shorthand_fields[].func`
 *   can never be recovered from the JSON at all (Kong strips Lua functions
 *   before serializing), so there is nothing to compile for them - the
 *   fields they touch just fall back to their plain type/required checks.
 * - Anything this compiler doesn't recognize falls back to `z.unknown()`
 *   with a console.warn, rather than throwing - an unknown or new DSL
 *   keyword should never make the config form unusable.
 */

// Kong's `len_min`/`len_max` operate on Lua's `#value`, which is a BYTE
// length, not a JS character count - matters for multi-byte (e.g. CJK) input.
function byteLength(value: string): number {
  return new TextEncoder().encode(value).length
}

const VAULT_REFERENCE_PATTERN = /^\{vault:\/\/[^}]+\}$/

function withVaultReference(schema: z.ZodTypeAny): z.ZodTypeAny {
  // `referenceable: true` means the field may also hold a `{vault://...}`
  // reference string instead of a real value of its own type.
  return z.union([schema, z.string().regex(VAULT_REFERENCE_PATTERN)])
}

function warnUnsupportedPattern(pattern: string, context: string): void {
  console.warn(
    `[lua-schema-to-zod] could not safely translate Lua pattern "${pattern}" (${context}); skipping this check client-side, the server remains the source of truth`,
  )
}

function translateOrWarn(pattern: string, context: string): RegExp | null {
  const regex = translateLuaPattern(pattern)
  if (!regex) warnUnsupportedPattern(pattern, context)
  return regex
}

interface PatternCheck {
  err?: string
  regex: RegExp | null
}

function collectPatternChecks(field: Record<string, any>): {
  matchAll: PatternCheck[]
  matchNone: PatternCheck[]
  matchAny: { err?: string, regexes: RegExp[] } | null
} {
  const matchAll: PatternCheck[] = []

  if (typeof field.match === 'string') {
    matchAll.push({ err: field.err, regex: translateOrWarn(field.match, 'match') })
  }
  if (Array.isArray(field.match_all)) {
    for (const check of field.match_all) {
      matchAll.push({ err: check.err, regex: translateOrWarn(check.pattern, 'match_all') })
    }
  }

  const matchNone: PatternCheck[] = Array.isArray(field.match_none)
    ? field.match_none.map((check: any) => ({ err: check.err, regex: translateOrWarn(check.pattern, 'match_none') }))
    : []

  const matchAny = field.match_any
    ? {
      err: field.match_any.err as string | undefined,
      regexes: (field.match_any.patterns ?? [])
        .map((pattern: string) => translateOrWarn(pattern, 'match_any'))
        .filter((regex: RegExp | null): regex is RegExp => regex !== null),
    }
    : null

  return { matchAll, matchNone, matchAny }
}

function compileStringField(field: Record<string, any>): z.ZodTypeAny {
  let schema: z.ZodTypeAny = Array.isArray(field.one_of) && field.one_of.length > 0
    ? z.enum(field.one_of as [string, ...string[]])
    : z.string()

  if (field.uuid && schema instanceof z.ZodString) {
    schema = schema.uuid()
  }

  const { matchAll, matchNone, matchAny } = collectPatternChecks(field)
  // Kong implicitly requires `len_min = 1` (a non-empty string) unless the
  // schema explicitly sets `len_min` (commonly to 0 to allow empty strings).
  const minLen = typeof field.len_min === 'number' ? field.len_min : 1
  const maxLen = typeof field.len_max === 'number' ? field.len_max : undefined

  return schema.superRefine((value, ctx) => {
    if (typeof value !== 'string') return

    const len = byteLength(value)
    if (len < minLen) {
      ctx.addIssue({ code: 'custom', message: `length (in bytes) must be at least ${minLen}` })
    }
    if (maxLen !== undefined && len > maxLen) {
      ctx.addIssue({ code: 'custom', message: `length (in bytes) must be at most ${maxLen}` })
    }

    if (typeof field.starts_with === 'string' && !value.startsWith(field.starts_with)) {
      ctx.addIssue({ code: 'custom', message: `must start with "${field.starts_with}"` })
    }

    if (Array.isArray(field.not_one_of) && field.not_one_of.includes(value)) {
      ctx.addIssue({ code: 'custom', message: 'this value is not allowed' })
    }

    for (const check of matchAll) {
      if (check.regex && !check.regex.test(value)) {
        ctx.addIssue({ code: 'custom', message: check.err ?? 'does not match the required pattern' })
      }
    }
    for (const check of matchNone) {
      if (check.regex?.test(value)) {
        ctx.addIssue({ code: 'custom', message: check.err ?? 'matches a forbidden pattern' })
      }
    }
    if (matchAny && matchAny.regexes.length > 0 && !matchAny.regexes.some((regex) => regex.test(value))) {
      ctx.addIssue({ code: 'custom', message: matchAny.err ?? 'does not match any of the allowed patterns' })
    }
  })
}

function compileNumberField(field: Record<string, any>): z.ZodTypeAny {
  let schema = z.number()
  if (field.type === 'integer') schema = schema.int()

  return schema.superRefine((value, ctx) => {
    if (Array.isArray(field.between)) {
      const [min, max] = field.between
      if (value < min || value > max) {
        ctx.addIssue({ code: 'custom', message: `must be between ${min} and ${max} (inclusive)` })
      }
    }
    if (typeof field.gt === 'number' && value <= field.gt) {
      ctx.addIssue({ code: 'custom', message: `must be greater than ${field.gt}` })
    }
    if (Array.isArray(field.one_of) && field.one_of.length > 0 && !field.one_of.includes(value)) {
      ctx.addIssue({ code: 'custom', message: 'value is not an allowed option' })
    }
    if (Array.isArray(field.not_one_of) && field.not_one_of.includes(value)) {
      ctx.addIssue({ code: 'custom', message: 'this value is not allowed' })
    }
  })
}

function compileBooleanField(field: Record<string, any>): z.ZodTypeAny {
  if (Array.isArray(field.one_of) && field.one_of.length > 0) {
    return z.boolean().refine((value) => field.one_of.includes(value), 'value is not an allowed option')
  }
  return z.boolean()
}

function compileArrayField(field: Record<string, any>): z.ZodTypeAny {
  const element = field.elements ? compileField(field.elements) : z.unknown()
  let schema = z.array(element)
  if (typeof field.len_min === 'number') schema = schema.min(field.len_min)
  if (typeof field.len_max === 'number') schema = schema.max(field.len_max)
  return schema
}

function compileMapField(field: Record<string, any>): z.ZodTypeAny {
  const keySchema = (field.keys ? compileField(field.keys) : z.string()) as z.ZodString
  const valueSchema = field.values ? compileField(field.values) : z.unknown()
  let schema: z.ZodTypeAny = z.record(keySchema, valueSchema)

  if (typeof field.len_min === 'number' || typeof field.len_max === 'number') {
    schema = schema.superRefine((value, ctx) => {
      const count = Object.keys(value as object).length
      if (typeof field.len_min === 'number' && count < field.len_min) {
        ctx.addIssue({ code: 'custom', message: `must have at least ${field.len_min} entries` })
      }
      if (typeof field.len_max === 'number' && count > field.len_max) {
        ctx.addIssue({ code: 'custom', message: `must have at most ${field.len_max} entries` })
      }
    })
  }

  return schema
}

// A foreign field's real "does this entity exist" check requires a DB
// lookup - out of scope client-side. All we can validate is that the value
// is shaped like a primary key reference (or null, commonly allowed).
function compileForeignField(): z.ZodTypeAny {
  return z.union([z.null(), z.string(), z.object({ id: z.string() }).passthrough()])
}

function compileRecordField(field: LuaField): z.ZodTypeAny {
  return buildObjectSchema(field.fields ?? [])
}

function buildObjectSchema(fields: LuaNamedField[]): z.ZodObject<any> {
  const shape: Record<string, z.ZodTypeAny> = {}
  for (const namedField of fields) {
    const [name, definition] = Object.entries(namedField)[0]
    shape[name] = compileField(definition as LuaField)
  }
  // Not `.strict()`: shorthand fields, subschema-only fields, and anything
  // else this compiler doesn't model yet should not make parsing fail.
  return z.object(shape)
}

function wrapCommon(schema: z.ZodTypeAny, field: Record<string, any>): z.ZodTypeAny {
  const isRequired = field.required === true

  // Kong represents "not set" as an explicit `null` in stored/returned config
  // about as often as by omitting the key entirely - `.optional()` alone
  // would reject the former, so every non-required field accepts both.
  let result = isRequired ? schema : schema.nullable()

  if (field.default !== undefined) {
    // `required: true` + a `default` is a common, valid combination (the
    // field is "always present" precisely because Kong fills the default
    // in) - the default applies regardless of `required`.
    result = result.default(field.default)
  } else if (!isRequired) {
    result = result.optional()
  }

  return result
}

export function compileField(field: LuaField): z.ZodTypeAny {
  let schema: z.ZodTypeAny

  switch (field.type) {
    case 'string':
      schema = compileStringField(field)
      break
    case 'number':
    case 'integer':
      schema = compileNumberField(field)
      break
    case 'boolean':
      schema = compileBooleanField(field)
      break
    case 'array':
    case 'set':
      schema = compileArrayField(field)
      break
    case 'map':
      schema = compileMapField(field)
      break
    case 'record':
      schema = compileRecordField(field)
      break
    case 'foreign':
      schema = compileForeignField()
      break
    case 'json':
      schema = z.unknown()
      break
    case 'function':
      // Holds Lua/JS source as a string in JSON form; we don't attempt to
      // validate the source itself.
      schema = z.string()
      break
    default:
      console.warn(`[lua-schema-to-zod] unsupported field type "${field.type}", falling back to unknown()`)
      schema = z.unknown()
  }

  if (field.referenceable) {
    schema = withVaultReference(schema)
  }

  return wrapCommon(schema, field)
}

/** Compile a full plugin config schema (the Admin API's root schema shape) into a Zod object schema. */
export function luaSchemaToZod(schema: LuaFormSchema): z.ZodObject<any> {
  return buildObjectSchema(schema.fields)
}
