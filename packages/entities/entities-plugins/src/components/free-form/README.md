# Free-Form Module

A schema-driven dynamic form rendering system for Kong plugin configuration. It replaces the legacy VueFormGenerator (VFG) approach with a modern Vue 3 Composition API architecture.

**Core idea**: Given a `FormSchema` (JSON-like descriptor of fields), the module auto-renders the appropriate Vue form components with correct types, labels, validation, and layout.

The generic, reusable rendering primitives (schema types, field components, composables, filler test
utilities) live in the standalone [`@kong-ui-public/freeform`](../../../../../core/freeform/README.md)
package. This directory holds only the entities-plugins-specific layer built on top of it: the plugin
registry, layout machinery, Redis/credential/scope UI, and the per-plugin config modules under `plugins/`.

## Directory Structure

```
free-form/
├── README.md
├── types.ts                 # entities-plugins-specific types (Redis config, PluginFormConfig/
│                             # PluginFormLayoutProps and friends) — depends on @kong-ui-public/freeform
├── composables/             # code-lens-providers.ts (Monaco YAML code-lens helpers)
├── layout/                  # Layout machinery only (runtime layout selection)
│   ├── provider.ts               # Layout injection key and provider helper
│   ├── DynamicLayout.vue (+ .cy.ts) # Runtime-selected layout wrapper
│   └── StandardLayout.vue (+ .cy.ts, .expressions.spec.ts) # Default API Gateway layout with form/code modes
├── plugin-context/          # Plugin-specific injected context (key-auth, openid-connect)
├── const.ts                 # Injection keys (REDIS_PARTIAL_INFO, FORM_EDITING)
├── define-plugin-config.ts  # Plugin config helper with CommonForm fallback
├── plugin-registry.ts       # Auto-discovers plugins/*.ts and plugins/*/index.ts
├── schema-enhancement.ts    # Transform legacy field rules to entity checks
├── components/              # entities-plugins-specific field components
│   ├── RadioField.vue       # Radio button groups (plain, or `card` with descriptions)
│   ├── AdvancedFields.vue   # Collapsible advanced fields section
│   ├── ScopeEntityField.vue (+ .spec.ts, scope-entity-field.cy.ts) # Scope entity selector
│   ├── CodeEditor.vue       # Code editor component
│   ├── RedisConfigCard.vue  # Redis configuration card
│   ├── RedisSelector.vue (+ free-form-redis-selector.cy.ts) # Redis partial instance selector
│   ├── CredentialSecretField.vue (+ credential-secret-field.cy.ts) # Credential secret input (generate/reveal)
│   ├── CollapsibleSection.vue # Generic collapsible section wrapper
│   ├── PluginConfigurationForm.vue (+ .cy.ts) # Composes the framework's `Form` with the shared plugin chrome
│   ├── ConditionField.vue   # Optional condition editor in General Info
│   └── ExpressionField.spec.ts # Unit test for ExpressionField; stays here until its mount harness
│                             #   stops depending on PluginConfigurationForm — see its own TODO
├── Common/                  # Generic plugin form used by default
└── plugins/                 # Plugin registry entries and custom plugin forms
    ├── *.ts                 # Simple plugins configured with CommonForm + overrides
    └── <plugin>/index.ts    # Folder-based plugins with dedicated Vue components
```

Everything in this directory is entities-plugins-specific and depends on `@kong-ui-public/freeform`, but
nothing in that package depends back on entities-plugins.

## Schema, rendering, render rules, empty values

The schema contract (`FormSchema`), the schema-to-component dispatch table, entity checks, composables,
path system, render rules, and empty-field-value semantics are all documented in
[`@kong-ui-public/freeform`'s README](../../../../../core/freeform/README.md) — this app only consumes
them, it doesn't own them.

### Expressible Fields (`expressions`)

See the framework README for the full semantics of the `expressions` twin-field convention
(`ExpressionField`/`ExpressionEditor`, array pairing, empty-slot rules). The rest of this section covers
what's specific to **this app's** integration.

| Rule | Detail |
|---|---|
| Twin array with nothing in it | Unset, not a run of `""`. rate-limiting-advanced drops `expressions.limit` once no row holds an expression, so a plugin whose expressions were added and then cleared matches one that never carried any. **Done in the form's own data, never by rewriting the value the form emits** — see the warning below |
| Gateway re-sorts | rate-limiting-advanced sorts `config.limit` ascending on save and carries each expression with its pair, so the stored index is not necessarily the submitted one. The form does not mirror this — it renders whatever comes back |

> [!WARNING]
> **Shape the payload in `formData`, never in `onFormChange`.** The framework's `form-context.ts` decides whether an incoming `model` is a real change by comparing it against the payload it last emitted (`isEqual(getValue(), newData)`). A payload that disagrees with the form's own state fails that comparison for good, so the next `model` looks like a change and the form re-initializes from it — reverting what the user just did. rate-limiting-advanced unset an all-empty `expressions` record in its `handleFormChange` and clearing an expression silently came back. Mutating `formData` keeps the two in step.

It ships **no placeholder**: a useful example is specific to the plugin, and the field-attribute fallback would offer the field's own default value, which reads as a value rather than an expression. Plugins pass their own, and override the help text through the `help` slot, using either of the normal field-copy patterns:

- **A registered renderer** — `fieldRenderers` is how a plugin customizes one field, and a registered renderer owns the whole field, expression included, so it renders `ExpressionField` itself with the wording it wants: `plugins/_shared/CustomKeyField.vue`, registered for `config.custom_key` by both rate-limiting forms. The field keeps its place among the auto-rendered siblings.
- **Explicit placement** — for a field the plugin lays out itself, pass the props directly: `RequestLimitsForm.vue`'s per-row `ExpressionEditor`, which pairs each `limit` with its `window_size`.

Note that `ExpressionField` resolves its own path and hands children the absolute form, so a relative `name` works either way.

#### Adopting it in a consuming app

For the default `StandardLayout`, nothing — but four things are worth checking:

1. **The payload gains a root-level `expressions` key** alongside `config`. Anything that whitelists, diffs, or transforms root keys before submitting needs to allow it through.
2. **Both plugins are `experimental`**, so they render VueFormGenerator (no expression UI at all) unless opted in — `useProvideExperimentalFreeForms([...])` in an ancestor of the form, or `engine="freeform"` on `PluginForm`/`PluginEntityForm`. Not `config.experimentalRenders`; that map feeds schema-level flags such as `keyAuthIdentityRealms`, not the engine choice.
3. **The expression controls sit behind `KM-3034-features-316`**, with the rest of the 3.16 features. The flag is not registered in the consuming app yet, so the inject defaults to **on** — otherwise the feature would be invisible everywhere; once the flag exists, whatever it provides wins in both directions and that default should become `false`. Each plugin gates itself with `plugins/_shared/use-expression-mode.ts`, which shadows the `expressible` marker on the schema it renders. Nothing is removed — the fields, their values and the `expressions` record all stay as the Gateway sent them, so every field still renders and its data still round-trips; only the editor beside it goes away.
4. **Konnect currently rejects the payload.** koko compiles the `""` padding and fails with `kcel: compile: ERROR: <input>:1:0: mismatched input '<EOF>'`. The Gateway accepts it; the Gateway's own guards skip `nil`/`null`/`""` before compiling. Until koko does the same, expressions work against a direct Admin API but not through Konnect. Note that no client payload avoids this — the schema right-pads a short array with `""` before validating.

**If you provide your own layout** via `FREE_FORM_PLUGIN_LAYOUT`, you must pass `expressions` through in two places, or every expression control silently disappears with no error:

- the **schema** handed to `Form` — if you filter root fields, keep `expressions` (`StandardLayout`'s `FREE_FORM_SCHEMA_KEYS`)
- the **model** keys you control — if you `pick()` the incoming model, keep `expressions`, or a saved plugin's expressions never load (`StandardLayout`'s `FREE_FORM_CONTROLLED_FIELDS`)

`Form` never renders the `expressions` record as a field of its own; each twin is rendered inline by the field it overrides. `buildFormSchema` skips it for the same reason, so the legacy VFG form does not flatten it into stray `expressions-*` inputs.

## Layout

Plugin forms use `DynamicLayout` (`layout/DynamicLayout.vue`) as the layout entry point. It renders a host-provided layout from `FREE_FORM_PLUGIN_LAYOUT` when one is available, and otherwise falls back to `StandardLayout` (`layout/StandardLayout.vue`). Layouts that need the common free-form `Form` wrapper can compose `PluginConfigurationForm` (`components/PluginConfigurationForm.vue`) and provide their own surrounding product-specific blocks. The default StandardLayout form mode provides a 3-step structure:

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
| `fieldRenderers` | `FieldRendererRule[]` | From `pluginConfig.fieldRenderers` |
| `onFormChange` | `(value) => void` | Callback when free-form data changes |
| `onValidityChange` | `(event) => void` | Callback for free-form validity updates |

Schema enhancement pipeline (in PluginEntityForm):

```
rawSchema -> appendEntityChecksFromMetadata(pluginName, schema)
          -> distributeEntityChecks(schema)
          -> freeformSchema
```

## Custom Field Rendering

Plugins can override how specific fields render using `FieldRenderer` (the component — see
`@kong-ui-public/freeform`'s README for `Custom Field Rendering` and the `FieldRendererRule` type used by
`pluginConfig.fieldRenderers`):

```vue
<Form :schema="schema">
  <template #[FIELD_RENDERERS]>
    <FieldRenderer :match="({ path }) => path === 'config.my_field'">
      <MyCustomField />
    </FieldRenderer>
  </template>
</Form>
```

## Testing Infrastructure

The filler test utilities (auto-fill for Cypress/Playwright) live in `@kong-ui-public/freeform` and are
re-exported from `@kong-ui-public/entities-plugins/filler/cypress` and `/filler/playwright` for backward
compatibility:

```typescript
import { createFiller } from '@kong-ui-public/entities-plugins/filler/cypress'

const filler = createFiller(schema)
filler.fill({ config: { host: 'localhost', port: 6379 } })
filler.fillField('config.host', 'example.com')
```

### Tests

| Test File | What it Covers |
|---|---|
| `components/free-form-redis-selector.cy.ts` | Redis partial configuration, dependency-based visibility |
| `components/credential-secret-field.cy.ts`, `components/scope-entity-field.cy.ts` | Entities-plugins-specific field integration tests |
| `components/ExpressionField.spec.ts` | Expressible-field ownership when a plugin customizes the field (mounts through `PluginConfigurationForm` — see its own TODO) |
| `layout/StandardLayout.cy.ts` | Layout behavior, scope switching, general info and code mode |
| `*.spec.ts` | Unit coverage for schema enhancement, registry and path utilities |

Field-component and framework-composable tests (`free-form-basic.cy.ts`, `expression-field.cy.ts`, per-field-type `.cy.ts`/`.spec.ts`, filler tests) now live in `@kong-ui-public/freeform`.

## How-To Guides

### Adding a New Plugin Form

1. Create a config file in `free-form/plugins/`
2. Export it with `definePluginConfig()`
3. Add `component` only if the plugin needs a dedicated Vue form component; otherwise `CommonForm` is used automatically
4. Add `fieldRenderers` for flat renderer overrides
5. Add `renderRules` in the plugin config when free-form layout rules are needed

Adding a new generic field type (not plugin-specific) is now done in `@kong-ui-public/freeform` — see its README.

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
| `KM_3034_FEATURES_316` | Gateway 3.16 features, including the expression controls on rate-limiting / rate-limiting-advanced |
