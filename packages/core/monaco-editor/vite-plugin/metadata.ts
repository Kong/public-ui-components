import { existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

// Monaco 0.56+ restricts package subpaths to esm/vs, leaving its shipped
// metadata outside the exports map. Resolve the installed package first;
// absolute filesystem loading also works with older Monaco peer versions.
const require = createRequire(typeof __filename === 'string' ? __filename : import.meta.url)
let packageRoot = dirname(require.resolve('monaco-editor'))
while (!existsSync(join(packageRoot, 'package.json'))) {
  const parent = dirname(packageRoot)
  if (parent === packageRoot) {
    throw new Error('Cannot locate the monaco-editor package')
  }
  packageRoot = parent
}

const manifest = require(join(packageRoot, 'package.json'))
export const usesModernEntryPoints = manifest.exports?.['./*'] === './esm/vs/*.js'
export const { features, languages } = require(join(packageRoot, 'esm/metadata.js')) as {
  features: IFeatureDefinition[]
  languages: IFeatureDefinition[]
}

export function monacoSpecifier(entry: string): string {
  return usesModernEntryPoints
    ? `monaco-editor/${entry.replace(/^vs\//, '')}`
    : `monaco-editor/esm/${entry}`
}
/*!----------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Released under the MIT license
 * https://github.com/microsoft/monaco-editor/blob/main/LICENSE.txt
 *----------------------------------------------------------------*/

export interface IWorkerDefinition {
  id: string
  entry: string
}

export interface IFeatureDefinition {
  label: string
  entry: string | string[] | undefined
  worker?: IWorkerDefinition
}



export type EditorLanguage = 'abap' | 'apex' | 'azcli' | 'bat' | 'bicep' | 'cameligo' | 'clojure' | 'coffee' | 'cpp' | 'csharp' | 'csp' | 'css' | 'cypher' | 'dart' | 'dockerfile' | 'ecl' | 'elixir' | 'flow9' | 'freemarker2' | 'fsharp' | 'go' | 'graphql' | 'handlebars' | 'hcl' | 'html' | 'ini' | 'java' | 'javascript' | 'json' | 'julia' | 'kotlin' | 'less' | 'lexon' | 'liquid' | 'lua' | 'm3' | 'markdown' | 'mdx' | 'mips' | 'msdax' | 'mysql' | 'objective-c' | 'pascal' | 'pascaligo' | 'perl' | 'pgsql' | 'php' | 'pla' | 'postiats' | 'powerquery' | 'powershell' | 'protobuf' | 'pug' | 'python' | 'qsharp' | 'r' | 'razor' | 'redis' | 'redshift' | 'restructuredtext' | 'ruby' | 'rust' | 'sb' | 'scala' | 'scheme' | 'scss' | 'shell' | 'solidity' | 'sophia' | 'sparql' | 'sql' | 'st' | 'swift' | 'systemverilog' | 'tcl' | 'twig' | 'typescript' | 'typespec' | 'vb' | 'wgsl' | 'xml' | 'yaml'

export type EditorFeature = 'anchorSelect' | 'bracketMatching' | 'caretOperations' | 'clipboard' | 'codeAction' | 'codeEditor' | 'codelens' | 'codicon' | 'colorPicker' | 'comment' | 'contextmenu' | 'cursorUndo' | 'diffEditor' | 'diffEditorBreadcrumbs' | 'dnd' | 'documentSymbols' | 'dropOrPasteInto' | 'find' | 'floatingMenu' | 'folding' | 'fontZoom' | 'format' | 'gotoError' | 'gotoLine' | 'gotoSymbol' | 'gpu' | 'hover' | 'indentation' | 'inlayHints' | 'inlineCompletions' | 'inlineProgress' | 'inPlaceReplace' | 'insertFinalNewLine' | 'inspectTokens' | 'iPadShowKeyboard' | 'lineSelection' | 'linesOperations' | 'linkedEditing' | 'links' | 'longLinesHelper' | 'middleScroll' | 'multicursor' | 'parameterHints' | 'placeholderText' | 'quickCommand' | 'quickHelp' | 'quickOutline' | 'readOnlyMessage' | 'referenceSearch' | 'rename' | 'sectionHeaders' | 'semanticTokens' | 'smartSelect' | 'snippet' | 'stickyScroll' | 'suggest' | 'toggleHighContrast' | 'toggleTabFocusMode' | 'tokenization' | 'unicodeHighlighter' | 'unusualLineTerminators' | 'wordHighlighter' | 'wordOperations' | 'wordPartOperations'

export type NegatedEditorFeature = '!anchorSelect' | '!bracketMatching' | '!caretOperations' | '!clipboard' | '!codeAction' | '!codeEditor' | '!codelens' | '!codicon' | '!colorPicker' | '!comment' | '!contextmenu' | '!cursorUndo' | '!diffEditor' | '!diffEditorBreadcrumbs' | '!dnd' | '!documentSymbols' | '!dropOrPasteInto' | '!find' | '!floatingMenu' | '!folding' | '!fontZoom' | '!format' | '!gotoError' | '!gotoLine' | '!gotoSymbol' | '!gpu' | '!hover' | '!indentation' | '!inlayHints' | '!inlineCompletions' | '!inlineProgress' | '!inPlaceReplace' | '!insertFinalNewLine' | '!inspectTokens' | '!iPadShowKeyboard' | '!lineSelection' | '!linesOperations' | '!linkedEditing' | '!links' | '!longLinesHelper' | '!middleScroll' | '!multicursor' | '!parameterHints' | '!placeholderText' | '!quickCommand' | '!quickHelp' | '!quickOutline' | '!readOnlyMessage' | '!referenceSearch' | '!rename' | '!sectionHeaders' | '!semanticTokens' | '!smartSelect' | '!snippet' | '!stickyScroll' | '!suggest' | '!toggleHighContrast' | '!toggleTabFocusMode' | '!tokenization' | '!unicodeHighlighter' | '!unusualLineTerminators' | '!wordHighlighter' | '!wordOperations' | '!wordPartOperations'
