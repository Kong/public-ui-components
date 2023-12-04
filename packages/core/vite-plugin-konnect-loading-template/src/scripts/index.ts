import * as fs from 'fs'
import * as path from 'path'
import { load } from 'cheerio'
import { compileAsync } from 'sass'
import format from 'html-format'
import { WARNING_HEADER } from './constants'

const generateTemplate = async (): Promise<void> => {
  try {
    const templateFile = fs.readFileSync(path.resolve('./src/__template__/template.html'), 'utf8')

    // Loading template
    const $cheerioTemplate = load(templateFile)
    const templateElement = $cheerioTemplate('template')
    const templateStyleElement = $cheerioTemplate('#konnect-app-loading-template-styles')

    // Compile the template styles
    const sassResult = await compileAsync(path.resolve('./src/__template__/template.scss'))

    // Inject the styles into the template
    templateStyleElement.html(sassResult.css)

    // Format the template, replacing the ` character
    const compiledTemplate: string = format(String(templateElement.html() || '')).replace(/`/g, "'")

    // Get vite plugin entry file and replace template strings
    const vitePluginFileContent = fs.readFileSync(path.resolve('./src/__template__/vite-plugin.ts'), 'utf8')
      .replace(/\/\/ {%%ENTRY_FILE_WARNING_HEADER%%}/g, WARNING_HEADER)
      .replace(/{%%KONNECT_LOADING_TEMPLATE%%}/g, compiledTemplate)

    // Write template string to constant file
    fs.writeFileSync(path.resolve('./src/index.ts'), vitePluginFileContent, 'utf8')
  } catch (err) {
    console.log('konnect-app-loading-template: could not inject template content', err)
  }
}

generateTemplate()
