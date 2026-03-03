# Free-Form Module

A schema-driven dynamic form rendering system for Kong plugin configuration. It replaces the legacy VueFormGenerator (VFG) approach with a modern Vue 3 Composition API architecture.

**Core idea**: Given a `FormSchema` (JSON-like descriptor of fields), the module auto-renders the appropriate Vue form components with correct types, labels, validation, and layout.

## Table of Contents

- [Directory Structure](#directory-structure)
- [Schema System](#schema-system)
- [Core Architecture](#core-architecture)
- [Layout](#layout)
- [Plugin-Specific Forms](#plugin-specific-forms)
- [Integration with Parent System](#integration-with-parent-system)
- [Custom Field Rendering](#custom-field-rendering)
- [Testing Infrastructure](#testing-infrastructure)
- [How-To Guides](#how-to-guides)
- [Reference](#reference)

## Directory Structure

```
free-form/
├── index.ts                 # Barrel export of all plugin form components
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
│   ├── KeyValueField.vue    # Map/dictionary key-value pairs
│   ├── StringArrayField.vue # Tag-like comma-separated string sets
│   ├── JsonField.vue        # JSON textarea editor
│   ├── ForeignField.vue     # Foreign entity reference (stores {id: string})
│   ├── RadioField.vue       # Radio button groups
│   ├── EnhancedInput.vue    # Base input wrapper (help text, errors, tooltips)
│   ├── AdvancedFields.vue   # Collapsible advanced fields section
│   ├── VFGField.vue         # Legacy VFG bridge (for enabled, scope, tags, protocols)
│   ├── CodeEditor.vue       # Code editor component
│   ├── RedisConfigCard.vue  # Redis configuration card
│   ├── RedisSelector.vue    # Redis partial instance selector
│   ├── SlideTransition.vue  # Height-animated collapse transition
│   ├── EntityChecksAlert.vue # Validation constraint alerts
│   ├── composables/         # Vue composables (core logic)
│   ├── headless/            # UI-free composable logic
│   ├── layout/              # Layout components
│   │   └── StandardLayout.vue  # 3-step layout: Scope -> Config -> General Info
│   ├── types.ts             # Core type definitions
│   ├── const.ts             # Injection keys (REDIS_PARTIAL_INFO, FORM_EDITING)
│   ├── utils.ts             # Path utilities, field sorting
│   └── schema-enhancement.ts # Transform legacy field rules to entity checks
├── Common/                  # Generic plugin form (fallback for any plugin)
├── AIMcpProxy/              # AI MCP Proxy plugin form
├── Datakit/                 # Complex visual flow editor + code editor
├── KeyAuth/                 # Key authentication plugin form
├── RequestCallout/          # HTTP callout plugin form
├── ServiceProtection/       # Service protection plugin form
├── UpstreamOauth/           # Upstream OAuth plugin form
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
| `number` / `integer` | No | `NumberField` |
| `number` / `integer` | Yes | `EnumField` |
| `boolean` | No | `BooleanField` |
| `boolean` | Yes | `EnumField` |
| `record` | - | `ObjectField` |
| `array` | - | `ArrayField` |
| `set` (tag-like) | - | `StringArrayField` |
| `set` (enum-like) | - | `EnumField` |
| `map` | - | `KeyValueField` |
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

| File | Exports | Purpose |
|---|---|---|
| `form-context.ts` | `provideFormShared()`, `useFormShared()` | Central form state: reactive data, schema, config, render rules, getValue/setValue |
| `field.ts` | `useField(name)` | Individual field state: value, schema, path, renderer, error, ancestors |
| `field-path.ts` | `useFieldPath()` | Calculates absolute dot-notation path from parent context via provide/inject |
| `schema.ts` | `useSchemaHelpers()` | Schema introspection: getSchema, getDefault, getSelectItems, getLabelAttributes |
| `labels.ts` | `useLabelPath()`, `useFieldAttrs()` | Label generation with dictionary lookup (IP, SSL, TTL, JWT, etc.) |
| `render-rules.ts` | `createRenderRuleRegistry()` | Bundles (field grouping/ordering) and dependencies (conditional visibility) |
| `ancestors.ts` | `useAncestors()` | Access parent field context for nested components |
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

## Layout

All plugin forms use `StandardLayout` (`shared/layout/StandardLayout.vue`) as the unified layout component. It provides a 3-step form structure:

1. **Plugin Scope** — Global vs Scoped (service/route/consumer/consumer_group) via radio buttons + VFGField for entity selection
2. **Plugin Configuration** — Free-form rendered config fields via default slot
3. **General Info** — enabled, instance_name, tags, protocols, condition

## Plugin-Specific Forms

### Plugin Form Selection

In `src/utils/free-form.ts`, a mapping determines which component renders each plugin:

```typescript
const mapping = {
  'request-callout': 'RequestCalloutForm',       // Always active
  'datakit': 'DatakitForm',                       // Always active
  'ai-mcp-proxy': 'AIMcpProxyForm',              // Always active
  'jwt-signer': 'CommonForm',                     // Always active
  'service-protection': { experimental: true, component: 'ServiceProtectionForm' },
  'upstream-oauth':     { experimental: true, component: 'UpstreamOauthForm' },
  'key-auth':           { experimental: true, component: 'KeyAuthForm' },
  'rate-limiting':      { experimental: true, component: 'CommonForm' },
  // ... more experimental mappings
}
```

- Experimental forms require opt-in via `experimentalRenders` in the consuming app.
- When `engine: 'freeform'` is forced, unmapped plugins fall back to `CommonForm`.

### Plugin Overview

| Plugin | Complexity | Key Feature |
|---|---|---|
| **Common** | Medium | Smart field categorization (required vs advanced) based on schema analysis |
| **KeyAuth** | Low | Extends Common; adds environment-specific identity_realms field (Konnect only) |
| **UpstreamOauth** | Low | Extends Common; one custom multiline field renderer |
| **AIMcpProxy** | Medium | Data transformation (split/join comma strings in headers/query) |
| **RequestCallout** | High | Symbol-based ID tracking for callout dependencies, tabs UI |
| **ServiceProtection** | High | Custom request limits UI with preset use cases, Redis strategy |
| **Datakit** | Very High | Dual-mode editor (visual flow graph via @vue-flow + YAML code editor) |

### Common Plugin Patterns

Every plugin form follows a consistent structure:

1. **Entry point**: `index.ts` exports a default Vue component
2. **Main wrapper**: `[Plugin]Form.vue` — uses `StandardLayout`
3. **Config form**: `ConfigForm.vue` (optional) — uses `Form` + `ObjectField` with plugin-specific layout
4. **Data hooks**: `prepareFormData()` transforms API data for display; `onChange()` transforms back for submission
5. **Slot injection**: All provide `AUTOFILL_SLOT` for vault secret picker integration

## Integration with Parent System

### Integration Point: `PluginEntityForm.vue`

```
PluginEntityForm.vue
  |-- if freeformName   -> render free-form component (from ./free-form/index.ts)
  |-- elif sharedFormName -> render shared form (legacy)
  |-- else               -> render VueFormGenerator (legacy)
```

Key props passed to free-form components:

| Prop | Type | Description |
|---|---|---|
| `schema` | `FormSchema` | Raw form schema from API |
| `model` / `record` | `Record<string, any>` | Plugin data |
| `formSchema` | `any` | Legacy VFG schema (for VFGField bridge) |
| `formModel` / `formOptions` | `any` | VFG state |
| `isEditing` | `boolean` | New vs edit mode |
| `renderRules` | `RenderRules` | From `PLUGIN_METADATA[pluginName].freeformRenderRules` |
| `onFormChange` | `(value) => void` | Callback when free-form data changes |
| `onModelUpdated` | `(value, model) => void` | Callback for VFG field changes |

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

The `match` function receives `{ path, schema }` and returns `boolean`.

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
const filler = createFiller(schema)
filler.fill({ config: { host: 'localhost', port: 6379 } })
filler.fillField('config.host', 'example.com')
```

### Integration Tests (`test/`)

| Test File | What it Covers |
|---|---|
| `free-form-basic.cy.ts` | Schema rendering, slot overrides, reactivity, lifecycle hooks |
| `free-form-render-rules.cy.ts` | Bundles, dependencies, circular detection, chained cascades |
| `free-form-redis-selector.cy.ts` | Redis partial configuration, dependency-based visibility |

## How-To Guides

### Adding a New Plugin Form

1. Create directory `free-form/[PluginName]/`
2. Create `index.ts` exporting the default component
3. Create `[PluginName]Form.vue` using `StandardLayout`
4. Optionally create `ConfigForm.vue` for custom config layout
5. Add export to `free-form/index.ts`
6. Add mapping entry in `src/utils/free-form.ts`
7. If the plugin has render rules, add to `PLUGIN_METADATA` in `src/definitions/metadata.ts`

### Adding a New Field Type

1. Create `shared/[Type]Field.vue` component
2. Add case in `Field.vue`'s `fieldRenderer` computed switch
3. Add handler type in `filler/shared/field-walker.ts` (`HandlerType` enum)
4. Add Cypress handler in `filler/cypress/handlers/`
5. Add Playwright handler in `filler/playwright/handlers/`
6. Add selector in `filler/shared/selectors.ts`
7. Add assertion in `test/utils.ts`

### Modifying Shared Components — Impact Guide

| File | Impact |
|---|---|
| `Form.vue` | Root provider; changes affect ALL plugins |
| `Field.vue` | Auto-dispatch logic; add new types here |
| `ObjectField.vue` | Handles record nesting, collapse, entity checks |
| `composables/form-context.ts` | Central state; changes affect data flow everywhere |
| `composables/render-rules.ts` | Bundle/dependency logic; changes affect field visibility |

## Reference

### Injection Keys

| Key | Purpose | Provided by |
|---|---|---|
| `FORMS_CONFIG` | App config (konnect / kongManager) | `PluginEntityForm.vue` |
| `REDIS_PARTIAL_INFO` | Redis partial state | Layout components |
| `FORM_EDITING` | Edit mode flag | Layout components |
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
| `KM_2262_CODE_MODE` | Enable form/code editor toggle in CommonForm |
| `KM_2306_CONDITION_FIELD_314` | Show the `condition` field in plugin forms |
