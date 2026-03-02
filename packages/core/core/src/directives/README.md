# Directives

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

Value format:

- `string`: treated as HTML input.
- `{ html, config }`: `config` is passed to DOMPurify.
