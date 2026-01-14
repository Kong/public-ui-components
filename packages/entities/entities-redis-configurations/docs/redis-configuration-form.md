# RedisConfigurationForm

A form component for Redis Configurations.

- [Requirements](#requirements)
- [Usage](#usage)
  - [Install](#install)
  - [Props](#props)
  - [Events](#events)
  - [Usage example](#usage-example)
- [TypeScript interfaces](#typescript-interfaces)

## Requirements

- `vue` and `vue-router` must be initialized in the host application.
- `@kong/kongponents` must be added as a dependency in the host application, globally available via the Vue Plugin installation, and the package's style imports must be added in the app entry file. [See here for instructions on installing Kongponents](https://kongponents.konghq.com/#globally-install-all-kongponents).
- `@kong-ui-public/i18n` must be available as a `dependency` in the host application.
- `@kong-ui-public/entities-shared` must be available as a `dependency` in the host application.
- `@kong-ui-public/entities-vaults` must be available as a `dependency` in the host application.
- `axios` must be installed as a dependency in the host application.

## Usage

### Install

[See instructions for installing the `@kong-ui-public/redis-configurations` package.](../README.md#install)

### Props

#### `config`

- type: `Object as PropType<KonnectRedisConfigurationFormConfig | KongManagerRedisConfigurationFormConfig>`
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

  - `cancelRoute`:
    - type: `RouteLocationRaw`
    - required: `true`
    - default: `undefined`
    - Route to return to when canceling creation of a redis configuration.

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

  - `cloudAuthAvailable`
    - type: `boolean`
    - required: `false`
    - default: `undefined`
    - Whether to show the Cloud Authentication fields.

  - `isPortReferenceable`
    - type: `boolean`
    - required: `false`
    - default: `undefined`
    - Whether the port field can accept vault references.

  - `isHostReferenceable`
    - type: `boolean`
    - required: `false`
    - default: `undefined`
    - Whether the host field can accept vault references.

  - `isServerNameReferenceable`
    - type: `boolean`
    - required: `false`
    - default: `undefined`
    - Whether the server_name field can accept vault references.

  - `isCEFieldsReferenceable`
    - type: `boolean`
    - required: `false`
    - default: `undefined`
    - Whether the CE partial fields can accept vault references. 

The base konnect or kongManger config.

#### `partialId`

- type: `String`
- required: `false`
- default: `''`

If showing the `Edit` type form, the ID of the Redis configuration.

#### `actionTeleportTarget`

- type: `String`
- required: `false`
- default: `''`

The name of the teleport target to render the form action buttons.

#### `slidoutTopOffset`

- type: `Number`
- required: `false`
- default: `60`

The top offset of the `View Configuration` slidout.

#### `disabledPartialType`

- type: `String`
- required: `false`
- default: `''`

The type of the partial to disable. If set it to `PartialType.REDIS_CE`, the Host/Port CE type option will be disabled. If set it to `PartialType.REDIS_EE`, all EE type options will be disabled.

### Events

#### error

An `@error` event is emitted when form validation fails. The event payload is the response error.

#### loading

A `@loading` event is emitted when loading state changes. The event payload is a boolean.

#### update

A `@update` event is emitted when the form is saved. The event payload is the Redis Configuration object.

### Usage example

Please refer to the [sandbox](../sandbox/pages/RedisConfigurationListPage.vue). The form is accessible by clicking the `+ New Redis Configuration` button or `Edit` action of an existing Redis Configuration.

## TypeScript interfaces

TypeScript interfaces [are available here](../src/types/redis-confiugration-form.ts) and can be directly imported into your host application. The following type interfaces are available for import:

```ts
import type {
  KonnectRedisConfigurationFormConfig,
  KongManagerRedisConfigurationFormConfig,
  RedisConfigurationFields,
  RedisConfigurationFormState,
} from '@kong-ui-public/entities-redis-configurations'
```
