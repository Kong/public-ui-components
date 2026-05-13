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
    - type: `string` for Kong Manager, `string | null` for Konnect
    - required: `true` for Kong Manager, `false` for Konnect
    - default: `undefined`
    - Name of the current workspace.

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

#### fetch:not-found

A `@fetch:not-found` event is emitted when the underlying GET returns **404** (for example after a Konnect-managed add-on or linked partial is deleted). It is **not** emitted as `@fetch:error`, so hosts can redirect to the list instead of showing a global not-found page. The payload is the Axios error.

#### fetch:success

A `@fetch:success` event is emitted when the redis **partial** configuration is successfully fetched (legacy Konnect/Kong Manager partial card, or the nested partial section inside Konnect-managed Redis config tab). The event payload is the redis configuration object (`RedisConfigurationResponse`).

#### fetch:managed-add-on-success

A `@fetch:managed-add-on-success` event is emitted when Konnect managed-cache mode loads the Cloud Gateways add-on as the primary entity. The payload is the managed cache add-on (`ManagedCacheAddOn`). It is not emitted on the legacy partial-only card.

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
