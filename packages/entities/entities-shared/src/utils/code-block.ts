import { codeToHtml } from './shiki'
import type { CodeBlockEventData } from '@kong/kongponents'

export async function highlightCodeBlock({ codeElement, code, language, theme }: CodeBlockEventData) {
  codeElement.innerHTML = await codeToHtml(code, { lang: language, theme: theme === 'dark' ? 'catppuccin-mocha' : 'catppuccin-latte', structure: 'inline' })
}
