# `useAsyncScheduler.ts`

A composable that provides a scheduler to handle a large number of async operations.

## Types

### `AsyncSchedulerOptions`
Defines the options for the async scheduler. Currently, the only option is `maxConcurrentAsyncs` defines the maximum number of async operations that can be run concurrently.

```ts
type AsyncSchedulerOptions = {
  maxConcurrentAsyncs: number,
}
```

### `AsyncAbortException`
An exception that is thrown when an async operation is canceled.

```ts
class AsyncAbortException extends Error { /* */ }
```

## Usage

### Schedule async operations
1. Get an `AsyncScheduler` instance by calling the `useAsyncScheduler(opt: AsyncSchedulerOptions)` composable.
2. Once you have the `AsyncScheduler` instance, wrap your async operation with the `scheduler.schedule<T>(fn: () => Promise<T>): Promise<T>` method. E.g.:

```ts
import { useAsyncScheduler } from '@kong-ui-public/entities-data-plane-nodes'

const scheduler = useAsyncScheduler({ maxConcurrentAsyncs: 10 })

// Original async function
const result = await fetch(xxx)

// Wrap the async function with the scheduler
const result = await scheduler.schedule(() => fetch(xxx))
```

The `scheduler.schedule` method will ensure that the number of concurrent async operations does not exceed the `maxConcurrentAsyncs` option,
and the async operations are executed in the order they are scheduled.

Please note the instance returned by `useAsyncScheduler` is **NOT** shared between components. If you want to share the scheduler between components,
you should use a global store or pass instance by props to share the scheduler.


### Canceling queued async operations

Sometimes you may want to cancel all async operations that have already been scheduled. You can do this by calling the `scheduler.cancelAll()` method.
Please note that this will not cancel the async operations that are currently running, it will only cancel the operations that are scheduled to run.

```ts
scheduler.cancelAll()
```

All the scheduled async operations will be rejected with an `AsyncAbortException` error after calling `cancelAll()`.
