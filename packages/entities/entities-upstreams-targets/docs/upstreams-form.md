# UpstreamsForm.vue

A form component to create/edit Upstreams.

- [Requirements](#requirements)
- [Usage](#usage)
  - [Install](#install)
  - [Props](#props)
  - [Events](#events)
  - [Usage example](#usage-example)
- [TypeScript interfaces](#typescript-interfaces)

## Requirements

- `vue` and `vue-router` must be initialized in the host application
- `@kong/kongponents` must be added as a `dependency` in the host application, globally available via the Vue Plugin installation, and the package's style imports must be added in the app entry file. [See here for instructions on installing Kongponents](https://kongponents.konghq.com/#globally-install-all-kongponents).
- `@kong-ui-public/i18n` must be available as a `dependency` in the host application.
- `axios` must be installed as a dependency in the host application

## Usage

### Install

[See instructions for installing the `@kong-ui-public/entities-upstreams-tagrets` package.](../README.md#install)

### Props

#### `config`

- type: `Object as PropType<KonnectUpstreamsFormConfig | KongManagerUpstreamsFormConfig>`
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
    - Route to return to when canceling creation of a Consumer.
  - `stickySessionsAvailable`:
    - type: `boolean`
    - required: `false`
    - default: `false`
    - If `true`, the sticky sessions algorithm is supported.

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

#### `upstreamId`

- type: `string`
- required: `false`
- default: `''`
- If a valid upstreamId is provided, it will put the form in Edit mode instead of Create.

### Events

#### update

A `@update` event is emitted when the form is saved. The event payload has `UpstreamResponse` interface.

#### error

An `@error` event is emitted when the form fails to fetch Upstream data or save Upstream data. The event payload is the response error (interface `AxiosError`).

#### loading

A `@loading` event is emitted when loading state changes. The event payload is a boolean.

### Usage example

Please refer to the [sandbox](../sandbox/pages/UpstreamFormPage.vue). The form is accessible by clicking the `+ New Upstream` button or `Edit` action of an existing Upstream.

## TypeScript interfaces

TypeScript interfaces [are available here](https://github.com/Kong/public-ui-components/blob/main/packages/entities/entities-upstreams-targets/src/types/upstreams-form.ts) and can be directly imported into your host application. The following type interfaces are available for import:

```ts
import type {
 BaseUpstreamsFormConfig,
 KonnectUpstreamsFormConfig,
 KongManagerUpstreamsFormConfig,
 UpstreamAlgorithm,
 UpstreamHash,
 HealthCheckType,
 ActiveHealthCheckHeader,
 ActiveHealthCheck,
 PassiveHealthCheck,
 UpstreamFormFields,
 UpstreamFormState,
 AlgorithmSelectItem,
 HashSelectItem,
 HealthCheckTypeSelectItem,
 MultiselectComposableOptions,
 UpstreamFormPayload,
 UpstreamResponse,
 UpstreamsFormActions,
} from '@kong-ui-public/entities-upstreams-targets'
```
