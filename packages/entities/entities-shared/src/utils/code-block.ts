import { codeToHtml } from './shiki'
import type { CodeBlockEventData } from '@kong/kongponents'

export function highlightCodeBlock({ codeElement, code, language, theme }: CodeBlockEventData) {
  codeElement.innerHTML = codeToHtml(code, { lang: language, theme: theme === 'dark' ? 'vesper' : 'catppuccin-latte', structure: 'inline' })
}
