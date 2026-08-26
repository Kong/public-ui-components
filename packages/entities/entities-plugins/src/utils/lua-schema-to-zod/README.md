# lua-schema-to-zod

Compiles a Kong plugin config schema (the Admin API's JSON dump of a
plugin's Lua schema, `GET /schemas/plugins/:name`) into a
[Zod](https://zod.dev) schema, for runtime validation without a round trip
to the gateway.

Used by the `free-form` code editor (`shared/CodeEditor.vue`) to show inline
markers as you type, and to decide when it's safe to switch back to the
visual form (see [Compat mode](#compat-mode)). It's not a replacement for
server-side validation - see [Limitations](#limitations).

## Usage

```ts
import { luaSchemaToZod } from './index'

const zodSchema = luaSchemaToZod(schema) // same as luaSchemaToZod(schema, 'strict')

const result = zodSchema.safeParse({ config: { minute: 100, policy: 'redis', redis: {} } })
if (!result.success) {
  // result.error.issues - per-field messages, usable for form errors
}
```

`compileField` compiles a single field definition in isolation; both
functions take the same optional `mode` argument.

## Compat mode

`'strict'` asks "is this config valid". `'compat'` asks "would rendering
this value in the visual form break or show something blank" - the
question that matters when deciding whether it's safe to switch from the
code editor back to the form.

| Kept strict (a wrong value breaks or corrupts rendering) | Relaxed (still displays fine - strict mode already flags real problems) |
|---|---|
| Type shape: `record`→object, `array`/`set`→array, `map`→object, `foreign`/`referenceable`→one of their allowed shapes | `required` / explicit `null` - a form field just showing empty is normal |
| `one_of` (string/number/boolean/set) - Field.vue renders these as a `<select>`; an out-of-list value renders it empty | `not_one_of`, `len_min`/`len_max`, `between`, `gt`, `match*`, `starts_with`, `uuid`, `integer` - content/business-rule checks that don't affect whether the value displays |

`elements`/`keys`/`values`/`fields` recurse under the *same* mode - a
compat-mode array still gets compat-mode items.

`strict` and `compat` are two independent, self-contained compilers, not
one compiler with `mode === '...'` branches: [`compile-strict.ts`](./compile-strict.ts),
[`compile-compat.ts`](./compile-compat.ts), sharing only the types in
[`types.ts`](./types.ts). [`index.ts`](./index.ts) picks one by `mode`. Same
shape as the `datakit` plugin's `schema/strict.ts` + `schema/compat.ts`
pair, and for the same reason: each file reads top to bottom as the whole
story for its mode.

## Scope

This is **Layer 1 only**: field-level type and constraint checks.

| Kong DSL | Zod behavior |
|---|---|
| `type` (string/number/integer/boolean/array/set/map/record/foreign/json/function) | corresponding Zod type |
| `required` / `default` | not `required: true` -> `.nullable().optional()` (also `.default()` when a default is present); `required: true` -> neither `null` nor `undefined` accepted |
| `one_of` (string) | `z.enum(...)` |
| `one_of` / `not_one_of` (other types) | refinement |
| `between` | inclusive min/max |
| `gt` | exclusive min |
| `len_min` / `len_max` (string) | **byte length**, not JS `.length` - see [Limitations](#limitations) |
| `len_min` / `len_max` (array/set/map) | element/entry count |
| `starts_with` | prefix check |
| `uuid: true` | `.uuid()` |
| `match` / `match_all` / `match_none` / `match_any` | translated regex checks, see [Lua patterns](#lua-patterns-are-not-js-regex) |
| `referenceable: true` | value may also be a `{vault://...}` reference string |
| `elements` / `keys` / `values` / `fields` | recursively compiled |

Every non-required field is nullable *and* optional, not just optional -
Kong represents "not set" as an explicit `null` about as often as by
omitting the key. A required field is the opposite, and names itself in the
message instead of a generic one (`"redis" is required` /
`"redis" cannot be null` / the type's own message for a present-but-wrong
value).

This matters most for `foreign`/`referenceable` fields, compiled as
`z.union(...)`: Zod's default union-failure message is a bare
`"Invalid input"` with the real reason buried in `issue.errors`. The
required/null check runs *before* the union is evaluated, so those two
common cases still get a real, named message; the union is also given its
own custom message for the remaining case (present, non-null, wrong shape).

Anything with an unrecognized `type` or keyword falls back to `z.unknown()`
with a `console.warn`, on purpose - an unfamiliar schema should degrade to
"checks less," never "throws and breaks the form."

## Limitations

### Not implemented at all (by explicit descope, not by accident)

- **`entity_checks`** (`mutually_exclusive`, `mutually_required`,
  `at_least_one_of`, `conditional`, `conditional_at_least_one_of`,
  `only_one_of`, ...) - cross-field rules, out of scope here.
- **`custom_entity_check`** / field-level **`custom_validator`** - not
  recoverable, for any plugin, ever: Kong's Admin API strips Lua functions
  before serializing a schema to JSON (`kong/api/api_helpers.lua`), so the
  actual check logic never reaches the frontend, only metadata like
  `field_sources`. Guarded fields still get their plain type/required
  checks; the cross-field rule itself is just absent client-side.
- **`shorthand_fields[].func`** - same reason; the rename/transform for
  deprecated aliases (e.g. `redis_host` → `config.redis.host`) is dropped,
  and the shorthand is compiled as a regular field with no transform applied.

Because of this, **this compiler cannot replace server-side validation**
for any plugin using these constructs - roughly 42% of the 231 real plugin
schemas checked, for `custom_entity_check` alone. Treat it as a UX
improvement (fail fast, per-field messages), not the source of truth - a
save action always goes to the Admin API, and its response is what actually
gates the write.

### Lua patterns are not JS regex

`match`/`match_all`/`match_none`/`match_any` use Lua pattern syntax, not
PCRE/JS regex (`%d` not `\d`, no alternation, no `{n,m}`, a bare `-` after
an item is a *lazy* quantifier). `lua-pattern.ts` translates what it's
confident about and skips the rest (with a warning) rather than mistranslate
- notably `%b`/`%f`, unmapped classes (`%p`/`%c`/`%g`), and a bare `-`
outside `[...]`. Checked against all 231 real plugin schemas: everything
compiled, and only 2 patterns ever hit the bail-out path, both correctly.

### Byte length, not character length

`len_min`/`len_max` check `#value` in Lua, a **byte** count - this compiler
uses `TextEncoder().encode(value).length`, not `value.length` (a UTF-16
code unit count). A 3-character Chinese string can be 9 bytes and fail a
`len_max: 8` that a naive `.length` check would have passed.

### `foreign` fields

Only checked for *shape* (`null`, a string, or `{ id: string }`) - whether
the referenced entity actually exists requires a DB round trip, out of
scope here. That check belongs in the UI layer (e.g. an entity picker).

### `record` fields are not `.strict()`

Unknown keys are stripped, not rejected - otherwise shorthand fields or any
DSL feature this compiler doesn't model yet would make valid configs fail
to parse.

## Running the tests

```bash
cd packages/entities/entities-plugins
npx vitest run src/utils/lua-schema-to-zod/
```

Split to match the file layout: `compile-strict.spec.ts`, `compile-compat.spec.ts`,
`lua-pattern.spec.ts`, `index.spec.ts` (checks the public API routes to the
right compiler by `mode`), `smoke.spec.ts` (every fixture in
`fixtures/schemas/*` compiles without throwing, via the public API).
