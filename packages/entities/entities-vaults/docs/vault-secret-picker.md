# VaultSecretPicker.vue

A picker component for selecting a vault secret reference.

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

- type: `Object as PropType<KonnectBaseFormConfig | KongManagerBaseFormConfig>`
- required: `true`
- default: `undefined`

The base Konnect or Kong Manager config object.

#### `setup`

- type: `string | false`
- required: `false`
- default: `false`

Pre-selected vault prefix. When set to a non-empty string, the picker skips the vault selection step and uses this value as the vault prefix.

#### `title`

- type: `string`
- required: `false`
- default: `undefined`

Custom title displayed in the picker modal header.

#### `proceedButtonText`

- type: `string`
- required: `false`
- default: `undefined`

Custom label for the confirm/proceed button.

#### `additionalDisabled`

- type: `boolean`
- required: `false`
- default: `false`

When `true`, the proceed button is disabled regardless of the current selection state.

#### `allowedProviders`

- type: `VaultProviders[]`
- required: `false`
- default: `undefined`

Restricts the vault list to only the specified providers. When `undefined`, all providers except `azure-certs` are shown.

#### `showSecretKey`

- type: `boolean`
- required: `false`
- default: `true`

Whether to show the optional secret key input field. Set to `false` when the consumer only needs a vault-level reference (e.g. Azure Key Vault Certificates, where the key segment is determined server-side).

### Events

#### proceed

A `@proceed` event is emitted when the user confirms their selection. The event payload is the resulting vault secret reference string (e.g. `{vault://my-vault/my-secret/my-key}`).

#### cancel

A `@cancel` event is emitted when the user dismisses the picker without making a selection.

### Usage example

Please refer to the [sandbox](../sandbox/pages/VaultSecretPickerPage.vue).

## TypeScript interfaces

TypeScript interfaces [are available here](../src/types/vault-form.ts) and can be directly imported into your host application. The following type interfaces are available for import:

```ts
import type {
  VaultProviders,
} from '@kong-ui-public/entities-vaults'
```
