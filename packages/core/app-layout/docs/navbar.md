# AppNavbar.vue

A Kong UI dynamic navbar component.

> **IMPORTANT**
>
> It is **highly** recommended to utilize the `AppLayout.vue` component which provides an integrated navbar and sidebar instead of utilizing this component on its own.

- [Features](#features)
- [Requirements](#requirements)
- [Install](#install)
- [CSS Variables](#css-variables)
  - [CSS variable example](#css-variable-example)

## Features

- Reactive updates based on `prop` value changes :rocket:
- Slottable areas for displaying custom navbar content, logos, etc.
- Support for slottable and dynamic full-width notification alerts :triangular_flag_on_post:

## Requirements

- `vue` must be initialized in the host application
- The navbar is set to `position: fixed` and is expected to render at the top of the viewport.

## Install

[See instructions for installing the `@kong-ui/app-layout` package.](../README.md#install)

## CSS Variables

You can customize some of the navbar CSS by adding CSS variables to your app. In most use-cases, this shouldn't be necessary.

Variable | Description | Default
---------|----------|---------
`--kong-ui-app-navbar-background-color` | The `background-color` of the navbar | `#fff`

### CSS variable example

```scss
.your-custom-navbar-class {
  --kong-ui-app-navbar-background-color: var(--blue-500, #1155cb);
}
```

---

[← Back to `@kong-ui/app-layout` docs](../README.md)
