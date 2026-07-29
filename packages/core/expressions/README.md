# @kong-ui-public/expressions

Reusable components to support [Kong's expressions language](https://developer.konghq.com/gateway/routing/expressions/).

- [Features](#features)
- [Requirements](#requirements)
- [Usage](#usage)
  - [Install](#install)
  - [Import and use](#import-and-use)
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

## Individual component documentation

- [`<ExpressionsEditor />`](docs/expressions-editor.md)
- [`<RouterPlaygroundModal />`](docs/router-playground-modal.md)
