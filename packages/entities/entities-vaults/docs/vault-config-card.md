# VaultConfigCard.vue

A config card component for Vaults.

- [Requirements](#requirements)
- [Usage](#usage)
  - [Install](#install)
  - [Props](#props)
  - [Events](#events)
  - [Usage example](#usage-example)
- [TypeScript interfaces](#typescript-interfaces)
- [VaultConfigCardView](#vaultconfigcardview)

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

- type: `Object as PropType<KonnectVaultEntityConfig | KongManagerVaultEntityConfig>`
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
    - The ID of the Vault to display the config for

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

An `@fetch:error` event is emitted when the component fails to fetch the vault. The event payload is the response error.

#### fetch:success

A `@fetch:success` event is emitted when the vault is successfully fetched. The event payload is the Vault object.

#### loading

A `@loading` event is emitted when loading state changes. The event payload is a boolean.

### Usage example

Please refer to the [sandbox](../sandbox/pages/VaultConfigCardPage.vue). The page is accessible by clicking on the row or `View details` button of an existing Vault.

## TypeScript interfaces

TypeScript interfaces [are available here](https://github.com/Kong/public-ui-components/blob/main/packages/entities/entities-vaults/src/types/vault-config.ts) and can be directly imported into your host application. The following type interfaces are available for import:

```ts
import type {
 VaultConfigurationSchema,
 KonnectVaultEntityConfig,
 KongManagerVaultEntityConfig,
} from '@kong-ui-public/entities-vaults'
```

## VaultConfigCardView

Use `VaultConfigCardView` for an already resolved record. It performs no entity, schema or association reads and shares its domain presentation with `VaultConfigCard`. The data owner handles loading, errors and retry and mounts the View after the record is available. No Axios provider, request endpoint or control plane ID is required to render it.

```ts
import { VaultConfigCardView } from '@kong-ui-public/entities-vaults'
import type { VaultConfigCardViewProps } from '@kong-ui-public/entities-vaults'
```

### View props

| Prop | Type | Required / default | Description |
| --- | --- | --- | --- |
| `record` | `Record<string, any>` | Required | Resolved business record; unwrap HTTP envelopes in the data owner. |
| `config` | `EntityConfigCardViewConfig & { apiType?: 'gateway' \| 'aiGateway' }` | `{}` | Optional presentation context. |
| `configCardDoc` | `string` | `''` | Documentation button URL. |
| `hideTitle` | `boolean` | `false` | Hide the card title. |

Pass the business API record without pre-mapping it through internal helpers. `config.apiType: 'aiGateway'` enables the existing auth-method-specific HashiCorp field mapping, labels, ordering and AI Gateway format restrictions. HTTP envelope unwrapping remains in the data owner. Sensitive config values stay masked in structured display and all supported code/copy/export formats, including when the generic sensitive-field checkbox is selected.

See [EntityConfigCardView](../../entities-shared/docs/entity-config-card-view.md) for presentation context, format availability, record updates and sensitive-field/copy behavior. Records and schemas are read without mutation.

### View slots and events

The View accepts title, actions and field-slot overrides with the existing `record`, `row` and `rowValue` parameters. It emits no HTTP loading/success/error events. Use `:key="record.id"` when changing business scope or when a fresh local editor state is required.

### Existing-record example

```vue
<VaultConfigCardView
  v-if="record"
  :key="record.id"
  :record="record"
  :config="{ apiType: 'aiGateway' }"
/>
```

Existing `VaultConfigCard` callers can keep the current request configuration and events. To migrate, upgrade compatible published business/shared packages, pass the existing data owner's resolved record to the View, keep any required schema/association loading in that owner, and remove response-fabrication adapters or duplicate local cards.
