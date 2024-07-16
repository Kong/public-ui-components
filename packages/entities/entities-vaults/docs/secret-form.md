# SecretForm.vue

A form component for Konnect config store secrets. *This component should only be used in Konnect*. 

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

- type: `Object as PropType<KonnectSecretFormConfig>`
- required: `true`
- default: `undefined`
- properties:
  - `app`:
    - type: `'konnect'`
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
    - Route to return to when canceling creation of a secret.

  - `controlPlaneId`:
    - type: `string`
    - required: `true`
    - default: `undefined`
    - Name of the current control plane.

#### `vaultId`

- type: `String`
- required: `true`

Current vault ID.

#### `secretId`

- type: `String`
- required: `false`
- default: `''`

If a valid `secretId` is provided, it will put the form in Edit mode instead of Create.

### Events

#### error

An `@error` event is emitted when form validation fails. The event payload is the response error.

#### loading

A `@loading` event is emitted when loading state changes. The event payload is a boolean.

#### update

A `@update` event is emitted when the form is saved. The event payload is the secret object.

### Usage example

Please refer to the [sandbox](../sandbox/pages/VaultConfigCardPage.vue). The form is accessible by clicking the `+ Store New Secret` button or `Edit` action of an existing secret.

## TypeScript interfaces

TypeScript interfaces [are available here](../src/types/secret-form.ts) and can be directly imported into your host application. The following type interfaces are available for import:

```ts
import type {
  BaseSecretFormConfig,
  KonnectSecretFormConfig,
  SecretStateFields,
  SecretState
} from '@kong-ui-public/entities-vaults'
