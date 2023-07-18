# useSwrvRequest

> **Note**: This function was previously known as `useRequest` in other Konnect UI projects. The usage is the same.

Provides a wrapper around `swrv` with a sensible default configuration. [See the swrv docs for all available options.](https://docs-swrv.netlify.app/configuration.html)

May be utilized along with [`useSwrvState`](../useSwrvState/)

## Usage

```typescript
import { useSwrvRequest } from '@kong-ui-public/core'
import { ref } from 'vue'

const cacheKey = ref('my-data-cache-key')

const { data: myData, error: myDataError, revalidate: revalidateMyData } = useSwrvRequest<MyDataType>(
  () => cacheKey.value,
  () => {
    return axios.get('/my/data/endpoint').then((response) => {
      // Do things with response

      return response
    })
    .catch((err) => {
      // Error logic
    })
    .finally(() => {
      // Always do this, e.g. disable loading state
    })
  },
  // Pass custom swrv config options
  {
    refreshInterval: 4000,
  }
)
```

### Default config settings

- `revalidateDebounce`: `500`
- `revalidateOnFocus`: `false`
- `dedupingInterval`: `100`

[See the swrv docs for all available options.](https://docs-swrv.netlify.app/configuration.html)
