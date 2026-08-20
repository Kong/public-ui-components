# Free-Form Module

A schema-driven dynamic form rendering system for Kong plugin configuration. It replaces the legacy VueFormGenerator (VFG) approach with a modern Vue 3 Composition API architecture.

**Core idea**: Given a `FormSchema` (JSON-like descriptor of fields), the module auto-renders the appropriate Vue form components with correct types, labels, validation, and layout.

## Directory Structure

```
free-form/
├── README.md
├── shared/                  # Core framework (reusable across ALL plugins)
│   ├── Form.vue             # Root form component (provides context)
│   ├── Field.vue            # Auto-dispatches to correct field component by schema type
│   ├── FieldRenderer.vue    # Register custom field renderers via match function
│   ├── ObjectField.vue      # Nested record rendering (collapsible)
│   ├── ArrayField.vue       # Array rendering (default/card/tabs appearances)
│   ├── StringField.vue      # Text/textarea/password inputs
│   ├── NumberField.vue      # Number/integer inputs
│   ├── BooleanField.vue     # Checkbox inputs
│   ├── EnumField.vue        # Select/multiselect dropdowns (for one_of fields)
│   ├── MapField.vue         # Map/dictionary fields with KeyId-backed entry tracking
│   ├── StringArrayField.vue # Tag-like comma-separated string sets
│   ├── JsonField.vue        # JSON textarea editor
│   ├── ForeignField.vue     # Foreign entity reference (stores {id: string})
│   ├── RadioField.vue       # Radio button groups
│   ├── EnhancedInput.vue    # Base input wrapper (help text, errors, tooltips)
│   ├── AdvancedFields.vue   # Collapsible advanced fields section
│   ├── SwitchField.vue      # Boolean toggle switch (KInputSwitch)
│   ├── ScopeEntityField.vue # Scope entity selector (service, route, consumer, consumer_group)
│   ├── CodeEditor.vue       # Code editor component
│   ├── RedisConfigCard.vue  # Redis configuration card
│   ├── RedisSelector.vue    # Redis partial instance selector
│   ├── SlideTransition.vue  # Height-animated collapse transition
│   ├── EntityChecksAlert.vue # Validation constraint alerts
│   ├── composables/         # Vue composables (core logic, including map entry tracking)
│   ├── layout/              # Layout components
│   │   ├── DynamicLayout.vue   # Runtime-selected layout wrapper
│   │   ├── StandardLayout.vue  # Default API Gateway layout with form/code modes
│   │   ├── provider.ts         # Layout injection key and provider helper
│   │   └── ConditionField.vue  # Optional condition editor in General Info
│   ├── types.ts             # Core type definitions
│   ├── const.ts             # Injection keys (REDIS_PARTIAL_INFO, FORM_EDITING)
│   ├── define-plugin-config.ts # Plugin config helper with CommonForm fallback
│   ├── plugin-registry.ts   # Auto-discovers plugins/*.ts and plugins/*/index.ts
│   ├── utils.ts             # Path utilities, field sorting
│   └── schema-enhancement.ts # Transform legacy field rules to entity checks
├── Common/                  # Generic plugin form used by default
├── plugins/                 # Plugin registry entries and custom plugin forms
│   ├── *.ts                 # Simple plugins configured with CommonForm + overrides
│   └── <plugin>/index.ts    # Folder-based plugins with dedicated Vue components
├── filler/                  # Test utilities for auto-filling forms (Cypress + Playwright)
└── test/                    # Integration tests
```

## Schema System

### FormSchema Structure

The schema mirrors Kong Admin API field definitions. Defined in `src/types/plugins/form-schema.ts`.

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

Defined in `Field.vue`. The mapping logic:

| Schema Type | `one_of` present? | Component |
|---|---|---|
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

### Composables (`shared/composables/`)

All exports below are re-exported from `@kong-ui-public/entities-plugins/freeform` (`render-rules.ts` only exports `renderRuleExactMatch` publicly; `createRenderRuleRegistry` stays internal) — see the "Standalone Usage" section below.

| File | Exports | Purpose |
|---|---|---|
| `form-context.ts` | `provideFormShared()`, `useFormShared()` | Central form state: reactive data, schema, config, render rules, getValue/setValue, getEmptyOrDefault/getEmptyValue |
| `field.ts` | `useField(name)` | Individual field state: value, schema, path, renderer, error, ancestors, emptyOrDefaultValue, emptyValue |
| `field-path.ts` | `useFieldPath()` | Calculates absolute dot-notation path from parent context via provide/inject |
| `schema.ts` | `useSchemaHelpers()` | Schema introspection: getSchema, getDefault, getEmptyOrDefault, getEmptyValue, getSelectItems, getLabelAttributes |
| `useMapField.ts` | `useMapField()` | KeyId-backed map field state: keys, add/remove/rename, display labels |
| `labels.ts` | `useLabelPath()`, `useFieldAttrs()` | Label generation with dictionary lookup (IP, SSL, TTL, JWT, etc.) |
| `render-rules.ts` | `createRenderRuleRegistry()`, `renderRuleExactMatch()` | Bundles (field grouping/ordering) and dependencies (conditional visibility) |
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

Passed as `<Form :config="{ emptyFieldValue: 'undefined' }">` (or via `PluginConfigurationBaseProps.formConfig` for plugin forms).

Two composables surface the resolved sentinel, for two different scenarios — **picking the wrong one is a common bug**:

| Composable | Backed by | Use for | Required-field behavior |
|---|---|---|---|
| `field.emptyOrDefaultValue` | `getEmptyOrDefault(path)` | **Initialization**: new map entry (`useMapField.addKey`), hidden-field reset | Forces schema structure back in: `[]` / `{}` / an explicit `schema.default` |
| `field.emptyValue` | `getEmptyValue()` | **User actively clears a value** (`handleUpdate`, mode switches that blank sibling fields) | Always the plain configured sentinel — never re-injects a default or forces structure |

Using `emptyOrDefaultValue` for a clear action is the bug to avoid: it would make a required field with an explicit `schema.default` impossible to empty, since every clear snaps it back to the default. See `StringField.vue`/`NumberField.vue`/`ArrayField.vue`'s `removeItem` for clear-action examples (`emptyValue`) versus `useMapField.vue`'s `addKey` (`emptyOrDefaultValue`). Note `ArrayField.vue`'s `addItem` calls `getDefault(path)` directly rather than `getEmptyOrDefault` — the two differ for a non-required field with an explicit `schema.default`, so it isn't an equivalent example.

**Exception**: some fields have external merge-semantics that require a literal `null` regardless of this config — e.g. the `partials` reset in `service-protection/RedisField.vue` and `datakit/flow-editor/FlowEditor.vue`, where the plugin entity form *merges* free-form data with VFG data and `undefined` wouldn't clear an existing value. These are commented inline where they occur; don't blindly convert every hardcoded `null` to `getEmptyValue()` without checking whether it's one of these.

**Caveat for the props-data resync guard**: with `emptyFieldValue: 'undefined'`, `getValue()` can return an object with keys whose value is `undefined` (the key is present, per JS semantics, even though the value is omitted from `JSON.stringify`). `form-context.ts`'s resync guard compares `getValue()` against the incoming `data` prop with `isEqual`, which treats `{ a: undefined }` and `{}` as different. If a host round-trips the form's output through something that strips `undefined` keys (a JSON serialize/parse, a store write) before feeding it back in as `data`, the guard will misfire and rebuild the form mid-edit. No consumer in this repo does that today; confirm your round trip preserves `undefined` keys before enabling the flag.

## Layout

Plugin forms use `DynamicLayout` (`shared/layout/DynamicLayout.vue`) as the layout entry point. It renders a host-provided layout from `FREE_FORM_PLUGIN_LAYOUT` when one is available, and otherwise falls back to `StandardLayout` (`shared/layout/StandardLayout.vue`). Layouts that need the common free-form `Form` wrapper can compose `PluginConfigurationForm` (`shared/layout/PluginConfigurationForm.vue`) and provide their own surrounding product-specific blocks. The default StandardLayout form mode provides a 3-step structure:

1. **Plugin Scope** — Global vs Scoped (service/route/consumer/consumer_group) via radio buttons + ScopeEntityField for entity selection
2. **Plugin Configuration** — Free-form rendered config fields via default slot
3. **General Info** — enabled, instance_name, tags, protocols, condition

Consuming apps can call `useProvideFreeFormPluginLayout()` to replace the layout shell for free-form plugin forms.

## Plugin-Specific Forms

### Plugin Form Selection

In `src/components/free-form/plugins/`, one config module determines how each plugin renders. The registry is auto-built from both `plugins/*.ts` and `plugins/*/index.ts`.

```typescript
export default definePluginConfig({
  experimental: true,
  component: KeyAuthForm,
  renderRules: {
    dependencies: {
      'config.foo': ['config.bar', 'baz'],
    },
  },
  fieldRenderers: [
    {
      match: 'config.foo',
      component: StringField,
      propsOverrides: { multiline: true },
    },
  ],
})
```

- `definePluginConfig()` defaults `component` to `CommonForm`, so simple plugins only need overrides.
- `experimental` defaults to `false` when the registry is resolved.
- Experimental forms require opt-in via the injected experimental free-form allowlist (`config.experimentalRenders` in Konnect flows).
- When `engine: 'freeform'` is forced, `PluginEntityForm` still renders `CommonForm` for plugins that do not have a registry entry.

### Plugin Overview

The registry currently mixes many simple single-file configs with a smaller set of folder-based custom forms. Representative examples:

| Plugin | Path Style | Key Feature |
|---|---|---|
| **Common** | `Common/` | Default layout + schema-driven required/advanced grouping |
| **ACL** | `plugins/acl/` | Dedicated scope/mode UI |
| **ai-mcp-proxy** | `plugins/ai-mcp-proxy/` | Data transformation for headers/query params |
| **key-auth** | `plugins/key-auth/` | Adds Konnect-only `identity_realms` handling |
| **request-callout** | `plugins/request-callout/` | Custom callout tabs and dependency tracking |
| **service-protection** | `plugins/service-protection/` | Request limit presets + Redis strategy form |
| **datakit** | `plugins/datakit/` | Visual flow editor plus code mode |
| **upstream-oauth** | `plugins/upstream-oauth.ts` | CommonForm with render rules and field overrides |

### Common Plugin Patterns

Simple plugins and custom plugins follow different patterns:

1. **Simple config module**: `plugins/<name>.ts` exports `definePluginConfig({...})` and relies on `CommonForm`
2. **Folder-based custom form**: `plugins/<name>/index.ts` exports a config that points to `[Plugin]Form.vue`
3. **Main wrapper**: custom forms usually use `DynamicLayout`
4. **Config form**: `ConfigForm.vue` is optional and only exists when plugin-specific composition is needed
5. **Data hooks**: some custom forms use `prepareFormData()` and custom change handling, but simple configs do not
6. **Autofill slot**: forms built on `DynamicLayout` typically provide `AUTOFILL_SLOT` for vault secret picker integration

## Integration with Parent System

### Integration Point: `PluginEntityForm.vue`

```
PluginEntityForm.vue
  |-- if freeformComponent -> render free-form component (from ./free-form/plugins/*)
  |-- elif sharedFormName -> render shared form (legacy)
  |-- else               -> render VueFormGenerator (legacy)
```

Key props passed to free-form components:

| Prop | Type | Description |
|---|---|---|
| `schema` | `FormSchema` | Raw form schema from API |
| `model` | `Record<string, any>` | Initial plugin data |
| `formSchema` | `any` | Legacy VFG schema (for scope and general info field metadata) |
| `formModel` | `Record<string, any>` | Legacy form model (for scope initialization) |
| `isEditing` | `boolean` | New vs edit mode |
| `pluginName` | `string` | Current plugin name |
| `renderRules` | `RenderRules` | From `pluginConfig.renderRules` |
| `fieldRenderers` | `FieldRenderer[]` | From `pluginConfig.fieldRenderers` |
| `onFormChange` | `(value) => void` | Callback when free-form data changes |
| `onValidityChange` | `(event) => void` | Callback for free-form validity updates |

Schema enhancement pipeline (in PluginEntityForm):

```
rawSchema -> appendEntityChecksFromMetadata(pluginName, schema)
          -> distributeEntityChecks(schema)
          -> freeformSchema
```

## Custom Field Rendering

Plugins can override how specific fields render using `FieldRenderer`:

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

## Testing Infrastructure

### Filler (`filler/`)

Auto-fill utilities for Cypress and Playwright tests. A framework-agnostic core with framework-specific adapters.

```
filler/
├── shared/       # field-walker (generator traversal), selectors (data-testid patterns), schema-utils
├── cypress/      # Cypress handlers for 11 field types
└── playwright/   # Playwright handlers (mirror structure)
```

Supported field types: string, number, boolean, enum, array, record, map, tag, json, foreign.

Usage:

```typescript
import { createFiller } from '@kong-ui-public/entities-plugins/filler/cypress'

const filler = createFiller(schema)
filler.fill({ config: { host: 'localhost', port: 6379 } })
filler.fillField('config.host', 'example.com')
```

### Tests

| Test File | What it Covers |
|---|---|
| `free-form-basic.cy.ts` | Schema rendering, slot overrides, reactivity, lifecycle hooks |
| `free-form-render-rules.cy.ts` | Bundles, dependencies, circular detection, chained cascades |
| `free-form-redis-selector.cy.ts` | Redis partial configuration, dependency-based visibility |
| `shared/layout/StandardLayout.cy.ts` | Shared layout behavior, scope switching, general info and code mode |
| `shared/*.spec.ts` | Unit coverage for schema enhancement, registry and path utilities |

## How-To Guides

### Adding a New Plugin Form

1. Create a config file in `free-form/plugins/`
2. Export it with `definePluginConfig()`
3. Add `component` only if the plugin needs a dedicated Vue form component; otherwise `CommonForm` is used automatically
4. Add `fieldRenderers` for flat renderer overrides
5. Add `renderRules` in the plugin config when free-form layout rules are needed

### Adding a New Field Type

1. Create `shared/[Type]Field.vue` component
2. Add case in `Field.vue`'s `fieldRenderer` computed switch
3. Add handler type in `filler/shared/field-walker.ts` (`HandlerType` enum)
4. Add Cypress handler in `filler/cypress/handlers/`
5. Add Playwright handler in `filler/playwright/handlers/`
6. Add selector support in `filler/shared/selectors.ts`
7. Add or update filler tests in `filler/cypress/fill-form.cy.ts` and `filler/playwright/fill-form.pw.ts`

### Modifying Shared Components — Impact Guide

| File | Impact |
|---|---|
| `Form.vue` | Root provider; changes affect ALL plugins |
| `Field.vue` | Auto-dispatch logic; add new types here |
| `ObjectField.vue` | Handles record nesting, collapse, entity checks |
| `composables/form-context.ts` | Central state; changes affect data flow everywhere |
| `composables/render-rules.ts` | Bundle/dependency logic; changes affect field visibility |
| `composables/schema.ts` | Default/empty-value resolution (`getDefault`, `getEmptyOrDefault`, `getEmptyValue`); changes affect every field's init and clear behavior |

## Standalone Usage (`@kong-ui-public/entities-plugins/freeform`)

The freeform rendering engine is published as a dedicated subpath export. It contains only the schema-driven field rendering primitives — no plugin registry, no layout, no scope selectors. This makes it suitable for building custom plugin form UIs (e.g. in a different MFE) without pulling in the full entities-plugins bundle.

### Installation

```ts
import { Form, FieldRenderer, FIELD_RENDERERS } from '@kong-ui-public/entities-plugins/freeform'
import type { FormSchema, RenderRules } from '@kong-ui-public/entities-plugins/freeform'

import '@kong-ui-public/entities-plugins/freeform/style.css'
```

### Basic Usage

```vue
<template>
  <form @submit.prevent="handleSubmit">
    <!-- freeform config fields -->
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
import { Form } from '@kong-ui-public/entities-plugins/freeform'
import type { FormSchema } from '@kong-ui-public/entities-plugins/freeform'

const props = defineProps<{ pluginSchema: FormSchema }>()
const formData = ref({})
const formRef = ref<InstanceType<typeof Form>>()

function handleSubmit() {
  const value = formRef.value?.getValue()
  // submit value
}
</script>
```

### Writing a Custom Field Component

The `shared/composables/` primitives listed above are re-exported from the `freeform` subpath, so a host app can author its own field component that reads and writes a named field's value the same way `SwitchField`/`RadioField` do internally — no `getValue`/`setValue` round-trip needed:

```vue
<script setup lang="ts">
import { toRef } from 'vue'
import { useField } from '@kong-ui-public/entities-plugins/freeform'

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

Register it against a field path with `FieldRenderer`, or place it directly inside a `Form`/layout slot with `name` set to the field's path — both wire into the same reactive form state as the built-in field components.

When the field needs to write an "empty" value (the user clears it, or a mode switch blanks it), use `emptyValue` from `useField()` instead of hardcoding `null` — see [Empty Field Values](#empty-field-values). Several plugin-specific fields under `plugins/` were written before this existed and had to be retrofitted; new field components should use it from the start.

## Reference

### Injection Keys

| Key | Purpose | Provided by |
|---|---|---|
| `FORMS_CONFIG` | App config (konnect / kongManager) | `PluginEntityForm.vue` |
| `REDIS_PARTIAL_INFO` | Redis partial state | Layout components |
| `FORM_EDITING` | Edit mode flag | Layout components |
| `FREE_FORM_PLUGIN_LAYOUT` | Optional host-provided free-form layout component | Consuming app |
| `FIELD_RENDERERS` | Slot name for custom renderers | `Form.vue` |
| `FIELD_RENDERER_SLOTS` | Inherited parent slots | `Form.vue` |
| `FEATURE_FLAGS.*` | Feature toggles | Consuming app |

### `data-testid` Conventions

| Element | Pattern | Example |
|---|---|---|
| Form | `ff-standard-layout-form` | |
| Field | `ff-{dotpath}` | `ff-config.redis.host` |
| Array item | `ff-array-{path}.{index}` | `ff-array-config.servers.0` |
| Object toggle | `ff-object-toggle-{path}` | `ff-object-toggle-config.redis` |
| Add button | `ff-array-add-{path}` | `ff-array-add-config.servers` |

### Feature Flags

| Flag | Purpose |
|---|---|
| `KM_2262_CODE_MODE` | Enable form/code editor toggle in StandardLayout (applies to all plugins unless they opt out via `hide-editor-mode-switcher`) |
| `KM_2306_CONDITION_FIELD_314` | Show the `condition` field in plugin forms |
| `KM_2446_DATAKIT_JWT_NODES` | Show the Authentication group in the Datakit flow editor node panel |
