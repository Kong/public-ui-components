# PluginSelect.vue

A grid component for selecting Plugins.

- [Requirements](#requirements)
- [Usage](#usage)
  - [Install](#install)
  - [Props](#props)
  - [Events](#events)
  - [Usage example](#usage-example)
- [TypeScript interfaces](#typescript-interfaces)

## Requirements

- `vue` and `vue-router` must be initialized in the host application
- `@kong/kongponents` must be added as a dependency in the host application, globally available via the Vue Plugin installation, and the package's style imports must be added in the app entry file. [See here for instructions on installing Kongponents](https://kongponents.konghq.com/#globally-install-all-kongponents).
- `@kong-ui-public/i18n` must be available as a `dependency` in the host application.
- `axios` must be installed as a dependency in the host application

## Usage

### Install

[See instructions for installing the `@kong-ui-public/entities-plugins` package.](../README.md#install)

### Props

#### `config`

- type: `Object as PropType<KonnectPluginFormConfig | KongManagerPluginFormConfig>`
- required: `true`
- default: `undefined`
- properties:
  - `app`:
    - type: `'konnect' | 'kongManager'`
    - required: `true`
    - default: `undefined`
    - App name.

  - `apiBaseUrl`:
    - type: `string`
    - required: `true`
    - default: `undefined`
    - Base URL for API requests.

  - `requestHeaders`:
    - type: `RawAxiosRequestHeaders | AxiosHeaders`
    - required: `false`
    - default: `undefined`
    - Additional headers to send with all Axios requests.

  - `getCreateRoute`:
    - type: `(plugin: string) => RouteLocationRaw`
    - required: `true`
    - default: `undefined`
    - A function that returns the route for creating a specific plugin type.

  - `workspace`:
    - type: `string`
    - required: `true`
    - default: `undefined`
    - *Specific to Kong Manager*. Name of the current workspace.

  - `controlPlaneId`:
    - type: `string`
    - required: `true`
    - default: `undefined`
    - *Specific to Konnect*. Name of the current control plane.

The base konnect or kongManger config.

### Events

#### plugin-clicked

An `@plugin-clicked` event is emitted when a plugin in the selection grid is clicked. The event payload is the plugin object.

#### loading

A `@loading` event is emitted when loading state changes. The event payload is a boolean.

### Usage example

Please refer to the [sandbox](../sandbox/pages/PluginListPage.vue). The form is accessible by clicking the `+ New Plugin` button.

## TypeScript interfaces

TypeScript interfaces [are available here](https://github.com/Kong/public-ui-components/blob/main/packages/entities/entities-plugins/src/types/plugin-form.ts) and can be directly imported into your host application. The following type interfaces are available for import:

```ts
import type {
  KonnectPluginFormConfig,
  KongManagerPluginFormConfig,
} from '@kong-ui-public/entities-plugins'
```
