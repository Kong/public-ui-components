# lua-schema-to-zod (POC)

Compiles a Kong plugin config schema - the JSON the Admin API dumps for a
plugin's Lua schema (`GET /schemas/plugins/:name`) - into a [Zod](https://zod.dev)
schema, so a frontend can validate plugin config at runtime without a round
trip to the gateway.

**Status: proof of concept.** Not wired into the `free-form` form system, not
used by any production code path. It exists to answer "is this feasible, and
how far can it get" - see [Scope](#scope) and [Limitations](#limitations)
below before reaching for it in real UI.

## Usage

```ts
import { luaSchemaToZod } from './index'

// `schema` is exactly what the Admin API returns for a plugin's schema
const zodSchema = luaSchemaToZod(schema)

const result = zodSchema.safeParse({ config: { minute: 100, policy: 'redis', redis: {} } })
if (!result.success) {
  // result.error.issues - per-field messages, usable for form errors
}
```

`compileField` is also exported if you need to compile a single field
definition in isolation (e.g. for a one-off input outside a full plugin
config).

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
field with a `default` still accepts an explicit `null` as-is - the default
only fills in for a genuinely missing key, matching Kong's own behavior of
not overriding an explicit null with the field's default.

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
  "Layer 2" proposal), but it's out of scope for this POC.
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
`kong-konnect/gateway-schema-watcher` at the time this POC was written: every
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

`index.spec.ts` covers specific behaviors (defaults, `between`, `one_of`,
`starts_with` + `match_none`, vault references, graceful fallback on unknown
types) against this package's existing `fixtures/schemas/*`. `smoke.spec.ts`
just asserts every one of those fixtures compiles without throwing.
