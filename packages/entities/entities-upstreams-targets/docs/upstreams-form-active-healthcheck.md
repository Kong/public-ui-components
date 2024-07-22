# UpstreamsFormActiveHealthCheck.vue

An Active Health Checks section of form component to create/edit Upstreams.

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
[See all properties](./upstreams-form.md#config)

#### `type`
- type: `HealthCheckType`
- required: `true`

#### `httpPath`
- type: `string`
- required: `true`

#### `timeout`
- type: `string`
- required: `true`

#### `concurrency`
- type: `string`
- required: `true`

#### `httpsSni`
- type: `string`
- required: `true`

#### `verifySsl`
- type: `boolean`
- required: `true`

#### `headers`
- type: `ActiveHealthCheckHeader[]`
- required: `true`

#### `interval`
- type: `string`
- required: `true`

#### `successes`
- type: `string`
- required: `true`

#### `httpStatuses`
- type: `string[]`
- required: `true`

#### `unhealthyInterval`
- type: `string`
- required: `true`

#### `httpFailures`
- type: `string`
- required: `true`

#### `tcpFailures`
- type: `string`
- required: `true`

#### `unhealthyHttpStatuses`
- type: `string[]`
- required: `true`

#### `unhealthyTimeouts`
- type: `string`
- required: `true`

#### `readonly`
[See all details](./upstreams-form-general-info.md#readonly)

### Events

#### update:type
A `@update:type` event is emitted when a value in the type input is changed. It's used for `v-model` binding in parent component. The event payload has `HealthCheckType` type.

#### update:http-path
A `@update:http-path` event is emitted when a value in the httpPath input is changed. It's used for `v-model` binding in parent component. The event payload has `string` type.

#### update:timeout
A `@update:timeout` event is emitted when a value in the timeout input is changed. It's used for `v-model` binding in parent component. The event payload has `string` type.

#### update:concurrency
A `@update:concurrency` event is emitted when a value in the concurrency input is changed. It's used for `v-model` binding in parent component. The event payload has `string` type.

#### update:https-sni
A `@update:https-sni` event is emitted when a value in the httpsSni input is changed. It's used for `v-model` binding in parent component. The event payload has `string` type.

#### update:verify-ssl
A `@update:verify-ssl` event is emitted when a value in the verifySsl input is changed. It's used for `v-model` binding in parent component. The event payload has `boolean` type.

#### update:headers
A `@update:headers` event is emitted when a value in the headers input is changed. It's used for `v-model` binding in parent component. The event payload has `ActiveHealthCheckHeader[]` type.

#### update:interval
A `@update:interval` event is emitted when a value in the interval input is changed. It's used for `v-model` binding in parent component. The event payload has `string` type.

#### update:successes
A `@update:successes` event is emitted when a value in the successes input is changed. It's used for `v-model` binding in parent component. The event payload has `string` type.

#### update:http-statuses
A `@update:http-statuses` event is emitted when a value in the httpStatuses input is changed. It's used for `v-model` binding in parent component. The event payload has `string[]` type.

#### update:unhealthy-interval
A `@update:unhealthy-interval` event is emitted when a value in the unhealthyInterval input is changed. It's used for `v-model` binding in parent component. The event payload has `string` type.

#### update:http-failures
A `@update:http-failures` event is emitted when a value in the httpFailures input is changed. It's used for `v-model` binding in parent component. The event payload has `string` type.

#### update:tcp-failures
A `@update:tcp-failures` event is emitted when a value in the tcpFailures input is changed. It's used for `v-model` binding in parent component. The event payload has `string` type.

#### update:unhealthy-http-statuses
A `@update:unhealthy-http-statuses` event is emitted when a value in the unhealthyHttpStatuses input is changed. It's used for `v-model` binding in parent component. The event payload has `string[]` type.

#### update:unhealthy-timeouts
A `@update:unhealthy-timeouts` event is emitted when a value in the unhealthyTimeouts input is changed. It's used for `v-model` binding in parent component. The event payload has `string` type.

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