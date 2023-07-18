# useSwrvState

Provides a way to map various `useSwrv` signals into a single enum value.  Intended for use with `useSWRV`, or a wrapper like `useRequest`.

## Usage

```ts
const { response, error, isValidating } = composables.useRequest(...)

const { state, swrvState: STATE } = useSwrvState(raw, error, isValidating)

const isLoading = computed(() => STATE.PENDING === state.value)
```

Or, with a custom `hasData` function that ensures `state` is `SUCCESS_HAS_DATA` if a non-standard `status` key is `'ok'` in the result:

```ts
const { response, error, isValidating } = composables.useRequest(...)

const { state, swrvState: STATE } = useSwrvState(raw, error, isValidating, (response: any) => response?.status === 'ok')

const isLoading = computed(() => STATE.PENDING === state.value)
```
