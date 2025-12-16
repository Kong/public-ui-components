import {
  createSingletonShorthands,
  createdBundledHighlighter,
} from '@shikijs/core'
import { createJavaScriptRegexEngine } from '@shikijs/engine-javascript'

const createHighlighter = createdBundledHighlighter({
  langs: {
    json: () => import('@shikijs/langs/json'),
    yaml: () => import('@shikijs/langs/yaml'),
    terraform: () => import('@shikijs/langs/terraform'),
    shellscript: () => import('@shikijs/langs/shellscript'),
    bash: () => import('@shikijs/langs/shellscript'),
    sh: () => import('@shikijs/langs/shellscript'),
    shell: () => import('@shikijs/langs/shellscript'),
    zsh: () => import('@shikijs/langs/shellscript'),
    powershell: () => import('@shikijs/langs/powershell'),
  },
  themes: {
    'catppuccin-mocha': () => import('@shikijs/themes/catppuccin-mocha'),
    'catppuccin-latte': () => import('@shikijs/themes/catppuccin-latte'),
  },
  engine: () => createJavaScriptRegexEngine(),
})

const { codeToHtml } = createSingletonShorthands(createHighlighter)

export { codeToHtml }
