# SniList.vue

A table component for SNIs.

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

[See instructions for installing the `@kong-ui-public/entities-snis` package.](../README.md#install)

### Props

#### `config`

- type: `Object as PropType<KonnectSniListConfig | KongManagerSniListConfig>`
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

  - `axiosRequestConfig`:
    - type: `AxiosRequestConfig`
    - required: `false`
    - default: `undefined`
    - An optional configuration object for the underlying Axios request.

  - `createRoute`:
    - type: `RouteLocationRaw`
    - required: `true`
    - default: `undefined`
    - Route for creating an SNI.

  - `getViewRoute`:
    - type: `(id: string) => RouteLocationRaw`
    - required: `true`
    - default: `undefined`
    - A function that returns the route for viewing an SNI.

  - `getEditRoute`:
    - type: `(id: string) => RouteLocationRaw`
    - required: `true`
    - default: `undefined`
    - A function that returns the route for editing an SNI.

  - `additionMessageForEmptyState`:
    - type: `string`
    - required: `false`
    - default: `undefined`
    - Additional message to show when there are no records.

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

  - `disableSorting`:
    - type: `boolean`
    - required: `false`
    - default: `undefined`
    - *Specific to Kong Manager*. Whether to disable table sorting.

  - `filterSchema`:
    - type: `FilterSchema`
    - required: `false`
    - default: `undefined`
    - *Specific to Kong Manager*. FilterSchema for fuzzy match.

  - `controlPlaneId`:
    - type: `string`
    - required: `true`
    - default: `undefined`
    - *Specific to Konnect*. Name of the current control plane.

The base konnect or kongManger config.

#### `cacheIdentifier`

- type: `String`
- required: `false`
- default: `''`

Used to override the default unique identifier for the table's entry in the cache. This should be unique across the Vue App.
Note: the default value is usually sufficient unless the app needs to support multiple separate instances of the table.

#### `canCreate`

- type: `Function as PropType<() => boolean | Promise<boolean>>`
- required: `false`
- default: `async () => true`

A synchronous or asynchronous function, that returns a boolean, that evaluates if the user can create a new entity.

#### `canDelete`

- type: `Function as PropType<(row: object) => boolean | Promise<boolean>>`
- required: `false`
- default: `async () => true`

A synchronous or asynchronous function, that returns a boolean, that evaluates if the user can delete a given entity.

#### `canEdit`

- type: `Function as PropType<(row: object) => boolean | Promise<boolean>>`
- required: `false`
- default: `async () => true`

A synchronous or asynchronous function, that returns a boolean, that evaluates if the user can edit a given entity.

#### `canRetrieve`

- type: `Function as PropType<(row: object) => boolean | Promise<boolean>>`
- required: `false`
- default: `async () => true`

A synchronous or asynchronous function, that returns a boolean, that evaluates if the user can retrieve (view details) a given entity.

### Events

#### error

An `@error` event is emitted when the table fails to fetch SNIs or delete an SNI. The event payload is the response error.

#### copy:success

A `@copy:success` event is emitted when an SNI ID, cert ID or the entity JSON is successfully copied to clipboard. The event payload shape is CopyEventPayload.

#### copy:error

A `@copy:error` event is emitted when an error occurs when trying to copy an SNI ID, cert ID or the entity JSON. The event payload shape is CopyEventPayload.

#### delete:success

A `@delete:success` event is emitted when an SNI is successfully deleted. The event payload is the SNI item data object.

### Usage example

Please refer to the [sandbox](../sandbox/pages/SniListPage.vue).

## TypeScript interfaces

TypeScript interfaces [are available here](https://github.com/Kong/public-ui-components/blob/main/packages/entities/entities-snis/src/types/sni-list.ts) and can be directly imported into your host application. The following type interfaces are available for import:

```ts
import type {
  BaseSniListConfig,
  KonnectSniListConfig,
  KongManagerSniListConfig,
} from '@kong-ui-public/entities-snis'
```
