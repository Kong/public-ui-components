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
- [Nested PageLayout](#nested-pagelayout)
- [Page Shortcuts](#page-shortcuts)
  - [`pageShortcutData` prop](#pageshortcutdata-prop)
  - [`app:pageShortcutsContext` injection](#apppageshortcutscontext-injection)
  - [`PageShortcutData` Interface](#pageshortcutdata-interface)
  - [`PageShortcutsContext` Interface](#pageshortcutscontext-interface)
- [TypeScript interfaces](#typescript-interfaces)

## Features

- Breadcrumb navigation powered by Kongponents `KBreadcrumbs`
- Page title rendered as an `<h1>` with automatic ellipsis truncation for long text
- Optional back navigation button next to the title via the `backTo` prop
- Actions slot for placing buttons or controls in the page header, aligned to the right
- Title-after slot for placing inline content (e.g. badges, status indicators) next to the page title
- Responsive tabbed navigation bar with automatic overflow handling
- Tabs that exceed the available width are moved into a "More" dropdown menu
- Support for both Vue Router route objects and string URLs in tabs
- `<router-view>` integration when tabs are present; falls back to a default slot otherwise
- Skeleton loading state while the tab layout is being computed
- Border separator between the header and content area
- Optional "favorite" star button next to the title for marking entity pages as shortcuts, integrated with a host-provided shortcuts context via dependency injection

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
- required: `false`

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

#### `pageShortcutData`

- type: `PageShortcutData`
- required: `false`
- default: `undefined`

When provided, marks the current page as an entity page eligible to be saved as a shortcut (favorite / recent). See [Page Shortcuts](#page-shortcuts) for the full integration contract.

The favorite star button only renders when **both** `pageShortcutData` is provided _and_ a host application supplies an `app:pageShortcutsContext` via `provide()` that exposes an `onFavoriteToggle` function. If either is missing, the button is hidden.

#### `backTo`

- type: `String | RouteLocationRaw`
- required: `false`
- default: `undefined`

A navigation target for a back button rendered to the left of the page title. When provided, an arrow icon button is displayed that navigates to the specified location when clicked.

The prop accepts two types of values:

1. **String URL** (relative or absolute): Rendered as an `<a>` element. If an `app:navigateTo` function is provided via Vue's dependency injection, it will be called instead of the default `window.location.href` assignment.
2. **Vue Router route object** (`RouteLocationRaw`): Rendered as a `<router-link>` and navigates using `router.push()`.

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

#### `actions`

An optional slot rendered on the right side of the page header, aligned to the bottom of the header row. Use this slot to place action buttons, dropdowns, or other controls that relate to the current page. The slot is rendered regardless of whether tabs are present.

#### `title`

Optional slot for a custom page title. Use it when the default `<h1>` needs to be replaced with a lower-level heading to preserve proper heading order.

#### `title-after`

An optional slot rendered immediately after the page title `<h1>`, inline within the title row. Use this slot to place badges, status indicators, or other inline content that should appear next to the title.

#### `tab-${tab.key}` (dynamic)

A dynamic, per-tab slot for customizing the rendered content of a specific tab in the tab bar. The slot name is constructed as `tab-` followed by the tab's `key`. If a matching slot is not provided for a given tab, the tab's `label` is rendered instead.

The slot exposes the corresponding `PageLayoutTab` object as a scoped slot prop:

```html
<template>
  <PageLayout
    :tabs="tabs"
    title="My Control Plane"
  >
    <template #tab-routes="{ tab }">
      {{ tab.label }}
      <KBadge appearance="info">12</KBadge>
    </template>
  </PageLayout>
</template>
```

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

#### With back button and actions

```html
<template>
  <PageLayout
    :back-to="{ name: 'control-planes' }"
    :breadcrumbs="breadcrumbs"
    title="My Control Plane"
  >
    <template #actions>
      <KButton appearance="primary">
        Create
      </KButton>
    </template>

    <div>Page content here</div>
  </PageLayout>
</template>

<script setup lang="ts">
import { PageLayout } from '@kong-ui-public/page-layout'

const breadcrumbs = [
  { key: 'api-gateway', text: 'API Gateway' },
  { key: 'control-planes', text: 'Control Planes' },
]
</script>
```

#### With title-after slot

```html
<template>
  <PageLayout
    :breadcrumbs="breadcrumbs"
    title="My Control Plane"
  >
    <template #title-after>
      <KBadge appearance="success">Active</KBadge>
    </template>

    <div>Page content here</div>
  </PageLayout>
</template>
```

#### With back button (string URL)

```html
<template>
  <PageLayout
    back-to="/control-planes"
    title="My Control Plane"
  >
    <div>Page content here</div>
  </PageLayout>
</template>
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

- Layout is computed on mount and recalculated whenever the tab bar's own size changes (observed via [`useResizeObserver`](https://vueuse.org/core/useResizeObserver), debounced at 150ms). This means the overflow recomputes correctly even when the window size doesn't change but the available width does (for example, when a sidebar is collapsed/expanded or a parent container is resized).
- The overflow is also recomputed automatically when the `tabs` prop changes (added, removed, or replaced).
- A skeleton loading state is displayed while the layout is being computed.
- The "More" button displays a badge with the count of hidden tabs.

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

## Nested PageLayout

`PageLayout` supports nesting. A common case is a parent route wrapping its children with `PageLayout` (for top-level breadcrumbs/tabs), while a child route's component also uses `PageLayout` for its own header. When this happens, the parent automatically detects the child and hides its own header and tabs (removing them from the DOM entirely), acting as a transparent pass-through. This ensures only the child's `PageLayout` header is visible. This is achieved via `provide` / `inject` internally.

This behavior is automatic and requires no additional configuration — simply nest `PageLayout` components via routing and the parent will defer to the child.

## Page Shortcuts

`PageLayout` can integrate with a host application's "shortcuts" system (typically a sidebar listing favorited and recently-visited entity pages). The integration has two halves:

1. The page declares itself as a shortcut-eligible entity via the `pageShortcutData` prop.
2. The host app provides a `PageShortcutsContext` via Vue `provide()` under the `app:pageShortcutsContext` injection key. This context is reactive and tells `PageLayout` whether the current page is currently favorited, and gives it callbacks to invoke when the user favorites a page or when an entity page is visited.

The favorite star button is only rendered when **both** halves of the contract are satisfied:

- `pageShortcutData` is provided with non-empty `entityType` and `label`, **and**
- An `app:pageShortcutsContext` is injected and exposes an `onFavoriteToggle` function.

If either side is missing, the button is hidden entirely (no DOM is rendered for it). This means a page can opt-in unconditionally by declaring `pageShortcutData`, and the host app controls global availability of the feature by deciding whether to `provide()` the context.

### `pageShortcutData` prop

Provide this prop to mark the page as an entity page. The `label` field is the display text; `entityType` is a string the host uses to group / categorize shortcuts (e.g. `"gateway-service"`, `"route"`). The optional `path` field is the URL the shortcut will navigate to when clicked from the host's shortcut list — if omitted, `PageLayout` falls back to the current route's `fullPath` (via `useRoute()`) when invoking `onFavoriteToggle` / `onEntityPageVisit`. An optional `parentLabel` can disambiguate entities with the same label under different parents.

### `app:pageShortcutsContext` injection

The host application must `provide('app:pageShortcutsContext', ctx)` a reactive object (typically created via `reactive()`). `PageLayout` interacts with it as follows:

- **`isFavorite`** — reactive boolean. When `true`, the star button renders as a filled star (and its aria-label switches to "Remove page from shortcuts"). The host is responsible for keeping this in sync with the user's favorites list whenever the route changes.
- **`onFavoriteToggle(pageShortcutData)`** — called when the user clicks the star button. Receives the current page's `PageShortcutData` with `path` resolved (either the value from the prop, or the current route's `fullPath` as a fallback). The host should toggle the favorite state for the current page and update `isFavorite` accordingly.
- **`onEntityPageVisit(pageShortcutData)`** — called when an entity page is visited (or when `pageShortcutData` changes). The host typically uses this to record the visit in a "Recents" list. To avoid double-counting in nested-PageLayout scenarios, this callback is only invoked from the **innermost** (non-nested) `PageLayout`, and is deferred via `nextTick()` so nested-layout detection has settled first.

#### Example host setup

```ts
import { ref, reactive, provide } from 'vue'
import type { PageShortcutData } from '@kong-ui-public/page-layout'

const favorites = ref<PageShortcutData[]>([])
const recents = ref<PageShortcutData[]>([])

const pageShortcutsContext = reactive({
  isFavorite: false,
  onFavoriteToggle: (data: PageShortcutData) => {
    // toggle `data` in `favorites` (e.g. dedupe by `path`),
    // then update `pageShortcutsContext.isFavorite` to match
  },
  onEntityPageVisit: (data: PageShortcutData) => {
    // prepend `data` to `recents`, dedupe by `path`, cap length, etc.
  },
})

provide('app:pageShortcutsContext', pageShortcutsContext)
```

### `PageShortcutData` Interface

```ts
interface PageShortcutData {
  /** The display label of the page shortcut */
  label: string
  /** The URL path of the page shortcut. If omitted, PageLayout falls back to the current route's `fullPath`. */
  path?: string
  /** The entity type of the page shortcut */
  entityType: string
  /** The display label of the parent entity */
  parentLabel?: string
}
```

| Property      | Type     | Required | Description                                                                                  |
| ------------- | -------- | -------- | -------------------------------------------------------------------------------------------- |
| `label`       | `string` | Yes      | Display text for the shortcut entry                                                          |
| `path`        | `string` | No       | URL path the shortcut navigates to. Falls back to the current route's `fullPath` if omitted. |
| `entityType`  | `string` | Yes      | Host-defined entity category (e.g. `"gateway-service"`, `"route"`)                           |
| `parentLabel` | `string` | No       | Optional parent entity label, useful for disambiguating shortcut rows                        |

### `PageShortcutsContext` Interface

> [!IMPORTANT]
> This interface is not defined within `@kong-ui-public/page-layout` package as it is primarily host-driven. PageLayout checks whether all mentioned above properties are provided and are of expected type but does not enforce the type to avoid breaking changes should the host-driven use case or interface change.

The shape `PageLayout` expects when injecting `app:pageShortcutsContext`. Only `onFavoriteToggle` is strictly required for the star button to render.

```ts
interface PageShortcutsContext {
  /** Whether the current page is currently favorited */
  isFavorite: boolean
  /** Called when the user clicks the favorite star button. Receives the current page's shortcut data with `path` resolved. */
  onFavoriteToggle: (data: PageShortcutData) => void
  /** Called when an entity page is visited or its shortcut data changes */
  onEntityPageVisit: (data: PageShortcutData) => void
}
```

## TypeScript interfaces

TypeScript interfaces [are available here](https://github.com/Kong/public-ui-components/blob/main/packages/core/page-layout/src/types/) and can be directly imported into your host application. The following type interfaces are available for import:

```ts
import type {
  PageLayoutTab,
  PageLayoutProps,
  PageLayoutSlots,
  PageLayoutTabsProps,
  PageShortcutData,
} from '@kong-ui-public/page-layout'
```
