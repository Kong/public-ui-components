# `ChangeLogLevelModal.vue`

A modal used to temporarily change the log level for a group of Data Plane nodes. The user picks a
target log level and an expiration (TTL, in seconds), after which the nodes revert to their default
log level.

The modal has two stages:

**1. Edit** — On **Save**, a single batch request creates a log-level operation for all `nodes`:

- Konnect: `POST /v2/control-planes/{controlPlaneId}/nodes/log-level-operations`
- Kong Manager: `POST /debug/cluster/data-planes/log-level-operations`
- body: `{ log_level, ttl, targets: { node_ids } }` → response: `{ id }`

While the request is in flight the Save button is disabled. On success the component emits
[`success`](#events) and switches to the status stage; on failure it renders a danger alert with the
error message at the bottom of the modal.

**2. Status** — After a successful Save the modal polls the operation's results endpoint every 2
seconds until every node has settled (no status is `in_progress`), showing a per-node status table:

- Konnect: `GET /v2/control-planes/{controlPlaneId}/nodes/log-level-operations/{id}/results`
- Kong Manager: `GET /debug/cluster/data-planes/log-level-operations/{id}/results`
- response: `{ data: Array<{ node_id, status }> }` where `status` is one of `in_progress`, `applied`,
  `reverted`, `superseded`, `failed`, `unsupported`.

Each row's Node host links to the node's detail page in a new tab when `getNodeDetailRoute` is
provided (otherwise it renders as plain text). Polling retries every 2 seconds even if a poll fails,
and stops once every node has settled. Closing the modal does **not** stop polling — a still-running
operation keeps polling in the background and is stopped (and the form reset) the next time the modal
is opened, or when the component is unmounted. Cancel, the close icon, and the **Done** button all
emit [`close`](#events).

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

#### `getNodeDetailRoute`

A function that returns the URL of a node's detail page, given its ID. When provided, each Node host
in the status table links to it (opened in a new tab) and must be a valid absolute URL. When omitted,
the Node host is rendered as plain text.

- type: `(nodeId: string) => string`
- required: `false`

### Events

#### `success`

Emitted when the log-level operation is created (the POST succeeds). The modal does **not** close
itself — it switches to the status stage and starts polling.

- payload: none

#### `close`

Emitted when the user dismisses the modal (Cancel, the close icon, or Done). The modal does **not**
change its own visibility — the host must close it, typically by setting `v-model:visible` to `false`
in response to this event.

- payload: none

#### `node-error`

Emitted during polling the first time a node's status becomes `failed` or `unsupported`. Emitted at
most once per node per operation.

- payload: `{ id: string, hostname: string, status: 'failed' | 'unsupported' }`

### Usage example

Please refer to the [sandbox](../sandbox/pages/ChangeLogLevel.vue). The page is accessible by
visiting the `/change-log-level-modal` route in the sandbox.
