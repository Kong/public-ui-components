# ConsumerList.vue

A table component for consumers.

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
- `@kong-ui-public/i18n` must be available as a `dependency` in the host application.
- `axios` must be installed as a dependency in the host application

## Usage

### Install

[See instructions for installing the `@kong-ui/entities-consumers` package.](../README.md#install)

### Props

#### `config`

- type: `Object as PropType<KonnectConsumerListConfig | KongManagerConsumerListConfig>`
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
    - Route for creating a consumer.

  - `getViewRoute`:
    - type: `(id: string) => RouteLocationRaw`
    - required: `true`
    - default: `undefined`
    - A function that returns the route for viewing a consumer.

  - `getEditRoute`:
    - type: `(id: string) => RouteLocationRaw`
    - required: `true`
    - default: `undefined`
    - A function that returns the route for editing a consumer.

  - `consumerGroupId`:
    - type: `string`
    - required: `false`
    - default: `null`
    - Current consumer group id if the ConsumerList in nested in the consumers tab on a consumer group detail page.

  - `consumerGroupName`:
    - type: `string`
    - required: `false`
    - default: `null`
    - Current consumer group name if the ConsumerList in nested in the consumers tab on a consumer group detail page.

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

- type: `Function as PropType<() => Promise<boolean>>`
- required: `false`
- default: `async () => true`

An asynchronous function, that returns a boolean, that evaluates if the user can create a new entity.
Note: When ConsumerList config specifies a `consumerGroupId` the `canCreate` permission is applied to the action of adding a consumer to a consumer group instead of creating a new consumer.

#### `canDelete`

- type: `Function as PropType<(row: object) => Promise<boolean>>`
- required: `false`
- default: `async () => true`

An asynchronous function, that returns a boolean, that evaluates if the user can delete a given entity.
Note: When ConsumerList config specifies a `consumerGroupId` the `canDelete` permission is applied to the action of removing a consumer from a consumer group instead of deleting a consumer.

#### `canEdit`

- type: `Function as PropType<(row: object) => Promise<boolean>>`
- required: `false`
- default: `async () => true`

An asynchronous function, that returns a boolean, that evaluates if the user can edit a given entity.

#### `canRetrieve`

- type: `Function as PropType<(row: object) => Promise<boolean>>`
- required: `false`
- default: `async () => true`

An asynchronous function, that returns a boolean, that evaluates if the user can retrieve (view details) a given entity.

### Events

#### error

An `@error` event is emitted when the table fails to fetch consumers or delete a consumer. The event payload is the response error.

#### copy:success

A `@copy:success` event is emitted when a consumer ID or the entity JSON is successfully copied to clipboard. The event payload shape is CopyEventPayload.

#### copy:error

A `@copy:error` event is emitted when an error occurs when trying to copy a consumer ID or the entity JSON. The event payload shape is CopyEventPayload.

#### delete:success

A `@delete:success` event is emitted when a consumer is successfully deleted. The event payload is the consumer item data object.

#### add:success

A `@add:success` event is emitted when one or more consumers are successfully added to a consumer group. The event payload is an array of the id's of the added consumers.

#### remove:success

A `@remove:success` event is emitted when a consumer is successfully removed from a consumer group. The event payload is the consumer item data object.

### Usage example

Please refer to the [sandbox](../sandbox/pages/ConsumerListPage.vue).

## TypeScript interfaces

TypeScript interfaces [are available here](https://github.com/Kong/shared-ui-components/blob/main/packages/entities/entities-consumers/src/types/consumer-list.ts) and can be directly imported into your host application. The following type interfaces are available for import:

```ts
import type {
  BaseConsumerListConfig,
  KonnectConsumerListConfig,
  KongManagerConsumerListConfig,
} from '@kong-ui/entities-consumers'
```
