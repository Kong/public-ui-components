# PermissionsWrapper

A composable that exports a shared Axios instance.

- [Features](#features)
- [Usage](#usage)
  - [Install](#install)
  - [Props](#props)
  - [Slots](#slots)
  - [Usage example](#usage-example)

## Features

- Hides default slot content until the required `authFunction` is successfully evaluated

## Usage

### Install

[See instructions for installing the `@kong-ui-public/entities-shared` package.](../README.md#install)

### Props

#### `authFunction`

- type: `Function as PropType<() => boolean | Promise<boolean>>`
- required: `true`
- default: `async () => true`

A sync or async function that returns a boolean to determine whether the wrapper should hide or show the default slot content.

#### `forceShow`

- type: `Boolean`
- required: `false`
- default: `false`

A `boolean` to force the default slot content to still be shown once the `authFunction` is evaluated

Useful if you want to display the item but disable it.

### Slots

#### `default`

The default slot content. Also provides `slotProps.isAllowed` which returns the `boolean` value of the evaluated `authFunction`.

### Usage example

```html
<template>
  <!-- Only showing relevant portions -->
  <EntityBaseTable>
    <template #actions="{ row }">
      <PermissionsWrapper :auth-function="() => canEdit(row)">
          <KDropdownItem
            @click="editRow(row)"
          >
            Edit
          </KDropdownItem>
        </PermissionsWrapper>
    </template>
    <template #actions="{ row }">
      <PermissionsWrapper :auth-function="() => canDelete(row)">
          <template #default="{ isAllowed }">
            <KDropdownItem
              :disabled="!isAllowed"
              @click="deleteRow(row)"
            >
              Delete
            </KDropdownItem>
          </template>
        </PermissionsWrapper>
    </template>
  </EntityBaseTable>
</template>

<script setup lang="ts">
import { EntityBaseTable, PermissionsWrapper } from '@kong-ui-public/entities-shared'
import { canUserAccess } from '@kong-ui/konnect-app-shell'

const canEdit = async (row: Record<string, any>): Promise<boolean> => {
  return await canUserAccess({ service: 'konnect', action: '#edit', resourcePath: `services/${row.id}` })
}
</script>
```
