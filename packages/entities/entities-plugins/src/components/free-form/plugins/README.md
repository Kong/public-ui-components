# Free-form Plugin Configs

Each free-form plugin is registered by adding one config module in this directory. The registry auto-discovers both `plugins/*.ts` and `plugins/*/index.ts`.

## Add a Plugin

1. Create a new config file whose kebab-case file or folder name maps to the plugin name.
2. Export the config with `definePluginConfig()`.
3. Use a top-level `.ts` file for simple plugins, or a folder with `index.ts` when the plugin needs a dedicated Vue form component.
4. Omit `component` when `CommonForm` is enough; `definePluginConfig()` will supply it automatically.

## Simple Plugin

```ts
import { definePluginConfig } from '../define-plugin-config'

export default definePluginConfig({})
```

This resolves to `CommonForm` unless you provide a custom `component`.

## Plugin With Render Rules

```ts
import { definePluginConfig } from '../define-plugin-config'

export default definePluginConfig({
  renderRules: {
    bundles: [
      ['config.strategy', 'config.redis'],
    ],
    dependencies: {
      'config.redis': ['config.strategy', 'redis'],
    },
  },
})
```

## Plugin With Field Renderers

```ts
import StringField from '../core/components/StringField.vue'
import { definePluginConfig } from '../define-plugin-config'

export default definePluginConfig({
  fieldRenderers: [
    {
      match: 'config.example',
      component: StringField,
      propsOverrides: {
        multiline: true,
      },
    },
  ],
})
```

`match` accepts either an exact field path string or a predicate function. Predicate matches receive `path`, `genericPath`, and `schema`.

## Plugin With Custom Component

```ts
import KeyAuthForm from './KeyAuthForm.vue'
import { definePluginConfig } from '../../define-plugin-config'

export default definePluginConfig({
  component: KeyAuthForm,
})
```

Place that file in `plugins/<plugin-name>/index.ts`.

Use a custom component when the plugin needs nested slot composition or plugin-specific form logic that cannot be expressed with `fieldRenderers` and `renderRules` alone.
