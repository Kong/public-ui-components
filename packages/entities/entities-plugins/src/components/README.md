# Plugin Form Components

## Component Hierarchy

```
PluginForm                          ← public entry point (host apps use this)
  └── PluginEntityForm              ← renders the actual form fields
        ├── <FreeForm component>    ← when isFreeForm (plugin-specific UI)
        ├── <SharedForm component>  ← plugin-specific form components (openid-connect, pre/post-function, exit-transformer, rate-limiting-advanced)
        └── VueFormGenerator (VFG)  ← default for standard plugins
```

### PluginForm

The top-level component consumed by host apps. Responsible for:

- Fetching the plugin schema from the API (`GET /schemas/plugins/:name`)
- Building `finalSchema` from the raw API response — using `isFreeForm` to decide **how** to build the schema (e.g. whether to include config fields in `finalSchema`, or treat a `set` with `one_of` as multiselect)
- Managing form state (`formModel`), submission, and error handling
- Rendering `PluginEntityForm` and action buttons

### PluginEntityForm

Responsible for **picking the renderer** and mounting it. Resolves `freeformName` and `sharedFormName` via `useFreeFormResolver` and `getSharedFormName`, then uses `v-if`/`v-else-if`/`v-else` to mount the free-form component, shared form, or VFG respectively. It does not fetch or process schemas itself.

---

## Rendering Engines

### VFG (Vue Form Generator)

The default engine for standard plugins. `buildFormSchema` (in `PluginForm`) transforms the raw Kong schema into a flat field descriptor object — adding labels, input types, select values, `valueType`, and other UI metadata. `finalSchema` is then passed to `PluginEntityForm`, which runs it through `useSchemas.parseSchema` for the final VFG conversion before passing the result to `VueFormGenerator`.

### Free-form

Used for plugins that require custom UI beyond what VFG can express (e.g. Datakit, RequestCallout, ServiceProtection). Determined by `isFreeForm(pluginType, engine)` via `useFreeFormResolver`.

When free-form is active:
- `finalSchema` contains **only** the standard wrapper fields (scope, protocols, enabled, tags) — the plugin config section is excluded
- `loadedSchema` (the raw unmodified API response) is passed as `:raw-schema` to `PluginEntityForm`
- `PluginEntityForm` computes `freeformSchema` from `props.rawSchema` via `appendEntityChecksFromMetadata` + `distributeEntityChecks`, and passes it as `:schema` to the free-form component
- The free-form component is responsible for rendering the config section using its own UI

---

## Schema Props

### On `PluginForm` (public props)

| Prop | Type | Description |
|---|---|---|
| `schema` | `Record<string, any>` | Optional pre-loaded raw Kong schema. When provided, skips the `GET /schemas/plugins/:name` API call entirely. Same shape as what the endpoint returns. |
| `engine` | `'vfg' \| 'freeform'` | Force a specific rendering engine. When omitted, `useFreeFormResolver` determines the engine based on `pluginType`. |

### On `PluginEntityForm` (internal props, passed by `PluginForm`)

| Prop | Type | Source in `PluginForm` | Description |
|---|---|---|---|
| `schema` | `Record<string, any>` | `finalSchema` | For VFG: the fully transformed field descriptor object. For free-form: only the standard wrapper fields (scope, protocols, etc.). |
| `rawSchema` | `Record<string, any>` | `loadedSchema` | The unmodified raw response from the Kong schema API. Used by free-form components that need the original schema structure. |

### Inside free-form components

Free-form components receive `:schema="freeformSchema"` where `freeformSchema` is computed in `PluginEntityForm` from `props.rawSchema` (= `loadedSchema`) by running it through `appendEntityChecksFromMetadata` and `distributeEntityChecks`.

---

## `useSchemas` Composable

`useSchemas` is used in two different places with different purposes.

### In `PluginForm` — `customSchemas`

`PluginForm` calls `useSchemas` to get `customSchemas`: a registry of plugin-specific frontend schema overrides. When `buildFormSchema` processes a raw Kong field, it checks `customSchemas[pluginType]` and merges any matching override onto the field descriptor. This is how plugins like `rate-limiting`, `saml`, `zipkin`, etc. get custom field types, labels, or input behaviors without changing the Kong API schema.

Some entries have `overwriteDefault: true`, which merges a `formSchema` sub-key into `defaultFormSchema` (the wrapper fields: scope, protocols, enabled, tags) instead of applying per-field config overrides.

### In `PluginEntityForm` — `parseSchema`

`PluginEntityForm` calls `parseSchema` unconditionally for **all** plugin types (both VFG and free-form). However, each path uses different parts of its output:

- **Free-form**: only uses `form.model` to initialize `formModel` with default values. The `form.schema` (VFG field descriptors) is ignored — free-form renders from `freeformSchema` (derived from `rawSchema`) instead.
- **VFG**: uses both `form.model` and `form.schema` to drive `VueFormGenerator`.

After `PluginForm` builds `finalSchema` (a flat dict of VFG-partially-ready fields keyed by dash-notation), `PluginEntityForm` passes it through `parseSchema` for the final VFG conversion step:

- Iterates over every field in `finalSchema`
- Calls the internal `buildFormSchema` (inside `useSchemas`) per field, which sets `model`, `id`, and label
- Routes each field through `fieldSchemaHandler` to apply type-specific VFG properties:
  - `foreign` → hidden input
  - `string` with `one_of` → select
  - `string` → text input
  - `integer`/`number` → number input with `min`/`max`
  - `boolean` → checkbox
  - `map` → `object-advanced`
- For standard plugins (not free-form/shared/legacy), groups fields into **pinned**, **default visible**, and **advanced** collapsible sections based on `required` and `fieldRules` from `PLUGIN_METADATA`

Returns `{ schema: formSchema, model: formModel, options }` consumed directly by `VueFormGenerator`.

---

## Schema Processing Flow

```
Kong API  ──GET /schemas/plugins/:name──►  loadedSchema   (raw, untouched)
                                                │
                              ┌─────────────────┴──────────────────┐
                              ▼ (VFG path)                          ▼ (free-form path)
                    PluginForm.buildFormSchema           passed as :raw-schema
                    + customSchemas overrides            to PluginEntityForm
                              │                                      │
                              ▼                                      ▼
                         finalSchema                        freeformSchema
                    (wrapper fields only              (appendEntityChecksFromMetadata
                     + VFG config fields)              + distributeEntityChecks)
                              │                                      │
                              ▼                                      ▼
                    useSchemas.parseSchema               free-form component
                    (type → VFG widget,                  renders config section
                     labels, field grouping)             using its own UI
                              │
                              ▼
                    VueFormGenerator
                    { fields/groups, model, options }
```
