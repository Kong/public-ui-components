# Freeform Plugin Per-Plugin Config

**Date:** 2026-04-02

## Problem

Adding a freeform plugin today requires touching **3 separate files** with redundant information:

| What | Where | Example |
|------|-------|---------|
| Plugin → component mapping | `src/utils/free-form.ts` | `'key-auth': { experimental: true, component: 'KeyAuthForm' }` |
| Render rules | `src/definitions/metadata.ts` | `PLUGIN_METADATA['rate-limiting'].freeformRenderRules` |
| Component barrel export | `src/components/free-form/index.ts` | `export { default as KeyAuthForm } from './KeyAuth'` |

Additionally, many plugins create a dedicated `.vue` form component just to customize one or two fields (e.g., `ExitTransformerForm.vue` exists only to render `config.functions` as a multiline textarea).

## Solution

A **single config file per plugin** in `free-form/plugins/`, auto-discovered via Vite's `import.meta.glob`. The config declares everything about a plugin's form behavior: experimental status, component override, render rules, and per-field customizations.

### What This Enables

- **One file to touch** when adding a new freeform plugin
- **No manual registration** — file naming convention handles the mapping
- **Fewer custom `.vue` components** — `fieldRenderers` replaces most of them
- **Shared defaults** — Redis FieldRenderer (currently hardcoded in StandardLayout) moves into an inheritable `defaultConfig`

---

## Config API

### Type definitions

```ts
interface FieldRenderer {
  /** Match by field path string or predicate function */
  match: string | ((opt: { path: string; schema: UnionFieldSchema }) => boolean)

  /** Component to render: a Vue component or a built-in component name (e.g., 'ArrayField') */
  component?: Component | string

  /** Props to shallow-merge with defaults */
  propsOverrides?: Record<string, any>
}

interface PluginFormConfig {
  /** Whether this plugin is experimental (opt-in via whitelist). Default: false */
  experimental?: boolean

  /** Form component to use. Default: CommonForm */
  component?: Component

  /** Custom render rules for form field layout (bundles, dependencies) */
  renderRules?: RenderRules

  /** Custom field renderers for specific fields */
  fieldRenderers?: FieldRenderer[]
}
```

### `definePluginConfig()`

Every config file calls `definePluginConfig()`, which merges the plugin config with a shared `defaultConfig`:

```ts
// shared/define-plugin-config.ts
export function definePluginConfig(config?: Partial<PluginFormConfig>): PluginFormConfig {
  return {
    ...defaultConfig,
    ...config,
    fieldRenderers: [
      ...(defaultConfig.fieldRenderers ?? []),
      ...(config?.fieldRenderers ?? []),
    ],
  }
}
```

**Merge rules:**
- `fieldRenderers` — default renderers first, then plugin-specific (appended)
- `component` — plugin overrides default (`CommonForm`)
- `renderRules`, `experimental` — plugin-specific only

### Default config

The `defaultConfig` contains shared field renderers that apply to all plugins. This replaces the hardcoded `<FieldRenderer>` in StandardLayout.vue:

```ts
// shared/default-config.ts
const defaultConfig: PluginFormConfig = {
  fieldRenderers: [
    {
      // Redis partial selector — currently hardcoded in StandardLayout.vue lines 17-20
      match: ({ path }) => path === redisPartialInfo?.redisPath?.value,
      component: RedisSelector,
    },
  ],
}
```

---

## Examples

### Directory structure

```
free-form/
  plugins/
    # Minimal: use CommonForm, no customization
    Jwt.ts
    BasicAuth.ts
    Cors.ts
    Prometheus.ts
    AwsLambda.ts
    CorrelationId.ts

    # With renderRules (bundles/dependencies)
    RateLimiting.ts
    ProxyCacheAdvanced.ts
    UpstreamOauth.ts

    # With fieldRenderers (replaces dedicated .vue form components)
    ExitTransformer.ts
    HttpLog.ts
    FileLog.ts
    ResponseTransformer.ts
    Opentelemetry.ts

    # With custom component (complex plugins that still need a .vue)
    KeyAuth/
      index.ts
      KeyAuthForm.vue
    AICustomGuardrail/
      index.ts
      AICustomGuardrailForm.vue
    ServiceProtection/
      index.ts
      ServiceProtectionForm.vue

  shared/
    define-plugin-config.ts    # definePluginConfig() + types
    default-config.ts          # defaultConfig with Redis FieldRenderer
```

### Config examples

**Minimal — non-experimental, CommonForm, no customization:**

```ts
// plugins/RequestCallout.ts
import { definePluginConfig } from '../shared/define-plugin-config'

export default definePluginConfig()
```

**Experimental, no customization:**

```ts
// plugins/Jwt.ts
import { definePluginConfig } from '../shared/define-plugin-config'

export default definePluginConfig({
  experimental: true,
})
```

**With renderRules:**

```ts
// plugins/RateLimiting.ts
import { definePluginConfig } from '../shared/define-plugin-config'

export default definePluginConfig({
  experimental: true,
  renderRules: {
    bundles: [
      ['config.policy', 'config.redis'],
    ],
    dependencies: {
      'config.redis': ['config.policy', 'redis'],
    },
  },
})
```

**With fieldRenderers — replaces `ExitTransformerForm.vue`:**

```ts
// plugins/ExitTransformer.ts
import { definePluginConfig } from '../shared/define-plugin-config'
import StringField from '../shared/StringField.vue'

export default definePluginConfig({
  experimental: true,
  fieldRenderers: [
    {
      match: 'config.functions',
      component: StringField,
      propsOverrides: { multiline: true, rows: 3 },
    },
  ],
})
```

**With fieldRenderers — replaces `ResponseTransformerForm.vue`:**

```ts
// plugins/ResponseTransformer.ts
import { definePluginConfig } from '../shared/define-plugin-config'
import StringField from '../shared/StringField.vue'

export default definePluginConfig({
  experimental: true,
  fieldRenderers: [
    {
      match: ({ path }) =>
        path === 'config.replace.body'
        || path === 'config.replace.json'
        || path.startsWith('config.') && path.endsWith('_by_lua'),
      component: StringField,
      propsOverrides: { multiline: true, rows: 3 },
    },
  ],
})
```

**With custom component:**

```ts
// plugins/KeyAuth/index.ts
import { definePluginConfig } from '../../shared/define-plugin-config'
import KeyAuthForm from './KeyAuthForm.vue'

export default definePluginConfig({
  experimental: true,
  component: KeyAuthForm,
})
```

### Resolved output

`definePluginConfig()` merges with `defaultConfig`. For `RateLimiting.ts` the resolved config is:

```ts
{
  experimental: true,
  component: CommonForm,            // from defaultConfig
  renderRules: {
    bundles: [['config.policy', 'config.redis']],
    dependencies: { 'config.redis': ['config.policy', 'redis'] },
  },
  fieldRenderers: [
    // inherited from defaultConfig
    { match: ({ path }) => path === redisPartialInfo?.redisPath?.value, component: RedisSelector },
    // (no plugin-specific renderers for this plugin)
  ],
}
```

---

## Design Decisions

### File location & naming

- Config files live in `free-form/plugins/`
- Support `PluginName.ts` (simple) or `PluginName/index.ts` (with companion `.vue`)
- **PascalCase** naming, auto-converted to kebab-case for plugin name mapping: `KeyAuth` → `key-auth`, `AICustomGuardrail` → `ai-custom-guardrail`
- Every freeform plugin must have a config file (even if just `export default definePluginConfig()`)

### Auto-discovery via `import.meta.glob`

```ts
const pluginConfigs = import.meta.glob(
  ['./plugins/*/index.ts', './plugins/*.ts'],
  { eager: true }
)
```

File paths are parsed to extract PascalCase names, converted to kebab-case, and keyed into a registry. This replaces the manual `mapping` object in `free-form.ts`.

**Why `import.meta.glob` over a custom Vite plugin:** simpler, well-supported, no build-time code generation needed.

### Auto-injection via PluginEntityForm

`PluginEntityForm.vue` will:
1. Import all plugin configs via the glob-based registry
2. Resolve config by plugin name (kebab-case)
3. Pass `renderRules`, `fieldRenderers`, and the resolved `component` as props to the form

This replaces the current three-way lookup across `free-form.ts`, `metadata.ts`, and `free-form/index.ts`.

### What gets removed

| File | What's removed |
|------|---------------|
| `src/utils/free-form.ts` | The entire `mapping` object and `getFreeFormName()` |
| `src/definitions/metadata.ts` | `freeformRenderRules` from `PLUGIN_METADATA` entries |
| `src/components/free-form/index.ts` | Barrel export file (no longer needed) |
| `StandardLayout.vue` | Hardcoded Redis `<FieldRenderer>` and `<slot name="field-renderers">` |

### Scope

This iteration covers: `experimental`, `component`, `renderRules`, `fieldRenderers`.
`FormConfig` options (`prepareFormData`, `transformLabel`, etc.) may be added later.

---

## Migration Path

1. Create `definePluginConfig()`, types (`PluginFormConfig`, `FieldRenderer`), and `defaultConfig` in `shared/`
2. Create `plugins/` directory with config files for all existing mapped plugins
3. Add glob-based resolver that builds a `pluginName → config` registry
4. Update `PluginEntityForm.vue` to use the new registry for component resolution and prop injection
5. Wire `fieldRenderers` from config into `Form.vue`'s `<template #[FIELD_RENDERERS]>`
6. Remove hardcoded Redis FieldRenderer from `StandardLayout.vue`
7. Migrate existing dedicated form components (ExitTransformer, ResponseTransformer, Opentelemetry, etc.) to `fieldRenderers` configs
8. Remove old `free-form.ts` mapping, `freeformRenderRules` from `metadata.ts`, and barrel export from `free-form/index.ts`
