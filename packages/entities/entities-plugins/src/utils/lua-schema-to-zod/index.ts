import { compileFieldCompat, compileSchemaCompat } from './compile-compat'
import { compileFieldStrict, compileSchemaStrict } from './compile-strict'

import type { z } from 'zod'
import type { CompileMode, LuaField, LuaFormSchema } from './types'

export type { CompileMode } from './types'

/**
 * Compile a Kong plugin config JSON schema (as dumped by the Admin API)
 * into a Zod schema for frontend runtime validation.
 *
 * `strict` (default) and `compat` are two independent, self-contained
 * compilers - see `compile-strict.ts` and `compile-compat.ts` - not one
 * compiler switched by a flag. This module just picks which one to run.
 */
export function compileField(field: LuaField, label: string, mode: CompileMode = 'strict'): z.ZodTypeAny {
  return mode === 'strict' ? compileFieldStrict(field, label) : compileFieldCompat(field, label)
}

/**
 * Compile a full plugin config schema (the Admin API's root schema shape)
 * into a Zod object schema.
 *
 * @param mode `'strict'` (default) compiles the full DSL, for showing real
 * validation errors. `'compat'` compiles a deliberately relaxed schema for
 * deciding whether it's currently safe to switch from the code editor back
 * to the visual form - see the README's "Compat mode" section.
 */
export function luaSchemaToZod(schema: LuaFormSchema, mode: CompileMode = 'strict'): z.ZodObject<any> {
  return mode === 'strict' ? compileSchemaStrict(schema) : compileSchemaCompat(schema)
}
