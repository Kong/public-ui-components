# ConfigCardItem.vue

A wrapper component for flexible display of entity configuration fields.

- [Requirements](#requirements)
- [Usage](#usage)
  - [Install](#install)
  - [Props](#props)
  - [Types](#types)
  - [Events](#events)
  - [Slots](#slots)
  - [Usage example](#usage-example)
- [TypeScript interfaces](#typescript-interfaces)

## Requirements

- `vue` and `vue-router` must be initialized in the host application
- `@kong/kongponents` must be added as a `dependency` in the host application, globally available via the Vue Plugin installation, and the package's style imports must be added in the app entry file. [See here for instructions on installing Kongponents](https://kongponents.konghq.com/#globally-install-all-kongponents).
- `axios` must be installed as a dependency in the host application

## Usage

### Install

[See instructions for installing the `@kong-ui-public/entities-shared` package.](../README.md#install)

### Props

#### `item`

- type: `Object as PropType<RecordItem>`
- required: `true`
- default: `undefined`
- properties:
  - `key`:
    - type: `string`
    - required: `true`
    - default: `undefined`
    - Key name for the record property. This should match a key in the entity response object.

  - `value`:
    - type: `any`
    - required: `true`
    - default: `undefined`
    - The property value.

  - `label`:
    - type: `string`
    - required: `false`
    - default: `''`
    - The property's display label. If not provided the `key` will be converted title case and used as the label.
    - Ex. `cat_name` -> `Cat Name`

  - `tooltip`:
    - type: `string`
    - required: `false`
    - default: `''`
    - If the property label has a tooltip, you can specify the text here.

  - `type`:
    - type: `ConfigurationSchemaType`
    - required: `false`
    - default: `''`
    - The display type. If unset, the value will be displayed as text. See [types](#types) for more details.

  - `order`:
    - type: `number`
    - required: `false`
    - default: `undefined`
    - For controlling the order the entries are displayed in. Properties without orders are placed at the end.

  - `hidden`:
    - type: `Boolean`
    - required: `false`
    - default: `false`
    - Set this to `true` if this property should not be visible.

  - `section`:
    - type: `ConfigurationSchemaSection`
    - required: `false`
    - default: `''`
    - The section to display the property in. Used by `EntityBaseConfigCard`.

  - `forceShow`:
    - type: `Boolean`
    - required: `false`
    - default: `false`
    - This prop is used to force the display of a property that doesn't exist in the record. If this property is `true`, you should use the slot to display the `value`.

The base item configuration.

#### `slim`

  - type: `Boolean`
  - required: `false`
  - default: `false`
  - This prop is used to force the label and value of the config card item to each use 50% of the available space rather than the default 25/75. Useful when rendering config cards inside narrower containers such as a slideout.

#### `truncated`

  - type: `Boolean`
  - required: `false`
  - default: `false`
  - This prop is used to truncate text values. If this is set to true, the value will truncate with `overflow: ellipsis`. Useful for values that have the potential to be very long strings.

### Types

There are multiple predefined display types that are supported. The default display type is `Text` (`ConfigurationSchemaType.Text`) which will just render the value as a string.

#### ID & Redacted

These types are used to display copiable ids and make use of the `CopyUUID` component from the `@kong-ui-public/copy-uuid` package. The `ID` (`ConfigurationSchemaType.ID`) type will render the value as plain text, while `Redacted` (`ConfigurationSchemaType.Redacted`) will obfuscate it. Both types offer the ability to copy the value and handle the copy success/failure events internally.

#### Date

The `Date` (`ConfigurationSchemaType.Date`) type takes a `timestamp` value and converts it into a user-friendly format.

Ex. `1649425676` -> `2022-04-08 09:47:56 -0400`

#### Link (Internal & External)

The Internal Link (`ConfigurationSchemaType.InternalLink`) type is used to render a link that is expected to trigger navigation within the application in the same browser window.

The External Link (`ConfigurationSchemaType.ExternalLink`) type is used to render the value as a link that will open in a new tab and uses `KExternalLink` under the covers.

#### Badge (Tag, Status, Method)

We support 3 types of badges currently.

The Status Badge (`ConfigurationSchemaType.BadgeStatus`) type is used to display `boolean` values. It will display a green `KBadge` with the text `Enabled` for a `true` value and a grey `KBadge` with the text `Disabled` for a `false` value.

The Tag Badge (`ConfigurationSchemaType.BadgeTag`) type is used to display `string[]` values. Each array value will be rendered in a horizontal line as a `default` styled `KBadge`.

The Method Badge (`ConfigurationSchemaType.BadgeMethod`) type is used to display a `string[]` of API methods in a horizontal line. An instance of `KMethodBadge` is rendered for each array item.

#### Json & Json Array

The Json (`ConfigurationSchemaType.Json`) is used to render a JSON value, while the Json Array (`ConfigurationSchemaType.JsonArray`) type is used to render a value that is an array of JSON objects.

Choosing either of these types will change the display of the rendered value to be aligned beneath the property label instead of to the side of it. Each property of the object will be displayed on it's own line under the original property label with a slight indentation to indicate grouping.

Note: Even if you are slotting the content for the value, you would want to specify the `type` in the `item` in order to get the content to display below the label.

The Json Array type renders the exact same way as the Json type does, but will use a `fieldset` element with a `legend` to allow for easy differentiation of where one entry ends and the next begins.

### Events

#### navigation-click

A `@navigation-click` event is emitted whene a user clicks an item that has `type` `ConfigurationSchemaType.InternalLink`. The event payload is the `item` object.

### Slots

#### label

Content to display for the item label. Displayed to the left of the value (or above for Json types). Slot content overrides `item.label` content. Provides the `item` object as a slot param.

#### label-tooltip

Slot what is displayed for the label tooltip content of the item. This slot is not available if using the `label` slot. Provides the `item` object as a slot param.

#### <property-key>

Slot what is displayed for the value content. This will override the rendering of the provided `item.value`. Provides the `item` object as a slot param.

### Usage example

Please refer to the [sandbox](../sandbox/pages/ConfigCardItemPage.vue).

## TypeScript interfaces

TypeScript interfaces [are available here](https://github.com/Kong/public-ui-components/blob/main/packages/entities/entities-shared/src/types/entity-base-config-card.ts) and can be directly imported into your host application. The following type interfaces are available for import:

```ts
import type {
  RecordItem,
  ConfigurationSchemaItem,
  ConfigurationSchemaType,
  ConfigurationSchemaSection,
} from '@kong-ui-public/entities-shared'
```
