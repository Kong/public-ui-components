# UpstreamsConfigCard.vue

A config card component for Upstream.

- [Requirements](#requirements)
- [Usage](#usage)
  - [Install](#install)
  - [Props](#props)
  - [Events](#events)
  - [Usage example](#usage-example)
- [TypeScript interfaces](#typescript-interfaces)
- [UpstreamsConfigCardView](#upstreamsconfigcardview)

## Requirements

- `vue` and `vue-router` must be initialized in the host application
- `@kong/kongponents` must be added as a dependency in the host application, globally available via the Vue Plugin installation, and the package's style imports must be added in the app entry file. [See here for instructions on installing Kongponents](https://kongponents.konghq.com/#globally-install-all-kongponents).
- `@kong-ui-public/i18n` must be available as a `dependency` in the host application.
- `axios` must be installed as a dependency in the host application

## Usage

### Install

[See instructions for installing the `@kong-ui-public/entities-upstreams-tagrets` package.](../README.md#install)

### Props

#### `config`

- type: `Object as PropType<KonnectUpstreamsEntityConfig | KongManagerUpstreamsEntityConfig>`
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
    - The ID of the Upstream to display the config for

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

An `@fetch:error` event is emitted when the component fails to fetch the upstream. The event payload is the response error.

#### fetch:success

A `@fetch:success` event is emitted when the upstream is successfully fetched. The event payload is the Upstream object.

#### loading

A `@loading` event is emitted when loading state changes. The event payload is a boolean.

### Usage example

Please refer to the [sandbox](../sandbox/pages/UpstreamsConfigCardPage.vue). The page is accessible by clicking on the row or `View details` button of an existing Upstream.

## TypeScript interfaces

TypeScript interfaces [are available here](https://github.com/Kong/public-ui-components/blob/main/packages/entities/entities-upstreams-targets/src/types/upstreams-config.ts) and can be directly imported into your host application. The following type interfaces are available for import:

```ts
import type {
 UpstreamsConfigurationSchema,
 KonnectUpstreamsEntityConfig,
 KongManagerUpstreamsEntityConfig,
} from '@kong-ui-public/entities-upstreams-targets'
```

## UpstreamsConfigCardView

Use `UpstreamsConfigCardView` for an already resolved record. It performs no entity, schema or association reads and shares its domain presentation with `UpstreamsConfigCard`. The data owner handles loading, errors and retry and mounts the View after the record is available. No Axios provider, request endpoint or control plane ID is required to render it.

```ts
import { UpstreamsConfigCardView } from '@kong-ui-public/entities-upstreams-targets'
import type { UpstreamsConfigCardViewProps } from '@kong-ui-public/entities-upstreams-targets'
```

### View props

| Prop | Type | Required / default | Description |
| --- | --- | --- | --- |
| `record` | `Record<string, any>` | Required | Resolved business record; unwrap HTTP envelopes in the data owner. |
| `config` | `EntityConfigCardViewConfig` | `{}` | Optional presentation context. |
| `hideTitle` | `boolean` | `false` | Hide the card title. |

Health-check, hash-field and nested-field presentation are built in. The public View preserves the existing plural `Upstreams` spelling.

See [EntityConfigCardView](../../entities-shared/docs/entity-config-card-view.md) for presentation context, format availability, record updates and sensitive-field/copy behavior. Records and schemas are read without mutation.

### View slots and events

The View accepts title, actions and field-slot overrides with the existing `record`, `row` and `rowValue` parameters. It emits no HTTP loading/success/error events. Use `:key="record.id"` when changing business scope or when a fresh local editor state is required.

### Existing-record example

```vue
<UpstreamsConfigCardView
  v-if="record"
  :key="record.id"
  :record="record"
/>
```

Existing `UpstreamsConfigCard` callers can keep the current request configuration and events. To migrate, upgrade compatible published business/shared packages, pass the existing data owner's resolved record to the View, keep any required schema/association loading in that owner, and remove response-fabrication adapters or duplicate local cards.
