# RouteConfigCard.vue

A config card component for routes.

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

[See instructions for installing the `@kong-ui-public/entities-routes` package.](../README.md#install)

### Props

#### `config`

- type: `Object as PropType<KonnectRouteEntityConfig | KongManagerRouteEntityConfig>`
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
    - The ID of the Route to display the config for

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

#### `serviceId`

- type: `String`
- required: `false`
- default: `''`

The id of the service with which the route is associated.

### Events

#### fetch:error

An `@fetch:error` event is emitted when the component fails to fetch the route. The event payload is the response error.

#### fetch:success

A `@fetch:success` event is emitted when the route is successfully fetched. The event payload is the Route object.

#### loading

A `@loading` event is emitted when loading state changes. The event payload is a boolean.

#### navigation-click

A `@navigation-click` event is emitted when a user clicks the `service name` button and the event payload is the entity type (`services`) and the service id.

### Usage example

Please refer to the [sandbox](../sandbox/pages/RouteConfigCardPage.vue). The page is accessible by clicking on the row or `View details` button of an existing Route.

## TypeScript interfaces

TypeScript interfaces [are available here](https://github.com/Kong/public-ui-components/blob/main/packages/entities/entities-routes/src/types/route-config-card.ts) and can be directly imported into your host application. The following type interfaces are available for import:

```ts
import type {
  RouteConfigurationSchema,
  KonnectRouteEntityConfig,
  KongManagerRouteEntityConfig,
} from '@kong-ui-public/entities-routes'
