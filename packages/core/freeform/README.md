# @kong-ui-public/freeform

A schema-driven dynamic form rendering engine for Kong plugin configuration, extracted from `@kong-ui-public/entities-plugins`. It contains only the generic, reusable rendering primitives — no plugin registry, no layout, no scope/Redis/credential UI — so it can be used to build custom plugin form UIs (e.g. in a different MFE) without pulling in the full entities-plugins bundle.

**Core idea**: Given a `FormSchema` (JSON-like descriptor of fields), the engine auto-renders the appropriate Vue form components with correct types, labels, validation, and layout.

- [Directory Structure](#directory-structure)
- [Schema System](#schema-system)
- [Core Architecture](#core-architecture)
- [Usage](#usage)
  - [Install](#install)
  - [Basic Usage](#basic-usage)
  - [Writing a Custom Field Component](#writing-a-custom-field-component)
- [Filler (test utilities)](#filler-test-utilities)
- [Reference](#reference)

## Directory Structure

```
src/
├── types.ts             # Core type definitions
├── form-schema.ts       # FormSchema/UnionFieldSchema/etc. — the schema type contract
├── field-dispatch.ts    # Schema-type -> component mapping (shared by Field/ExpressionField)
├── utils.ts (+ .spec.ts) # Path utilities, field sorting
├── constants.ts         # USE_SECRET_INPUT_KEY, FREE_FORM_SCHEMA_MAP_KEY injection keys
├── external-links.ts    # Doc links referenced by field help text
├── composables/         # Vue composables (core logic, including map entry tracking)
│   └── useFreeformI18n.ts # i18n wrapper backed by locales/freeform-en.json
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
    ├── ExpressionField.vue  # An expressible field: its value input plus its expression
    ├── ExpressionEditor.vue # Just the collapsible expression editor
    ├── EnhancedInput.vue    # Base input wrapper (help text, errors, tooltips)
    ├── SwitchField.vue      # Boolean toggle switch (KInputSwitch)
    ├── SlideTransition.vue  # Height-animated collapse transition
    ├── EntityChecksAlert.vue (+ .spec.ts) # Validation constraint alerts
    ├── test-utils.ts        # Cypress mount/assert helpers for the *.cy.ts tests below
    └── *.cy.ts              # Integration tests for core fields/mechanisms
```

Everything here is generic: no plugin registry, no layout, no scope/Redis/credential UI. That kind of
entities-plugins-specific code (layout, plugin registry, Redis types, credential fields, etc.) stays in
`@kong-ui-public/entities-plugins`, which depends on this package — never the other way around.

## Schema System

### FormSchema Structure

The schema mirrors Kong Admin API field definitions. Defined in `form-schema.ts`.

```typescript
interface FormSchema {
  type: 'record'
  fields: NamedFieldSchema[]        // Array of { fieldName: UnionFieldSchema }
  supported_partials?: Record<string, string[]>  // Redis partial support
}

type NamedFieldSchema = { [name: string]: UnionFieldSchema }

// Field types: string | number | integer | boolean | foreign | array | set | map | record | json | function
type UnionFieldSchema = StringFieldSchema | NumberLikeFieldSchema | BooleanFieldSchema
  | ArrayFieldSchema | SetFieldSchema | MapFieldSchema | RecordFieldSchema
  | JsonFieldSchema | ForeignFieldSchema
```

### Schema to Component Mapping

Defined in `field-dispatch.ts`. The mapping logic:

| Schema Type | `one_of` present? | Component |
|---|---|---|
| any type, with an `expressions` twin | - | `ExpressionField` (the value input below, plus its expression) |
| `string` | No | `StringField` |
| `string` | Yes | `EnumField` |
| `number` | `integer` | No | `NumberField` |
| `number` | `integer` | Yes | `EnumField` |
| `boolean` | No | `BooleanField` |
| `boolean` | Yes | `EnumField` |
| `record` | - | `ObjectField` |
| `array` | - | `ArrayField` |
| `set` (tag-like) | - | `StringArrayField` |
| `set` (enum-like) | - | `EnumField` |
| `map` | - | `MapField` |
| `json` | - | `JsonField` |
| `foreign` | - | `ForeignField` |

### Entity Checks

Validation constraints at the schema level:

- `at_least_one_of` — at least one field must have a value
- `mutually_exclusive` — only one field can have a value
- `mutually_required` — all or none must have values
- `conditional` — if field X matches, then field Y must match
- `conditional_at_least_one_of` — conditional at-least-one rule

## Core Architecture

### Data Flow

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

### Composables (`composables/`)

All exports below are re-exported from the package root (`render-rules.ts` only exports `renderRuleExactMatch` publicly; `createRenderRuleRegistry` stays internal) — see [Usage](#usage) below.

| File | Exports | Purpose |
|---|---|---|
| `form-context.ts` | `provideFormShared()`, `useFormShared()` | Central form state: reactive data, schema, config, render rules, getValue/setValue, getEmptyOrDefault/getEmptyValue |
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

### Path System

Fields are addressed by dot-notation paths:

- `$` — root symbol
- `.` — separator
- `*` — array wildcard (for schema lookup)

```typescript
resolve('config', 'redis', 'host')     // -> 'config.redis.host'
resolveRoot('config', 'redis')          // -> '$.config.redis'
generalizePath('config.servers.0.host') // -> 'config.servers.*.host'
```

### Render Rules

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

### Empty Field Values

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

### Expressible Fields (`expressions`)

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

Rendering is entirely schema-driven: `Field.vue` dispatches to `ExpressionField` (the plain input plus its expression) for any field whose twin resolves in the schema, and to the normal type mapping otherwise. Schemas without an `expressions` record are unaffected.

| Component | Use |
|---|---|
| `ExpressionField` | The pair. What the dispatch resolves to; a host overriding the field replaces both halves |
| `ExpressionEditor` | Just the collapsible editor, for a host that lays out the value input itself |

## Usage

### Install

```ts
import { Form, FieldRenderer, FIELD_RENDERERS } from '@kong-ui-public/freeform'
import type { FormSchema, RenderRules } from '@kong-ui-public/freeform'

import '@kong-ui-public/freeform/style.css'
```

### Basic Usage

```vue
<template>
  <form @submit.prevent="handleSubmit">
    <Form
      ref="formRef"
      :schema="pluginSchema"
      :data="formData"
      @change="formData = $event"
    />

    <button type="submit">Save</button>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Form } from '@kong-ui-public/freeform'
import type { FormSchema } from '@kong-ui-public/freeform'

const props = defineProps<{ pluginSchema: FormSchema }>()
const formData = ref({})
const formRef = ref<InstanceType<typeof Form>>()

function handleSubmit() {
  const value = formRef.value?.getValue()
  // submit value
}
</script>
```

### Custom Field Rendering

Override how specific fields render using `FieldRenderer`:

```vue
<Form :schema="schema">
  <template #[FIELD_RENDERERS]>
    <FieldRenderer :match="({ path }) => path === 'config.my_field'">
      <MyCustomField />
    </FieldRenderer>
  </template>
</Form>
```

The `match` function receives `{ path, genericPath, schema }` and returns `boolean`.

Rendering priority in `Field.vue` (highest to lowest):

1. Named slot override (by field name)
2. Custom renderer (from slot-based registration)
3. `FieldRenderer` match
4. Auto-dispatch by schema type

### Writing a Custom Field Component

The composables listed above are exported from the package root, so a host app can author its own field component that reads and writes a named field's value the same way `SwitchField`/`RadioField`-style components do internally — no `getValue`/`setValue` round-trip needed:

```vue
<script setup lang="ts">
import { toRef } from 'vue'
import { useField } from '@kong-ui-public/freeform'

const props = defineProps<{ name: string }>()
const { value } = useField<boolean>(toRef(() => props.name))
</script>

<template>
  <input
    type="checkbox"
    :checked="value"
    @change="value = ($event.target as HTMLInputElement).checked"
  >
</template>
```

Register it against a field path with `FieldRenderer`, or place it directly inside a `Form` slot with `name` set to the field's path — both wire into the same reactive form state as the built-in field components.

When the field needs to write an "empty" value (the user clears it, or a mode switch blanks it), use `emptyValue` from `useField()` instead of hardcoding `null` — see [Empty Field Values](#empty-field-values).

## Filler (test utilities)

Auto-fill utilities for Cypress and Playwright tests. A framework-agnostic core with framework-specific adapters — depends only on `form-schema.ts` and other generic primitives, no plugin/layout knowledge.

```
filler/
├── shared/       # field-walker (generator traversal), selectors (data-testid patterns), schema-utils
├── cypress/      # Cypress handlers for 11 field types
└── playwright/   # Playwright handlers (mirror structure)
```

Supported field types: string, number, boolean, enum, array, record, map, tag, json, foreign.

Usage:

```typescript
import { createFiller } from '@kong-ui-public/freeform/filler/cypress'

const filler = createFiller(schema)
filler.fill({ config: { host: 'localhost', port: 6379 } })
filler.fillField('config.host', 'example.com')
```

```typescript
import { createFiller } from '@kong-ui-public/freeform/filler/playwright'

const filler = createFiller(page, schema)
await filler.fill({ config: { host: 'localhost', port: 6379 } })
```

### Adding a New Field Type

1. Create `components/[Type]Field.vue` component
2. Add a case in `field-dispatch.ts`'s `resolveFieldComponent` (kept separate from `Field.vue` so `ExpressionField` can share it)
3. Add handler type in `filler/shared/field-walker.ts` (`HandlerType` enum)
4. Add Cypress handler in `filler/cypress/handlers/`
5. Add Playwright handler in `filler/playwright/handlers/`
6. Add selector support in `filler/shared/selectors.ts`
7. Add or update filler tests in `filler/cypress/fill-form.cy.ts` and `filler/playwright/fill-form.pw.ts`

## Reference

### Injection Keys

| Key | Purpose |
|---|---|
| `FIELD_RENDERERS` | Slot name for custom renderers (`Form.vue`) |
| `FIELD_RENDERER_SLOTS` | Inherited parent slots (`Form.vue`) |
| `USE_SECRET_INPUT_KEY` | Toggles secret-input rendering on `StringField` (provided by the host app) |

### `data-testid` Conventions

| Element | Pattern | Example |
|---|---|---|
| Form | `ff-standard-layout-form` | |
| Field | `ff-{dotpath}` | `ff-config.redis.host` |
| Array item | `ff-array-{path}.{index}` | `ff-array-config.servers.0` |
| Object toggle | `ff-object-toggle-{path}` | `ff-object-toggle-config.redis` |
| Add button | `ff-array-add-{path}` | `ff-array-add-config.servers` |
