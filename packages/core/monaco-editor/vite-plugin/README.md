# @kong-ui-public/monaco-editor/vite-plugin

A plugin to simplify loading the [Monaco Editor](https://github.com/microsoft/monaco-editor) with [Vite](https://vite.dev/). This plugin can be used standalone with `monaco-editor` or along with the runtime code of `@kong-public-ui/monaco-editor` to reduce bundle size.

This plugin also configures and loads the Monaco Editor web workers for you, so you don't need to manually set them up as described in the [official Monaco Editor ESM integration guide](https://github.com/microsoft/monaco-editor/blob/main/docs/integrate-esm.md#using-vite).

Since `@kong-public-ui/monaco-editor` uses [`@shikijs/monaco`](https://shiki.style/packages/monaco) to highlight Monaco Editor, this plugin also provides fine-grained control over the bundled languages and themes of shiki.

> [!IMPORTANT]
> `@kong-public-ui/monaco-editor` loads all the languages and features of Monaco Editor and all the corresponding languages of shiki by default, which significantly increases bundle size. Furthermore, since `@shikijs/monaco` integrates Shiki with Monaco Editor synchronously and loads all languages by default, it greatly increases Monaco Editor's initial loading time. It is strongly recommended to use this Vite plugin to reduce bundle size and improve loading performance by selectively including only the languages and features you need.

> [!TIP]
> This Vite plugin only needs to be applied in the consumer app. If you are developing a library based on Monaco Editor or `@kong-public-ui/monaco-editor`, you only need to externalize monaco-editor during the build.

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

- `shiki` (`object`) - Shiki fine-grained bundle configuration:
  - `langs` (`string[]`) - Languages to include for Shiki syntax highlighting. By default, uses the same languages specified in the `languages` option above.
  - `themes` (`string[]`) - Themes to include for Shiki syntax highlighting. By default, `catppuccin-latte` and `catppuccin-mocha` are included.

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
      shiki: {
        langs: ['javascript', 'typescript', 'json', 'yaml'],
        themes: ['catppuccin-latte', 'catppuccin-mocha', 'nord'],
      },
    }),
  ],
})
```
