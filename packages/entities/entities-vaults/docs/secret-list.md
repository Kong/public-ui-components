# SecretList.vue

A list component for Konnect config store secrets. *This component should only be used in Konnect*. 

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

[See instructions for installing the `@kong-ui-public/entities-vaults` package.](../README.md#install)

### Props

#### `config`

- type: `Object as PropType<KonnectSecretListConfig>`
- required: `true`
- default: `undefined`
- properties:
  - `app`:
    - type: `'konnect'`
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

  - `cancelRoute`:
    - type: `RouteLocationRaw`
    - required: `true`
    - default: `undefined`
    - Route to return to when canceling creating or editing a secret.

  - `createRoute`:
    - type: `RouteLocationRaw`
    - required: `true`
    - default: `undefined`
    - Route for creating a secret.

  - `getEditRoute`:
    - type: `(id: string) => RouteLocationRaw`
    - required: `true`
    - default: `undefined`
    - A function that returns the route for editing a secret.

  - `additionMessageForEmptyState`:
    - type: `string`
    - required: `false`
    - default: `undefined`
    - Additional message to show when there are no records.

  - `controlPlaneId`:
    - type: `string`
    - required: `true`
    - default: `undefined`
    - Name of the current control plane.

#### `vaultId`

- type: `String`
- required: `true`
- default: `undefined`
- Current vault ID.

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

### Events

#### error

An `@error` event is emitted when the table fails to fetch secrets or delete a secret. The event payload is the response error.

#### delete:success

A `@delete:success` event is emitted when a secret is successfully deleted. The event payload is the secret item data object.

### Usage example

Please refer to the [sandbox](../sandbox/pages/VaultConfigCardPage.vue).

## TypeScript interfaces

TypeScript interfaces [are available here](../src/types/secret-list.ts) and can be directly imported into your host application. The following type interfaces are available for import:

```ts
import type {
  KonnectSecretListConfig,
  SecretEntityRow,
} from '@kong-ui-public/entities-vaults'
