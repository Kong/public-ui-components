import { codeToHtml } from './shiki'
import type { CodeBlockEventData } from '@kong/kongponents'

export function highlightCodeBlock({ codeElement, code, language, theme }: CodeBlockEventData) {
  codeElement.innerHTML = codeToHtml(code, { lang: language, theme: theme === 'dark' ? 'catppuccin-mocha' : 'catppuccin-latte', structure: 'inline' })
}
