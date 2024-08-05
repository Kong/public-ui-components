# @kong-ui-public/expressions

Reusable components to support [Kong's expressions language](https://docs.konghq.com/gateway/latest/reference/expressions-language/).

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
- [`monaco-editor`](https://www.npmjs.com/package/monaco-editor) is required as a dependency in the host application
- [`vite-plugin-monaco-editor`](https://www.npmjs.com/package/vite-plugin-monaco-editor) is a required Vite plugin to bundle the Monaco Editor and its web workers
- [`@kong-ui-public/forms`](https://www.npmjs.com/package/@kong-ui-public/forms) is an optional dependency required for the `RouterPlaygroundModal` component

## Usage

### Install

Install required `dependencies` in your host application:

```sh
yarn add monaco-editor
yarn add @kong-ui-public/forms # optional: required for `RouterPlaygroundModal` component
```

Install required `devDependencies` in your host application:

```sh
yarn add -D vite-plugin-monaco-editor
```

Enable the `vite-plugin-monaco-editor` plugin. Your Vite config should look like this:

```ts
import monacoEditorPlugin from 'vite-plugin-monaco-editor'

export default defineConfig({
  // ...
  plugins: [
    monacoEditorPlugin({}),
  ],
  // ...
}
```

For more information on configuring the `vite-plugin-monaco-editor` plugin, you should refer to their [readme docs](https://github.com/vdesjs/vite-plugin-monaco-editor/blob/master/README.md).

### Import and use

Import the component(s) in your host application as well as the package styles:

```ts
import { asyncInit, ExpressionsEditor } from '@kong-ui-public/expressions'
import '@kong-ui-public/expressions/dist/style.css'
import '@kong-ui-public/forms/dist/style.css' // optional: required for `RouterPlaygroundModal` component

app.component('VueFormGenerator', VueFormGenerator) // optional: required for `RouterPlaygroundModal` component
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
