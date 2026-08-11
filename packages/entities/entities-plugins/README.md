# @kong-ui-public/entities-plugins

Plugin entity components.

- [Requirements](#requirements)
- [Included components](#included-components)
- [Usage](#usage)
  - [Install](#install)
  - [Registration](#registration)
  - [Color mode (light/dark theme)](#color-mode-lightdark-theme)
- [Individual component documentation](#individual-component-documentation)

## Requirements

- `vue` and `vue-router` must be initialized in the host application
- `@kong/kongponents` must be added as a dependency in the host application, globally available via the Vue Plugin installation, and the package's style imports must be added in the app entry file. [See here for instructions on installing Kongponents](https://kongponents.konghq.com/#globally-install-all-kongponents).
- `@kong-ui-public/i18n` must be available as a `dependency` in the host application.
- `axios` must be installed as a dependency in the host application
> [!CAUTION]
> A string of 'undefined' is disallowed in Plugin icon names

## Included components

- `PluginList`

Reference the [individual component docs](#individual-component-documentation) for more info.

## Usage

### Install

Install the component in your host application

```sh
yarn add @kong-ui-public/entities-plugins
```

### Registration

Import the component(s) in your host application as well as the package styles

```ts
import { PluginList, PluginSelect, PluginForm, PluginConfigCard } from '@kong-ui-public/entities-plugins'
import '@kong-ui-public/entities-plugins/dist/style.css'
```

### Color mode (light/dark theme)

Components in this package that embed a Monaco-based editor (for example the plugin free-form code editors) automatically match the host application's active color mode. To enable this, the host application should `provide` a `ComputedRef<'light' | 'dark'>` under the `app:konnectColorMode` injection key. When provided, the editors reactively switch between their light and dark themes as the value changes. When the key is not provided, the editors fall back to the `'light'` theme.

```ts
// In the host application (e.g. within your root component's setup)
import { computed, provide } from 'vue'

// `isDarkMode` is however your app tracks its current theme
const colorMode = computed<'light' | 'dark'>(() => (isDarkMode.value ? 'dark' : 'light'))

provide('app:konnectColorMode', colorMode)
```

## Individual component documentation

- [`<PluginList.vue />`](docs/plugin-list.md)
- [`<PluginSelect.vue />`](docs/plugin-select.md)
- [`<PluginForm.vue />`](docs/plugin-form.md)
- [`<PluginConfigCard.vue />`](docs/plugin-config-card.md)
- [`<CustomPluginForm.vue />`](docs/custom-plugin-form.md)
