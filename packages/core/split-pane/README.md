# @kong-ui-public/split-pane

A shared SplitPane component for Vue 3 applications with resizable panes, vertical navigation, and collapsible panels.

- [Features](#features)
- [Requirements](#requirements)
- [Usage](#usage)
  - [Install](#install)
  - [Props](#props)
  - [Slots](#slots)
  - [Composables](#composables)
- [Components](#components)
  - [SplitPane](#splitpane)
  - [SplitToolbar](#splittoolbar)
- [Examples](#examples)

## Features

- **Three-pane layout**: Left, center, and right panes with customizable visibility
- **Resizable panes**: Drag-to-resize functionality between center and right panes
- **Collapsible left pane**: Expand/collapse the left pane with smooth transitions
- **Vertical navigation**: Optional navigation sidebar with icon buttons and tooltips
- **Flexible configuration**: Control pane visibility and maximum widths
- **Toolbar support**: Optional toolbar slot above the panes, with dedicated SplitToolbar component
- **Responsive**: Automatically adjusts to window resizing
- **Accessible**: Full keyboard support and ARIA attributes

## Requirements

- `vue` must be initialized in the host application
- `@kong/kongponents` must be available as a `dependency` in the host application
- `vue-router` (optional, required if using navigation items with routing)

## Usage

### Install

Install the package in your host application:

```sh
pnpm add @kong-ui-public/split-pane
```

## Components

### SplitPane

The main layout component providing a three-pane split view with optional navigation, resizable panes, and a collapsible left panel.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `resizable` | `boolean` | `true` | Enable drag-to-resize functionality between center and right panes |
| `showResizeHandle` | `boolean` | `true` | Show/hide the resize handle divider |
| `showNavigation` | `boolean` | `true` | Show/hide the vertical navigation sidebar |
| `navigationItems` | `VerticalNavigationItem[]` | `[]` | Array of navigation items to display in the sidebar |
| `paneLeft` | `PaneConfig` | `{ visible: true, maxWidth: '500px' }` | Configuration for the left pane |
| `paneCenter` | `PaneConfig` | `{ visible: true, maxWidth: '50%' }` | Configuration for the center pane |
| `paneRight` | `PaneConfig` | `{ visible: true, maxWidth: '50%' }` | Configuration for the right pane |

#### Type Definitions

```typescript
interface PaneConfig {
  /** Pass false to hide the pane even if it contains slot content */
  visible?: boolean
  /** The max width of the pane (e.g., '500px', '50%') */
  maxWidth?: string
}

interface VerticalNavigationItem {
  /** Vue Router location object for navigation */
  to?: RouteLocationRaw
  /** Tooltip text displayed on hover */
  tooltip: string
  /** Whether this navigation item is currently active */
  active: boolean
  /** Icon component to display */
  icon: Component
  /** Test ID for the navigation item */
  testid: string
}
```

#### Default Constraints

- **Left pane**: Min width `260px`, max width `500px` (customizable)
- **Center/Right panes**: Min width `300px` each
- When `resizable` is `true`, center and right panes have no max-width constraint
- When `resizable` is `false`, center and right panes respect the `maxWidth` prop

### Slots

The component provides four named slots:

| Slot | Description |
|------|-------------|
| `toolbar` | Optional toolbar content displayed above the panes |
| `pane-left` | Content for the collapsible left pane |
| `pane-center` | Content for the resizable center pane |
| `pane-right` | Content for the right pane |

### SplitToolbar

A toolbar component designed to be used within the `toolbar` slot of SplitPane. It provides a three-section layout (left, center, right) with consistent styling and spacing.

#### Features

- **Three-section layout**: Left, center, and right sections for organizing toolbar content
- **Consistent spacing**: Center section always remains centered, even when left or right sections are empty
- **Sticky positioning**: Stays at the top of the pane during scrolling
- **Flexible content**: Each section can contain any Vue components or HTML elements

#### Slots

The SplitToolbar component provides three named slots:

| Slot | Description |
|------|-------------|
| `left` | Left-aligned toolbar content (e.g., navigation, back buttons) |
| `center` | Center-aligned toolbar content (e.g., titles, search) |
| `right` | Right-aligned toolbar content (e.g., actions, buttons) |

**Note**: The center section will remain centered regardless of whether the left or right sections contain content, ensuring consistent visual alignment.

### Composables

#### `useSplitPane()`

A composable that provides split-pane functionality including drag-to-resize and pane collapsing.

**Returns:**

```typescript
{
  isDraggingPaneLeft: ComputedRef<boolean>
  isDraggingInnerPanes: ComputedRef<boolean>
  startDraggingInnerPanes: (e: MouseEvent) => void
  refreshInnerPaneSizes: () => void
  paneLeftExpanded: ComputedRef<boolean>
  togglePaneLeft: () => Promise<void>
  startDraggingPaneLeft: (e: MouseEvent) => void
  centerPaneWidth: Ref<number>
}
```

## Examples

### Basic Three-Pane Layout

```vue
<template>
  <SplitPane
    :navigation-items="navItems"
    :show-navigation="true"
  >
    <template #pane-left>
      <div class="left-content">
        <!-- Collapsible left sidebar content -->
      </div>
    </template>

    <template #pane-center>
      <div class="center-content">
        <!-- Main content area -->
      </div>
    </template>

    <template #pane-right>
      <div class="right-content">
        <!-- Right panel content -->
      </div>
    </template>
  </SplitPane>
</template>

<script setup lang="ts">
import { SplitPane } from '@kong-ui-public/split-pane'
import { HomeIcon, SettingsIcon } from '@kong/icons'

const navItems = [
  {
    to: '/home',
    tooltip: 'Home',
    active: true,
    icon: HomeIcon,
    testid: 'home',
  },
  {
    to: '/settings',
    tooltip: 'Settings',
    active: false,
    icon: SettingsIcon,
    testid: 'settings',
  },
]
</script>
```

### With Toolbar

```vue
<template>
  <SplitPane>
    <template #toolbar>
      <SplitToolbar>
        <template #left>
          Left Toolbar
        </template>
        <template #center>
          Center Toolbar
        </template>
        <template #right>
          Right Toolbar
        </template>
      </SplitToolbar>
    </template>

    <template #pane-center>
      <!-- Content -->
    </template>
  </SplitPane>
</template>
```

### Two-Pane Layout (No Left Pane)

```vue
<template>
  <SplitPane
    :pane-left="{ visible: false }"
    :show-navigation="false"
  >
    <template #pane-center>
      <!-- Main content -->
    </template>

    <template #pane-right>
      <!-- Side panel -->
    </template>
  </SplitPane>
</template>
```

### Non-Resizable Layout

```vue
<template>
  <SplitPane
    :resizable="false"
    :pane-center="{ maxWidth: '60%' }"
    :pane-right="{ maxWidth: '40%' }"
  >
    <template #pane-center>
      <!-- Fixed width center pane -->
    </template>

    <template #pane-right>
      <!-- Fixed width right pane -->
    </template>
  </SplitPane>
</template>
```

### Custom Pane Widths

```vue
<template>
  <SplitPane
    :pane-left="{ maxWidth: '400px' }"
    :pane-center="{ maxWidth: '800px' }"
  >
    <template #pane-left>
      <!-- Custom width left pane -->
    </template>

    <template #pane-center>
      <!-- Custom width center pane -->
    </template>

    <template #pane-right>
      <!-- Flexible right pane -->
    </template>
  </SplitPane>
</template>
```
