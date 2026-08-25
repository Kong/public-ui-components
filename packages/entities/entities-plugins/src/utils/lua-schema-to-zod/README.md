# lua-schema-to-zod

Compiles a Kong plugin config schema - the JSON the Admin API dumps for a
plugin's Lua schema (`GET /schemas/plugins/:name`) - into a [Zod](https://zod.dev)
schema, so a frontend can validate plugin config at runtime without a round
trip to the gateway.

Used by the `free-form` plugin config form's code editor
(`shared/CodeEditor.vue`) to show inline validation markers as you type, and
to decide whether it's currently safe to switch back to the visual form (see
[Compat mode](#compat-mode)). It does not replace server-side validation -
see [Scope](#scope) and [Limitations](#limitations) for exactly what it
covers and what it deliberately doesn't.

## Usage

```ts
import { luaSchemaToZod } from './index'

// `schema` is exactly what the Admin API returns for a plugin's schema
const zodSchema = luaSchemaToZod(schema) // same as luaSchemaToZod(schema, 'strict')

const result = zodSchema.safeParse({ config: { minute: 100, policy: 'redis', redis: {} } })
if (!result.success) {
  // result.error.issues - per-field messages, usable for form errors
}
```

`compileField` is also exported if you need to compile a single field
definition in isolation (e.g. for a one-off input outside a full plugin
config); it takes the same optional mode argument as `luaSchemaToZod`.

## Compat mode

`luaSchemaToZod(schema, 'compat')` compiles a second, deliberately relaxed
schema that answers a different question than `'strict'` does. `'strict'`
asks "is this config fully valid". `'compat'` asks "would rendering this
value in the visual form break or show something nonsensically blank" - the
question that matters when deciding whether it's currently safe to switch
from the code editor back to the form, without the form crashing or quietly
showing garbage.

| Kept strict in compat mode (a wrong value here breaks or visibly corrupts rendering) | Relaxed in compat mode (a wrong value here just displays as-is, and the form's own field-level validation can flag it normally) |
|---|---|
| `required` / explicit `null` - a missing or null value is completely normal for a form field to show empty, so `required` never applies in compat mode; every field is treated as `.nullable().optional()` | - |
| Type shape: `record` must be an object, `array`/`set` must be an array, `map` must be an object, `foreign`/`referenceable` must match one of their allowed shapes | `uuid: true` (a non-UUID string still renders fine in a text input) |
| `one_of` (string/number/boolean/set) - Field.vue renders these as a `<select>`; a value outside the option list renders that select empty, a visible broken state, not just an invalid one | `not_one_of`, `len_min`/`len_max`, `between`, `gt`, `match`/`match_all`/`match_none`/`match_any`, `starts_with` - all pure content/business-rule checks that don't affect whether the value can be displayed |
| - | `integer` (a float in an "integer" field still displays fine in a number input) |

`elements` (array/set), `keys`/`values` (map), and `fields` (record) are all
recompiled recursively under the *same* mode - a compat-mode array still
gets compat-mode items, not strict ones.

### File layout

Unlike the table above might suggest, this isn't one compiler with
`mode === 'strict'` checks sprinkled through it. `strict` and `compat` are
two independent, self-contained compilers, in their own files:

- [`compile-strict.ts`](./compile-strict.ts) - the full DSL
- [`compile-compat.ts`](./compile-compat.ts) - the relaxed rules above
- [`types.ts`](./types.ts) - the `LuaField`/`LuaFormSchema`/`CompileMode`
  types shared by both (no behavior, just shapes)
- [`index.ts`](./index.ts) - the public `luaSchemaToZod`/`compileField`,
  which just pick one of the two compilers by `mode`

This is the same shape as the `datakit` plugin's `schema/compat.ts` +
`schema/strict.ts` pair, for the same reason: reading either file top to
bottom tells the whole story for that mode, with no branching on mode mixed
into shared logic. The two files necessarily duplicate some structure (type
dispatch, the recursion shape) - that's an intentional trade, not an
oversight.

## Scope

This is **Layer 1 only**: field-level type and constraint checks. Given a
field's JSON definition, it maps:

| Kong DSL | Zod behavior |
|---|---|
| `type` (string/number/integer/boolean/array/set/map/record/foreign/json/function) | corresponding Zod type |
| `required` / `default` | not `required: true` -> `.nullable().optional()` (also `.default()` on top when a default is present); `required: true` -> neither `null` nor `undefined` accepted |
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

Every non-`required: true` field is both nullable and optional, not just
optional: Kong's own stored/returned plugin config represents "not set" as an
explicit `null` about as often as by omitting the key, so a schema that only
accepted `undefined` would reject a lot of real, valid config payloads. A
non-required field with a `default` still accepts an explicit `null` as-is -
the default only fills in for a genuinely missing key, matching Kong's own
behavior of not overriding an explicit null with the field's default.

A `required: true` field is the opposite on both counts, and says so
explicitly - by name - rather than falling through to whatever generic
message its compiled type happens to produce. Every message quotes the
actual field name (the object key at that nesting level; an array's elements
are labeled `"<field> item"`, a map's `"<field> key"` / `"<field> value"`)
rather than a generic "this field":

- missing (`undefined`) -> `"redis" is required`, even if the field also has
  a `default` (a default only fills in a missing value - it doesn't change
  whether the field is required)
- explicit `null` -> `"redis" cannot be null`
- present and non-null, but the wrong shape -> the type's own message (or the
  compiler's custom one - see `foreign`/`referenceable` below)

This matters most for `foreign` and `referenceable` fields, both of which
compile to a `z.union(...)`: Zod reports a bare `"Invalid input"` at the top
level whenever every branch of a union fails, with the real reason buried
inside `issue.errors` (which nothing here unpacks). Left alone, a missing or
`null` required `foreign`/`referenceable` field would say nothing more than
`"Invalid input"`. The required/null check above runs *before* the union is
ever evaluated, so those two common cases get a real, named message
regardless of what the field's own type is; the union is also given its own
custom `error` message naming the field (e.g. `"consumer" must be a string
ID, or an object with an "id" property`) for the remaining case - a value
that's present, non-null, and still the wrong shape.

Anything with an unrecognized `type` or an unhandled keyword falls back to
`z.unknown()` (or is silently ignored) with a `console.warn`, on purpose -
a schema this compiler doesn't fully understand should degrade to "checks
less," never "throws and breaks the form."

## Limitations

### Not implemented at all (by explicit descope, not by accident)

- **`entity_checks`** (`mutually_exclusive`, `mutually_required`,
  `at_least_one_of`, `conditional`, `conditional_at_least_one_of`,
  `only_one_of`, ...) - cross-field rules. These are declarative and *could*
  be compiled into a generic `superRefine` executor (that was the original
  "Layer 2" proposal), but it's out of scope here.
- **`custom_entity_check`** and field-level **`custom_validator`** - Kong's
  Admin API strips Lua functions before serializing a schema to JSON
  (`kong/api/api_helpers.lua`: any table value of Lua type `"function"` is
  dropped). Only metadata like `field_sources` survives; the actual check
  logic never reaches the frontend. **There is no way to recover this from
  the JSON, for any plugin, ever** - it's not a "not implemented yet" gap,
  it's a hard ceiling on what a JSON-schema-to-Zod compiler can do. Fields
  guarded by one of these still get their plain type/required checks; the
  cross-field rule itself is just absent client-side.
- **`shorthand_fields[].func`** - the rename/transform logic for deprecated
  aliases (e.g. `redis_host` → `config.redis.host`) is also a Lua closure and
  is dropped the same way. Shorthand fields are compiled as if they were
  regular fields (their own inline validator survives), but no
  forward/backward transform is applied.

Because of the above, **this compiler cannot replace server-side
validation** for any plugin that uses these constructs - which, across the
231 real plugin schemas checked during the feasibility pass, is roughly 42%
(`custom_entity_check` alone). Treat client-side validation from this
compiler as a UX improvement (fail fast, per-field messages) layered in
front of the Admin API's response, never as the source of truth. A save
action must still go to the Admin API and its 4xx response is what actually
gates the write.

### Lua patterns are not JS regex

`match`/`match_all`/`match_none`/`match_any` use Lua pattern syntax, not
PCRE/JS regex (`%d` not `\d`, no alternation `|`, no `{n,m}`, a bare `-`
after an item is a *lazy* quantifier unlike JS's greedy `*`). `lua-pattern.ts`
translates what it's confident about and returns `null` for the rest, which
the compiler then skips (with a warning) rather than mistranslate. Patterns
it deliberately bails on:

- `%b` (balanced match) and `%f` (frontier pattern) - no JS equivalent
- `%p` / `%c` / `%g` character classes and their complements - not mapped
  (only `%a %d %l %s %u %w %x` and their uppercase complements are)
- a `-` used as a quantifier outside `[...]` - too easy to translate wrong
- any other unrecognized `%`-escape

Validated against all 231 real Admin-API JSON dumps in
`kong-konnect/gateway-schema-watcher` at the time this was written: every
schema compiled without throwing, and exactly 2 patterns (across all
plugins) hit the bail-out path - both correctly, on constructs in the list
above. This isn't a guarantee it'll always be that clean as Kong ships new
plugins/patterns, just a data point on how conservative the translator is in
practice.

### Byte length, not character length

`len_min`/`len_max` check `#value` in Lua, which is a **byte** count. This
compiler uses `TextEncoder().encode(value).length` to match that, not
`value.length` (a JS string's `.length` is a UTF-16 code unit count). This
matters for multi-byte input (CJK, emoji): a 3-character Chinese string can
be 9 bytes and would fail a `len_max: 8` that a naive `.length` check would
have passed.

### `foreign` fields

A `foreign` field (e.g. `consumer`, `service`) references another entity by
ID. This compiler only checks that the value is *shaped* like a reference
(`null`, a string, or `{ id: string }`) - it cannot check the referenced
entity actually exists, since that requires a DB round trip. That check, if
wanted, belongs in the UI layer (e.g. an entity picker), not in this Zod
schema.

### `record` fields are not `.strict()`

Compiled records use plain `z.object(shape)`, which strips unknown keys
rather than rejecting them. This is deliberate: shorthand fields, and any
DSL feature this compiler doesn't model yet, would otherwise make
otherwise-valid configs fail to parse.

## Running the tests

```bash
cd packages/entities/entities-plugins
npx vitest run src/utils/lua-schema-to-zod/
```

Tests are split to match the file layout:

- `compile-strict.spec.ts` - the full DSL (defaults, `between`, `one_of`,
  `starts_with` + `match_none`, vault references, required/null messages,
  graceful fallback on unknown types) against this package's existing
  `fixtures/schemas/*`
- `compile-compat.spec.ts` - the relaxed rules from the table above
- `lua-pattern.spec.ts` - the Lua-pattern-to-JS-regex translator
- `index.spec.ts` - just checks the public `luaSchemaToZod`/`compileField`
  route to the right one of the two compilers by `mode`
- `smoke.spec.ts` - asserts every fixture in `fixtures/schemas/*` compiles
  without throwing (via the public API, strict mode)
