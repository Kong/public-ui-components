# CollapsibleSection.vue

A Kong UI simple collapsible section component.

- [Requirements](#requirements)
- [Usage](#usage)
  - [Install](#install)
  - [Props](#props)
  - [Slots](#slots)

## Requirements

- `vue` must be initialized in the host application
- `@kong/kongponents` must be available as a `dependency` in the host application, along with the package's style imports. [See here for instructions on installing Kongponents](https://kongponents.konghq.com/#globally-install-all-kongponents)

## Usage

### Install

[See instructions for installing the `@kong-ui-public/app-layout` package.](../README.md#install)

### Props

#### `title`

- type: `String`
- required: `false`
- default: `''`

The title text of the section.

#### `description`

- type: `String`
- required: `false`
- default: `''`

Descriptive text displayed below the `title`

#### `collapsible`

- type: `Boolean`
- required: `false`
- default: `true`

Whether or not section should be collapsible. Collapsible section is rendered as a `details` element, while a non-collapsible is rendered as a `div`.

#### `titleTag`

- type: `String`
- required: `false`
- default: `'div'`

HTML element you want title to be rendered as. Defaults to `div`.

### Slots

#### `header`

Header content to be rendered in place of `title` and `description`.

#### `default`

Main content to be displayed in the section.

#### `actions`

Located to the right of the card title, the `actions` slot allows for slotting in any action elements.

_Note:_ actions slot will be omitted when [`collapsible` prop](#collapsible) is `true` in order to leave room for caret icon.

---

[← Back to `@kong-ui-public/app-layout` docs](../README.md)
