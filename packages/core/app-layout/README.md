# @kong-ui/core-app-layout

A Kong UI application layout component that provides a responsive navbar, sidebar, and main content area.

- [Features](#features)
- [Requirements](#requirements)
- [Included components](#included-components)
- [Install](#install)
  - [Vue Plugin](#vue-plugin)
  - [In-Component registration](#in-component-registration)
- [Usage](#usage)
  - [Props](#props)
  - [Slots](#slots)
  - [Teleport Containers](#teleport-containers)
  - [Usage Example](#usage-example)
- [TypeScript interfaces](#typescript-interfaces)
- [Individual component documentation](#individual-component-documentation)

## Features

- Responsive navbar component ([see the navbar docs for more info](docs/navbar.md))
- Responsive sidebar component ([see the sidebar docs for more info](docs/sidebar.md))
- Main content slot with pre-configured styles, etc.
- Ability to takeover the default slot content for displaying global error states or other content

## Requirements

- `vue` and `vue-router` must be initialized in the host application
- `@kong/kongponents` must be available as a `dependency` in the host application, along with the package's style imports. [See here for instructions on installing Kongponents](https://kongponents.konghq.com/#globally-install-all-kongponents).
- The Vue app container element (the element the host Vue app is mounted in) must have an id of `#app` (alternatively, you **must** manually add a CSS rule of `height: 100%` to your element)
- The `AppLayout.vue` component **must** be the root-level element within your Vue app's `<template>` unless you are also utilizing [the `KonnectAppShell.vue` component](../../packages/konnect-app-shell/README.md).
  - If using the `KonnectAppShell.vue` component, the `AppLayout.vue` component **must** be the only component placed inside the `KonnectAppShell.vue`'s default slot.
- This package **must not** list any other package in this monorepository as a `dependency` or `devDependency`. This package will likely be published in the future for consumption by some of Kong's open-source applications.

## Included components

- `AppLayout.vue`
- `AppNavbar.vue`
- `NavbarDropdownMenu.vue`
- `AppSidebar.vue`
- `SidebarToggle.vue`
- `AppError.vue`

Reference the [individual component docs](#individual-component-documentation) for more info.

## Install

Install the component in your host application

```sh
yarn add @kong-ui/core-app-layout
```

### Vue Plugin

Initialize the component as a plugin within your application's entry file (e.g. `main.ts`) to make the component globally available.

```ts
import { createApp } from 'vue'
import App from './App.vue'
import AppLayout from '@kong-ui/core-app-layout'

const app = createApp(App)

app.use(AppLayout)
app.mount('#app')
```

### In-Component registration

Alternatively, import the component within your application's root component.

```ts
import { AppLayout } from '@kong-ui/core-app-layout'
```

## Usage

> **Note**: TODO - for now, you can reference the sandbox app `pnpm --filter "@kong-ui/core-app-layout" run dev`

### Props

> **Note**: TODO

### Slots

> **Note**: TODO

### Teleport Containers

> **Note**: TODO

### Usage Example

> **Note**: TODO

## TypeScript interfaces

TypeScript interfaces [are available here](https://github.com/Kong/shared-ui-components/blob/main/packages/app-layout/src/types/) and can be directly imported into your host application.

## Individual component documentation

- [`<AppNavbar.vue />`](docs/navbar.md)
- [`<AppSidebar.vue />`](docs/sidebar.md)
- [`<AppError.vue />`](docs/error.md)
