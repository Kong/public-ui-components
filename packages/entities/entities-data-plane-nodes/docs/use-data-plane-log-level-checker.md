# `useDataPlaneLogLevelChecker` composable

A composable that provides utilities to get and set the log level of a Data Plane node.

## Types

### `UseDataPlaneLogLevelCheckerOptions`

The options for the `useDataPlaneLogLevelChecker` composable.

```ts
type UseDataPlaneLogLevelCheckerOptions = {
  getDataPlaneLogLevel: (dataPlaneId: string) => Promise<LogLevel>,
  setDataPlaneLogLevel: (dataPlaneId: string, level: LogLevel, revertAfter: number) => Promise<void>,
  requestExecutor?: <T>(fn: () => Promise<T>) => Promise<T>,
}
```
#### Properties:
- `getDataPlaneLogLevel`: `(dataPlaneId: string) => Promise<LogLevel>` - A function that retrieves the log level of a Data Plane node.
- `setDataPlaneLogLevel`: `(dataPlaneId: string, level: LogLevel, revertAfter: number) => Promise<void>` - A function that sets the log level and revert after time (in seconds) of a Data Plane node.
- `requestExecutor`: `<T>(fn: () => Promise<T>) => Promise<T>` - A scheduler function that executes a request. If not provided, the composable will use the default scheduler (call the function directly without any scheduling). It is recommended to use the `useAsyncScheduler` composable to create a scheduler and pass the `schedule` function to this option.


### `DataPlaneLogLevel`

The type of the composable returned by `checkDataPlaneLogLevel`.

```ts
type DataPlaneLogLevel = {
  currentLogLevel: Ref<LogLevel | null>,
  updateStatus: Ref<'pending' | 'success' | 'error' | 'loading'>,
  updateErrorMessage: Ref<string | null>,
  updateLogLevel: (level: LogLevel, revertAfter: number) => Promise<void>,
}
```

## Usage

### Check the log level of a Data Plane node
1. Get the `checkDataPlaneLogLevel` composable by calling `useDataPlaneLogLevelChecker()`. Please provide the `UseDataPlaneLogLevelCheckerOptions` object as the argument to the composable. E.g.:

```ts
import { useDataPlaneLogLevelChecker, useAsyncScheduler } from '@kong-ui-public/entities-data-plane-nodes'

const scheduler = useAsyncScheduler({ maxConcurrentAsyncs: 10 })

const { checkDataPlaneLogLevel } = useDataPlaneLogLevelChecker({
  getDataPlaneLogLevel: async (dataPlaneId) => {
    // Call the API to get the log level of the Data Plane node
    return 'info'
  },
  setDataPlaneLogLevel: async (dataPlaneId, level, revertAfter) => {
    // Call the API to set the log level of the Data Plane node
  },
  requestExecutor: scheduler.schedule,
})
```

2. Once you have the `checkDataPlaneLogLevel` function, you can call it with the `dataPlaneId` to get the log level information of the specific Data Plane node.

```ts
const { currentLogLevel, updateStatus, updateErrorMessage, updateLogLevel } = checkDataPlaneLogLevel('data-plane-node-id')
```
