# AppNavbar.vue

A Kong UI dynamic navbar component.

> **IMPORTANT**
>
> It is **highly** recommended to utilize the `AppLayout.vue` component which provides an integrated navbar and sidebar instead of utilizing this component on its own.

- [Features](#features)
- [Requirements](#requirements)
- [Usage](#usage)
  - [Install](#install)
  - [App Navbar Links](#app-navbar-links)
  - [Slots](#slots)
- [CSS Variables](#css-variables)
  - [CSS variable example](#css-variable-example)

## Features

- Reactive updates based on `prop` value changes :rocket:
- Slottable areas for displaying custom navbar content, logos, etc.
- [Pre-configured link styles when wrapped in a `.app-navbar-links` container](#app-navbar-links)
- Support for slottable and dynamic full-width notification alerts :triangular_flag_on_post:

## Requirements

- `vue` must be initialized in the host application
- The navbar is set to `position: fixed` and is expected to render at the top of the viewport.

## Usage

### Install

[See instructions for installing the `@kong-ui-public/app-layout` package.](../README.md#install)

### App Navbar Links

Standard links can be displayed at the top left of the navbar by injecting content in to the default slot. By wrapping the links (`<a>` tags or `<router-link>` tags) in a container with `.app-navbar-links` class, the default styles will be applied.

You can also add a class of `.active` or `.router-link-active` to the `<a>` or `<router-link>` to automatically apply the active link styles.

```html
<div class="app-navbar-links">
  <a href="/workspaces" class="active">Workspaces</a>
  <router-link to="/portal">Dev Portal</router-link>
</div>
```

### Slots

#### `center`

The main slot to use for navbar content if you don't need a left/center/right navbar layout.

#### `left` and `right`

The left and right slots to use for a left/center/right navbar layout.

#### `logo`

The non-mobile logo.

#### `mobile-logo`

The mobile logo.

#### `mobile-sidebar-toggle`

To be used with the `SidebarToggle.vue` component.

## CSS Variables

You can customize some of the navbar CSS by adding CSS variables to your app. In most use-cases, this shouldn't be necessary.

Variable | Description | Default
---------|----------|---------
`--kong-ui-app-navbar-background` | The CSS `background` of the navbar | `transparent`

### CSS variable example

```scss
.your-custom-navbar-class {
  --kong-ui-app-navbar-background: #1155cb;
}
```

---

[← Back to `@kong-ui-public/app-layout` docs](../README.md)
