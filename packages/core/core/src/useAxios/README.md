# useAxios

Provides a base `axios` instance to utilize for requests within your host application or component library.

A host application or component can provide a base axios instance factory to utilize by calling `app.provide('get-axios-instance', axiosFactoryFunction)`.

## Example

### Using the axios instance as-is

```typescript
import { useAxios } from '@kong-ui-public/core'

const { getAxiosInstance } = useAxios()

// **Must** be called at the root of the `script setup` block, optionally passing in custom `AxiosRequestConfig` options
const axiosInstance = getAxiosInstance()

const fetchData = async (): Promise<void> => {
  try {
      const { data } = await axiosInstance.get('/api/endpoint')
  } catch (error: any) {
    // Handle errors
  }
}
```


### Providing a base axios instance factory

```typescript
const createCustomAxiosInstance = (options: AxiosRequestConfig = {}): AxiosInstance => {
  // Create a base axios instance with a bound refresh interceptor
  const customAxiosInstance = axios.create({
    withCredentials: true,
    timeout: 30000,
    ...options,
  })

  // Import a custom error interceptor
  const { refreshInterceptor } = useInterceptor()
  // Bind a custom error interceptor
  customAxiosInstance.interceptors.response.use((res) => res, (error: AxiosError) => refreshInterceptor(customAxiosInstance, error))

  // Return the axios instance
  return customAxiosInstance
}

// Provide the base axios instance generator to all children
app.provide<(options?: AxiosRequestConfig) => AxiosInstance>('get-axios-instance', createCustomAxiosInstance)
```
