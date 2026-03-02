# @kong-ui-public/core

> **Note**: This package must **not** contain Vue components.

- [useAxios](#useaxios)
- [useDebounce](#usedebounce)
- [usePackage](#usepackage)
- [useSwrvState](#useswrvstate)
- [useTablePreferences](#usetablepreferences)
- [useWindow](#usewindow)
- [v-safe-html](#v-safe-html)

## useAxios

[useAxios docs](./src/useAxios/README.md)

## useDebounce

[useDebounce docs](./src/useDebounce/README.md)

## usePackage

[usePackage docs](./src/usePackage/README.md)

## useSwrvState

[useSwrvState docs](./src/useSwrvState/README.md)

## useTablePreferences

[useTablePreferences docs](./src/useTablePreferences/README.md)

## useWindow

[useWindow docs](./src/useWindow/README.md)

## v-safe-html

HTML sanitization directive backed by DOMPurify.

Global registration:

```ts
import { createApp } from 'vue'
import { SafeHtmlPlugin } from '@kong-ui-public/core'

createApp(App).use(SafeHtmlPlugin)
```

Local registration:

```ts
import { vSafeHtml } from '@kong-ui-public/core'

export default {
	directives: { safeHtml: vSafeHtml },
}
```

Template usage:

```vue
<div v-safe-html="htmlString" />
<div v-safe-html="{ html: htmlString, config: { ALLOWED_TAGS: ['a', 'strong'] } }" />
```
