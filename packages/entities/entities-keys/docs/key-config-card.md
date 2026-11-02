# KeyConfigCard.vue

A config card component for Keys.

- [Requirements](#requirements)
- [Usage](#usage)
  - [Install](#install)
  - [Props](#props)
  - [Events](#events)
  - [Usage example](#usage-example)
- [TypeScript interfaces](#typescript-interfaces)
- [KeyConfigCardView](#keyconfigcardview)

## Requirements

- `vue` and `vue-router` must be initialized in the host application
- `@kong/kongponents` must be added as a dependency in the host application, globally available via the Vue Plugin installation, and the package's style imports must be added in the app entry file. [See here for instructions on installing Kongponents](https://kongponents.konghq.com/#globally-install-all-kongponents).
- `@kong-ui-public/i18n` must be available as a `dependency` in the host application.
- `axios` must be installed as a dependency in the host application

## Usage

### Install

[See instructions for installing the `@kong-ui-public/entities-keys` package.](../README.md#install)

### Props

#### `config`

- type: `Object as PropType<KonnectKeyEntityConfig | KongManagerKeyEntityConfig>`
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
    - The ID of the Key to display the config for

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

#### `keySetId`

- type: `string | null`
- required: `false`
- default: `null`

Specify the KeySet ID once you want to fetch the key within a KeySet URL scope.

### Events

#### fetch:error

An `@fetch:error` event is emitted when the component fails to fetch the Key. The event payload is the response error.

#### fetch:success

A `@fetch:success` event is emitted when the Key is successfully fetched. The event payload is the Key object.

#### loading

A `@loading` event is emitted when loading state changes. The event payload is a boolean.

#### navigation-click

A `@navigation-click` event is emitted when a user clicks the `key set name` button and the event payload is the entity type (`key-sets`) and the key set id.

### Usage example

Please refer to the [sandbox](../sandbox/pages/KeyConfigCardPage.vue). The page is accessible by clicking on the row or `View details` button of an existing Key.

## TypeScript interfaces

TypeScript interfaces [are available here](https://github.com/Kong/public-ui-components/blob/main/packages/entities/entities-keys/src/types/key-config-card.ts) and can be directly imported into your host application. The following type interfaces are available for import:

```ts
import type {
  KeyConfigurationSchema,
  KonnectKeyEntityConfig,
  KongManagerKeyEntityConfig,
} from '@kong-ui-public/entities-keys'
```

## KeyConfigCardView

Use `KeyConfigCardView` for an already resolved record. It performs no entity, schema or association reads and shares its domain presentation with `KeyConfigCard`. The data owner handles loading, errors and retry and mounts the View after the record is available. No Axios provider, request endpoint or control plane ID is required to render it.

```ts
import { KeyConfigCardView } from '@kong-ui-public/entities-keys'
import type { KeyConfigCardViewProps } from '@kong-ui-public/entities-keys'
```

### View props

| Prop | Type | Required / default | Description |
| --- | --- | --- | --- |
| `record` | `Record<string, any>` | Required | Resolved business record; unwrap HTTP envelopes in the data owner. |
| `config` | `EntityConfigCardViewConfig` | `{}` | Optional presentation context. |
| `configCardDoc` | `string` | `''` | Documentation button URL. |
| `hideTitle` | `boolean` | `false` | Hide the card title. |
| `requestUrl` | `string` | `''` | JSON panel display metadata only; never requested. |
| `keySetId` | `string \| null` | `null` | Optional scoped Key Set ID. |
| `keySetName` | `string` | `undefined` | Resolved name; omission falls back to the Key Set ID. |
| `keySetNameLoading` | `boolean` | `false` | Display the Key Set-name loading indicator. |

JWK/PEM expansion is local and updates with the record. Supply associated Key Set information explicitly; the View never resolves it.

See [EntityConfigCardView](../../entities-shared/docs/entity-config-card-view.md) for presentation context, format availability, record updates and sensitive-field/copy behavior. Records and schemas are read without mutation.

### View slots and events

The View accepts title, actions and field-slot overrides with the existing `record`, `row` and `rowValue` parameters. It emits no HTTP loading/success/error events. The `navigation-click` event supplies the associated ID and `'key-sets'`. Local JWK parsing failures emit `error:parse` with the parsing error. Use `:key="record.id"` when changing business scope or when a fresh local editor state is required.

### Existing-record example

```vue
<KeyConfigCardView
  v-if="record"
  :key="record.id"
  :record="record"
  :key-set-name="keySet?.name"
  :key-set-name-loading="keySetLoading"
/>
```

Existing `KeyConfigCard` callers can keep the current request configuration and events. To migrate, upgrade compatible published business/shared packages, pass the existing data owner's resolved record to the View, keep any required schema/association loading in that owner, and remove response-fabrication adapters or duplicate local cards.
