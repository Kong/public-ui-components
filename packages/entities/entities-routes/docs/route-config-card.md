# RouteConfigCard.vue

A config card component for routes.

- [Requirements](#requirements)
- [Usage](#usage)
  - [Install](#install)
  - [Props](#props)
  - [Events](#events)
  - [Usage example](#usage-example)
- [TypeScript interfaces](#typescript-interfaces)
- [RouteConfigCardView](#routeconfigcardview)

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

  - `axiosRequestConfig`:
    - type: `AxiosRequestConfig`
    - required: `false`
    - default: `undefined`
    - An optional configuration object for the underlying Axios request.

  - `workspace`:
    - type: `string` for Kong Manager, `string | null` for Konnect
    - required: `true` for Kong Manager, `false` for Konnect
    - default: `undefined`
    - Name of the current workspace.

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
```

## RouteConfigCardView

Use `RouteConfigCardView` for an already resolved record. It performs no entity, schema or association reads and shares its domain presentation with `RouteConfigCard`. The data owner handles loading, errors and retry and mounts the View after the record is available. No Axios provider, request endpoint or control plane ID is required to render it.

```ts
import { RouteConfigCardView } from '@kong-ui-public/entities-routes'
import type { RouteConfigCardViewProps } from '@kong-ui-public/entities-routes'
```

### View props

| Prop | Type | Required / default | Description |
| --- | --- | --- | --- |
| `record` | `Record<string, any>` | Required | Resolved business record; unwrap HTTP envelopes in the data owner. |
| `config` | `EntityConfigCardViewConfig` | `{}` | Optional presentation context. |
| `configCardDoc` | `string` | `''` | Documentation button URL. |
| `hideTitle` | `boolean` | `false` | Hide the card title. |
| `service` | `{ id: string, name?: string, loading?: boolean }` | `undefined` | Resolved association display state. Omission displays the ID from the record. |

Supply the associated service name or loading state explicitly. The View never resolves a service.

See [EntityConfigCardView](../../entities-shared/docs/entity-config-card-view.md) for presentation context, format availability, record updates and sensitive-field/copy behavior. Records and schemas are read without mutation.

### View slots and events

The View accepts title, actions and field-slot overrides with the existing `record`, `row` and `rowValue` parameters. It emits no HTTP loading/success/error events. The `navigation-click` event supplies the associated ID and `'services'`. Use `:key="record.id"` when changing business scope or when a fresh local editor state is required.

### Existing-record example

```vue
<RouteConfigCardView
  v-if="record"
  :key="record.id"
  :record="record"
  :service="record.service ? { id: record.service.id, name: service?.name, loading: serviceLoading } : undefined"
/>
```

Existing `RouteConfigCard` callers can keep the current request configuration and events. To migrate, upgrade compatible published business/shared packages, pass the existing data owner's resolved record to the View, keep any required schema/association loading in that owner, and remove response-fabrication adapters or duplicate local cards.
