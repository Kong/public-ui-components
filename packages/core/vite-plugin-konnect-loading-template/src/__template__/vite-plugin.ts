// {%%ENTRY_FILE_WARNING_HEADER%%}

import { load } from 'cheerio'

const konnectLoadingTemplate: string = `{%%KONNECT_LOADING_TEMPLATE%%}`

export default function KonnectLoadingTemplateVitePlugin (rootAppSelector = '#app') {
  return {
    name: 'vite-plugin-konnect-loading-template',
    transformIndexHtml: (html: string) => {
      try {
        const $cheerioApp = load(html)
        const appRootElement = $cheerioApp(rootAppSelector)

        if (!appRootElement) {
          return html
        }

        // Append `div#app` element with the konnect loading template content
        appRootElement.html(konnectLoadingTemplate)

        // Return the modified HTML
        return $cheerioApp.html()
      } catch (err) {
        console.log('konnect-app-loading-template: could not inject template content', err)
        return html
      }
    },
  }
}
