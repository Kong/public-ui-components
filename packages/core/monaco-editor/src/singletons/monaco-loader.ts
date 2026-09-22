/**
 * Process-wide bootstrap for the Monaco Editor + Shiki highlighter.
 */

import * as monaco from 'monaco-editor'
import { shikiToMonaco } from '@shikijs/monaco'
import { getSingletonHighlighter, bundledLanguages, bundledThemes } from 'shiki'
import { ref } from 'vue'

// Flag if monaco loaded
export const isMonacoLoaded = ref(false)
let initPromise: Promise<void> | null = null

export async function loadMonaco() {
  if (initPromise) {
    return initPromise
  }

  initPromise = (async () => {
    try {
      // @ts-ignore jsonDefaults location varies across Monaco Editor versions
      // v0.55.0 introduced breaking changes and issues; Konnect still uses v0.52.x.
      const jsonDefaults = monaco.json?.jsonDefaults || monaco.languages.json?.jsonDefaults
      // Disable JSON token provider to prevent conflicts with @shikijs/monaco
      // https://github.com/shikijs/shiki/issues/865#issuecomment-3689158990
      jsonDefaults?.setModeConfiguration({ tokens: false })

      const highlighter = await getSingletonHighlighter(
        {
          themes: Object.values(bundledThemes),
          langs: Object.values(bundledLanguages),
        },
      )
      highlighter.getLoadedLanguages().forEach(lang => {
        monaco.languages.register({ id: lang })
      })
      shikiToMonaco(highlighter, monaco)
      isMonacoLoaded.value = true
    } catch (error) {
      initPromise = null
      throw error
    }
  })()

  return initPromise
}
