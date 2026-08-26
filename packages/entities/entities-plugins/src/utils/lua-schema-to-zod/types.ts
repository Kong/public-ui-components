/**
 * A Kong plugin config field, as dumped by the Admin API. Deliberately typed
 * loosely (not as the stricter `FormSchema`/`UnionFieldSchema` in
 * `../../types/plugins/form-schema`): this compiler consumes live
 * `JSON.parse()`'d Admin API output, which was never going to satisfy a
 * hand-maintained literal-union type at the TS level anyway, and the DSL has
 * more optional keys (e.g. `uuid`, `gt`, `starts_with`) than that type
 * currently models.
 */
export type LuaField = Record<string, any> & { type: string }

// `| undefined`: TS infers sibling keys as `?: undefined` when it widens a
// heterogeneous array of `{ fieldName: LuaField }` objects into a union.
export type LuaNamedField = Record<string, LuaField | undefined>

export type LuaFormSchema = { fields: LuaNamedField[] }

/**
 * `strict` compiles the full DSL - see `compile-strict.ts` - for showing
 * real validation errors. `compat` - `compile-compat.ts` - compiles a
 * deliberately looser schema whose only job is "would rendering this value
 * in the visual form break or show something nonsensically blank", used to
 * decide whether switching from the code editor back to the visual form is
 * currently safe, not whether the config is fully valid. See the README's
 * "Compat mode" section for the exact rules.
 *
 * These are two independent, self-contained compilers (not one compiler
 * parameterized by a flag) - each reads top to bottom as a complete story
 * for its mode. Some structure (type dispatch, recursion shape) is
 * necessarily duplicated between them; that's an intentional trade for never
 * having a `mode === '...'` branch buried inside shared logic.
 */
export type CompileMode = 'strict' | 'compat'
