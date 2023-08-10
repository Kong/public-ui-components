# KeySetForm.vue

A form component for Key Sets.

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

- type: `Object as PropType<KonnectKeySetFormConfig | KongManagerKeySetFormConfig>`
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

  - `cancelRoute`:
    - type: `RouteLocationRaw`
    - required: `true`
    - default: `undefined`
    - Route to return to when canceling creation of a Key Set.

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

The base konnect or kongManger config.

#### `keySetId`

- type: `String`
- required: `false`
- default: `''`

If showing the `Edit` type form, the ID of the Key Set.

### Events

#### error

An `@error` event is emitted when the form fails to fetch or save a Key Set. The event payload is the response error.

#### loading

A `@loading` event is emitted when loading state changes. The event payload is a boolean.

#### update

A `@update` event is emitted when the form is saved. The event payload is the Key Set object.

### Usage example

Please refer to the [sandbox](../sandbox/pages/KeySetFormPage.vue). The form is accessible by clicking the `+ New Set` button or `Edit` action of an existing Key Set.

## TypeScript interfaces

TypeScript interfaces [are available here](https://github.com/Kong/shared-ui-components/blob/main/packages/entities/entities-key-sets/src/types/key-set-form.ts) and can be directly imported into your host application. The following type interfaces are available for import:

```ts
import type {
  KonnectKeySetFormConfig,
  KongManagerKeySetFormConfig,
} from '@kong-ui/entities-key-sets'
```