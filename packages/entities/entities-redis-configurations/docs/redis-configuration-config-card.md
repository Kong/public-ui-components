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

TypeScript interfaces [are available here](../src/types/redis-confiugration-config.ts) and can be directly imported into your host application. The following type interfaces are available for import:

```ts
import type {
  KonnectRedisConfigurationEntityConfig,
  KongManagerRedisConfigurationEntityConfig,
} from '@kong-ui-public/entities-redis-configurations'
```

## RedisConfigurationConfigCardView

Use `RedisConfigurationConfigCardView` for an already resolved record. It performs no entity, schema or association reads and shares its domain presentation with `RedisConfigurationConfigCard`. The data owner handles loading, errors and retry and mounts the View after the record is available. No Axios provider, request endpoint or control plane ID is required to render it.

```ts
import { RedisConfigurationConfigCardView } from '@kong-ui-public/entities-redis-configurations'
import type { RedisConfigurationConfigCardViewProps } from '@kong-ui-public/entities-redis-configurations'
```

### View props

| Prop | Type | Required / default | Description |
| --- | --- | --- | --- |
| `record` | `Record<string, any>` | Required | Resolved business record; unwrap HTTP envelopes in the data owner. |
| `config` | `EntityConfigCardViewConfig & { cloudAuthAvailable?: boolean }` | `{}` | Optional presentation context. |
| `hideTitle` | `boolean` | `true` | Hide the card title. |

Pass the resolved raw record. The existing `config.kind` discriminator identifies managed-cache add-ons; no separate mode prop is needed. It applies the existing partial flattening, cloud-auth display rules, managed field allowlisting, raw JSON/timestamp preservation and local Terraform transforms. If a page displays both cache and linked-partial segments, its data owner loads those records and owns segment loading. Changing View inputs never requests the other source.

`config.cloudAuthAvailable` selects the supported cloud-authentication display contract and normalization. It is independent of Redis type and cannot be inferred from whether credential fields happen to be present.

See [EntityConfigCardView](../../entities-shared/docs/entity-config-card-view.md) for presentation context, format availability, record updates and sensitive-field/copy behavior. Records and schemas are read without mutation.

### View slots and events

The View accepts title, actions and field-slot overrides with the existing `record`, `row` and `rowValue` parameters. It emits no HTTP loading/success/error events. Use `:key="record.id"` when changing business scope or when a fresh local editor state is required.

### Existing-record example

```vue
<RedisConfigurationConfigCardView
  v-if="record"
  :key="record.id"
  :record="record"
  :config="{ app: 'konnect', cloudAuthAvailable: true }"
/>
```

Existing `RedisConfigurationConfigCard` callers can keep the current request configuration and events. To migrate, upgrade compatible published business/shared packages, pass the existing data owner's resolved record to the View, keep any required schema/association loading in that owner, and remove response-fabrication adapters or duplicate local cards.
