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
| `reveal-adapter.ts` | `defineRevealAdapter()`, `updateModelValue()` | Tells the form what a component does with fields, so a reveal and the field errors reach fields that are not mounted, see [Closed Containers](closed-containers.md) |
| `reveal-tree.ts` | `scanRevealTree()`, `flattenRevealTree()`, `findDeepest()`, `coversFieldPath()`, `matchesContainer()` | Finds the fields the form's content renders and the containers they sit in, from its vnodes, without mounting them |
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
