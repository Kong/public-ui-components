import DOMPurify from 'dompurify'

import type { App, Directive } from 'vue'
import type { Config } from 'dompurify'

type SafeHtmlValue = string | { html: string, config?: Config }

const resolveValue = (value: SafeHtmlValue): { html: string, config?: Config } => {
  if (typeof value === 'string') {
    return { html: value }
  }

  if (value && typeof value === 'object') {
    return { html: value.html ?? '', config: value.config }
  }

  return { html: '' }
}

const applySafeHtml = (el: HTMLElement, value: SafeHtmlValue) => {
  const { html, config } = resolveValue(value)
  const sanitized = DOMPurify.sanitize(String(html), config)
  el.innerHTML = sanitized
}

export const vSafeHtml: Directive<HTMLElement, SafeHtmlValue> = {
  mounted(el, binding) {
    applySafeHtml(el, binding.value)
  },
  updated(el, binding) {
    if (binding.value !== binding.oldValue) {
      applySafeHtml(el, binding.value)
    }
  },
}

export const SafeHtmlPlugin = {
  install(app: App) {
    app.directive('safe-html', vSafeHtml)
  },
}

export default SafeHtmlPlugin
