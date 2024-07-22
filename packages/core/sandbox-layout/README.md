# @kong-ui-public/sandbox-layout

A layout component for Vue component sandboxes. Simply slot in your component (`default` slot) and component controls (`controls` slot).

- [Requirements](#requirements)
- [Usage](#usage)
  - [Install](#install)
  - [Props](#props)
  - [Slots](#slots)
  - [Example](#example)

## Requirements

- `vue` must be initialized in the host application
- `@kong/kongponents` must be available as a `dependency` in the host application, along with the package's style imports. [See here for instructions on installing Kongponents](https://kongponents.konghq.com/#globally-install-all-kongponents).

## Usage

### Install

Install the package in your host application

> **Important**
> This package should **always** be installed as a `devDependency` as it is only utilized when building component sandbox apps and should **never** be compiled into a package's `/dist` folder.

```sh
yarn add -D @kong-ui-public/sandbox-layout
```

### Props

#### `links`

- type: `SandboxNavigationItem[]`
- required: `false`
- default: `[]`

An array containing `SandboxNavigationItem` objects adhering to this interface:

```ts
interface SandboxNavigationItem {
  /** The name of the item to display in the navigation, e.g. `My page` */
  name: string
  /** The router link object, e.g. `{ name: 'my-page' }` */
  to: RouteLocationRaw
}
```

#### `title`

- type: `string`
- required: `false`
- default: `''`

A string to display as the title

#### `controlsMinWidth`

- type: `Number`
- required: `false`
- default: `240`

The minimum width of the `controls` sidebar. A `number` that is converted to pixels. Defaults to `240`

### Slots

#### `default`

The `default` slot should be utilized for main component display.

#### `controls`

The `controls` slot should be utilized for interactive controls, used to manipulate the component displayed in the `default` slot. The default width of this slot is `240px`.

### Example

Initialize the component in your sandbox app's entry file along with the router and `links` object.

```ts
// main.ts

import { createApp } from 'vue'
import App from './App.vue'
import { createRouter, createWebHistory } from 'vue-router'

// Import component, types, and styles
import { SandboxLayout } from '@kong-ui-public/sandbox-layout'
import type { SandboxNavigationItem } from '@kong-ui-public/sandbox-layout'
import '@kong-ui-public/sandbox-layout/dist/style.css'

const app = createApp(App)

// Globally register the component in your sandbox app
app.component('SandboxLayout', SandboxLayout)

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'sandbox-home',
      component: () => import('./pages/HomePage.vue'),
    },
    {
      path: '/example',
      name: 'example',
      component: () => import('./pages/ExamplePage.vue'),
    },
  ],
})

// Define the sandbox layout links here to inject into your application
const appLinks: SandboxNavigationItem[] = ([
  {
    name: 'Sandbox Homepage',
    to: { name: 'sandbox-home' },
  },
  {
    name: 'Example Page',
    to: { name: 'example' },
  },
])

// Provide the app links to the SandboxLayout components
app.provide('app-links', appLinks)
// Init the router
app.use(router)
// Mount the app
app.mount('#app')
```

Set up your sandbox app's `App.vue`

```html
<template>
  <router-view />
</template>
```

Utilize the `SandboxLayout` component in your sandbox app's page components

```html
<!-- ExamplePage.vue -->
<template>
  <SandboxLayout
    :links="appLinks"
    title="My chart component"
  >
    <!-- Inject the interactive controls into the `#controls` slot -->
    <template #controls>
      <label>Chart Type</label>
      <input type="radio" name="chartType" value="bar" />
      <input type="radio" name="chartType" value="line" />
    </template>

    <!-- Add your component in the `default` slot -->
    <MyChartComponent />
  </SandboxLayout>
</template>

<script setup lang="ts">
import { inject } from 'vue'
import type { SandboxNavigationItem } from '@kong-ui-public/sandbox-layout'

// Inject the app-links from the entry file
const appLinks: SandboxNavigationItem[] = inject('app-links', [])
</script>
```
