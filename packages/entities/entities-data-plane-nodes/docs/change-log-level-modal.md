# `ChangeLogLevelModal.vue`

A modal used to temporarily change the log level for a group of Data Plane nodes. The user picks a
target log level and an expiration (TTL, in seconds), after which the nodes revert to their default
log level.

On **Save**, a single batch request is sent to update the log level for all `nodes`:

- Konnect: `POST /v2/control-planes/{controlPlaneId}/nodes/log-level-operations`
- Kong Manager: `POST /debug/cluster/data-planes/log-level-operations`
- body: `{ log_level, ttl, targets: { node_ids } }`

While the request is in flight the Save button is disabled. On success the component emits
[`success`](#events); on failure it renders a danger alert with the error message at the bottom of
the modal.

- [Requirements](#requirements)
- [Usage](#usage)
  - [Props](#props)
  - [Events](#events)
  - [Usage example](#usage-example)

## Requirements

- `vue` must be initialized in the host application
- `@kong/kongponents` must be added as a dependency in the host application, globally available via
  the Vue Plugin installation, and the package's style imports must be added in the app entry file.
  [See here for instructions on installing Kongponents](https://kongponents.konghq.com/#globally-install-all-kongponents).
- `@kong-ui-public/i18n` must be available as a `dependency` in the host application.

## Usage

### Props

#### `visible`

Controls whether the modal is shown. Supports two-way binding via `v-model:visible`.

- type: `boolean`
- required: `false`

#### `config`

The configuration that tells the modal which API to call. A discriminated union on `app`:

- type: `ChangeLogLevelConfig`
- required: `true`
- properties:
  - `app`: `'konnect' | 'kongManager'` - Which product the host application is.
  - `apiBaseUrl`: `string` - The base URL requests are prefixed with.
  - `controlPlaneId`: `string` - Required when `app` is `'konnect'`; the target control plane ID.
  - `axiosRequestConfig`: `AxiosRequestConfig` (optional) - Passed through to the axios instance.

#### `nodes`

The list of Data Plane nodes to change the log level for. Their `id`s are sent as
`targets.node_ids` in the request.

- type: `Array<{ id: string, hostname: string }>`
- required: `true`
- properties:
  - `id`: `string` - The ID of the Data Plane node.
  - `hostname`: `string` - The hostname of the Data Plane node.

### Events

#### `success`

Emitted after the log-level request succeeds. The modal does **not** close itself — the host
application controls visibility via `v-model:visible`.

- payload: none

### Usage example

Please refer to the [sandbox](../sandbox/pages/ChangeLogLevel.vue). The page is accessible by
visiting the `/change-log-level-modal` route in the sandbox.
