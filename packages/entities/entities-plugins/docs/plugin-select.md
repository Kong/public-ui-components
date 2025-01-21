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

- type: `Object as PropType<KonnectPluginSelectConfig | KongManagerPluginSelectConfig>`
- required: `true`
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

  - `axiosRequestConfig`:
    - type: `AxiosRequestConfig`
    - required: `false`
    - default: `undefined`
    - An optional configuration object for the underlying Axios request.

  - `getCreateRoute`:
    - type: `(plugin: string) => RouteLocationRaw`
    - required: `true`
    - default: `undefined`
    - A function that returns the route for creating a specific plugin type.

  - `createCustomRoute`:
    - type: RouteLocationRaw
    - required: `false`
    - default: `undefined`
    - The route for creating a custom plugin.

  - `getCustomEditRoute`:
    - type: `(plugin: string, type: 'schema' | 'streaming') => RouteLocationRaw`
    - required: `false`
    - default: `undefined`
    - A function that returns the route for editing a custom plugin.

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

  - `entityId`:
    - type: `string`
    - required: `false`
    - default: `null`
    - Current entity id if the PluginSelect is being launched from the plugins tab on a consumer, consumer group, gateway service, or route detail page.

  - `entityType`:
    - type: `'consumers' | 'consumer_groups' | 'services' | 'routes'`
    - required: `false`
    - default: `null`
    - Current entity type if the PluginSelect is being launched from the plugins tab on a consumer, consumer group, gateway service, or route detail page.

The base konnect or kongManger config.

#### `customPluginSupport`

- type: `'none' | 'disabled' | 'schema' | 'streaming'`
- required: `false`
- default: `'none'`

Control plane custom plugins support level.
- When `'none'`, custom plugins tab is hidden from the UI.
- When `'disabled'`, custom plugins tab is shown but grayed out and disabled.
- When `'schema'`, custom plugins tab is enabled for creating schema-only custom plugins, only the schema-only custom plugins can be rendered, edited, and deleted due to API limitations.
- When `'streaming'`, custom plugins tab is enabled for creating streaming custom plugins, both schema-only and streaming custom plugins can be rendered, edited, and deleted.

#### `canCreateCustomPlugin`

- type: `Function as PropType<() => boolean | Promise<boolean>>`
- required: `false`
- default: `async () => true`

A synchronous or asynchronous function, that returns a boolean, that evaluates if the user can create a new custom plugin.

#### `canDeleteCustomPlugin`

- type: `Function as PropType<(row: object) => boolean | Promise<boolean>>`
- required: `false`
- default: `async () => true`

A synchronous or asynchronous function, that returns a boolean, that evaluates if the user can delete a given custom plugin.

#### `canEditCustomPlugin`

- type: `Function as PropType<(row: object) => boolean | Promise<boolean>>`
- required: `false`
- default: `async () => true`

A synchronous or asynchronous function, that returns a boolean, that evaluates if the user can edit a given custom plugin.

#### `navigateOnClick`

- type: `boolean`
- required: `false`
- default: `true`

If false, let consuming component handle event when clicking on a plugin. Used in conjunction with `@plugin-clicked` event.

#### `availableOnServer`

- type: `boolean`
- required: `false`
- default: `true`

Checks the kong config plugins.available_on_server and if true, then it will not show plugins from PluginMeta that are outside of the available_on_server array.

#### `ignoredPlugins`

- type: `string[]`
- required: `false`
- default: '[]'

An array of the plugin names. These are plugins that should not be displayed.

#### `disabledPlugins`

- type: `DisabledPlugin`
- required: `false`
- default: `{}`

Plugins that should be disabled and their disabled messages.
Example:

```json
{
  "acl": "ACL is not supported for this entity type"
}
```

#### `highlightedPluginIds`

- type: `string[]`
- required: `false`
- default: `[]`

Ids of plugins to show in the highlighted plugins group.

#### `highlightedPluginsTitle`

- type: `string`
- required: `false`
- default: `i18n.t('plugins.select.highlighted_plugins.title')`

Title for the highlighted plugins group

### Events

#### plugin-clicked

An `@plugin-clicked` event is emitted when a plugin in the selection grid is clicked. The event payload is the plugin object.

#### loading

A `@loading` event is emitted when loading state changes. The event payload is a boolean.

#### delete-custom:success

A `@delete-custom:success` event is emitted when custom plugin is successfully deleted. The event payload is the deleted plugin's name.

### Usage example

Please refer to the [sandbox](../sandbox/pages/PluginListPage.vue). The form is accessible by clicking the `+ New Plugin` button.

## TypeScript interfaces

TypeScript interfaces [are available here](https://github.com/Kong/public-ui-components/blob/main/packages/entities/entities-plugins/src/types/plugin-form.ts) and can be directly imported into your host application. The following type interfaces are available for import:

```ts
import type {
  KonnectPluginSelectConfig,
  KongManagerPluginSelectConfig,
} from '@kong-ui-public/entities-plugins'
```
