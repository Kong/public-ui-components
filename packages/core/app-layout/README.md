# @kong-ui-public/app-layout

A set of Kong UI application layout components that provides a responsive navbar, sidebar, and main content area.

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
- [CSS Variables](#css-variables)
  - [CSS variable example](#css-variable-example)
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

- `AccountDropdown.vue`
- `AppAboutSection.vue`
- `AppError.vue`
- `AppLayout.vue`
- `AppNavbar.vue`
- `AppPageHeader.vue`
- `AppSidebar.vue`
- `SidebarToggle.vue`
- `AppPageInfoSection.vue`
- `GradientBadge.vue`

Reference the [individual component docs](#individual-component-documentation) for more info.

## Install

Install the component in your host application

```sh
yarn add @kong-ui-public/app-layout
```

### Vue Plugin

Initialize the component as a plugin within your application's entry file (e.g. `main.ts`) to make the component globally available.

```ts
import { createApp } from 'vue'
import App from './App.vue'
import AppLayout from '@kong-ui-public/app-layout'

const app = createApp(App)

app.use(AppLayout)
app.mount('#app')
```

### In-Component registration

Alternatively, import the component within your application's root component.

```ts
import { AppLayout } from '@kong-ui-public/app-layout'
```

## Usage

> **Note**: TODO - for now, you can reference the sandbox app `pnpm --filter "@kong-ui-public/app-layout" run dev`

### Props

> **Note**: TODO

### Slots

> **Note**: TODO

### Teleport Containers

> **Note**: TODO

### Usage Example

> **Note**: TODO

## CSS Variables

You can customize some of the `AppLayout.vue` CSS by adding CSS variables to your app. In most use-cases, this shouldn't be necessary.

| Variable                               | Description                                                             | Default                                             |
| -------------------------------------- | ----------------------------------------------------------------------- | --------------------------------------------------- |
| `--kong-ui-app-layout-main-box-shadow` | The box-shadow behind the `.kong-ui-app-layout-main` main container     | `-30px 174px 250px #0023DB`                         |
| `--kong-ui-app-layout-content-padding` | The padding of the `.kong-ui-app-layout-content` main content container | `16px` below `1024px`, `32px` at `1024px` and above |

### CSS variable example

```scss
.your-app-container-class {
  --kong-ui-app-sidebar-mobile-icon-color: #008080;
}
```

## TypeScript interfaces

TypeScript interfaces [are available here](https://github.com/Kong/public-ui-components/blob/main/packages/core/app-layout/src/types/) and can be directly imported into your host application.

## Individual component documentation

- [`<AppNavbar.vue />`](docs/navbar.md)
- [`<AppSidebar.vue />`](docs/sidebar.md)
- [`<AppError.vue />`](docs/error.md)
- [`<AppPageHeader />`](docs/page-header.md)
- [`<AppAboutSection />`](docs/about-section.md)
- [`<AppPageInfoSection`](docs/page-info-section.md)
