# Directives

## v-safe-html

A Vue directive for safely rendering HTML content with XSS protection via [DOMPurify](https://github.com/cure53/DOMPurify).

### Why v-safe-html?

When you need to render dynamic HTML (like formatted text, links, or rich content), Vue's built-in `v-html` directive is dangerous because it renders raw HTML without any sanitization. This can lead to XSS vulnerabilities if the content contains:

- Malicious script tags: `<script>alert('XSS')</script>`
- Event handlers: `<img src=x onerror="alert('XSS')">`
- JavaScript URLs: `<a href="javascript:alert('XSS')">click</a>`

The `v-safe-html` directive solves this by automatically sanitizing HTML using DOMPurify before rendering. DOMPurify removes all dangerous elements and attributes while preserving safe HTML formatting like links, bold text, and lists.

### How it works

1. You bind HTML content to `v-safe-html`
2. DOMPurify scans and removes any XSS vectors (scripts, event handlers, etc.)
3. Only safe HTML is rendered to the DOM

### Comparison Examples

| Scenario | HTML Content | `v-html` Behavior | `v-safe-html` Behavior |
|----------|--------------|-------------------|------------------------|
| **Safe formatting** | `<strong>Bold</strong> text` | ✅ Renders: **Bold** text | ✅ Renders: **Bold** text |
| **Safe links** | `<a href="https://example.com">Link</a>` | ✅ Renders clickable link | ✅ Renders clickable link |
| **Script injection** | `<script>alert('XSS')</script>Hello` | ❌ **Executes alert, shows "Hello"** | ✅ Shows only "Hello" (script removed) |
| **Image with error handler** | `<img src=x onerror="alert('XSS')">` | ❌ **Executes alert when image fails** | ✅ Renders `<img src=x>` (handler removed) |
| **JavaScript protocol** | `<a href="javascript:alert('XSS')">Click</a>` | ❌ **Executes alert on click** | ✅ Renders `<a>Click</a>` (href sanitized) |
| **Inline event handlers** | `<div onclick="alert('XSS')">Text</div>` | ❌ **Executes alert on click** | ✅ Renders `<div>Text</div>` (onclick removed) |
| **Multiple events** | `<button onmouseover="steal()">Hover</button>` | ❌ **Executes on hover** | ✅ Renders `<button>Hover</button>` (event removed) |
| **Iframe injection** | `<iframe src="https://evil.com"></iframe>` | ❌ **Loads external iframe** | ✅ Empty (iframe removed) |
| **SVG script** | `<svg><script>alert('XSS')</script></svg>` | ❌ **Executes script** | ✅ Empty or safe SVG only |
| **Data URI** | `<a href="data:text/html,<script>alert()</script>">Link</a>` | ❌ **Can execute code** | ✅ href sanitized or removed |
| **Mixed content** | `<p>Safe <script>bad()</script> text</p>` | ❌ **Executes bad(), shows "Safe text"** | ✅ Shows "Safe text" (script removed) |
| **Form elements** | `<input type="text" value="test">` | ⚠️ Renders form input | ⚠️ Default: removed (use config to allow) |

### Usage

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
