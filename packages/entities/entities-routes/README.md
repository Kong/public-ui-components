# @kong-ui-public/entities-routes

Route entity components.

- [Requirements](#requirements)
- [Included components](#included-components)
- [Usage](#usage)
  - [Install](#install)
  - [Registration](#registration)
  - [Reduce the bundle size (Optional)](#reduce-the-bundle-size-optional)
- [Individual component documentation](#individual-component-documentation)

## Requirements

- `vue` and `vue-router` must be initialized in the host application
- `@kong/kongponents` must be added as a dependency in the host application, globally available via the Vue Plugin installation, and the package's style imports must be added in the app entry file. [See here for instructions on installing Kongponents](https://kongponents.konghq.com/#globally-install-all-kongponents).
- `@kong-ui-public/i18n` must be available as a `dependency` in the host application.
- `axios` must be installed as a dependency in the host application

## Included components

- `RouteList`
- `RouteForm`
- `RouteConfigCard`

Reference the [individual component docs](#individual-component-documentation) for more info.

## Usage

### Install

Install the component in your host application

```sh
yarn add @kong-ui-public/entities-routes
```

### Registration

Import the component(s) in your host application as well as the package styles

```ts
import { RouteList, RouteForm, RouteConfigCard } from '@kong-ui-public/entities-routes'
import '@kong-ui-public/entities-routes/dist/style.css'
```

### Reduce the bundle size (Optional)

This package installs `@kong-ui-public/expressions` and `monaco-editor` to support [Kong's Expressions language](https://docs.konghq.com/gateway/latest/reference/expressions-language/)-related features. However, this will add several megabytes to your bundle size.

If you don't need Expressions features, but have imported the components (e.g., `<RouteForm.vue />`) with these features in your host app, add the following configuration to your Vite config to avoid bundling them with your build result:

> As of now, only `<RouteForm.vue />` has Expressions features. You should ensure you are not using Expressions features in your host app before adding this configuration.

```ts
defineConfig({
  build: {
    rollupOptions: {
      external: ['@kong-ui-public/expressions', 'monaco-editor'],
    },
  },
})
```

## Individual component documentation

- [`<RouteList.vue />`](docs/route-list.md)
- [`<RouteForm.vue />`](docs/route-form.md)
- [`<RouteConfigCard.vue />`](docs/route-config-card.md)
