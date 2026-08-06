# @kong-ui-public/expressions

Reusable components to support [Kong's expressions language](https://developer.konghq.com/gateway/routing/expressions/).

- [Features](#features)
- [Requirements](#requirements)
- [Usage](#usage)
  - [Install](#install)
  - [Import and use](#import-and-use)
  - [Color mode (light/dark theme)](#color-mode-lightdark-theme)
- [Individual component documentation](#individual-component-documentation)

## Features

- Provides a Monaco-based editor with autocomplete and syntax highlighting support for the expressions language.

## Requirements

- `vue` must be initialized in the host application
- [`@kong-ui-public/monaco-editor`](https://www.npmjs.com/package/@kong-ui-public/monaco-editor) is required to provide Monaco Editor runtime support and the Vite plugin used to bundle Monaco Editor and its web workers
- [`@kong-ui-public/forms`](https://www.npmjs.com/package/@kong-ui-public/forms) is an optional dependency required for the `RouterPlaygroundModal` component

## Usage

### Install

Install the required Monaco Editor package in your host application:

```sh
yarn add @kong-ui-public/monaco-editor
```

Enable the Monaco Editor Vite plugin from `@kong-ui-public/monaco-editor`. Your Vite config should look like this:

```ts
import monaco from '@kong-ui-public/monaco-editor/vite-plugin'

export default defineConfig({
  // ...
  plugins: [
    monaco({}),
  ],
  // ...
}
```

For more information on configuring languages, editor features, Shiki languages, and Shiki themes, refer to the [`@kong-ui-public/monaco-editor` Vite plugin docs](../monaco-editor/vite-plugin/README.md).

### Import and use

Import the component(s) in your host application as well as the package styles:

```ts
import { asyncInit, ExpressionsEditor } from '@kong-ui-public/expressions'
import '@kong-ui-public/expressions/dist/style.css'
```

This package utilizes [vite-plugin-top-level-await](https://github.com/Menci/vite-plugin-top-level-await) to transform code in order to use top-level await on older browsers. To load the WASM correctly, you must use `await` or `Promise.then` to wait the imported `asyncInit` before using any other imported values.

For example:

```ts
const editorInitialized = ref(false)

asyncInit.then(() => {
  editorInitialized.value = true
  // use the editor and other imported values
})
```

You can also make use of Vue's experimental [Suspense](https://vuejs.org/guide/built-ins/suspense.html) component to load async components that use this package.

### Color mode (light/dark theme)

The Monaco-based editors in this package automatically match the host application's active color mode. To enable this, the host application should `provide` a `ComputedRef<'light' | 'dark'>` under the `app:konnectColorMode` injection key. When provided, the editors reactively switch between their light and dark themes as the value changes. When the key is not provided, the editors fall back to the `'light'` theme.

```ts
// In the host application (e.g. within your root component's setup)
import { computed, provide } from 'vue'

// `isDarkMode` is however your app tracks its current theme
const colorMode = computed<'light' | 'dark'>(() => (isDarkMode.value ? 'dark' : 'light'))

provide('app:konnectColorMode', colorMode)
```

## Individual component documentation

- [`<ExpressionsEditor />`](docs/expressions-editor.md)
- [`<RouterPlaygroundModal />`](docs/router-playground-modal.md)
