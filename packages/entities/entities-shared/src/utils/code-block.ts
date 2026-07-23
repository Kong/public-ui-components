import { codeToHtml } from './shiki'
import type { CodeBlockEventData } from '@kong/kongponents'

export function highlightCodeBlock({ codeElement, code, language }: CodeBlockEventData) {
  /*
   * Emit both palettes so appearance is driven by the Konnect theme, not a prop: shiki inlines
   * the light colors on each token and adds a `--shiki-dark` custom property. A single scoped
   * rule in app-root's `_global.scss` swaps to `--shiki-dark` under the Konnect night theme.
   */
  codeElement.innerHTML = codeToHtml(code, {
    lang: language,
    themes: { light: 'catppuccin-latte', dark: 'material-theme-darker' },
    structure: 'inline',
  })
}
