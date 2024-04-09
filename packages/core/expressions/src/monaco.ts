import * as monaco from 'monaco-editor'
import { type Schema, type SchemaDefinition } from './schema'

interface MonarchLanguage extends monaco.languages.IMonarchLanguage {
  keywords: string[];
}

interface Token {
  detail?: string;
  children?: Record<string, Token>;
}

const buildTokenTree = (schemaDefinition: SchemaDefinition) => {
  const root: Token = {}

  for (const [kind, fields] of Object.entries(schemaDefinition)) {
    for (const field of fields) {
      let token = root
      for (const t of field.split('.')) {
        if (token.children === undefined) {
          token.children = {}
        }
        if (token.children[t] === undefined) {
          token.children[t] = {}
        }
        token = token.children[t]
      }
      token.detail = kind
    }
  }

  return root
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

  const tokenTree = buildTokenTree(schema.definition)

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
        [/==|!=|~|\^=|=\^|>=?|<=?|&&|\|\|/, 'operators'],
        [/[()]/, 'brackets'],
        [/".*?"/, 'string'],
        [/\d+/, 'number'],
      ],
    },
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
    // run the following function when a period is typed
    triggerCharacters: ['.'],

    // function to generate object autocompletion
    provideCompletionItems: (model, position) => {
      const word = model.getWordUntilPosition(position)

      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      }

      // split everything the user has typed on the current line up at each space, and only look at the last word
      const lastChars = model.getValueInRange({
        startLineNumber: position.lineNumber,
        startColumn: 0,
        endLineNumber: position.lineNumber,
        endColumn: position.column,
      })

      const words = lastChars.replace('\t', '').split(' ')
      const activeTyping = words[words.length - 1] // what the user is currently typing (everything after the last space)

      const inputTokens = activeTyping.split('.').slice(0, -1)
      let token: Token = tokenTree
      for (const t of inputTokens) {
        const child = token?.children?.[t]
        if (child === undefined) {
          return { suggestions: [] }
        }
        token = child
      }

      if (token?.children === undefined) {
        return { suggestions: [] }
      }

      return {
        suggestions: Object.entries(token.children).map(([token, props]) => ({
          label: token === '*' ? '...' : token,
          kind: monaco.languages.CompletionItemKind.Property,
          detail: props.detail,
          insertText: token === '*' ? '' : token,
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
