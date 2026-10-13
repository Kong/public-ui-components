# AboutCard.vue

A card that presents entity metadata as a list of label/value rows. Built on Kongponents `KCard`, with no overrides of its styles.

- [Features](#features)
- [Requirements](#requirements)
- [Usage](#usage)
  - [Install](#install)
  - [Props](#props)
  - [Slots](#slots)
  - [Usage example](#usage-example)
- [Responsive behavior](#responsive-behavior)
- [Accessibility](#accessibility)
- [TypeScript interfaces](#typescript-interfaces)

## Features

- Label/value rows configured declaratively through the `rows` prop
- Per-row override slots for both the label and the value, for rows that need a badge, a switch, a link, or any other component
- Optional informational tooltip per row, rendered next to the label and reachable by keyboard
- Optional card title, description, and header actions
- Skeleton loading state sized to the number of rows, so the card doesn't jump when data arrives
- Long labels and values wrap and then clamp at two lines, so one unusual row can't stretch the card

## Requirements

- `vue` must be initialized in the host application
- `@kong/kongponents` must be available as a `dependency` in the host application, along with the package's style imports. Specifically, the following Kongponents must be available:
  - `KCard`
  - `KSkeletonBox`
  - `KTooltip`

## Usage

### Install

[See instructions for installing the `@kong-ui-public/page-layout` package.](../README.md#install)

### Props

| Prop          | Type               | Required | Default | Description                                                    |
| :------------ | :----------------- | :------- | :------ | :------------------------------------------------------------- |
| `title`       | `string`           | `false`  | `''`    | Card title.                                                     |
| `titleTag`    | `string`           | `false`  | `'h2'`  | HTML element the title is rendered as.                          |
| `description` | `string`           | `false`  | `''`    | Description rendered above the rows.                            |
| `rows`        | `AboutCardRow[]`   | `false`  | `[]`    | The label/value rows.                                           |
| `isLoading`   | `boolean`          | `false`  | `false` | Renders skeleton placeholders instead of the rows.              |

Each entry in `rows` is an `AboutCardRow`:

| Property  | Type     | Required | Description                                                                               |
| :-------- | :------- | :------- | :---------------------------------------------------------------------------------------- |
| `key`     | `string` | `true`   | Unique key for the row. Also the suffix of the `label-${key}` and `row-${key}` slot names. |
| `label`   | `string` | `false`  | Label text. Ignored when the `label-${key}` slot is provided.                              |
| `tooltip` | `string` | `false`  | Informational tooltip rendered next to the label.                                          |
| `value`   | `string` | `false`  | Value text. Ignored when the `row-${key}` slot is provided.                                |

### Slots

| Slot            | Slot props | Description                                                   |
| :-------------- | :--------- | :------------------------------------------------------------ |
| `title`         | —          | Card title, overriding the `title` prop.                       |
| `description`   | —          | Description, overriding the `description` prop.                |
| `actions`       | —          | Action elements rendered to the right of the card title.       |
| `label-${key}`  | `{ row }`  | Replaces the label of the row with the matching `key`.         |
| `row-${key}`    | `{ row }`  | Replaces the value of the row with the matching `key`.         |
| `default`       | —          | Content rendered below the rows.                               |

A row's `tooltip` is rendered by the component itself and is not replaced by the `label-${key}` slot, so you can override just the label text and keep the tooltip.

### Usage example

```html
<template>
  <AboutCard
    description="The model this route resolves to."
    :is-loading="isLoading"
    :rows="rows"
    title="About this model"
  >
    <template #row-labels>
      <KBadge>env: production</KBadge>
    </template>
    <template #row-enabled>
      <KInputSwitch v-model="enabled" />
    </template>
  </AboutCard>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { AboutCard } from '@kong-ui-public/page-layout'
import type { AboutCardRow } from '@kong-ui-public/page-layout'

const isLoading = ref<boolean>(false)
const enabled = ref<boolean>(true)

const rows: AboutCardRow[] = [
  { key: 'name', label: 'Name', value: 'gpt-4o-multi-purpose', tooltip: 'The display name of this model.' },
  { key: 'id', label: 'ID', value: 'default-model-1' },
  { key: 'labels', label: 'Labels' },
  { key: 'enabled', label: 'Enabled', tooltip: 'Whether this model accepts traffic.' },
]
</script>
```

## Responsive behavior

The card is usually rendered in a narrow column (for example, `PageLayout`'s `aside` slot), where the viewport width says nothing useful about how much room the rows actually have. The rows therefore respond to the **card's own width** via a CSS container query: below `320px` the label moves above its value instead of sitting beside it.

Label and value text wraps and then clamps at two lines. Clamping applies to the text the component renders — content you supply through a `label-${key}` or `row-${key}` slot is laid out as-is, so badges, switches and other components are never boxed in.

The label column is a fixed `140px`. Labels longer than that wrap within the column rather than widening it, so rows stay aligned down the card.

## Card styling

The card reads slightly more compact than a default `KCard`: a smaller title and a tighter gap between the title and the content. These are set through `KCard`'s own `--kui-card-title-font-size` and `--kui-card-gap` custom properties rather than by overriding its rules, so they keep working across `KCard` changes.

They are scoped to AboutCard's own root element, so other cards on the page — including a sibling `KCard` in the same `aside` slot — are unaffected.

## Accessibility

The rows are a description list — `<dl>` wrapping one `<div>` per row, each containing a `<dt>` label and a `<dd>` value. This gives assistive technology a real label-to-value association, which a `<label>` element cannot: per the HTML specification a `<label>` is the caption of a *form control*, so a standalone one carries no semantics. That is why these labels are not `KLabel`.

Each tooltip is triggered by a `<button>` rather than a bare icon, so it is reachable by keyboard, and carries an `aria-label` with the tooltip text.

## TypeScript interfaces

```ts
import type { AboutCardRow, AboutCardProps, AboutCardSlots } from '@kong-ui-public/page-layout'
```
