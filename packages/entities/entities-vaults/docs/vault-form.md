# VaultForm.vue

A form component for Vaults.

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

- type: `Object as PropType<KonnectVaultFormConfig | KongManagerVaultFormConfig>`
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
    - Route to return to when canceling creation of an Vault.

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

  - `azureVaultProviderAvailable`
    - type: `boolean`
    - required: `true`
    - default: `undefined`
    - *Specific to Konnect*. Show/hide Azure option.
    - **Note:** This is experimental and not supported by the backend right now

  - `ttl`
    - type: `boolean`
    - required: `true`
    - default: `undefined`
    - Show/hide SupportTTL option.

  - `hcvAppRoleMethodAvailable`
    - type: `boolean`
    - required: `false`
    - default: `undefined`
    - Show/hide approle option and corresponding fields.

  - `hcvCertMethodAvailable`
    - type: `boolean`
    - required: `false`
    - default: `undefined`
    - Show/hide cert option and corresponding fields.

  - `hcvOauth2MethodAvailable`
    - type: `boolean`
    - required: `false`
    - default: `undefined`
    - Show/hide oauth2 option and corresponding fields. 

  - `awsStsEndpointUrlAvailable`
    - type: `boolean`
    - required: `false`
    - default: `undefined`
    - Show/hide STS endpoint url field in AWS Vault Config.

The base konnect or kongManger config.

#### `vaultId`

- type: `String`
- required: `false`
- default: `''`

If showing the `Edit` type form, the ID of the Vault.

### Events

#### error

An `@error` event is emitted when form validation fails. The event payload is the response error.

#### loading

A `@loading` event is emitted when loading state changes. The event payload is a boolean.

#### update

A `@update` event is emitted when the form is saved. The event payload is the Vault object.

### Usage example

Please refer to the [sandbox](../sandbox/pages/VaultListPage.vue). The form is accessible by clicking the `+ New Vault` button or `Edit` action of an existing Vault.

## TypeScript interfaces

TypeScript interfaces [are available here](../src/types/vault-form.ts) and can be directly imported into your host application. The following type interfaces are available for import:

```ts
import type {
  BaseVaultFormConfig,
  KonnectVaultFormConfig,
  KongManagerVaultFormConfig,
  VaultProviders,
  VaultAuthMethods,
  KongVaultConfig,
  AWSVaultConfig,
  GCPVaultConfig,
  HCVVaultConfig,
  HCVVaultConfigPayload,
  VaultPayload,
  VaultStateFields,
  VaultState
} from '@kong-ui-public/entities-vaults'
```
