# Free-form Plugin Configs

Each free-form plugin is registered by adding one config file in this directory.

## Add a Plugin

1. Create a new config file whose PascalCase file or folder name maps to the plugin name through `kebabCase`.
2. Export the config with `definePluginConfig()`.
3. Use a top-level `.ts` file for simple plugins, or a folder with `index.ts` when the plugin needs a dedicated Vue form component.

## Simple Plugin

```ts
import { definePluginConfig } from '../shared/define-plugin-config'

export default definePluginConfig({
  experimental: true,
})
```

## Plugin With Render Rules

```ts
import { definePluginConfig } from '../shared/define-plugin-config'

export default definePluginConfig({
  experimental: true,
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
import StringField from '../shared/StringField.vue'
import { definePluginConfig } from '../shared/define-plugin-config'

export default definePluginConfig({
  experimental: true,
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

`match` accepts either an exact field path string or a predicate function.

## Plugin With Custom Component

```ts
import KeyAuthForm from '../KeyAuth'
import { definePluginConfig } from '../shared/define-plugin-config'

export default definePluginConfig({
  experimental: true,
  component: KeyAuthForm,
})
```

Use a custom component when the plugin needs nested slot composition or plugin-specific form logic that cannot be expressed with `fieldRenderers` and `renderRules` alone.
