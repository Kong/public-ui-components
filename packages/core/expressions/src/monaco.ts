import * as monaco from 'monaco-editor'
import { type AstType } from '@kong/atc-router'
import { type Schema } from './schema'

interface MonarchLanguage extends monaco.languages.IMonarchLanguage {
  keywords: string[];
}

interface Item {
  property: string
  kind: AstType
  documentation?: string
}

const flattenProperties = (schema: Schema): Array<Item> => {
  const { definition, documentation } = schema
  const properties: Array<Item> = []
  Object.entries(definition).forEach(([kind, fields]) => {
    fields.forEach((field) => {
      properties.push({
        property: field,
        kind: kind as AstType,
        documentation: documentation?.[field],
      })
    })
  })
  return properties
}

export const theme = 'kong-expr-theme'

export const getLanguageId = (schemaName: string) => `kong-expr_${schemaName}`

export const registerTheme = () => {
  monaco.editor.defineTheme(theme, {
    inherit: true,
    base: 'vs',
    rules: [
      { token: 'keyword', foreground: '#003694', fontStyle: 'bold' },
      { token: 'operators', foreground: '#003694', fontStyle: 'bold' },
      { token: 'string', foreground: '#009966' },
      { token: 'number', foreground: '#009966' },
      { token: 'variable', foreground: '#006699' },
      { token: 'brackets', foreground: '#993399' },
    ],
    colors: {
      'editor.foreground': '#000000',
    },
  })
}

export const registerLanguage = (schema: Schema) => {
  const languageId = getLanguageId(schema.name)

  if (monaco.languages.getEncodedLanguageId(languageId) !== 0) {
    return { languageId }
  }

  const flatProperties = flattenProperties(schema)

  const keywords = ['not', 'in', 'contains']

  monaco.languages.register({ id: languageId })

  monaco.languages.setMonarchTokensProvider(languageId, {
    keywords,
    tokenizer: {
      root: [
        [/[a-zA-Z][\w$]*/, {
          cases: {
            '@keywords': 'keyword',
            '@default': 'variable',
          },
        }],
        [/[()]/, 'delimiter.parenthesis'],
        [/==|!=|~|\^=|=\^|>=?|<=?|&&|\|\|/, 'operators'],
        [/".*?"/, 'string'],
        [/\d+/, 'number'],
      ],
    },
    brackets: [{ open: '(', close: ')', token: 'delimiter.parenthesis' }],
  } as MonarchLanguage)

  monaco.languages.registerCompletionItemProvider(languageId, {
    provideCompletionItems: (model, position) => {
      const word = model.getWordUntilPosition(position)
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      }

      const suggestions = keywords.map((key) => ({
        label: key,
        kind: monaco.languages.CompletionItemKind.Keyword,
        insertText: key,
        range,
      }))

      return { suggestions }
    },
  })

  monaco.languages.registerCompletionItemProvider(languageId, {
    // additional characters to trigger the following function
    triggerCharacters: ['.', '*'],

    // function to generate object autocompletion
    provideCompletionItems: (model, position) => {
      const lineContent = model.getLineContent(position.lineNumber)
      let startColumn = 0

      // find the start of the current word, note that '.' is also considered a word character
      for (let i = position.column - 2; i >= 0; i--) {
        if (!/[\w.]/.test(lineContent[i])) {
          startColumn = i + 2
          break
        }
      }

      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn,
        endColumn: position.column,
      }

      return {
        suggestions: flatProperties.map((item) => ({
          label: item.property,
          kind: monaco.languages.CompletionItemKind.Property,
          detail: item.kind,
          documentation: item.documentation,
          insertText: item.property.replace(/\*/g, ''),
          range,
        })),
      }
    },
  })

  monaco.languages.setLanguageConfiguration(languageId, {
    brackets: [['(', ')']],
    autoClosingPairs: [
      { open: '(', close: ')' },
      { open: '"', close: '"', notIn: ['string'] },
    ],
  })

  return { languageId }
}
