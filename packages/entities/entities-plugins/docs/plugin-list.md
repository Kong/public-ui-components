# PluginList.vue

A table component for plugins.

- [Requirements](#requirements)
- [Usage](#usage)
  - [Install](#install)
  - [Props](#props)
  - [Events](#events)
  - [Usage example](#usage-example)
- [TypeScript interfaces](#typescript-interfaces)

## Requirements

- `vue` and `vue-router` must be initialized in the host application
- `@kong/kongponents` must be added as a `dependency` in the host application, globally available via the Vue Plugin installation, and the package's style imports must be added in the app entry file. [See here for instructions on installing Kongponents](https://kongponents.konghq.com/#globally-install-all-kongponents).

## Usage

### Install

[See instructions for installing the `@kong-ui-public/entities-plugins` package.](../README.md#install)

### Props

#### `config`

- type: `Object as PropType<KonnectPluginListConfig | KongManagerPluginListConfig>`
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

  - `createRoute`:
    - type: `RouteLocationRaw`
    - required: `true`
    - default: `undefined`
    - Route for creating a plugin.

  - `getViewRoute`:
    - type: `(plugin: EntityRow) => RouteLocationRaw`
    - required: `true`
    - default: `undefined`
    - A function that returns the route for viewing a plugin.

  - `getEditRoute`:
    - type: `(plugin: EntityRow) => RouteLocationRaw`
    - required: `true`
    - default: `undefined`
    - A function that returns the route for editing a plugin.

  - `getScopedEntityViewRoute`
    - type: `(type: ViewRouteType, id: string) => RouteLocationRaw`
    - required: `true`
    - default: `undefined`
    - A function that returns the route for the specific entity linked with plugin

  - `getConfigureDynamicOrderingRoute`
    - type: `(plugin: EntityRow) => RouteLocationRaw`
    - required: `true`
    - default: `undefined`
    - A function that returns the route for plugin's dynamic ordering confiugration page

  - `getToggleDisabledTooltip`
    - type: `(row: EntityRow) => string | null`,
    - required: `false`,
    - default: `() => null`,
    - A synchronous function, that returns a string for a entity row, will be displayed on the switch hover tooltip. A null return will not make tooltip displayed. Please note it's a synchronous function.

  - `workspace`:
    - type: `string`
    - required: `true`
    - default: `undefined`
    - *Specific to Kong Manager*. Name of the current workspace.

  - `isExactMatch`:
    - type: `boolean`
    - required: `false`
    - default: `undefined`
    - *Specific to Kong Manager*. Whether to use exact match.

  - `filterSchema`:
    - type: `FilterSchema`
    - required: `false`
    - default: `undefined`
    - *Specific to Kong Manager*. FilterSchema for fuzzy match.

  - `disableSorting`:
    - type: `boolean`
    - required: `false`
    - default: `undefined`
    - *Specific to Kong Manager*. Whether to disable table sorting.

  - `controlPlaneId`:
    - type: `string`
    - required: `true`
    - default: `undefined`
    - *Specific to Konnect*. Name of the current control plane.

  - `entityId`:
    - type: `string`
    - required: `false`
    - default: `null`
    - Current entity id if the PluginList is nested in the plugins tab on a consumer, gateway service, or route detail page.

  - `entityType`:
    - type: `'consumers' | 'services' | 'routes'`
    - required: `false`
    - default: `null`
    - Current entity type if the PluginList is nested in the plugins tab on a consumer, gateway service, or route detail page.

The base konnect or kongManger config.

#### `cacheIdentifier`

- type: `String`
- required: `false`
- default: `''`

Used to override the default unique identifier for the table's entry in the cache. This should be unique across the Vue App.
Note: the default value is usually sufficient unless the app needs to support multiple separate instances of the table.

#### `canCreate`

- type: `Function as PropType<() => Promise<boolean>>`
- required: `false`
- default: `async () => true`

An asynchronous function, that returns a boolean, that evaluates if the user can create a new entity.

#### `canDelete`

- type: `Function as PropType<(row: object) => Promise<boolean>>`
- required: `false`
- default: `async () => true`

An asynchronous function, that returns a boolean, that evaluates if the user can delete a given entity.

#### `canEdit`

- type: `Function as PropType<(row: object) => Promise<boolean>>`
- required: `false`
- default: `async () => true`

An asynchronous function, that returns a boolean, that evaluates if the user can edit a given entity.

#### `canToggle`

- type: `Function as PropType<(row: EntityRow) => Promise<boolean>>`
- required: `false`
- default: `async () => true`

An asynchronous function, that returns a boolean, that evaluates if the user can toggle (enable/disable) a given entity

#### `canRetrieve`

- type: `Function as PropType<(row: object) => Promise<boolean>>`
- required: `false`
- default: `async () => true`

An asynchronous function, that returns a boolean, that evaluates if the user can retrieve (view details) a given entity.

#### `canRetrieveScopedEntity`

- type: `Function as PropType<(entityType: 'service' | 'route' | 'consumer', entityId: string) => Promise<boolean>>`
- required: `false`
- default: `async () => true`

An asynchronous function, that returns a boolean, that evaluates if the user can retrieve (view details) a given scoped entity (e.g. route linked with the plugin)

#### `canConfigureDynamicOrdering`

- type: `Function as PropType<(row: EntityRow) => Promise<boolean>>`
- required: `false`
- default: `async () => true`

An asynchronous function, that returns a boolean, that evaluates if the user can configure dynamic ordering for a given entity.

#### `title`

The table is rendered inside a `KCard`. `title` text is displayed in the upper left corner of the `KCard` above the table.

### Events

#### error

An `@error` event is emitted when the table fails to fetch plugins or delete a plugin. The event payload is the response error.

#### copy:success

A `@copy:success` event is emitted when a plugin ID or the entity JSON is successfully copied to clipboard. The event payload shape is CopyEventPayload.

#### copy:error

A `@copy:error` event is emitted when an error occurs when trying to copy a plugin ID or the entity JSON. The event payload shape is CopyEventPayload.

#### delete:success

A `@delete:success` event is emitted when a plugin is successfully deleted. The event payload is the plugin item data object.

#### toggle-enabled

A `toggle-enabled` event is emitted when a plugin's enabled status is been toggled. The event has two arguments, the first is `isEnabled` and second is the plugin's schema

### Usage example

Please refer to the [sandbox](../sandbox/pages/PluginListPage.vue).

## TypeScript interfaces

TypeScript interfaces [are available here](https://github.com/Kong/public-ui-components/blob/main/packages/entities/entities-plugins/src/types/index.ts) and can be directly imported into your host application. The following type interfaces are available for import:

```ts
import type {
  BasePluginListConfig,
  KonnectPluginListConfig,
  KongManagerPluginListConfig,
} from '@kong-ui-public/entities-plugins'
```
