# OnboardingCard.vue

A "welcome" card meant to sit at the top of an entity list or detail page, telling the
user what to do next. It renders a title/subtitle header followed by a grid of clickable
items, where each item links to a route or triggers a callback (e.g. "Design a route",
"Add a plugin", "View all routes").

- [Features](#features)
- [Usage](#usage)
  - [Install](#install)
  - [Props](#props)
  - [Events](#events)
  - [Usage example](#usage-example)
- [TypeScript interfaces](#typescript-interfaces)
  - [`OnboardingCardItem`](#onboardingcarditem)

## Features

- Configurable title and optional subtitle
- Grid of items, each either a `router-link` (via `to`) or a button (via `onClick`)
- Optional `vertical` item variant that stacks the icon/title/description and centers them
- Optional dismiss/close button

## Usage

### Install

[See instructions for installing the `@kong-ui-public/entities-shared` package.](../README.md#install)

### Props

#### `title`

- type: `String`
- required: `true`

Card heading.

#### `subtitle`

- type: `String`
- required: `false`

Optional copy shown below the title. Not rendered if omitted.

#### `items`

- type: `OnboardingCardItem[]`
- required: `true`

Items rendered in the grid below the header. See [`OnboardingCardItem`](#typescript-interfaces)
for the shape of each entry. An item navigates via `to` when provided, links to an external
URL via `href` when provided, or otherwise renders as a button and calls `onClick` when
clicked. `to` takes precedence over `href`, which takes precedence over `onClick`.

#### `dismissible`

- type: `Boolean`
- required: `false`
- default: `true`

Controls whether the close button is rendered.

### Events

#### dismiss

A `@dismiss` event is emitted when the close button is clicked. The component does not
track its own visibility - the parent is responsible for hiding the card (and persisting
that choice, if desired) in response to this event.

### Usage example

Please refer to the [sandbox](../sandbox/pages/OnboardingCardPage.vue).

## TypeScript interfaces

### `OnboardingCardItem`

```ts
interface OnboardingCardItem {
  /** Icon component from `@kong/icons`. Optional - omit to render without an icon. */
  icon?: Component
  /** Icon box color scheme, akin to `KBadge`'s `appearance` prop. Defaults to `success`. */
  appearance?: 'success' | 'decorative-purple' | 'decorative-aqua' | 'neutral'
  title: string
  description?: string
  /**
   * Named route (or full route location) to navigate to when the item is clicked.
   * Takes precedence over `href` and `onClick` if more than one is provided.
   */
  to?: RouteLocationRaw
  /**
   * External URL to link to when the item is clicked, rendered as an `<a>` opening in a new tab.
   * Takes precedence over `onClick` if both are provided. Ignored if `to` is also provided.
   */
  href?: string
  /** Click handler, used when the item does not navigate to a route or link to a URL. */
  onClick?: () => void
  /**
   * Defaults to icon left and text right.
   * `vertical` stacks the icon, title, and description vertically and centers them.
   */
  variant?: 'default' | 'vertical'
}
```
