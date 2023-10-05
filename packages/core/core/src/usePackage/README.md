# usePackage

- [Imported bundle requirements](#imported-bundle-requirements)
- [Host application](#host-application)
  - [Usage](#usage)

## Imported bundle requirements

1. Imported bundles must be bundled as UMD
2. The imported Vue lib must **NOT** internalize Vue (e.g. include the Vue core in its bundle) as it will pollute the global namespace and break hot-module reload during local development.

## Host application

- Host app must import global Vue from CDN (`/index.html`)

  ```html
  <!-- https://github.com/vuejs/core/tree/main/packages/vue#which-dist-file-to-use -->
  <!-- Cannot use the `vue.runtime.global.js` build since it won't support local hot-reload for local dev -->
    <script src="https://unpkg.com/vue@3.2.40/dist/vue.global.js"></script>
  ````

- **TODO:** Grab the version of Vue from the installed npm package and inject into `/index.html` script import at build time.
- Host app must install Vite plugin import `vite-plugin-externals`
- Host app must `define` `process.env.*` variables as shown below

  ```ts
  import { viteExternalsPlugin } from 'vite-plugin-externals'

  export default defineConfig({
    // Define global constant replacements; required for the host app
    define: {
      'process.env.development': JSON.stringify('development'),
      'process.env.production': JSON.stringify('production'),
    },
    plugins: [
      vue(),
      viteExternalsPlugin({
        vue: 'Vue',
      }),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    build: {
      outDir: './dist',
      minify: true,
      rollupOptions: {
        // make sure to externalize deps that shouldn't be bundled into your library
        external: ['vue'],
        output: {
          // Provide global variables to use in the UMD build for externalized deps
          globals: {
            vue: 'Vue',
          },
          exports: 'named',
          sourcemap: false,
        },
      },
    },
  })
  ```

### Usage

- The `importPackage` asynchronous function can only be called within Vue's `setup()` function, typically inside one of the `defineAsyncComponent` or `onBeforeMount` hooks.
- You must provide `libName` that matches the exact build.lib.name value from the component package
- User should pass script url: `@kong-ui-public/demo-component@1` and then export the UMD by default, and prefix the URL in the importPackage script so that the user doesn't have to provide it, e.g. `https://packages.konghq.tech/`

```html
<template>
  <div>
    <!-- UMD Vue component -->
    <div v-if="!loadingButtons">
      <TestButton
        msg="This is another test"
      />
      <RedButton
        custom-text="This is the red button"
      />
    </div>

    <!-- We must use v-show here so that the kong-auth-login element exists in the DOM -->
    <div v-show="!loadingKongAuthElements">
      <p>The component has loaded!</p>
      <kong-auth-login />
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineAsyncComponent, onBeforeMount } from 'vue'
import { usePackage } from '@kong-ui-public/demo-core'

// Import 2 button components from the same package
const { importPackage: importButtons, loadingPackage: loadingButtons } = usePackage({
  script: {
    libName: 'demo-component', // Required for UMD builds
    url: 'http://localhost:3333/demo-component.umd.js',
    type: 'umd',
  },
  styles: {
    urls: ['http://localhost:3333/style.css'],
  },
})

const TestButton = defineAsyncComponent(async (): Promise<any> => {
  const { TestButton } = await importButtons()
  // @ts-ignore
  return TestButton
})

const RedButton = defineAsyncComponent(async (): Promise<any> => {
  const { RedButton } = await importButtons()
  // @ts-ignore
  return RedButton
})

// Import kong-auth-elements
const { importPackage: importKongAuthElements, loadingPackage: loadingKongAuthElements } = usePackage({
  script: {
    libName: 'kong-auth-elements',
    url: 'https://packages.konghq.tech/@kong/kong-auth-elements@1/dist/kong-auth-elements.umd.js',
    type: 'umd',
  },
  styles: {
    urls: ['https://packages.konghq.tech/@kong/kong-auth-elements@1/dist/style.css'],
    shadowRoot: 'kong-auth-login',
  },
  onReady: async () => {
    // When package is imported, call the provided function to register the web components to the window
    // @ts-ignore
    window.registerKongAuthNativeElements({
      userEntity: 'user',
    })
  },
})

// Since we're not using the `defineAsyncComponent` method and just registering the web component to the window, we need to use the `onBeforeMount` hook
onBeforeMount(async () => {
  await importKongAuthElements()
})
</script>
```
