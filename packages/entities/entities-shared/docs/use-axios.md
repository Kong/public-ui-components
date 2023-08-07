# useAxios

A composable that exports a shared Axios instance.

- [Usage](#usage)
  - [Install](#install)
  - [Parameters](#parameters)
  - [Import](#import)

## Usage

### Install

[See instructions for installing the `@kong-ui-public/entities-shared` package.](../README.md#install)

### Parameters

#### `options`

- type: `AxiosRequestConfig`
- required: `false`
- default: `{}`

Additional Axios request config settings.

### Import

```html
<script setup lang="ts">
import { useAxios } from '@kong-ui-public/entities-shared'

const { axiosInstance } = useAxios({
  headers: props.config.requestHeaders,
})

const fetcher = async ({ page, pageSize, offset, sortColumnKey, sortColumnOrder, query }) => {
  try {
    const { data: { data: tableData } } = await axiosInstance.get('/path/to/endpoint')

    return {
      data: tableData,
      total: tableData.length,
    }
  } catch (error: any) {
    // handle error
  }
}
</script>
```
