# @kong-ui-public/entities-routes

Route entity components.

- [Requirements](#requirements)
  - [Expressions features](#expressions-features)
- [Included components](#included-components)
- [Usage](#usage)
  - [Install](#install)
  - [Registration](#registration)
- [Individual component documentation](#individual-component-documentation)

## Requirements

- `vue` and `vue-router` must be initialized in the host application
- `@kong/kongponents` must be added as a dependency in the host application, globally available via the Vue Plugin installation, and the package's style imports must be added in the app entry file. [See here for instructions on installing Kongponents](https://kongponents.konghq.com/#globally-install-all-kongponents).
- `@kong-ui-public/i18n` must be available as a `dependency` in the host application.
- `axios` must be installed as a dependency in the host application

### Expressions features

Some components (e.g., RouteForm with `expressions` route flavor enabled) in this package use `@kong-ui-public/expressions` and `monaco-editor` to support [Kong's Expressions language](https://docs.konghq.com/gateway/latest/reference/expressions-language/), you will need to install `@kong-ui-public/expressions` and `monaco-editor` in your host app to use Expressions features.

If you don't use Expressions features but have non-type imports from this package in your host app, you will need to add the following to your Vite config:

```ts
defineConfig({
  build: {
    rollupOptions: {
      external: ['@kong-ui-public/expressions', 'monaco-editor'],
    },
  },
})
```

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

## Individual component documentation

- [`<RouteList.vue />`](docs/route-list.md)
- [`<RouteForm.vue />`](docs/route-form.md)
- [`<RouteConfigCard.vue />`](docs/route-config-card.md)
