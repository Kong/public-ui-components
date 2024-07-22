# useTablePreferences

Provides a localStorage setter/getter for storing `KTable` user preferences.

- [Requirements](#requirements)
- [Usage](#usage)
  - [Install](#install)
  - [Usage Example](#usage-example)

## Requirements

Technically this composable can be utilized without Vue; however, normal usage is with `KTable` sourced from `@kong/kongponents`.

Typical Kong UI requirements:

- `vue` and `vue-router` should be initialized in the host application
- `@kong/kongponents` must be available as a `dependency` in the host application and registered globally, along with the Kongponents style import. [See here for instructions on installing Kongponents](https://kongponents.konghq.com/#globally-install-all-kongponents).

## Usage

### Install

Install the package in your host application

```sh
yarn add @kong-ui-public/core
```

### Usage Example

```html
<template>
  <!-- Only showing a partial KTable implementation -->
  <!-- https://kongponents.konghq.com/components/table.html -->
  <KTable
    :data-testid="tableKey"
    :fetcher="fetcher"
    :initial-fetcher-params="userTablePreferences"
    @update:table-preferences="updateTablePreferences"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useTablePreferences } from '@kong-ui-public/core'
import type { UserTablePreferences } from '@kong-ui-public/core'

const tableKey = ref<string>('my-custom-table')
const { getTablePreferences, setTablePreferences } = useTablePreferences()
const userTablePreferences = getTablePreferences(tableKey.value)

const updateTablePreferences = (tablePreferences: UserTablePreferences): void => {
  setTablePreferences(tableKey.value, tablePreferences)
}
</script>
```
