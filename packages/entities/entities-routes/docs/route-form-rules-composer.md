# RouteFormRulesComposer.vue

A form component for route rules in RouteForm.

- [Usage](#usage)
  - [Install](#install)
  - [Props](#props)
  - [Events](#events)
  - [Usage example](#usage-example)

## Usage

### Install

[See instructions for installing the `@kong-ui-public/entities-routes` package.](../README.md#install)

### Props

#### `protocols`

- type: `keyof typeof PROTOCOLS_TO_ROUTE_RULES`
- required: `true`

A string representing the protocols of the route to configure. For possible values, please refer to the `PROTOCOLS_TO_ROUTE_RULES` from the package.

#### `routeFlavors`

- type: `RouteFlavors`
- required: `true`

The route flavors available for configuration.

#### `readonly`

- type: `boolean`
- required: `false`
- default: `false`

Whether the form is read-only.

#### `recordFlavor`

- type: `RouteFlavor`
- required: `false`
- default: `undefined`

The route flavor of the existing record. If provided, the form will prevent user from switching to a different flavor.

#### `showExpressionsModalEntry`

- type: `boolean`
- required: `false`
- default: `false`

Whether to show the entry to the router playground under the Expressions editor.

#### `tooltips`

- type: `{ [RouteFlavor.TRADITIONAL]?: string; [RouteFlavor.EXPRESSIONS]?: string }?`
- required: `false`
- default: `undefined`

Tooltips to show for tabs for each flavor. When there is only one flavor, the tab label and tooltip will not be shown.

### Events

#### `notify`

A `@notify` event is emitted when a Toast is called. The event payload is an object with the following properties:

- `message`:
  - type: `string`
  - The message to display in the Toast.
- `type`:
  - type: `'success' | 'error' | 'warning' | 'info'`
  - The type of Toast to display.

#### `update:payload`

A `@update:payload` event is emitted when the form is updated. The event payload is of the `TypedRouteRulesPayload?` type:

- `type`
  - type: `RouteFlavor`
  - The route flavor of the payload.
- `payload`
  - type: `TraditionalRoutePayload | ExpressionsRoutePayload`
  - The payload body of the form.

### Usage example

Please refer to the [sandbox](../sandbox/pages/RouteRulesComposerPage.vue).
