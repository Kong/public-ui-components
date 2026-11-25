# Architecture

## Directory Structure

```
src/
├── types.ts             # Core type definitions
├── form-schema.ts       # FormSchema/UnionFieldSchema/etc. — the schema type contract
├── field-dispatch.ts    # Schema-type -> component mapping, used by Field.vue
├── utils.ts (+ .spec.ts) # Path utilities, field sorting
├── constants.ts         # USE_SECRET_INPUT_KEY, FREE_FORM_SCHEMA_MAP_KEY injection keys
├── external-links.ts    # Doc links referenced by field help text
├── composables/         # Vue composables (core logic, including map entry tracking)
│   └── useI18n.ts         # i18n wrapper backed by locales/en.json
├── filler/               # Test utilities for auto-filling forms (Cypress + Playwright);
│                         # schema-shape-driven, no plugin/layout knowledge
└── components/
    ├── Form.vue             # Root form component (provides context)
    ├── Field.vue            # Auto-dispatches to correct field component by schema type
    ├── FieldRenderer.vue    # Register custom field renderers via match function
    ├── ObjectField.vue      # Nested record rendering (collapsible)
    ├── ArrayField.vue       # Array rendering (default/card/tabs appearances)
    ├── StringField.vue (+ .spec.ts) # Text/textarea/password inputs
    ├── NumberField.vue      # Number/integer inputs
    ├── BooleanField.vue     # Checkbox inputs
    ├── EnumField.vue        # Select/multiselect dropdowns (for one_of fields)
    ├── MapField.vue         # Map/dictionary fields with KeyId-backed entry tracking
    ├── StringArrayField.vue # Tag-like comma-separated string sets
    ├── JsonField.vue        # JSON textarea editor
    ├── ForeignField.vue     # Foreign entity reference (stores {id: string})
    ├── ExpressionEditor.vue # The collapsible expression editor; StringField/NumberField render one inline, or a host places it itself
    ├── EnhancedInput.vue    # Base input wrapper (help text, errors, tooltips)
    ├── FieldErrors.vue      # The list of a field's errors, rendered under its control
    ├── CelInput.vue         # Standalone CEL input using the shared Monaco language API
    ├── CelField.vue         # CEL form binding; selected by a custom renderer for a string field
    ├── SwitchField.vue      # Boolean toggle switch (KInputSwitch)
    ├── SlideTransition.vue  # Height-animated collapse transition
    ├── EntityChecksAlert.vue (+ .spec.ts) # Validation constraint alerts
    ├── test-utils.ts        # Cypress mount/assert helpers for the *.cy.ts tests below
    └── *.cy.ts              # Integration tests for core fields/mechanisms
```

## Data Flow

```
FormSchema + data props
       |
   Form.vue (provideFormShared -> creates reactive innerData, schemaHelpers)
       |
   Field.vue (useField -> reads schema + value by path, dispatches to renderer)
       |
   *Field.vue (reads/writes field value via composables)
       |
   onChange callback -> emits transformed data upward
```

## Composables (`composables/`)

All exports below are re-exported from the package root (`render-rules.ts` only exports `renderRuleExactMatch` publicly; `createRenderRuleRegistry` stays internal) — see [Usage](../README.md#usage).

| File | Exports | Purpose |
|---|---|---|
| `form-context.ts` | `provideFormShared()`, `useFormShared()` | Central form state: reactive data, schema, config, render rules, getValue/setValue, getEmptyOrDefault/getEmptyValue |
| `reveal-open.ts` | `useRevealOpen(container, open)` | Opens a section that keeps its fields mounted while closed (e.g. `KCollapse`) when a reveal heads for a field inside it |
| `field.ts` | `useField(name)` | Individual field state: value, schema, path, renderer, error, ancestors, emptyOrDefaultValue, emptyValue |
| `field-path.ts` | `useFieldPath()` | Calculates absolute dot-notation path from parent context via provide/inject |
| `schema.ts` | `useSchemaHelpers()` | Schema introspection: getSchema, getDefault, getEmptyOrDefault, getEmptyValue, getSelectItems, getLabelAttributes |
| `useMapField.ts` | `useMapField()` | KeyId-backed map field state: keys, add/remove/rename, display labels |
| `labels.ts` | `useLabelPath()`, `useFieldAttrs()` | Label generation with dictionary lookup (IP, SSL, TTL, JWT, etc.) |
| `render-rules.ts` | `createRenderRuleRegistry()`, `renderRuleExactMatch()` | Bundles (field grouping/ordering) and dependencies (conditional visibility) |
| `expression.ts` | `useExpressionField()` | One expressible field's twin: value, empty sentinel, array-slot writes, clear |
| `expression-paths.ts` | `toExpressionPath()`, `toSourcePath()`, `isExpressionFieldSchema()`, `EXPRESSIONS_FIELD`, `EXPRESSION_ARRAY_EMPTY` | Pure path/schema helpers for the `expressions` convention. Separate from `expression.ts` so `form-context` can use them without an import cycle |
| `ancestors.ts` | `useFieldAncestors()` | Access parent field context for nested components |
| `constants.ts` | `FIELD_RENDERERS`, `FIELD_RENDERER_SLOTS` | Injection key symbols |

## Path System

Fields are addressed by dot-notation paths:

- `$` — root symbol
- `.` — separator
- `*` — array wildcard (for schema lookup)

```typescript
resolve('config', 'redis', 'host')     // -> 'config.redis.host'
resolveRoot('config', 'redis')          // -> '$.config.redis'
generalizePath('config.servers.0.host') // -> 'config.servers.*.host'
```

## Render Rules

Control field ordering and conditional visibility. Accepted by `Form` and `ObjectField`.

```typescript
interface RenderRules {
  // Group fields together and control ordering.
  // Each bundle is an array of field paths at the same nesting level.
  bundles?: string[][]

  // Show a field only when its dependency matches the expected value.
  // Field and dependency must be at the same nesting level.
  dependencies?: {
    [fieldPath: string]: [dependencyPath: string, expectedValue: any]
  }
}
```

Example:

```typescript
const renderRules: RenderRules = {
  bundles: [
    ['config.strategy', 'config.redis'],   // strategy and redis rendered together
  ],
  dependencies: {
    'config.redis': ['config.strategy', 'redis'],  // show redis only when strategy === 'redis'
  },
}
```

Constraints:
- Fields in the same bundle or dependency must be at the same nesting level.
- Circular references are not allowed (validated at runtime with helpful error messages).

## Empty Field Values

Fields resolve their "no value" representation through `FormConfig.emptyFieldValue`, not a hardcoded `null`:

```typescript
interface FormConfig<T = Record<string, any>> {
  /** Sentinel written for an empty/unset field. Defaults to `'null'`. */
  emptyFieldValue?: 'null' | 'undefined'
  prepareFormData?: (data: any) => any
  transformLabel?: (label: string, fieldPath: string) => string
  hasValue?: (data: T | undefined) => boolean
  updateOnChange?: boolean
}
```

Passed as `<Form :config="{ emptyFieldValue: 'undefined' }">`.

Two composables surface the resolved sentinel, for two different scenarios — **picking the wrong one is a common bug**:

| Composable | Backed by | Use for | Required-field behavior |
|---|---|---|---|
| `field.emptyOrDefaultValue` | `getEmptyOrDefault(path)` | **Initialization**: new map entry (`useMapField.addKey`), hidden-field reset | Forces schema structure back in: `[]` / `{}` / an explicit `schema.default` |
| `field.emptyValue` | `getEmptyValue()` | **User actively clears a value** (`handleUpdate`, mode switches that blank sibling fields) | Always the plain configured sentinel — never re-injects a default or forces structure |

Using `emptyOrDefaultValue` for a clear action is the bug to avoid: it would make a required field with an explicit `schema.default` impossible to empty, since every clear snaps it back to the default. See `StringField.vue`/`NumberField.vue`/`ArrayField.vue`'s `removeItem` for clear-action examples (`emptyValue`) versus `useMapField.ts`'s `addKey` (`emptyOrDefaultValue`). Note `ArrayField.vue`'s `addItem` calls `getDefault(path)` directly rather than `getEmptyOrDefault` — the two differ for a non-required field with an explicit `schema.default`, so it isn't an equivalent example.

## Expressible Fields (`expressions`)

Some Gateway config fields can alternatively have their value supplied as a CEL expression evaluated on every request, which takes priority over the plain value. The expression lives in a **twin field under a root-level `expressions` record — a sibling of `config`, not part of it**:

```jsonc
{
  "config":      { "limit": [10, 20, 30], "minute": null },
  "expressions": { "limit": ["", "", "some_expression"] }
}
```

| Rule | Detail |
|---|---|
| Twin path | The field path with its first segment swapped: `config.minute` ↔ `expressions.minute`, `config.limit.0` ↔ `expressions.limit.0` |
| Marker | Both halves must agree: `expressible` on the source field, and the twin's `expressible_kong_type` — the type the expression must return. Clearing either turns expression mode off and leaves the plain field. An expressible *array* carries `expressible` on the array while its twins are per element, so an element inherits it from its parent |
| Array pairing | **By position, as submitted.** `expressions.limit[i]` drives `config.limit[i]` |
| Empty array slot | `""` — never `null`. Kong makes every array element `required`, so a null element fails validation. A twin array is emitted at the source array's full length with `""` in every literal slot |
| Empty scalar twin | The configured `emptyFieldValue` sentinel (absent/null); a scalar has no slot to hold |

Rendering is entirely schema-driven, so **a host needs no configuration to get it**: `StringField` and `NumberField` render their own `ExpressionEditor` below the value input whenever the field's twin resolves in the schema, and nothing otherwise. Schemas without an `expressions` record are unaffected. This is self-contained per field component rather than a separate dispatch step, so it applies equally whether the field was reached through `Field.vue`'s type-based dispatch or a host rendered `StringField`/`NumberField` directly (`MapField`'s inline string values, for one).

| Component | Use |
|---|---|
| `ExpressionEditor` | The collapsible editor on its own. `StringField`/`NumberField` render one via their `expressionEditor` prop; a host that lays the value input out itself places it directly |
