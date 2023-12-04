# @kong-ui-public/vite-plugin-konnect-loading-template

A Vite plugin that injects a static HTML Konnect loading template in the host application's root `div#app` element that is displayed until the app has finished hydrating. The template is **manually compiled** from the `KonnectAppShell > AppLayout` components, and includes (inline) all necessary styles.

The template, by default, is hidden for the following URL paths on the Konnect UI domain(s):

```ts
// Paths defined in `https://github.com/shared-ui-components/packages/core/konnect-app-shell/vite-plugins/vite-plugin-konnect-app-loading-template/template.html`
const excludedPaths = [
  '/login',
  '/logout',
  '/register',
  '/accept-invitation',
  '/forgot-password',
  '/reset-password',
  '/org-switcher',
  '/onboarding',
]
```

#### Requirements

- `cheerio` must be installed as a `devDependency` in your host application

    ```sh
    # pnpm
    pnpm --filter "your-package" add -D cheerio

    # yarn
    yarn add -D cheerio
    ```

#### Installation

```shell
# pnpm
pnpm --filter "{your package name}" add -D @kong-ui-public/vite-plugin-konnect-loading-template

# yarn
yarn add -D @kong-ui-public/vite-plugin-konnect-loading-template
```

Ensure that your host app utilizes Vue's default root container in it's `/index.html` file:

```html
<div id="app"></div>
```

Next, import the Vite plugin in your app's `vite.config.ts` file (if you are in the [`konnect-ui-apps` repository](https://github.com/Kong/konnect-ui-apps), the loading template is already configured)

```ts
// vite.config.ts

import { defineConfig } from 'vite'
import KonnectLoadingTemplateVitePlugin from '@kong-ui-public/vite-plugin-konnect-loading-template'

export default defineConfig({
  // ... more code
  plugins: [
    vue(),
    // Inject the static Konnect app loading template
    KonnectLoadingTemplateVitePlugin(),
  ]
})
```
