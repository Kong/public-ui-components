import { z } from 'zod'

import type { LuaField, LuaFormSchema, LuaNamedField } from './types'

/**
 * `compat` mode: compiles a deliberately relaxed schema that only checks
 * whether a value would break or visibly corrupt rendering in the visual
 * form - not whether it's fully valid (that's `compile-strict.ts`'s job).
 * See the README's "Compat mode" section for the full rule table; in short:
 *
 * - `required` never applies - a missing/null value is a completely normal
 *   thing for a form field to show empty.
 * - Type shape (`record` -> object, `array`/`set` -> array, `map` -> object,
 *   `foreign`/`referenceable` -> one of their allowed shapes) is still
 *   enforced - the wrong shape breaks the matching Field component.
 * - `one_of` is still enforced - Field.vue renders these as a `<select>`,
 *   and a value outside the option list renders that select empty.
 * - Everything else (`len_min`/`len_max`, `between`, `gt`, `not_one_of`,
 *   `match*`, `starts_with`, `uuid`, `integer`) is dropped entirely - none
 *   of it affects whether the value can be displayed.
 */

const VAULT_REFERENCE_PATTERN = /^\{vault:\/\/[^}]+\}$/

function withVaultReference(schema: z.ZodTypeAny, label: string): z.ZodTypeAny {
  return z.union([schema, z.string().regex(VAULT_REFERENCE_PATTERN)], {
    error: `"${label}" must be a valid value, or a "{vault://...}" reference`,
  })
}

function compileStringField(field: Record<string, any>): z.ZodTypeAny {
  // `one_of` is the one content-adjacent check kept in compat mode - see the
  // module doc comment.
  return Array.isArray(field.one_of) && field.one_of.length > 0
    ? z.enum(field.one_of as [string, ...string[]])
    : z.string()
}

function compileNumberField(field: Record<string, any>): z.ZodTypeAny {
  let schema = z.number()

  if (Array.isArray(field.one_of) && field.one_of.length > 0) {
    const options = field.one_of as number[]
    schema = schema.superRefine((value, ctx) => {
      if (!options.includes(value)) {
        ctx.addIssue({ code: 'custom', message: 'value is not an allowed option' })
      }
    })
  }

  return schema
}

function compileBooleanField(field: Record<string, any>): z.ZodTypeAny {
  if (Array.isArray(field.one_of) && field.one_of.length > 0) {
    return z.boolean().refine((value) => field.one_of.includes(value), 'value is not an allowed option')
  }
  return z.boolean()
}

function compileArrayField(field: Record<string, any>, label: string): z.ZodTypeAny {
  const element = field.elements ? compileFieldCompat(field.elements, `${label} item`) : z.unknown()
  return z.array(element)
}

function compileMapField(field: Record<string, any>, label: string): z.ZodTypeAny {
  const keySchema = (field.keys ? compileFieldCompat(field.keys, `${label} key`) : z.string()) as z.ZodString
  const valueSchema = field.values ? compileFieldCompat(field.values, `${label} value`) : z.unknown()
  return z.record(keySchema, valueSchema)
}

function compileForeignField(label: string): z.ZodTypeAny {
  return z.union([z.string(), z.object({ id: z.string() }).passthrough()], {
    error: `"${label}" must be a string ID, or an object with an "id" property`,
  })
}

function compileRecordField(field: LuaField): z.ZodTypeAny {
  return buildObjectSchema(field.fields ?? [])
}

function buildObjectSchema(fields: LuaNamedField[]): z.ZodObject<any> {
  const shape: Record<string, z.ZodTypeAny> = {}
  for (const namedField of fields) {
    const [name, definition] = Object.entries(namedField)[0]
    shape[name] = compileFieldCompat(definition as LuaField, name)
  }
  return z.object(shape)
}

function wrapCommon(schema: z.ZodTypeAny, field: Record<string, any>): z.ZodTypeAny {
  // `required` never applies in compat mode - always nullable. A `default`
  // still fills in a missing value (doesn't hurt, and mirrors what the
  // visual form would actually show), it just doesn't make the field required.
  let result: z.ZodTypeAny = schema.nullable()
  result = field.default !== undefined ? result.default(field.default) : result.optional()
  return result
}

export function compileFieldCompat(field: LuaField, label: string): z.ZodTypeAny {
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
      schema = compileArrayField(field, label)
      break
    case 'map':
      schema = compileMapField(field, label)
      break
    case 'record':
      schema = compileRecordField(field)
      break
    case 'foreign':
      schema = compileForeignField(label)
      break
    case 'json':
      schema = z.unknown()
      break
    case 'function':
      schema = z.string()
      break
    default:
      // No console.warn here (unlike compile-strict.ts) - it already warns
      // once per compile; compat compiles the same schema again right after.
      schema = z.unknown()
  }

  if (field.referenceable) {
    schema = withVaultReference(schema, label)
  }

  return wrapCommon(schema, field)
}

export function compileSchemaCompat(schema: LuaFormSchema): z.ZodObject<any> {
  return buildObjectSchema(schema.fields)
}
