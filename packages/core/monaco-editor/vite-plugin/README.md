# @kong-ui-public/monaco-editor/vite-plugin

A plugin to simplify loading the [Monaco Editor](https://github.com/microsoft/monaco-editor) with [Vite](https://vite.dev/). This plugin can be used standalone with `monaco-editor` or along with the runtime code of `@kong-public-ui/monaco-editor` to reduce bundle size.

This plugin configures and loads the Monaco Editor web workers for you, so you don't need to manually set them up as described in the [official Monaco Editor ESM integration guide](https://github.com/microsoft/monaco-editor/blob/main/docs/integrate-esm.md#using-vite).

## Usage

```ts
import { defineConfig } from 'vite'
import monaco from '@kong-ui-public/monaco-editor/vite-plugin'

export default defineConfig({
  plugins: [monaco({})],
})
```

## Options

Options can be passed in to `@kong-ui-public/monaco-editor/vite-plugin`. They can be used to generate a smaller editor bundle by selecting only certain languages or only certain editor features:

- `languages` (`string[]`) - include only a subset of the languages supported. By default, all languages shipped with the `monaco-editor` will be included. The plugin will automatically configure the web workers for all included languages.

- `features` (`string[]`) - include only a subset of the editor features. By default, all features shipped with the `monaco-editor` will be included. Instead of enumerating included features, it is also possible to exclude certain default features by prefixing them with an exclamation mark `!`.

- `customLanguages` (`{label:string; entry:string; worker:{id:string, entry:string} }[]`) - Custom languages (outside of the ones shipped with the `monaco-editor`), e.g. [monaco-yaml](https://github.com/remcohaszing/monaco-yaml).

## Example

```ts
import { defineConfig } from 'vite'
import monaco from '@kong-ui-public/monaco-editor/vite-plugin'

export default defineConfig({
  plugins: [
    monaco({
      languages: ['javascript', 'typescript', 'json', 'yaml'],
      features: [
        'bracketMatching',
        'comment',
        'format',
        'hover',
        'placeholderText',
        'suggest',
      ],
      customLanguages: [
        {
          label: 'yaml',
          entry: 'monaco-yaml',
          worker: {
            id: 'monaco-yaml/yamlWorker',
            entry: 'monaco-yaml/yaml.worker',
          },
        },
      ],
    }),
  ],
})
```
