# PluginCatalog.vue

A grid or list of plugins to pick from, with a group filter sidebar and a search box.

- [Props](#props)
- [Models](#models)
- [Events](#events)

## Props

`PluginCatalog` takes the same `config`, permission (`can*`), `customPluginSupport`, `availableOnServer`, `ignoredPlugins`, `disabledPlugins` and `highlightedPluginIds` props as [PluginSelect](./plugin-select.md#props).

## Models

Both filters work on their own when left unbound. Bind them to open the catalog pre-filtered, or to keep the filters in sync with something else such as the URL.

### `v-model:groups`

- type: `PluginCatalogFilterGroup[]` (any `PluginGroup` value, or `'Featured'`)
- default: `[]`

The ticked groups in the filter sidebar. Several groups can be selected at once. Results keep the sidebar order whatever order the array is in. Values that are not a sidebar group are ignored.

### `v-model:search`

- type: `string`
- default: `''`

The text in the search box. Plugins are matched by name, and by id prefix.

### Example

Open the catalog with Authentication and Security ticked:

```vue
<template>
  <PluginCatalog
    v-model:groups="groups"
    v-model:search="search"
    :config="config"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { PluginCatalog, type PluginCatalogFilterGroup } from '@kong-ui-public/entities-plugins'
import { PluginGroup } from '@kong-ui-public/entities-plugins-metadata'

const groups = ref<PluginCatalogFilterGroup[]>([PluginGroup.AUTHENTICATION, PluginGroup.SECURITY])
const search = ref('')
</script>
```

> Bind with `v-model`, not a one-way `:groups`. With a one-way prop the catalog emits `update:groups` but keeps showing the value it was given, so the checkboxes do not respond.

## Events

The same `plugin-clicked`, `loading` and `delete-custom:success` events as [PluginSelect](./plugin-select.md#events), plus `update:groups` and `update:search` for the models.
