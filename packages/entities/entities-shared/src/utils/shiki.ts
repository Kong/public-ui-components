import { createHighlighterCoreSync } from '@shikijs/core'
import { createJavaScriptRegexEngine } from '@shikijs/engine-javascript'
import json from '@shikijs/langs/json'
import yaml from '@shikijs/langs/yaml'
import terraform from '@shikijs/langs/terraform'
import shellscript from '@shikijs/langs/shellscript'
import powershell from '@shikijs/langs/powershell'
import materialThemeDarker from '@shikijs/themes/material-theme-darker'
import catppuccinLatte from '@shikijs/themes/catppuccin-latte'
import type { HighlighterCore, CodeToHastOptions } from '@shikijs/core'

let highlighter: HighlighterCore | null = null

function getHighlighter(): HighlighterCore {
  if (!highlighter) {
    highlighter = createHighlighterCoreSync({
      langs: [json, yaml, terraform, shellscript, powershell],
      themes: [materialThemeDarker, catppuccinLatte],
      engine: createJavaScriptRegexEngine(),
      langAlias: {
        bash: 'shellscript',
        sh: 'shellscript',
        shell: 'shellscript',
        zsh: 'shellscript',
      },
    })
  }
  return highlighter
}

function codeToHtml(code: string, options: CodeToHastOptions): string {
  return getHighlighter().codeToHtml(code, options)
}

export { codeToHtml }
