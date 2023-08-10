# KeySetsConfigCard.vue

A config card component for Key Sets.

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

[See instructions for installing the `@kong-ui/entities-key-sets` package.](../README.md#install)

### Props

#### `config`

- type: `Object as PropType<KonnectKeySetEntityConfig | KongManagerKeySetEntityConfig>`
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
    - The ID of the Key Sets to display the config for

The base konnect or kongManger config.

#### `hideTitle`

- type: `Boolean`
- required: `false`
- default: `false`

Set this value to `true` to hide the card title.

### Events

#### fetch:error

An `@fetch:error` event is emitted when the component fails to fetch the Key Sets. The event payload is the response error.

#### fetch:success

A `@fetch:success` event is emitted when the Key Sets is successfully fetched. The event payload is the Key Sets object.

#### loading

A `@loading` event is emitted when loading state changes. The event payload is a boolean.

#### copy:success

A `@copy:success` event is emitted when a user clicks the `Copy JSON` button and the JSON object is copied successfully.

### Usage example

Please refer to the [sandbox](../sandbox/pages/KeySetConfigCardPage.vue). The page is accessible by clicking on the row or `View details` button of an existing Ke Sets.

## TypeScript interfaces

TypeScript interfaces [are available here](https://github.com/Kong/shared-ui-components/blob/main/packages/entities/entities-key-sets/src/types/key-set-config-card.ts) and can be directly imported into your host application. The following type interfaces are available for import:

```ts
import type {
  KeySetConfigurationSchema,
  KonnectKeySetEntityConfig,
  KongManagerKeySetEntityConfig,
} from '@kong-ui/entities-key-sets'
```
