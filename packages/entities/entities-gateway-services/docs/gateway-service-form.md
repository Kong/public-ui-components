# GatewayServiceForm.vue

A form component for gateway services.

- [Requirements](#requirements)
- [Usage](#usage)
  - [Install](#install)
  - [Props](#props)
  - [Slots](#slots)
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

[See instructions for installing the `@kong-ui-public/entities-gateway-services` package.](../README.md#install)

### Props

#### `config`

- type: `Object as PropType<KonnectGatewayServiceFormConfig | KongManagerGatewayServiceFormConfig>`
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
    - Route to return to when canceling creation of a gateway service.

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

#### `gatewayServiceId`

- type: `String`
- required: `false`
- default: `''`

If showing the `Edit` type form, the ID of the Gateway Service.

#### `hideSectionsInfo`

- type: `Boolean`
- required: `false`
- default: `false`

Show/hide `EntityFormSection` component info column.

### Slots

#### `form-actions`

Content to be displayed instead of the default `Cancel` and `Save` buttons, at the bottom of the form.

Slot props:
- `canSubmit`
  - type: `Boolean`
  - Should the submit button be enabled or disabled.
- `submit`
  - type: `Function`
  - Form submit handler function.
- `cancel`
  - type: `Function`
  - Cancel handler function.

### Events

#### error

An `@error` event is emitted when the form fails to fetch or save a gateway service. The event payload is the response error.

#### loading

A `@loading` event is emitted when loading state changes. The event payload is a boolean.

#### update

A `@update` event is emitted when the form is saved. The event payload is the Gateway Service object.

#### model-updated

A `@model-updated` event is emitted when any form value was changed. The event payload is the Gateway Service payload object.

#### url-valid:success

A `@url-valid:success` event is emitted if url validation passed successfully.

#### url-valid:error

A `@url-valid:error` event is emitted if url validation is failed. The event payload is `string`.

### Usage example

Please refer to the [sandbox](../sandbox/pages/GatewayServiceFormPage.vue). The form is accessible by clicking the `+ New Gateway Service` button or `Edit` action of an existing Gateway Service.

## TypeScript interfaces

TypeScript interfaces [are available here](https://github.com/Kong/public-ui-components/blob/main/packages/entities/entities-gateway-services/src/types/gateway-service-form.ts) and can be directly imported into your host application. The following type interfaces are available for import:

```ts
import type {
  BaseGatewayServiceFormConfig,
  KonnectGatewayServiceFormConfig,
  KongManagerGatewayServiceFormConfig,
} from '@kong-ui-public/entities-gateway-services'
```
