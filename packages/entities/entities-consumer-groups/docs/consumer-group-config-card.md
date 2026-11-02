# ConsumerGroupConfigCard.vue

A config card component for consumer groups.

- [Requirements](#requirements)
- [Usage](#usage)
  - [Install](#install)
  - [Props](#props)
  - [Events](#events)
  - [Usage example](#usage-example)
- [TypeScript interfaces](#typescript-interfaces)
- [ConsumerGroupConfigCardView](#consumergroupconfigcardview)

## Requirements

- `vue` and `vue-router` must be initialized in the host application
- `@kong/kongponents` must be added as a dependency in the host application, globally available via the Vue Plugin installation, and the package's style imports must be added in the app entry file. [See here for instructions on installing Kongponents](https://kongponents.konghq.com/#globally-install-all-kongponents).
- `@kong-ui-public/i18n` must be available as a `dependency` in the host application.
- `axios` must be installed as a dependency in the host application

## Usage

### Install

[See instructions for installing the `@kong-ui-public/entities-consumer-groups` package.](../README.md#install)

### Props

#### `config`

- type: `Object as PropType<KonnectConsumerGroupEntityConfig | KongManagerConsumerGroupEntityConfig>`
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
    - The ID of the Consumer Group to display the config for

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

#### fetch:error

An `@fetch:error` event is emitted when the form fails to fetch the Consumer Group. The event payload is the response error.

#### fetch:success

A `@fetch:success` event is emitted when the Consumer Group is successfully fetched. The event payload is the Consumer Group object.

#### loading

A `@loading` event is emitted when loading state changes. The event payload is a boolean.

### Usage example

Please refer to the [sandbox](../sandbox/pages/ConsumerGroupConfigCardPage.vue). The page is accessible by clicking on the row or `View details` button of an existing Consumer Group.

## TypeScript interfaces

TypeScript interfaces [are available here](../src/types/consumer-group-config-card.ts) and can be directly imported into your host application. The following type interfaces are available for import:

```ts
import type {
  ConsumerGroupConfigurationSchema,
  KonnectConsumerGroupEntityConfig,
  KongManagerConsumerGroupEntityConfig,
} from '@kong-ui-public/entities-consumer-groups'
```

## ConsumerGroupConfigCardView

Use `ConsumerGroupConfigCardView` for an already resolved record. It performs no entity, schema or association reads and shares its domain presentation with `ConsumerGroupConfigCard`. The data owner handles loading, errors and retry and mounts the View after the record is available. No Axios provider, request endpoint or control plane ID is required to render it.

```ts
import { ConsumerGroupConfigCardView } from '@kong-ui-public/entities-consumer-groups'
import type { ConsumerGroupConfigCardViewProps } from '@kong-ui-public/entities-consumer-groups'
```

### View props

| Prop | Type | Required / default | Description |
| --- | --- | --- | --- |
| `record` | `Record<string, any>` | Required | Resolved business record; unwrap HTTP envelopes in the data owner. |
| `config` | `EntityConfigCardViewConfig` | `{}` | Optional presentation context. |
| `configCardDoc` | `string` | `''` | Documentation button URL. |
| `hideTitle` | `boolean` | `false` | Hide the card title. |

Pass the resolved consumer group, not an envelope containing `consumer_group`.

See [EntityConfigCardView](../../entities-shared/docs/entity-config-card-view.md) for presentation context, format availability, record updates and sensitive-field/copy behavior. Records and schemas are read without mutation.

### View slots and events

The View accepts title, actions and field-slot overrides with the existing `record`, `row` and `rowValue` parameters. It emits no HTTP loading/success/error events. Use `:key="record.id"` when changing business scope or when a fresh local editor state is required.

### Existing-record example

```vue
<ConsumerGroupConfigCardView
  v-if="record"
  :key="record.id"
  :record="record"
/>
```

Existing `ConsumerGroupConfigCard` callers can keep the current request configuration and events. To migrate, upgrade compatible published business/shared packages, pass the existing data owner's resolved record to the View, keep any required schema/association loading in that owner, and remove response-fabrication adapters or duplicate local cards.
