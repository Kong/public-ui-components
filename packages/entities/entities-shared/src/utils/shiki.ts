// Import through `shiki`'s own subpaths (not `@shikijs/*` directly) so these always resolve to the
// same `@shikijs/*` copies as the host app's `shiki`. The bare `shiki` entry is avoided on purpose:
// the monaco-editor Vite plugin replaces it with a trimmed, generated module.
import { createHighlighterCoreSync } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'
import json from 'shiki/langs/json.mjs'
import yaml from 'shiki/langs/yaml.mjs'
import terraform from 'shiki/langs/terraform.mjs'
import shellscript from 'shiki/langs/shellscript.mjs'
import powershell from 'shiki/langs/powershell.mjs'
import materialThemeDarker from 'shiki/themes/material-theme-darker.mjs'
import catppuccinLatte from 'shiki/themes/catppuccin-latte.mjs'
import type { HighlighterCore, CodeToHastOptions } from 'shiki/core'

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
