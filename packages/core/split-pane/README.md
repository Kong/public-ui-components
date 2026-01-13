# @kong-ui-public/split-pane

A shared SplitPane layout component for Vue 3 applications.

- [Features](#features)
- [Requirements](#requirements)
- [Usage](#usage)
  - [Install](#install)
  - [Basic Usage](#basic-usage)
  - [Nested Panes](#nested-panes)
  - [Props](#props)
    - [SplitPane Props](#splitpane-props)
    - [Pane Props](#pane-props)

## Features

- Split pane component for Vue 3 applications
- Resizable panes with drag-and-drop functionality
- Horizontal and vertical split layouts
- Customizable pane sizes with min/max constraints
- Support for nested split panes
- Smooth drag interactions with visual feedback

## Requirements

- `vue` must be initialized in the host application
- `@kong/kongponents` must be available as a `dependency` in the host application

## Usage

### Install

Install the package in your host application

```sh
pnpm add @kong-ui-public/split-pane
```

### Basic Usage

Import the components and use them in your Vue application:

```vue
<template>
  <SplitPane>
    <Pane :size="30" :min-size="20" :max-size="50">
      <div>Left pane content</div>
    </Pane>
    <Pane :min-size="20">
      <div>Center pane content</div>
    </Pane>
    <Pane :size="25" :min-size="15">
      <div>Right pane content</div>
    </Pane>
  </SplitPane>
</template>

<script setup lang="ts">
import { SplitPane, Pane } from '@kong-ui-public/split-pane'
</script>
```

To persist pane sizes across sessions, use the `storageKey` prop:

```vue
<template>
  <SplitPane storage-key="my-app-main-layout">
    <Pane :size="30" :min-size="20">
      <div>Left sidebar</div>
    </Pane>
    <Pane :min-size="40">
      <div>Main content</div>
    </Pane>
  </SplitPane>
</template>
```

### Nested Panes

You can nest SplitPane components to create complex layouts:

```vue
<template>
  <SplitPane :push-other-panes="false">
    <!-- Left sidebar -->
    <Pane :size="20" :min-size="15" :max-size="30">
      <div>Sidebar</div>
    </Pane>
    
    <!-- Main content area with horizontal split -->
    <Pane :min-size="40">
      <SplitPane horizontal :push-other-panes="false">
        <Pane>
          <div>Top content</div>
        </Pane>
        <Pane>
          <div>Middle content</div>
        </Pane>
        <Pane>
          <div>Bottom content</div>
        </Pane>
      </SplitPane>
    </Pane>
    
    <!-- Right panel -->
    <Pane :size="25" :min-size="20" :max-size="40">
      <div>Right panel</div>
    </Pane>
  </SplitPane>
</template>

<script setup lang="ts">
import { SplitPane, Pane } from '@kong-ui-public/split-pane'
</script>
```

### Props

#### SplitPane Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `horizontal` | `boolean` | `false` | When `false`, creates vertical split panes with horizontal dividers (side-by-side layout). When `true`, creates horizontal split panes with vertical dividers (stacked layout). |
| `pushOtherPanes` | `boolean` | `true` | Whether to push other panes when dragging a divider. When `false`, only the two adjacent panes are resized. |
| `storageKey` | `string` | `undefined` | Unique key for localStorage persistence. When provided, pane sizes will be automatically saved to localStorage and restored on mount. |

#### Pane Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | `number \| string` | `undefined` | Initial size of the pane in percentage (0-100). If not specified, the pane will be sized equally with other panes. |
| `minSize` | `number \| string` | `0` | Minimum size of the pane in percentage (0-100). Prevents the pane from being resized below this value. |
| `maxSize` | `number \| string` | `100` | Maximum size of the pane in percentage (0-100). Prevents the pane from being resized above this value. |

**Note:** All size values are in percentages relative to the parent SplitPane container.
