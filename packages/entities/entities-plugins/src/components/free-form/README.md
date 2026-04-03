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
│   ├── KeyValueField.vue    # Map/dictionary key-value pairs
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
│   ├── composables/         # Vue composables (core logic)
│   ├── headless/            # UI-free composable logic
│   ├── layout/              # Layout components
│   │   ├── StandardLayout.vue  # Shared layout with form/code modes
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

All plugin forms use `StandardLayout` (`shared/layout/StandardLayout.vue`) as the unified layout component. In form mode it provides a 3-step structure:

1. **Plugin Scope** — Global vs Scoped (service/route/consumer/consumer_group) via radio buttons + ScopeEntityField for entity selection
2. **Plugin Configuration** — Free-form rendered config fields via default slot
3. **General Info** — enabled, instance_name, tags, protocols, condition

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
3. **Main wrapper**: custom forms usually use `StandardLayout`
4. **Config form**: `ConfigForm.vue` is optional and only exists when plugin-specific composition is needed
5. **Data hooks**: some custom forms use `prepareFormData()` and custom change handling, but simple configs do not
6. **Autofill slot**: forms built on `StandardLayout` typically provide `AUTOFILL_SLOT` for vault secret picker integration

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
| `KM_2446_DATAKIT_JWT_NODES` | Show the Authentication group in the Datakit flow editor node panel |
