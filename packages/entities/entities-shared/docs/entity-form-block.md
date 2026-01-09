# EntityFormBlock.vue

This component succeeds the `[EntityFormSection](./entity-form-section.md)` component, providing layout functionalities under `FreeForm` the next gen of form fields rendering engine.

- [Usage](#usage)
  - [Install](#install)
  - [Props](#props)
  - [Slots](#slots)
  - [Usage example](#usage-example)

## Usage

### Install

[See instructions for installing the `@kong-ui-public/entities-shared` package.](../README.md#install)

### Props

#### `title`

- type: `String`
- required: `false`
- default: `''`

Renders the provided `string` as the `h2` tag content.

> If the `title` prop is not provided, you must provide a `title` slot to render the content.

#### `description`

- type: `String`
- required: `false`
- default: `''`

Description text. Can also be slotted.

#### `step`

- type: `Number`
- required: `false`
- default: `undefined`

Step number for the form section.

### Slots

#### description

Description text. Can also be passed as a prop. This slot will override the `description` prop if both are provided.

#### default

Form content slot that appears on the right of title and description. Please note that component styling applies default `margin-top` to all top-level slot children, other than the first.

#### step

Step content slot that appears to the left of the form content. This slot will override the `step` prop if both are provided.

#### title

Title content slot that goes above the description, allowing for custom rendering of the title. If this slot is provided, the `title` prop will not be rendered.

#### extra

Extra content slot that goes under the description, allowing for additional information or actions related to the section. This slot is optional and can be used to enhance the section with more context or controls.

### Usage example

Please refer to the [sandbox](../sandbox/pages/EntityFormBlockPage.vue).
