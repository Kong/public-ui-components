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

#### `loading`

- type: `boolean`
- required: `false`
- default: `false`

Whether the editor is in a loading state. When true, displays a loading overlay.

#### `options`

- type: `Partial<editor.IStandaloneEditorConstructionOptions>`
- required: `false`
- default: `undefined`

Additional Monaco Editor options to customize the editor further. See [Monaco Editor API](https://microsoft.github.io/monaco-editor/typedoc/interfaces/editor.IStandaloneEditorConstructionOptions.html) for available options.

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
