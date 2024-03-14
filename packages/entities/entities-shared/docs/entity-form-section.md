# EntityFormSection.vue

Component that provides basic layout and styling for descriptive form section. Renders section title and description on the left and slot for any input fields on the right.

- [Requirements](#requirements)
- [Usage](#usage)
  - [Install](#install)
  - [Props](#props)
  - [Slots](#slots)
  - [Usage example](#usage-example)

## Requirements

- `vue` and `vue-router` must be initialized in the host application

## Usage

### Install

[See instructions for installing the `@kong-ui-public/entities-shared` package.](../README.md#install)

### Props

#### `title`

- type: `String`
- required: `false`
- default: `''`

The title text of the form section.

#### `titleTag`

- type: `String`
- required: `false`
- default: `'h2'`

Tag to render title text. Defaults to `h2`, however based on [heading hierarchy](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/Heading_Elements) on your page you can change it to be any other heading level.

#### `description`

- type: `String`
- required: `false`
- default: `''`

Description text. Can also be slotted.

#### `hasDivider`

- type: `Boolean`
- required: `false`
- default: `false`

Controls whether to render bottom divider or not.

#### `stickyInfoHeader`

- type: `Boolean`
- required: `false`
- default: `true`

Prop to enable/disable sticky behavior for infoheader element.

#### `hideInfoHeader`

- type: `Boolean`
- required: `false`
- default: `false`

Prop to show/hide infoheader element.

### Slots

#### description

Description text. Can also be passed as a prop. This slot will override the `description` prop if both are provided.

#### default

Form content slot that appears on the right of title and description. Please note that component styling applies default `margin-top` to all top-level slot children, other than the first.

#### footer

Footer content slot that goes under the description.

### Usage example

Please refer to the [sandbox](../sandbox/pages/EntityFormSectionPage.vue).
