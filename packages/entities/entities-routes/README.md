# @kong-ui-public/entities-routes

Route entity components.

- [Requirements](#requirements)
- [Included components](#included-components)
- [Usage](#usage)
  - [Install](#install)
  - [Registration](#registration)
- [Expressions features](#expressions-features)
- [Individual component documentation](#individual-component-documentation)

## Requirements

- `vue` and `vue-router` must be initialized in the host application.
- `@kong/kongponents` must be added as a dependency in the host application, globally available via the Vue Plugin installation, and the package's style imports must be added in the app entry file. [See here for instructions on installing Kongponents](https://kongponents.konghq.com/#globally-install-all-kongponents).
- `@kong-ui-public/i18n` must be available as a `dependency` in the host application.
- `axios` must be installed as a dependency in the host application.
- If you want to enable [Kong's Expressions language](https://docs.konghq.com/gateway/latest/reference/expressions-language/)-related [features](#expressions-features) in your host app, `@kong-ui-public/expressions` and `monaco-editor` must be installed as dependencies in the host application.

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

If you want to enable [expressions feature](#expressions-features), you also need to install `devDependencies` in your host application:

```sh
yarn add -D vite-plugin-monaco-editor
```

Enable the `vite-plugin-monaco-editor` plugin. Your Vite config should look like this:

```ts
import monacoEditorPlugin from 'vite-plugin-monaco-editor'

export default defineConfig({
  // ...
  plugins: [
    monacoEditorPlugin({}),
  ],
  // ...
})
```

### Registration

Import the component(s) in your host application as well as the package styles

```ts
import { RouteList, RouteForm, RouteConfigCard } from '@kong-ui-public/entities-routes'
import '@kong-ui-public/entities-routes/dist/style.css'
```

## Expressions features

This package utilizes `@kong-ui-public/expressions` and `monaco-editor` to support [Kong's Expressions language](https://docs.konghq.com/gateway/latest/reference/expressions-language/)-related features. You will need to ensure these dependencies are installed in your host application to enable these features.

As of now, `<RouteForm.vue />` is the only component with Expressions features(controlled via the `routeFlavor` prop).

## Individual component documentation

- [`<RouteList.vue />`](docs/route-list.md)
- [`<RouteForm.vue />`](docs/route-form.md)
- [`<RouteConfigCard.vue />`](docs/route-config-card.md)
