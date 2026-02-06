# @kong-ui-public/monaco-editor

A kong UI Monaco Editor wrapper for Vue 3 with syntax highlighting powered by Shiki.

- [Features](#features)
- [Requirements](#requirements)
- [Usage](#usage)
  - [Install](#install)
  - [Register](#register)
  - [MonacoEditor Component](#monacoeditor-component)
    - [Props](#props)
    - [v-model](#v-model)
    - [Slots](#slots)
    - [Usage Example](#usage-example)
  - [MonacoEditorStatusOverlay Component](#monacoeditorstatusoverlay-component)
    - [Props](#props-1)
    - [Usage Example](#usage-example-1)
  - [useMonacoEditor Composable](#usemonacoeditor-composable)
  - [Vite Plugin](#vite-plugin)

## Features

- Vue 3 wrapper component for [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- Syntax highlighting powered by [Shiki](https://shiki.matsu.io/)
- Two-way data binding with `v-model`
- TypeScript support
- Light and dark themes
- Customizable toolbar with built-in and custom action buttons
- Keyboard shortcuts support for actions
- Configurable context menu integration
- Customizable editor options
- Loading and empty states with customizable slots
- Composable API for advanced use cases
- Vite plugin for optimized builds

## Requirements

- `vue` must be initialized in the host application
- `@kong/kongponents` must be available as a `dependency` in the host application (for icons)

## Usage

### Install

Install the package in your host application

```sh
pnpm add @kong-ui-public/monaco-editor
```

Import the styles in your application:

```typescript
import '@kong-ui-public/monaco-editor/dist/runtime/style.css'
```

or if you prefer css

```css
@import "@kong-ui-public/monaco-editor/dist/runtime/style.css";
```

### Register

You can register the `MonacoEditor` component globally or import it locally in your components.

#### Global Registration

```typescript
import { createApp } from 'vue'
import { MonacoEditor } from '@kong-ui-public/monaco-editor'

const app = createApp(App)

app.component('MonacoEditor', MonacoEditor)
```

#### Local Registration

```vue
<script setup lang="ts">
import { MonacoEditor } from '@kong-ui-public/monaco-editor'
</script>
```

## MonacoEditor Component

### Props

#### `appearance`

- type: `'embedded' | 'standalone'`
- required: `false`
- default: `'embedded'`

The appearance style of the Monaco Editor container.

- `embedded`: minimal styling, intended to blend into the surrounding layout.
- `standalone`: renders with an input-like border and adds extra editor padding for more comfortable editing.

#### `theme`

- type: `'light' | 'dark'`
- required: `false`
- default: `'light'`

The theme of the Monaco Editor instance.

#### `language`

- type: `string`
- required: `false`
- default: `'markdown'`

The programming language for syntax highlighting. Supports all languages available in [Shiki](https://shiki.matsu.io/languages).

#### `options`

- type: `Partial<editor.IStandaloneEditorConstructionOptions>`
- required: `false`
- default: `undefined`

Additional Monaco Editor options to customize the editor further. See [Monaco Editor API](https://microsoft.github.io/monaco-editor/typedoc/interfaces/editor.IStandaloneEditorConstructionOptions.html) for available options.

#### `loading`

- type: `boolean`
- required: `false`
- default: `false`

Indicates that the editor is waiting for external data in addition to its own internal initialization.

> [!WARNING]
> This prop does not control the Monaco Editor's initialization lifecycle.

The editor manages its own internal loading state while Monaco and syntax highlighting are being initialized.
The loading prop is additive, it allows consumers to keep the loading overlay visible if additional async work (such as fetching content) is still in progress after the editor itself is ready.

The loading overlay is shown when either:
- The editor is still initializing internally, or
- The loading prop is set to true

#### `showLoadingState`

- type: `boolean`
- required: `false`
- default: `true`

Controls whether the loading state overlay is rendered.

> [!NOTE]
> This does not affect editor initialization. When set to false, the editor will still initialize and emit ready, but no loading UI will be displayed.

Useful for constrained layouts where the loading overlay would be visually disruptive.

#### `showEmptyState`

- type: `boolean`
- required: `false`
- default: `true`

Controls whether the empty state overlay is rendered when the editor has no content.

> [!NOTE]
> This does not affect editor initialization. When set to false, the editor will still initialize and emit ready, but no empty state UI will be displayed even if the content is empty.

Useful for embedded or compact layouts where the empty state overlay is unnecessary.

#### `toolbar`

- type: `MonacoEditorToolbarOptions`
- required: `false`
- default: `false`

Configuration for the editor toolbar, which displays action buttons above the editor. The toolbar supports both built-in actions and custom user-defined actions.

##### Built-in Actions

The following built-in actions are available:

- **`format`**: Formats the editor content using Monaco's formatter
- **`search`**: Toggles the search/find widget
- **`fullScreen`**: Toggles full-screen mode for the editor

You can enable built-in actions by setting them to `true` or customize them with configuration objects:

```typescript
interface MonacoEditorToolbarOptions {
  actions?: {
    // Built-in actions
    format?: boolean | MonacoEditorActionConfig
    search?: boolean | MonacoEditorActionConfig
    fullScreen?: boolean | MonacoEditorActionConfig
    
    // Custom actions
    [key: string]: boolean | MonacoEditorActionConfig | undefined
  }
}
```

##### Action Configuration

Each action can be configured with the following options:

```typescript
interface MonacoEditorActionConfig {
  /** Unique identifier for the action */
  id: string
  
  /** Display label for the action */
  label?: string
  
  /** Icon component for the action button */
  icon?: Component
  
  /** Keybindings associated with the action (e.g., ['Command', 'Shift', 'F']) */
  keybindings?: string[]
  
  /**
   * The action to execute when the button is clicked.
   * Can be:
   * - A function that receives the editor composable instance
   * - A string ID of a Monaco editor command (e.g., 'editor.action.formatDocument')
   */
  action: string | ((editor: ReturnType<typeof useMonacoEditor>) => void)
  
  /** Where the action should appear in the toolbar */
  placement?: 'left' | 'center' | 'right' // default: 'left'
  
  /** Order of the action within its placement (lower numbers appear first) */
  order?: number // default: 100
  
  /** Group identifier for visual grouping with separators */
  group?: number | string
  
  /** Whether to show this action in the context menu (right-click) */
  showInContextMenu?: boolean // default: true
  
  /** Context menu group identifier */
  contextMenuGroupId?: string // default: 'navigation'
  
  /** Order of the action within its context menu group */
  contextMenuOrder?: number // default: 1
}
```

##### Keybindings

Actions can define keyboard shortcuts using the `keybindings` property. Keybindings are specified as an array of strings representing keys and modifiers.

**Supported Modifiers:**
- `Command`, `Cmd`, `Ctrl`, `CtrlCmd` (maps to Cmd on Mac, Ctrl on Windows/Linux)
- `Shift`
- `Alt`, `Option`
- `Win`, `Meta`

**Supported Keys:**
- Letters: `a`-`z` (case-insensitive)
- Digits: `0`-`9`
- Function keys: `F1`-`F12`
- Special keys: `Enter`, `Escape`/`Esc`, `Space`, `Tab`, `Backspace`, `Delete`, `Insert`, `Home`, `End`, `PageUp`, `PageDown`
- Arrow keys: `Up`, `Down`, `Left`, `Right`, `ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`

**Examples:**
```typescript
keybindings: ['Command', 'S']           // Cmd+S (Mac) or Ctrl+S (Win/Linux)
keybindings: ['Ctrl', 'Shift', 'F']     // Ctrl+Shift+F
keybindings: ['Alt', 'Enter']           // Alt+Enter
keybindings: ['Command', 'K']           // Cmd+K (Mac) or Ctrl+K (Win/Linux)
```

##### Example: Basic Toolbar with Built-in Actions

```vue
<template>
  <MonacoEditor
    v-model="code"
    language="json"
    :toolbar="{
      actions: {
        format: true,
        search: true,
        fullScreen: true,
      },
    }"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { MonacoEditor } from '@kong-ui-public/monaco-editor'

const code = ref('{"hello": "world"}')
</script>
```

##### Example: Customized Built-in Actions

```vue
<template>
  <MonacoEditor
    v-model="code"
    language="json"
    :toolbar="{
      actions: {
        format: {
          placement: 'right',
          order: 1,
          keybindings: ['Command', 'Shift', 'F'],
        },
        search: {
          placement: 'right',
          order: 2,
        },
        fullScreen: {
          placement: 'right',
          order: 3,
          group: 'view',
        },
      },
    }"
  />
</template>
```

##### Example: Custom Actions

```vue
<template>
  <MonacoEditor
    v-model="code"
    language="json"
    :toolbar="{
      actions: {
        format: true,
        
        // Custom action with function
        validate: {
          id: 'validateJson',
          label: 'Validate JSON',
          icon: CheckCircleIcon,
          placement: 'right',
          keybindings: ['Command', 'K'],
          action: (editor) => {
            try {
              JSON.parse(editor.editor.value?.getValue() || '')
              alert('Valid JSON!')
            } catch (error) {
              alert('Invalid JSON: ' + error.message)
            }
          },
        },
        
        // Custom action with Monaco command ID
        copyContent: {
          id: 'copyAllContent',
          label: 'Copy All',
          icon: CopyIcon,
          placement: 'right',
          action: 'editor.action.clipboardCopyAction',
        },
      },
    }"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { MonacoEditor } from '@kong-ui-public/monaco-editor'
import { CheckCircleIcon, CopyIcon } from '@kong/icons'

const code = ref('{"hello": "world"}')
</script>
```

##### Example: Advanced Configuration with Groups

```vue
<template>
  <MonacoEditor
    v-model="code"
    language="typescript"
    :toolbar="{
      actions: {
        // Edit group on the left
        format: {
          placement: 'left',
          order: 1,
          group: 'edit',
        },
        
        // View group in the center
        search: {
          placement: 'center',
          order: 1,
          group: 'view',
        },
        fullScreen: {
          placement: 'center',
          order: 2,
          group: 'view',
        },
        
        // Custom actions on the right
        runCode: {
          id: 'runCode',
          label: 'Run Code',
          icon: PlayCircleIcon,
          placement: 'right',
          order: 1,
          keybindings: ['Command', 'Enter'],
          action: (editor) => {
            console.log('Running code:', editor.editor.value?.getValue())
          },
        },
      },
    }"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { MonacoEditor } from '@kong-ui-public/monaco-editor'
import { PlayCircleIcon } from '@kong/icons'

const code = ref('console.log("Hello, world!")')
</script>
```

### Events

#### `ready`

Emitted when the Monaco editor instance has finished initializing and is ready for interaction.

This event reflects only the editor's internal readiness, not any external loading state controlled by the loading prop.

**Payload:**

- `editor`: The Monaco `IStandaloneCodeEditor` instance.

##### Example

```vue
<template>
  <MonacoEditor
    v-model="code"
    language="javascript"
    @ready="onEditorReady"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { editor } from 'monaco-editor'

const code = ref('// your code here')

function onEditorReady(editorInstance: editor.IStandaloneCodeEditor) {
  // You can now use the Monaco editor instance
  editorInstance.focus()
}
</script>
```

### v-model

The component requires a `v-model` binding to manage the editor content:

```vue
<MonacoEditor v-model="code" />
```

### Slots

#### `state-loading`

Slot for customizing the loading state overlay. Receives `isLoading` as a slot prop.

```vue
<MonacoEditor v-model="code">
  <template #state-loading="{ isLoading }">
    <div v-if="isLoading">Custom loading...</div>
  </template>
</MonacoEditor>
```

#### `state-empty`

Slot for customizing the empty state overlay. Receives `isEmpty` as a slot prop.

```vue
<MonacoEditor v-model="code">
  <template #state-empty="{ isEmpty }">
    <div v-if="isEmpty">Custom empty state...</div>
  </template>
</MonacoEditor>
```

### Usage Example

```vue
<template>
  <div class="editor-wrapper">
    <MonacoEditor
      v-model="code"
      :theme="isDark ? 'dark' : 'light'"
      appearance="standalone"
      language="json"
      :options="{
        readOnly: false,
        minimap: {
          enabled: false,
        },
      }"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { MonacoEditor } from '@kong-ui-public/monaco-editor'

const code = ref('{\n  "hello": "world"\n}')
const isDark = ref(false)
</script>

<style scoped>
.editor-wrapper {
  height: 500px;
  width: 100%;
}
</style>
```

## MonacoEditorStatusOverlay Component

The `MonacoEditorStatusOverlay` component displays a centered overlay message within the Monaco Editor, typically used for status messages like loading, empty states, or error messages.

> [!NOTE]
> The `MonacoEditor` component uses `MonacoEditorStatusOverlay` internally for two built-in states:
> - **Loading state** (`state-loading` slot): Shown while the editor is initializing or when the `loading` prop is `true`
> - **Empty state** (`state-empty` slot): Shown when the editor is ready but has no content
>
> You can customize these by providing your own content in the respective slots, or use `MonacoEditorStatusOverlay` with custom props for consistent styling.

### Props

#### `title`

- type: `string`
- required: `true`

The title to display in the overlay.

#### `message`

- type: `string`
- required: `true`

The message to display in the overlay.

#### `icon`

- type: `Component`
- required: `false`
- default: `undefined`

An optional icon component to display above the title. Can be any Vue component, typically an icon from `@kong/icons`.

### Usage Example

```vue
<template>
  <div class="editor-wrapper">
    <MonacoEditor
      v-model="code"
      language="json"
    >
      <template #state-loading>
        <MonacoEditorStatusOverlay
          title="Loading"
          message="Please wait while the editor is initializing..."
          :icon="SpinnerIcon"
        />
      </template>
    </MonacoEditor>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { MonacoEditor, MonacoEditorStatusOverlay } from '@kong-ui-public/monaco-editor'
import { SpinnerIcon } from '@kong/icons'

const code = ref('')
</script>

<style scoped>
.editor-wrapper {
  height: 500px;
  width: 100%;
  position: relative;
}
</style>
```

You can also use it for custom empty states:

```vue
<template>
  <MonacoEditor v-model="code">
    <template #state-empty>
      <MonacoEditorStatusOverlay
        title="No Content"
        message="Start typing to add content to the editor"
        :icon="DocumentIcon"
      />
    </template>
  </MonacoEditor>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { MonacoEditor, MonacoEditorStatusOverlay } from '@kong-ui-public/monaco-editor'
import { DocumentIcon } from '@kong/icons'

const code = ref('')
</script>
```

## useMonacoEditor Composable

For advanced use cases, you can use the `useMonacoEditor` composable directly:

```typescript
import { ref } from 'vue'
import { useMonacoEditor } from '@kong-ui-public/monaco-editor'

const editorRef = ref<HTMLElement | null>(null)
const codeRef = ref('// your code here')

const monacoEditor = useMonacoEditor(editorRef, {
  language: 'javascript',
  code: codeRef,
  theme: 'light',
  monacoOptions: {
    readOnly: false,
    minimap: {
      enabled: false,
    },
  },
})

// Access editor states
console.log(monacoEditor.editorStates.hasContent)

// Access editor methods
monacoEditor.setContent('new content')
monacoEditor.focus()
```

### Example with Custom Actions

```typescript
import { ref } from 'vue'
import { useMonacoEditor } from '@kong-ui-public/monaco-editor'
import type { MonacoEditorActionConfig } from '@kong-ui-public/monaco-editor'

const editorRef = ref<HTMLElement | null>(null)
const codeRef = ref('console.log("Hello")')

// Define custom actions
const customActions: MonacoEditorActionConfig[] = [
  {
    id: 'runCode',
    label: 'Run Code',
    keybindings: ['Command', 'Enter'],
    action: (editor) => {
      const code = editor.editor.value?.getValue()
      console.log('Executing:', code)
      eval(code)
    },
  },
  {
    id: 'clearConsole',
    label: 'Clear Console',
    keybindings: ['Command', 'K'],
    action: () => {
      console.clear()
    },
  },
]

const monacoEditor = useMonacoEditor(editorRef, {
  language: 'javascript',
  code: codeRef,
  actions: customActions,
  onReady: (editor) => {
    console.log('Editor is ready!', editor)
  },
})

// Register additional actions dynamically
setTimeout(() => {
  monacoEditor.registerActions([
    {
      id: 'customFormat',
      label: 'Custom Format',
      action: 'editor.action.formatDocument',
    },
  ])
}, 1000)
```

### Example with Keyboard Commands

```typescript
import { ref } from 'vue'
import { useMonacoEditor } from '@kong-ui-public/monaco-editor'

const editorRef = ref<HTMLElement | null>(null)
const codeRef = ref('# Markdown content')

const monacoEditor = useMonacoEditor(editorRef, {
  language: 'markdown',
  code: codeRef,
})

// Trigger built-in Monaco commands
function formatDocument() {
  monacoEditor.triggerKeyboardCommand('editor.action.formatDocument')
}

function toggleCommentLine() {
  monacoEditor.triggerKeyboardCommand('editor.action.commentLine')
}

function showSearchWidget() {
  monacoEditor.toggleSearchWidget()
}
```

## Vite Plugin

This package includes a Vite plugin for optimized builds. The plugin reduces bundle size by allowing you to selectively include only the languages and features you need.

```typescript
import { defineConfig } from 'vite'
import MonacoVitePlugin from '@kong-ui-public/monaco-editor/vite-plugin'

export default defineConfig({
  plugins: [
    MonacoVitePlugin({
      languages: ['json', 'yaml', 'javascript'],
      features: ['bracketMatching', 'comment', 'format'],
      shiki: {
        langs: ['json', 'yaml', 'javascript'],
        themes: ['catppuccin-latte', 'catppuccin-mocha'],
      },
    }),
  ],
})
```

For more details on configuration options, see the [Vite Plugin README](https://github.com/Kong/public-ui-components/blob/main/packages/core/monaco-editor/vite-plugin/README.md).

## API Reference

### Exported Components

```typescript
import {
  MonacoEditor,              // Main editor component
  MonacoEditorStatusOverlay, // Status overlay component for loading/empty states
} from '@kong-ui-public/monaco-editor'
```

### Exported Composables

```typescript
import {
  useMonacoEditor,           // Core editor composable
} from '@kong-ui-public/monaco-editor'
```

### Common Monaco Commands

These command IDs can be used with `triggerKeyboardCommand()` or as string values for action configurations:

#### Editing Commands
- `editor.action.formatDocument` - Format the entire document
- `editor.action.formatSelection` - Format the current selection
- `editor.action.commentLine` - Toggle line comment
- `editor.action.addCommentLine` - Add line comment
- `editor.action.removeCommentLine` - Remove line comment
- `editor.action.blockComment` - Toggle block comment
- `editor.action.indentLines` - Indent current line(s)
- `editor.action.outdentLines` - Outdent current line(s)
- `editor.action.copyLinesUpAction` - Copy line up
- `editor.action.copyLinesDownAction` - Copy line down
- `editor.action.moveLinesUpAction` - Move line up
- `editor.action.moveLinesDownAction` - Move line down
- `editor.action.deleteLines` - Delete current line(s)

#### Search & Replace Commands
- `actions.find` - Open find widget
- `editor.action.startFindReplaceAction` - Open find and replace widget
- `actions.findWithSelection` - Find with selection
- `editor.action.nextMatchFindAction` - Find next match
- `editor.action.previousMatchFindAction` - Find previous match

#### Selection Commands
- `editor.action.selectAll` - Select all
- `editor.action.smartSelect.expand` - Expand selection
- `editor.action.smartSelect.shrink` - Shrink selection
- `editor.action.selectToBracket` - Select to bracket

#### Clipboard Commands
- `editor.action.clipboardCopyAction` - Copy
- `editor.action.clipboardCutAction` - Cut
- `editor.action.clipboardPasteAction` - Paste

#### Folding Commands
- `editor.fold` - Fold current region
- `editor.unfold` - Unfold current region
- `editor.foldAll` - Fold all regions
- `editor.unfoldAll` - Unfold all regions
- `editor.foldAllBlockComments` - Fold all block comments
- `editor.foldAllMarkerRegions` - Fold all marker regions

### Quick Reference: Toolbar Configuration

#### Enable all built-in actions:
```typescript
:toolbar="{ actions: { format: true, search: true, fullScreen: true } }"
```

#### Custom action with keyboard shortcut:
```typescript
:toolbar="{
  actions: {
    myAction: {
      id: 'myAction',
      label: 'My Action',
      icon: MyIcon,
      keybindings: ['Command', 'K'],
      action: (editor) => { /* ... */ }
    }
  }
}"
```

#### Action with Monaco command:
```typescript
:toolbar="{
  actions: {
    format: {
      action: 'editor.action.formatDocument'
    }
  }
}"
```

#### Positioning actions:
```typescript
:toolbar="{
  actions: {
    left: { placement: 'left', order: 1, ... },
    center: { placement: 'center', order: 1, ... },
    right: { placement: 'right', order: 1, ... }
  }
}"
```

#### Grouping actions:
```typescript
:toolbar="{
  actions: {
    action1: { group: 'edit', ... },
    action2: { group: 'edit', ... },
    action3: { group: 'view', ... }
  }
}"
```

### Tips & Best Practices

1. **Use keybindings consistently**: Follow platform conventions (Command on Mac, Ctrl on Windows/Linux) by using modifiers like `Command`, `Ctrl`, or `CtrlCmd`.

2. **Group related actions**: Use the `group` property to visually separate different categories of actions in the toolbar.

3. **Provide labels for accessibility**: Always include a `label` for toolbar actions to improve accessibility.

4. **Use built-in commands when possible**: Monaco provides many built-in commands that are well-tested and optimized.

5. **Handle editor state**: Check editor readiness and content state before performing actions that depend on editor content.

6. **Context menu integration**: Set `showInContextMenu: false` for toolbar-only actions that don't make sense in the right-click context menu.
