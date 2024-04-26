# `ChangeLogLevelModal.vue`

A modal used to change the log level for a group of Data Plane nodes.

- [Requirements](#requirements)
- [Usage](#usage)
  - [Install](#install)
  - [Props](#props)
  - [Usage example](#usage-example)

## Requirements

- `vue` must be initialized in the host application
- `@kong/kongponents` must be added as a dependency in the host application, globally available via the Vue Plugin installation, and the package's style imports must be added in the app entry file. [See here for instructions on installing Kongponents](https://kongponents.konghq.com/#globally-install-all-kongponents).
- `@kong-ui-public/i18n` must be available as a `dependency` in the host application.

## Usage

### Install
[See instructions for installing the `@kong-ui-public/entities-data-plane-nodes` package.](../README.md#install)

### Props

#### `instanceList`

The list of Data Plane nodes to change the log level for. All instances will be displayed in the modal as a list,
and the log level will be changed for all instances when the form is submitted. For data plane node that doesn't
have the capability to change the log level, the log level will not be changed and rendered as "unsupported".

- type: `Array<Pick<DataPlaneNodeCommon, 'id' | 'hostname'> & { hasDLLCapability?: boolean }>`
- required: `true`
- properties:
  - `id`: `string` - The ID of the Data Plane node.
  - `hostname`: `string` - The hostname of the Data Plane node.
  - `hasDLLCapability`: `boolean` - Whether the Data Plane node has the Dynamic Log Level capability. If not provided, the capability will be assumed to be `true`.

#### `initialLogLevel`

The initial log level to display in the form. This should be the log level that is currently set for all instances in the `instanceList`.
We recommend providing the log level as a prop to ensure that the modal can display the correct log level for all instances in first render.
If log level of some instance is not provided, the modal will raise a request to retrieve the log level of that instance.

- type: `Map<string /* dataPlaneNodeId */, LogLevel>`
- required: `true`

#### `requests`

- required: `true`

An object containing the requests infrastructure to be used by the modal. The object should contain the following properties:

- `scheduler`: The scheduler to be used by the modal to handle large number of async requests. Use the `useAsyncScheduler` composable internally. Please refer to the [composables documentation](./use-async-scheduler.md) for more information.
  - type: `AsyncScheduler | AsyncSchedulerOptions | null`
  - default: `{ maxConcurrentAsyncs: 10 }`
  - required: `false`
  
- `getDataPlaneLogLevel`: The function to be used to retrieve the log level of a Data Plane node.
  - type: `(dataPlaneNodeId: string) => Promise<LogLevel>`
  - required: `true`

- `setDataPlaneLogLevel`: The function to be used to set the log level of a Data Plane node.
  - type: `(dataPlaneNodeIdstring, logLevel: LogLevel, revertAfter: number) => Promise<void>`
  - required: `true`

### Usage example

Please refer to the [sandbox](../sandbox/pages/ChangeLogLevel.vue). The page is accessible by visiting `/change-log-level-modal` route in the sandbox.

