# PluginConfigCard.vue

A config card component for plugins. Configuration section properties will be ordered alphabetically with required fields displayed first, non-required fields with a value displayed second, and all other fields displayed after that.

- [Requirements](#requirements)
- [Usage](#usage)
  - [Install](#install)
  - [Props](#props)
  - [Events](#events)
  - [Adopting `showScopeName`](#adopting-showscopename)
  - [Usage example](#usage-example)
- [TypeScript interfaces](#typescript-interfaces)

## Requirements

- `vue` and `vue-router` must be initialized in the host application
- `@kong/kongponents` must be added as a dependency in the host application, globally available via the Vue Plugin installation, and the package's style imports must be added in the app entry file. [See here for instructions on installing Kongponents](https://kongponents.konghq.com/#globally-install-all-kongponents).
- `@kong-ui-public/i18n` must be available as a `dependency` in the host application.
- `axios` must be installed as a dependency in the host application

## Usage

### Install

[See instructions for installing the `@kong-ui-public/entities-plugins` package.](../README.md#install)

### Props

#### `config`

- type: `Object as PropType<KonnectPluginEntityConfig | KongManagerPluginEntityConfig>`
- required: `true`
- default: `undefined`
- properties:
  - `app`:
    - type: `'konnect' | 'kongManager'`
    - required: `true`
    - default: `undefined`
    - App name.

  - `apiBaseUrl`:
    - type: `string`
    - required: `true`
    - default: `undefined`
    - Base URL for API requests.

  - `axiosRequestConfig`:
    - type: `AxiosRequestConfig`
    - required: `false`
    - default: `undefined`
    - An optional configuration object for the underlying Axios request.

  - `workspace`:
    - type: `string` for Kong Manager, `string | null` for Konnect
    - required: `true` for Kong Manager, `false` for Konnect
    - default: `undefined`
    - Name of the current workspace.

  - `controlPlaneId`:
    - type: `string`
    - required: `true`
    - default: `undefined`
    - *Specific to Konnect*. Name of the current control plane.

  - `entityId`:
    - type: `string`
    - required: `true`
    - default: `''`
    - The ID of the Plugin to display the config for.

  - `pluginType`:
    - type: `string`
    - required: `true`
    - default: `''`
    - The type of Plugin to display the config for.

  - `showScopeName`:
    - type: `boolean`
    - required: `false`
    - default: `false`
    - **KM-2996 rollout gate.** When `true`, each scoped entity row resolves and shows the entity's
      name as a link to its detail page with the id as a subtitle, and the row labels drop their
      "ID" suffix. When `false`, the row shows the bare id as a button that emits
      `navigation-click`. Only takes effect alongside the `showNameAsLink` prop.
      See [Adopting `showScopeName`](#adopting-showscopename).

  - `getServiceViewRoute` / `getRouteViewRoute` / `getConsumerViewRoute` / `getConsumerGroupViewRoute`:
    - type: `(id: string) => RouteLocationRaw`
    - required: `false`
    - default: `undefined`
    - The route for the scoped entity's detail page. Used as the link target when `showScopeName`
      is enabled. When omitted, the row falls back to emitting `navigation-click` instead of
      linking, even with `showScopeName` on.

The base konnect or kongManger config.

#### `showNameAsLink`

- type: `Boolean`
- required: `false`
- default: `false`

Set this value to `true` to render scoped entity rows (service, route, consumer, consumer group,
partials) as interactive links instead of a copyable UUID. Nothing about `showScopeName` takes
effect unless this is also `true`.

#### `configCardDoc`

- type: `String`
- required: `false`
- default: `null`

Set this value to display the documentation button.

#### `hideTitle`

- type: `Boolean`
- required: `false`
- default: `false`

Set this value to `true` to hide the card title.

#### `scopedEntityType`

- type: `String`
- required: `false`
- default: `''`

The type of the entity with which the plugin is associated. Can be one of `'services'`, `'routes'`, `'consumers'` or `consumer_groups`.

#### `scopedEntityId`

- type: `String`
- required: `false`
- default: `''`

The id of the entity with which the plugin is associated.

### Events

#### fetch:error

A `@fetch:error` event is emitted when the component fails to fetch the Plugin. The event payload is the response error.

#### error:fetch-schema

A `@error:fetch-schema` event is emitted when the component fails to fetch the Plugin schema. The event payload is the response error.

#### fetch:success

A `@fetch:success` event is emitted when the Plugin is successfully fetched. The event payload is the Plugin object.

#### loading

A `@loading` event is emitted when loading state changes. The event payload is a boolean.

#### navigation-click

A `@navigation-click` event is emitted when a scoped entity row is clicked and no route was
supplied for it via the config (`getServiceViewRoute` and friends). The payload is
`(id: string, direction: 'route' | 'consumer' | 'consumer_group' | 'service' | 'partial')`.
Hosts that supply the route getters get a real `<router-link>` instead and this event does not
fire for that row.

### Adopting `showScopeName`

`showScopeName` is a temporary rollout gate for KM-2996 and should be wired to your feature flag
service. It lives on the `config` prop rather than an injection, so a value that resolves after
mount still takes effect.

Both apps need three things: the flag, the `showNameAsLink` prop, and the four route getters.

```vue
<template>
  <PluginConfigCard
    :config="config"
    show-name-as-link
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { PluginConfigCard } from '@kong-ui-public/entities-plugins'
import type { KonnectPluginEntityConfig } from '@kong-ui-public/entities-plugins'

// Konnect: your LaunchDarkly wrapper. Kong Manager: whatever gates features there.
const showScopeName = useFeatureFlag('KM-2996-plugin-config-scope-name')

// Keep the config a computed so the card re-renders when the flag resolves.
const config = computed<KonnectPluginEntityConfig>(() => ({
  app: 'konnect',
  apiBaseUrl,
  controlPlaneId,
  entityId: pluginId,
  pluginType,
  showScopeName: showScopeName.value,
  getServiceViewRoute: (id) => ({ name: 'service-detail', params: { id } }),
  getRouteViewRoute: (id) => ({ name: 'route-detail', params: { id } }),
  getConsumerViewRoute: (id) => ({ name: 'consumer-detail', params: { id } }),
  getConsumerGroupViewRoute: (id) => ({ name: 'consumer-group-detail', params: { id } }),
}))
</script>
```

Notes:

- **Build the config as a `computed`, not a plain object.** A static object captures the flag's
  initial (usually `false`) value and never updates.
- **Prefer a flag value that is already resolved when the card mounts.** The name lookups fire once,
  on the plugin fetch. If the flag flips to `true` after that, the rows relabel and render links but
  show ids until the card refetches.
- **`showNameAsLink` is independent and not flagged.** It predates KM-2996 (it was `showIdAsLink`)
  and still controls whether these rows are links at all. With `showScopeName` off, hosts already
  passing it keep the exact previous behavior.
- **Extra API calls when enabled.** With the flag on, the card issues one `GET` per populated scope
  (up to four: `services/{id}`, `routes/{id}`, `consumers/{id}`, `consumer_groups/{id}`). Failures
  surface via `@fetch:error` and the row falls back to showing the id, so a missing read permission
  degrades rather than breaks.
- **Omitting a route getter is a supported half-state.** That row keeps emitting `navigation-click`,
  so you can roll the flag out before every detail route exists.
- **Removing the flag later:** delete `showScopeName` from `BasePluginConfigCardConfig`, drop the
  `scopeNameEnabled` computed in `PluginConfigCard.vue`, and delete the four `*_id` label keys from
  `src/locales/en.json`.

### Usage example

Please refer to the [sandbox](../sandbox/pages/PluginConfigCardPage.vue). The page is accessible by clicking on the row or `View details` button of an existing Plugin.

## TypeScript interfaces

TypeScript interfaces [are available here](https://github.com/Kong/public-ui-components/blob/main/packages/entities/entities-plugins/src/types/plugin-config-card.ts) and can be directly imported into your host application. The following type interfaces are available for import:

```ts
import type {
  PluginConfigurationSchema,
  KonnectPluginEntityConfig,
  KongManagerPluginEntityConfig,
} from '@kong-ui-public/entities-plugins'
```
