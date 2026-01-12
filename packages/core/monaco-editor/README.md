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
  - [useMonacoEditor Composable](#usemonacoeditor-composable)
  - [Vite Plugin](#vite-plugin)

## Features

- Vue 3 wrapper component for [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- Syntax highlighting powered by [Shiki](https://shiki.matsu.io/)
- Two-way data binding with `v-model`
- TypeScript support
- Light and dark themes
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

## useMonacoEditor Composable

For advanced use cases, you can use the `useMonacoEditor` composable directly:

```typescript
import { useMonacoEditor } from '@kong-ui-public/monaco-editor'

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
