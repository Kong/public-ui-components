# RedisConfigurationConfigCard.vue

A config card component for Redis Configurations.

- [Requirements](#requirements)
- [Usage](#usage)
  - [Install](#install)
  - [Props](#props)
  - [Events](#events)
  - [Usage example](#usage-example)
- [TypeScript interfaces](#typescript-interfaces)
- [RedisConfigurationConfigCardView](#redisconfigurationconfigcardview)

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

An `@fetch:error` event is emitted when the component fails to fetch the redis configuration (including **404** after a Konnect-managed add-on or linked partial is deleted). Hosts typically check `error.response?.status === 404` to redirect to the list.

#### fetch:success

A `@fetch:success` event is emitted when the Koko redis partial loads (`RedisConfigurationResponse`). Legacy Konnect/Kong Manager cards always emit this. Konnect-managed detail emits it from the partial segment when the add-on is `ready`; the cache segment uses `fetch:managed-add-on-success` for the add-on payload.

#### fetch:managed-add-on-success

A `@fetch:managed-add-on-success` event is emitted when Konnect managed-cache mode loads the Cloud Gateways add-on as the primary entity. The payload is the managed cache add-on (`ManagedCacheAddOn`). It is not emitted on the legacy partial-only card.

### Usage example

Please refer to the [sandbox](../sandbox/pages/RedisConfigurationDetail.vue).

## TypeScript interfaces

TypeScript interfaces [are available here](../src/types/redis-configuration-config.ts) and can be directly imported into your host application. The following type interfaces are available for import:

```ts
import type {
  KonnectRedisConfigurationEntityConfig,
  KongManagerRedisConfigurationEntityConfig,
} from '@kong-ui-public/entities-redis-configurations'
```

## RedisConfigurationConfigCardView

`RedisConfigurationConfigCardView` displays an already loaded Redis configuration record with the same presentation as `RedisConfigurationConfigCard`, without making any requests. The host loads the record, handles loading and errors, and mounts the View once the record is available.

```ts
import { RedisConfigurationConfigCardView } from '@kong-ui-public/entities-redis-configurations'
```

### View props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `record` | `Record<string, any>` | Required | The Redis configuration record, unwrapped from the HTTP response. |
| `config` | `EntityConfigCardViewConfig` | `{}` | Presentation and export context. See [`EntityConfigCardView`](../../entities-shared/docs/entity-config-card-view.md#config). |
| `hideTitle` | `boolean` | `true` | Hide the card title. |
| `cloudAuthAvailable` | `boolean` | `false` | Show Cloud authentication fields of Redis partials. |

Managed cache add-ons and Redis partials are told apart by the record shape, so pass the record as returned by the API.

### View slots and events

The View accepts `title` and `actions` slots. It emits no events.

```vue
<RedisConfigurationConfigCardView
  v-if="record"
  :record="record"
/>
```
