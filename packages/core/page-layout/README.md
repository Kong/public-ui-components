# @kong-ui-public/page-layout

A set of Kong UI page layout components that provides a structured page header with breadcrumbs, title, and responsive tabbed navigation.

- [Requirements](#requirements)
- [Included components](#included-components)
- [Install](#install)
  - [In-Component registration](#in-component-registration)
- [TypeScript interfaces](#typescript-interfaces)
- [Individual component documentation](#individual-component-documentation)

## Requirements

- `vue` and `vue-router` must be initialized in the host application
- `@kong/kongponents` must be available as a `dependency` in the host application, along with the package's style imports. [See here for instructions on installing Kongponents](https://kongponents.konghq.com/#globally-install-all-kongponents).

## Included components

- `PageLayout.vue`

Reference the [individual component docs](#individual-component-documentation) for more info.

## Install

Install the component in your host application

```sh
yarn add @kong-ui-public/page-layout
```

### In-Component registration

Import the component within your application.

```ts
import { PageLayout } from '@kong-ui-public/page-layout'
```

## TypeScript interfaces

TypeScript interfaces [are available here](https://github.com/Kong/public-ui-components/blob/main/packages/core/page-layout/src/types/) and can be directly imported into your host application. The following type interfaces are available for import:

```ts
import type { PageLayoutTab, PageLayoutProps, PageLayoutSlots, PageLayoutTabsProps } from '@kong-ui-public/page-layout'
```

## Individual component documentation

- [`<PageLayout />`](docs/page-layout.md)
