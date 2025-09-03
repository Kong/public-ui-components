# AppSidebar.vue

A Kong UI dynamic sidebar component.

> **IMPORTANT**
>
> It is **highly** recommended to utilize the `AppLayout.vue` component which provides an integrated navbar and sidebar instead of utilizing this component on its own.

- [Features](#features)
- [Requirements](#requirements)
- [Usage](#usage)
  - [Install](#install)
- [`AppSidebar.vue`](#appsidebarvue-1)
  - [Sidebar Icons](#sidebar-icons)
  - [Props](#props)
  - [Slots](#slots)
  - [Events](#events)
  - [Mobile sidebar](#mobile-sidebar)
  - [Usage example](#usage-example)
- [`SidebarToggle.vue`](#sidebartogglevue)
  - [Props ](#props-1)
  - [Events ](#events-1)
  - [Mobile usage example](#mobile-usage-example)
- [CSS Variables](#css-variables)
  - [CSS variable example](#css-variable-example)
- [TypeScript interfaces](#typescript-interfaces)

## Features

- Reactive updates based on `prop` value changes :rocket:
- Completely customizable L1 and L2 navigation items
- Navigate via `<router-link>` in your host application, or provide regular URLs :link:
- Slottable `header` area for displaying the host application logo
- Included `SidebarToggle.vue` component utilized separately in the Navbar to toggle the sidebar's visibility on mobile :sparkles:

## Requirements

- `vue` and `vue-router` must be initialized in the host application
- `@kong/kongponents` must be available as a `dependency` in the host application, along with the package's style imports. [See here for instructions on installing Kongponents](https://kongponents.konghq.com/#globally-install-all-kongponents). Specifically, the following Kongponents must be available:
  - `KDropdownItem`
  - `KDropdown`
  - `KTooltip`
- The sidebar is set to `position: fixed` and is expected to render at 100% of the viewport height. This means your Navbar, etc. should never be placed above the sidebar unless on mobile.
- If L2 sidebar items have required `route.params` in their route, they must be properly declared in the `item.to` property. Example:

    ```ts
    // Note: `currentRoute` equates to router.currentRoute and must be passed in to the consuming app's route generator
    {
      name: 'Runtime Manager',
      key: 'runtime-manager',
      to: { name: 'runtime-manager' },
      // Require the 'runtime-manager' page to be active and expanded to render the L2 items
      items: active('runtime-manager') && !!String(currentRoute?.params.control_plane_id || '') && [
        {
          name: 'Runtime Instances',
          to: {
            name: 'runtime-instances',
            // Required route params MUST be declared
            params: {
              control_plane_id: currentRoute?.params.control_plane_id
            }
          },
        },
      ],
    },
    ```

## Usage

### Install

[See instructions for installing the `@kong-ui-public/app-layout` package.](../README.md#install)

## `AppSidebar.vue`

You will likely want to utilize a wrapper component in your application to generate the dynamic sidebar items, so import the `AppSidebar` component and the package styles into your wrapper component.

You will also need to utilize a factory function (e.g. a composable) in order to generate and update your sidebar menu items.

### Sidebar Icons

Each primary SidebarItem `key` generates a `sidebar-icon-{key}` slot in the `AppSidebar`, and a corresponding slot in the `AppLayout` component in order to slot in sidebar icons from `@kong/icons`.

```html
<template>
  <AppLayout :sidebar-top-items="sidebarItemsTop">
    <template #sidebar-icon-overview>
      <OverviewIcon :size="KUI_ICON_SIZE_40" />
    </template>
  </AppLayout>
</template>

<script setup lang="ts">
import { OverviewIcon } from '@kong/icons'
import { KUI_ICON_SIZE_40 } from '@kong/design-tokens'

const sidebarItemsTop = [
  {
    key: 'overview',
    name: 'Overview',
    to: '/sidebar/?overview',
  },
]
</script>
```

### Props

#### `topItems`

- type: `Array as PropType<SidebarPrimaryItem[]>`
- required: `false`
- default: `[]`

An array of `SidebarPrimaryItem` objects to display in the top navigation list (above the divider).

#### `bottomItems`

- type: `Array as PropType<SidebarPrimaryItem[]>`
- required: `false`
- default: `[]`

An array of `SidebarPrimaryItem` objects to display in the bottom navigation list (below the divider).

#### `groupConfig`

- type: Object as PropType<GroupConfigMap>
- default: `() => ({})`

A map of sidebar group config objects to customize the group's label, collapsibility, etc.

```ts
// GroupConfig
{
  label: string
  collapsible?: boolean // whether or not the group can be collapsed
  collapsed?: boolean // initial collapse state of the group
}
// GroupConfigMap
{
  [key: string]: GroupConfig
}
```

#### `headerHeight`

- type: `number`
- required: `false`
- default: `60`

The height of the sidebar `header` slot, in pixels.

The `headerHeight` should be set to the same height as the host application's navbar element, if applicable.

#### `topOffset`

- type: `number`
- required: `false`
- default: `0`

The number of pixels to offset the sidebar from the top of the viewport. Typically, the default of `0` should be used.

Useful if you're showing a full-width notification above the navbar and need to offset the top of the sidebar as well.

#### `zIndex`

- type: `number`
- required: `false`
- default: `2`

Set the `z-index` of the fixed sidebar.

#### `open`

- type: `boolean`
- required: `false`
- default: `false`

Set to `true` when the mobile sidebar should be open.

#### `mobileEnabled`

- type: `boolean`
- required: `false`
- default: `false`

Set to `true` to enable the sidebar from being automatically hidden off-screen on mobile (requiring you to utilize the `SidebarToggle.vue` component to hide/show the sidebar).

#### `mobileTopOffset`

- type: `number`
- required: `false`
- default: `0`

The number of pixels to offset the sidebar from the top on mobile (viewport width less than `768px`). The `mobileTopOffset` should be set to the same height as the host application's navbar element, if applicable.

When omitted, or the browser viewport is `768px` or greater, the sidebar has a `top` offset of `0px`.

This is useful when your app has a navbar on mobile that appears above the sidebar.

#### `mobileHeaderVisible`

- type: `boolean`
- required: `false`
- default: `false`

Used to determine whether to show or hide the `header` slot on mobile. The `header` slot is hidden by default on mobile.

This is useful if your mobile navbar already displays the app logo.

If you still want to show the sidebar `header` slot even on mobile, set `mobileHeaderVisible` to `true`.

#### `mobileCloseDelay`

- type: `number`
- required: `false`
- default: `350`

The delay, in milliseconds, to wait before automatically closing the mobile sidebar when an `item` is clicked.

#### `mobileOverlay`

- type: `boolean`
- required: `false`
- default: `true`

Show a fixed overlay over the body content when the mobile sidebar is open. To disable the overlay, set to `false`.

#### `mobileOverlayZIndex`

- type: `number`
- required: `false`
- default: `1`

Set the `z-index` of the overlay that is shown behind the mobile sidebar, over the content, when the sidebar is open.

#### `mobileOverlayCloseOnClick`

- type: `boolean`
- required: `false`
- default: `true`

Close the mobile sidebar when a user clicks on the sidebar overlay.

### Slots

#### `header`

Utilize the `header` slot to inject your application's logo into the top of the sidebar, likely aligned with the nav, above the `top` slot.

#### `top`

Utilize the `top` slot to inject additional UI into the top of the sidebar, below the `header` slot, above the `topItems`.

#### `footer`

Utilize the `footer` slot to inject content into the fixed area at the bottom of the sidebar, below the `bottomItems`.

### Events

#### `click`

A `@click` event is emitted whenever an `item` in the sidebar is clicked.

The `click` event emits a payload of the `item` that was clicked, along with its attributes and children, if applicable.

#### `toggle`

A `@toggle` event is emitted whenever the sidebar is opened or closed.

The `toggle` event emits a payload of a `boolean` to indicate if the sidebar is open.

### Mobile sidebar

To utilize the mobile version of the sidebar included in the component, you must set the `mobileEnabled` prop to `true` and utilize the `SidebarToggle.vue` component. [Examples can be found below](#sidebartogglevue).

The host application **must** handle closing the mobile sidebar when the route changes from a navigation event that does _not_ originate from clicking an item within the sidebar itself. Here's an example:

```ts
import { ref, watch } from 'vue'
import composables from './composables'

const route = composables.useRoute()
const mobileSidebarOpen = ref<boolean>(false)

watch(() => route.path, (newPath, oldPath) => {
  // If the path didn't change, there's no need to refresh the nav
  if (newPath !== oldPath) {
    // Close the mobile sidebar if it's open
    if (mobileSidebarOpen.value) {
      mobileSidebarOpen.value = false
    }
  }
})
```

### Usage example

<details>

<summary>:sparkles: Click to view the expanded usage example :sparkles:</summary>

#### `LayoutWrapper.vue`

> Note: This example disables the mobile sidebar for simplicity via the `mobile-enabled` prop. If your application wants to enable the mobile-friendly sidebar (recommended), [view the mobile usage example below](#mobile-usage-example).

```html
<template>
  <AppSidebar
    :header-height="60"
    :top-items="topItems"
    :bottom-items="bottomItems"
    :header-height="60"
    @click="activateSidebarItem"
  >
    <template #header>
      <div class="d-flex w-100 align-items-center">
        <router-link :to="{ name: 'home' }">
          <img src="my-logo.svg" />
        </router-link>
      </div>
    </template>
  </AppSidebar>
</template>

<script setup lang="ts">
import { watch, onBeforeMount } from 'vue'
// AppSidebar Component and types
import { AppSidebar, SidebarPrimaryItem, SidebarSecondaryItem } from '@kong-ui-public/app-layout'
import { RouteRecordRedirectOption, useRoute, useRouter } from 'vue-router'
import useSidebar from '../composables/useSidebar'
// Component styles
import '@kong-ui-public/app-layout/dist/style.css'

const { updateMenu, topItems, bottomItems } = composables.useSidebar()
const router = useRouter()
const route = useRoute()

// Update the sidebar menu when the route.path changes
watch(
  () => route.path,
  (newPath, oldPath) => {
    // If the path didn't change, there's no need to refresh the nav
    if (newPath !== oldPath) {
      // Important: Update up the menu to properly render the sidebar items on route change
      updateMenu(route)
    }
  },
)

const activateSidebarItem = (item: SidebarPrimaryItem | SidebarSecondaryItem) => {
  if (typeof item?.to === 'object') {
    try {
      // Try to resolve the route based on the `item.to` property.
      // If unsuccessful, the catch will fire and we will fallback to allowing the `route.path` watcher handle the update
      const clickedRoute = router.resolve(item.to)

      // Get the full clickedRoute route config (to check its `redirect` property)
      const redirect: RouteRecordRedirectOption | undefined = router.getRoutes().find(route => route.name === clickedRoute.name)?.redirect

      let shouldUpdateMenu = true

      if (typeof redirect === 'object') {
        // If `redirect` is an object and the clickedRoute.name is the same as the redirect.name, return false to prevent updating the menu
        shouldUpdateMenu = (redirect as Record<string, any>).name && (redirect as Record<string, any>).name !== router.currentRoute.value.name
      } else if (typeof redirect === 'string') {
        // If `redirect` is a string and the clickedRoute.name is the same as the redirect (string, which is likely the route name), return false to prevent updating the menu
        shouldUpdateMenu = redirect !== router.currentRoute.value.name
      }

      // If a redirect property exists
      if (shouldUpdateMenu) {
        // Pass true here to allow for the route change to still be evaluated
        updateMenu(clickedRoute)
      }
    } catch (err) {
      // do nothing, fallback to the `route.path` watcher to update the menu
    }
  }
}

onBeforeMount(() => {
  updateMenu(route)
})
</script>
```

#### `useSidebar.ts`

```ts
import { ref } from 'vue'
import { SidebarPrimaryItem } from '@kong-ui-public/app-layout'
import { RouteLocationNormalizedLoaded } from 'vue-router'

export const useSidebar = () => {
  const topItems = ref<SidebarPrimaryItem[]>([])
  const bottomItems = ref<SidebarPrimaryItem[]>([])

  const updateMenu = (currentRoute?: RouteLocationNormalizedLoaded) => {
    // Determine if the sidebar item is active if any matched route.name evaluates to the `routeName` string passed
    const active = (routeName: string): boolean => !!currentRoute?.matched.some(({ name }) => name === routeName)

    topItems.value = [
      {
        name: 'Organizations',
        key: 'organizations',
        to: { name: 'organizations' },
        active: active('root-organizations'), // L1 active() name must point to the root parent
      },
      {
        name: 'Users',
        key: 'users',
        to: { name: 'users' },
        active: active('root-users'), // L1 active() name must point to the root parent
      },
      {
        name: 'Control Planes',
        key: 'control-planes',
        to: { name: 'control-planes' },
        active: active('root-control-planes'), // L1 active() name must point to the root parent
      },
    ]
  }

  return {
    updateMenu,
    topItems,
    bottomItems,
  }
}
```

</details>

## `SidebarToggle.vue`

This package also exports a `SidebarToggle.vue` component that should be utilized in the host application's navbar in order to hide/show the Sidebar on mobile (under `768px` viewport width).

When the mobile sidebar is toggled open, a class of `kong-ui-app-sidebar-open` is automatically added to the `document.body`, which applies a rule of `overflow: hidden` while the sidebar is open so that only the sidebar contents is scrollable.

```scss
body.kong-ui-app-sidebar-open {
  overflow: hidden;

  @media (min-width: $kui-breakpoint-tablet) { // 1024px - this breakpoint is *required* is is not configurable
    overflow: auto;
  }
}
```

### Props&nbsp;

#### `active`

- type: `boolean`
- required: `false`
- default: `false`

A boolean to indicate whether the toggle icon is active (meaning the mobile sidebar is open/expanded).

### Events&nbsp;

#### `toggle`&nbsp;

A `@toggle` event is emitted whenever the `active` state of the toggle component changes.

The `toggle` event emits a payload of a `boolean` to indicate if the toggle icon is active.

### Mobile usage example

<details>

<summary>:sparkles: Click to view the expanded mobile usage example :sparkles:</summary>

```html
<template>
  <header class="navbar">
    <nav>
      <SidebarToggle
        :active="mobileSidebarOpen"
        @toggle="sidebarToggled"
      />
      <router-link to="/">
        <img src="mylogo.svg" />
      </router-link>
    </nav>
  </header>
  <div class="sandbox-container">
    <AppSidebar
      :top-items="sidebarItemsTop"
      :header-height="60"
      mobile-enabled
      :open="mobileSidebarOpen"
      :mobile-top-offset="60"
      :mobile-header-visible="false"
      @click="sidebarItemClick"
      @toggle="sidebarToggled"
    >
      <template #header>
        <div class="kong-logo d-flex w-100">
          <router-link to="/">
            <img src="my-logo.svg" />
          </router-link>
        </div>
      </template>
    </AppSidebar>
    <main>
      <p>This is the main page content.</p>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { AppSidebar, SidebarToggle, SidebarPrimaryItem } from '../src'

const sidebarItemClick = (item: SidebarPrimaryItem): void => {
  // Do something
  console.log('item: %o', item)
}

const mobileSidebarOpen = ref(false)
const sidebarToggled = (isOpen: boolean) => {
  mobileSidebarOpen.value = isOpen
}
</script>
```

</details>

## CSS Variables

You can customize some of the sidebar CSS by adding CSS variables to your app. In most use-cases, this shouldn't be necessary.

| Variable                                  | Description                                      | Default       |
| ----------------------------------------- | ------------------------------------------------ | ------------- |
| `--kong-ui-app-sidebar-background`        | The CSS `background` of the sidebar              | `transparent` |
| `--kong-ui-app-sidebar-header-background` | The CSS `background` of the `.sidebar-header`    | `transparent` |
| `--kong-ui-app-sidebar-mobile-icon-color` | The color of the "lines" of the mobile menu icon | `#1155cb`     |

### CSS variable example

```scss
.your-app-container-class {
  --kong-ui-app-sidebar-mobile-icon-color: #008080;
}
```

## TypeScript interfaces

TypeScript interfaces [are available here](https://github.com/Kong/public-ui-components/blob/main/packages/core/app-layout/src/types/sidebar.ts) and can be directly imported into your host application. The following type interfaces are available for import:

```ts
import type { SidebarPrimaryItem, SidebarSecondaryItem, GroupConfig, GroupConfigMap } from '@kong-ui-public/app-layout'
```

---

[← Back to `@kong-ui-public/app-layout` docs](../README.md)
