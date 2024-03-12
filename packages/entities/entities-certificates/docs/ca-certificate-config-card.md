# CACertificateConfigCard.vue

A config card component for CA certificates.

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

[See instructions for installing the `@kong-ui-public/entities-certificates` package.](../README.md#install)

### Props

#### `config`

- type: `Object as PropType<KonnectCACertificateEntityConfig | KongManagerCACertificateEntityConfig>`
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

  - `requestHeaders`:
    - type: `RawAxiosRequestHeaders | AxiosHeaders`
    - required: `false`
    - default: `undefined`
    - Additional headers to send with all Axios requests.

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
    - The ID of the CA Certificate to display the config for

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

An `@fetch:error` event is emitted when the component fails to fetch the CA Certificate. The event payload is the response error.

#### fetch:success

A `@fetch:success` event is emitted when the CA Certificate is successfully fetched. The event payload is the CA Certificate object.

#### loading

A `@loading` event is emitted when loading state changes. The event payload is a boolean.

### Usage example

Please refer to the [sandbox](../sandbox/pages/CACertificateConfigCardPage.vue). The page is accessible by clicking on the row or `View details` button of an existing CACertificate.

## TypeScript interfaces

TypeScript interfaces [are available here](../src/types/certificate-config-card.ts) and can be directly imported into your host application. The following type interfaces are available for import:

```ts
import type {
  CACertificateConfigurationSchema,
  KonnectCertificateEntityConfig,
  KongManagerCertificateEntityConfig,
} from '@kong-ui-public/entities-certificates'
```
