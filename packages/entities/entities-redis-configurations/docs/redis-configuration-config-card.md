# RedisConfigurationConfigCard.vue

A config card component for Redis Configurations.

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
- `axios` must be installed as a dependency in the host application.

## Usage

### Install

[See instructions for installing the `@kong-ui-public/redis-configurations` package.](../README.md#install)

### Props

#### `config`

- type: `Object as PropType<KonnectRedisConfigurationEntityConfig | KongManagerRedisConfigurationEntityConfig>`
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
    - required: `true`
    - default: `''`
    - The ID of the Redis Configuration to display the config for

  - `cloudAuthAvailable`
    - type: `boolean`
    - required: `false`
    - default: `undefined`
    - Whether to show the Cloud Authentication section in the form.

The base konnect or kongManger config.

#### `configCardDoc`

- type: `String`
- required: `false`
- default: `null`

Set this value to display the documentation button.

#### `hideTitle`

- type: `Boolean`
- required: `false`
- default: `false`

Set this value to `true` to hide the card title.

### Events

#### loading

A `@loading` event is emitted when loading state changes. The event payload is a boolean.

#### fetch:error

An `@fetch:error` event is emitted when the component fails to fetch the redis configuration. The event payload is the response error.

#### fetch:success

A `@fetch:success` event is emitted when the redis configuration is successfully fetched. The event payload is the redis configuration object.

### Usage example

Please refer to the [sandbox](../sandbox/pages/RedisConfigurationDetail.vue).

## TypeScript interfaces

TypeScript interfaces [are available here](../src/types/redis-confiugration-config.ts) and can be directly imported into your host application. The following type interfaces are available for import:

```ts
import type {
  KonnectRedisConfigurationEntityConfig,
  KongManagerRedisConfigurationEntityConfig,
} from '@kong-ui-public/entities-redis-configurations'
```
