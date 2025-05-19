# RouteForm.vue

A form component for Routes.

- [Requirements](#requirements)
- [Usage](#usage)
  - [Install](#install)
  - [Props](#props)
  - [Slots](#slots)
  - [Events](#events)
  - [Usage example](#usage-example)
- [TypeScript interfaces](#typescript-interfaces)

## Requirements

- `vue` and `vue-router` must be initialized in the host application.
- `@kong/kongponents` must be added as a dependency in the host application, globally available via the Vue Plugin installation, and the package's style imports must be added in the app entry file. [See here for instructions on installing Kongponents](https://kongponents.konghq.com/#globally-install-all-kongponents).
- `@kong-ui-public/i18n` must be available as a `dependency` in the host application.
- `axios` must be installed as a dependency in the host application.

## Usage

### Install

[See instructions for installing the `@kong-ui-public/entities-routes` package.](../README.md#install)

### Props

#### `config`

- type: `Object as PropType<KonnectRouteFormConfig | KongManagerRouteFormConfig>`
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
    - Route to return to when canceling creation of a Route.

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

#### `routeId`

- type: `String`
- required: `false`
- default: `''`

If showing the `Edit` type form, the ID of the Route.

#### `serviceId`

- type: `String`
- required: `false`
- default: `''`

If service is pre-selected, hides service select dropdown.

#### `hideSectionsInfo`

- type: `Boolean`
- required: `false`
- default: `false`

Show/hide `EntityFormSection` component info column.

#### `hideNameField`

- type: `Boolean`
- required: `false`
- default: `false`

Show/hide Route name field. If `true`, `name` field is stripped from payload object.

#### `hideServiceField`

- type: `Boolean`
- required: `false`
- default: `false`

Show/hide Service Select field. Should be used in case of manually adding `service_id` in payload.

#### `routeFlavors` (controls Expressions features)

- type: `RouteFlavors`
- required: `false`
- default: `{ traditional: true }`
- properties:
  - `traditional`:
    - type: `boolean`
    - required: `false`
    - default: `true`
    - Whether to show input components for the traditional route.
  - `expressions`:
    - type: `boolean`
    - required: `false`
    - default: `false`
    - Whether to show input components for the Expressions route. (If true, Expressions features will be enabled for this component.)

#### `configTabTooltips`

- type: `Object as PropType<{ traditional?: string; expressions?: string } | undefined>`
- required: `false`
- default: `undefined`
- properties:
  - `traditional`:
    - type: `string`
    - required: `false`
    - default: `undefined`
    - Text to show in the tooltip of the traditional config tab.

  - `expressions`:
    - type: `string`
    - required: `false`
    - default: `undefined`
    - Text to show in the tooltip of the Expressions config tab.

#### `showExpressionsModalEntry`

- type: `Boolean`
- required: `false`
- default: `false`

Show/hide the Expressions modal entry button.

#### `schema`

- type: `Object`
- required: `false`
- default: `undefined`

The schema object for the form. If provided, the form will not request the schema from the API. Currently only used for the plugin form playground in the sandbox.

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

#### `after-expressions-editor`

Content to be displayed after the Expressions editor.

Slot props:

- `expression`
  - type: `[string, (value: string) => void]`
  - The expression and a function to update the expression. This is useful when slot content is trying to update the expression (e.g., router playground).
- `state`
  - type: `ExpressionsEditorState`
  - The state of the editor.

### Events

#### error

An `@error` event is emitted when form validation fails. The event payload is the response error.

#### loading

A `@loading` event is emitted when loading state changes. The event payload is a boolean.

#### update

A `@update` event is emitted when the form is saved. The event payload is the Route object.

#### model-updated

A `@model-updated` event is emitted when any form value was changed. The event payload is the Route payload object.

#### notify

A `@notify` event is emitted when a Toast is called. The event payload is an object with the following properties:

- `message`:
  - type: `string`
  - The message to display in the Toast.
- `type`:
  - type: `'success' | 'error' | 'warning' | 'info'`
  - The type of Toast to display.

### Usage example

Please refer to the [sandbox](../sandbox/pages/RouteListPage.vue). The form is accessible by clicking the `+ New Route` button or `Edit` action of an existing Route.

## TypeScript interfaces

TypeScript interfaces [are available here](../src/types/route-form.ts) and can be directly imported into your host application. The following type interfaces are available for import:

```ts
import type {
  BaseRouteFormConfig,
  KonnectRouteFormConfig,
  KongManagerRouteFormConfig,
  RoutingRulesEntities,
  RoutingRuleEntity,
  PathHandlingVersion,
  Protocol,
  HeaderFields,
  Methods,
  Method,
  Sources,
  Destinations,
  BaseRouteStateFields,
  TraditionalRouteStateFields,
  ExpressionsRouteStateFields,
  RouteState,
  Headers,
  BaseRoutePayload,
  TraditionalRoutePayload,
  ExpressionsRoutePayload,
  SelectItem
} from '@kong-ui-public/entities-routes'
```
