# PageLayout.vue

A Kong UI page layout component that provides a structured page header with breadcrumbs, title, and responsive tabbed navigation.

- [Features](#features)
- [Requirements](#requirements)
- [Usage](#usage)
  - [Install](#install)
  - [Props](#props)
  - [Slots](#slots)
  - [Usage example](#usage-example)
- [Tabbed Navigation](#tabbed-navigation)
  - [Tab Overflow](#tab-overflow)
  - [Navigation Handling](#navigation-handling)
  - [`PageLayoutTab` Interface](#pagelayouttab-interface)
- [TypeScript interfaces](#typescript-interfaces)

## Features

- Breadcrumb navigation powered by Kongponents `KBreadcrumbs`
- Page title rendered as an `<h1>` with automatic ellipsis truncation for long text
- Responsive tabbed navigation bar with automatic overflow handling
- Tabs that exceed the available width are moved into a "More" dropdown menu
- Support for both Vue Router route objects and string URLs in tabs
- `<router-view>` integration when tabs are present; falls back to a default slot otherwise
- Skeleton loading state while the tab layout is being computed
- Border separator between the header and content area

## Requirements

- `vue` and `vue-router` must be initialized in the host application
- `@kong/kongponents` must be available as a `dependency` in the host application, along with the package's style imports. [See here for instructions on installing Kongponents](https://kongponents.konghq.com/#globally-install-all-kongponents). Specifically, the following Kongponents must be available:
  - `KBreadcrumbs`
  - `KDropdown`
  - `KDropdownItem`
  - `KSkeletonBox`

## Usage

### Install

[See instructions for installing the `@kong-ui-public/page-layout` package.](../README.md#install)

### Props

#### `title`

- type: `String`
- required: `true`

The title text of the page, rendered as an `<h1>` element.

#### `breadcrumbs`

- type: `Array as PropType<BreadcrumbItem[]>`
- required: `false`
- default: `[]`

An array of breadcrumb items passed to the Kongponents `KBreadcrumbs` component. When provided, breadcrumbs are rendered above the page title. The `BreadcrumbItem` type is imported from `@kong/kongponents`.

#### `tabs`

- type: `Array as PropType<PageLayoutTab[]>`
- required: `false`
- default: `[]`

An array of `PageLayoutTab` objects that define the tabbed navigation displayed below the page title.

When tabs are provided:

- The internal `PageLayoutTabs` component renders a horizontal tab bar
- A `<router-view>` is used for the content area (instead of the default slot)
- Tabs that overflow the container are moved into a "More" dropdown

When no tabs are provided:

- The default slot is rendered for page content
- A bottom border is added to the header area as a separator

### Slots

#### `default`

The main content area of the page. This slot is **only rendered when no tabs are provided**. When tabs are present, a `<router-view>` is used instead to render the active tab's route component.

### Usage example

#### With tabs

```html
<template>
  <PageLayout
    :breadcrumbs="breadcrumbs"
    :tabs="tabs"
    title="My Control Plane"
  />
</template>

<script setup lang="ts">
import { PageLayout } from '@kong-ui-public/page-layout'
import type { PageLayoutTab } from '@kong-ui-public/page-layout'

const breadcrumbs = [
  { key: 'api-gateway', text: 'API Gateway' },
  { key: 'gateways', text: 'Gateways' },
]

const tabs: PageLayoutTab[] = [
  {
    key: 'overview',
    label: 'Overview',
    to: '/',
    active: true,
  },
  {
    key: 'gateway-services',
    label: 'Gateway services',
    to: '/gateway-services',
  },
  {
    key: 'routes',
    label: 'Routes',
    to: '/routes',
  },
]
</script>
```

#### Without tabs

```html
<template>
  <PageLayout
    :breadcrumbs="breadcrumbs"
    title="Settings"
  >
    <div>Your page content here</div>
  </PageLayout>
</template>

<script setup lang="ts">
import { PageLayout } from '@kong-ui-public/page-layout'

const breadcrumbs = [
  { key: 'home', text: 'Home' },
  { key: 'settings', text: 'Settings' },
]
</script>
```

#### Title only (no breadcrumbs, no tabs)

```html
<template>
  <PageLayout title="Dashboard">
    <div>Dashboard content</div>
  </PageLayout>
</template>
```

## Tabbed Navigation

The `PageLayoutTabs` component is an internal component used by `PageLayout` to render the tab bar. It is not exported directly but its behavior is configured through the `tabs` prop on `PageLayout`.

### Tab Overflow

The tab bar dynamically measures the available container width and determines how many tabs can fit. Tabs that exceed the available space are moved into a "More" dropdown menu powered by Kongponents `KDropdown`.

- Layout is computed on mount and recalculated on window resize (debounced at 150ms)
- A skeleton loading state is displayed while the layout is being computed
- The "More" button displays a badge with the count of hidden tabs

### Navigation Handling

Tabs support two types of navigation:

1. **Vue Router route objects** (`RouteLocationRaw`): Rendered as `<router-link>` components for client-side navigation.
2. **String URLs** (relative or absolute): Rendered as `<a>` elements. If an `app:navigateTo` function is provided via Vue's dependency injection, it will be called for string-based routes instead of the default anchor behavior.

### `PageLayoutTab` Interface

```ts
interface PageLayoutTab {
  /** The unique kebab-case key of the tab */
  key: string
  /** The display text of the navbar tab */
  label: string
  /** Vue Router `to` object or a URL path (relative or absolute) */
  to: string | RouteLocationRaw
  /** Is the navbar tab active */
  active?: boolean
  /** The data-testid attribute; auto-generated as `${key}-tab-link` if not provided */
  dataTestId?: string
}
```

| Property     | Type                         | Required | Default            | Description                                                |
| ------------ | ---------------------------- | -------- | ------------------ | ---------------------------------------------------------- |
| `key`        | `string`                     | Yes      | -                  | Unique kebab-case identifier for the tab                   |
| `label`      | `string`                     | Yes      | -                  | Display text of the tab                                    |
| `to`         | `string \| RouteLocationRaw` | Yes      | -                  | Navigation target: a Vue Router route object or URL string |
| `active`     | `boolean`                    | No       | `undefined`        | Whether the tab is currently active (highlighted)          |
| `dataTestId` | `string`                     | No       | `${key}-tab-link`  | Custom `data-testid` attribute for testing                 |

## TypeScript interfaces

TypeScript interfaces [are available here](https://github.com/Kong/public-ui-components/blob/main/packages/core/page-layout/src/types/) and can be directly imported into your host application. The following type interfaces are available for import:

```ts
import type {
  PageLayoutTab,
  PageLayoutProps,
  PageLayoutSlots,
  PageLayoutTabsProps,
} from '@kong-ui-public/page-layout'
```
