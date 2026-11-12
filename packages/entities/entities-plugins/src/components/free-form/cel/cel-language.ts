import * as monaco from 'monaco-editor'
import type { IDisposable, editor } from 'monaco-editor'
import {
  CEL_MACROS, formatCelType, getCelCallables, getCelCallFrames, getCelDescription, getCelFields, getCelGlobals, getCelLocals,
  isCelPresenceRoot, resolveCelChain,
} from './cel-catalog'
import type { CelCallable, CelScope, CelType } from './cel-catalog'
import { endsInCelLiteral, maskCelLiterals } from './cel-tokens'
import { getCelHoveredSubject, getCelMetadataKeys, getCelSubjectSuggestions } from './cel-subjects'
import type { CelSubjects, CelSubjectValue } from './cel-subjects'
import type { CelCompileError } from './cel-validation'

export const CEL_LANGUAGE_ID = 'kong-plugin-cel'
const SUGGEST_ARGUMENTS_COMMAND = `${CEL_LANGUAGE_ID}.suggestArguments`

/** Only replace the current identifier, preserving its receiver and following text. */
export const getCelCompletionContext = (line: string, column: number) => {
  const before = line.slice(0, column - 1)
  // Don't suggest variables inside a string or comment.
  if (endsInCelLiteral(before)) return undefined
  const match = before.match(/(?:\b([a-zA-Z_]\w*(?:\s*\.\s*[a-zA-Z_]\w*)*)\s*\.\s*)?([a-zA-Z_]\w*)?$/)
  if (!match) return undefined
  return { receiver: match[1]?.replace(/\s+/g, '') ?? '', prefix: match[2] ?? '', startColumn: column - (match[2]?.length ?? 0) }
}

export interface CelSuggestion {
  label: string
  kind: 'variable' | 'field' | 'function'
  detail: string
  /** The description from the Kong Gateway reference, for a global variable. */
  documentation?: string
  callable?: CelCallable
}

/**
 * What to offer at the end of `before`, whose last line is `line`: the members
 * of the receiver's type, or the macro variables, globals and functions at the
 * start of a term.
 */
export const getCelSuggestions = (before: string, scope: CelScope, subjects: CelSubjects = {}): CelSuggestion[] => {
  const line = before.slice(before.lastIndexOf('\n') + 1)
  const context = getCelCompletionContext(line, line.length + 1)
  if (!context) return []
  const frames = getCelCallFrames(before)
  const call = [...frames].reverse().find(frame => frame.name)
  // The first argument of a macro names a new variable.
  if (call && CEL_MACROS.has(call.name) && call.method && call.argument === 0) return []
  const presenceOnly = call?.name === 'has' && !call.receiver
  const locals = getCelLocals(before, scope)
  const field = (label: string, type: CelType, kind: CelSuggestion['kind'], path: string, global: boolean): CelSuggestion => ({
    label, kind,
    detail: type.kind === 'record' && type.namespace ? path : `${path} · ${formatCelType(type)}`,
    documentation: global ? getCelDescription(path) : undefined,
  })

  if (!context.receiver) {
    // A macro variable hides the global of the same name.
    const variables = new Map<string, [CelType, boolean]>()
    for (const [name, type] of Object.entries(getCelGlobals(scope))) variables.set(name, [type, true])
    for (const [name, type] of locals) variables.set(name, [type, false])
    const suggestions = [...variables]
      .filter(([, [type]]) => !presenceOnly || isCelPresenceRoot(type))
      .map(([name, [type, global]]) => field(name, type, 'variable', name, global))
    if (!presenceOnly) {
      for (const callable of getCelCallables(undefined, scope)) suggestions.push({ label: callable.name, kind: 'function', detail: callable.signature, callable })
    }
    return suggestions
  }

  const type = resolveCelChain(context.receiver, locals, scope)
  if (!type) return []
  const global = !locals.has(context.receiver.split('.')[0])
  const suggestions = getCelFields(type, presenceOnly)
    .map(([name, member]) => field(name, member, 'field', `${context.receiver}.${name}`, global))
  if (type.kind === 'map' && type.metadata) {
    // principal.metadata keys come from the loaded principals.
    for (const { key, types } of getCelMetadataKeys(subjects)) {
      suggestions.push({ label: key, kind: 'field', detail: `${context.receiver}.${key} · ${types.join(' | ')}` })
    }
  }
  if (!presenceOnly) {
    for (const callable of getCelCallables(type)) suggestions.push({ label: callable.name, kind: 'function', detail: callable.signature, callable })
  }
  return suggestions
}

/**
 * What to show when hovering the identifier at `offset`: a function's signature,
 * or a variable's type and, for a Gateway variable, its description.
 */
export const getCelHover = (source: string, offset: number, scope: CelScope) => {
  const code = maskCelLiterals(source)
  const start = offset - code.slice(0, offset).match(/\w*$/)![0].length
  const end = offset + code.slice(offset).match(/^\w*/)![0].length
  const word = code.slice(start, end)
  if (!/^[A-Za-z_]\w*$/.test(word)) return
  const before = code.slice(0, start)
  const after = code.slice(end)
  const receiver = before.match(/(?<![\w.])([A-Za-z_]\w*(?:\s*\.\s*[A-Za-z_]\w*)*)\s*\.\s*$/)?.[1]?.replace(/\s+/g, '') ?? ''
  if (/\.\s*$/.test(before) && !receiver) return
  // A macro's first argument declares its variable, which is in scope after the comma.
  const declaration = /\.\s*\w+\s*\(\s*$/.test(before) && /^\s*,/.test(after)
  const locals = getCelLocals(declaration ? code.slice(0, end + after.indexOf(',') + 1) : before, scope)

  if (/^\s*\(/.test(after)) {
    const receiverType = receiver ? resolveCelChain(receiver, locals, scope) : undefined
    if (receiver && !receiverType) return
    const callable = getCelCallables(receiverType, scope).find(item => item.name === word)
    return callable && { start, end, title: callable.signature, description: callable.description }
  }

  const path = receiver ? `${receiver}.${word}` : word
  const type = resolveCelChain(path, locals, scope)
  if (!type) return
  const local = locals.has(path.split('.')[0])
  const namespace = type.kind === 'record' && type.namespace
  return {
    start, end,
    title: namespace ? path : `${path}: ${formatCelType(type)}`,
    description: local ? undefined : getCelDescription(path),
  }
}

/** The call the cursor is in, with its callable, for signature help. */
export const getCelSignature = (before: string, scope: CelScope) => {
  const call = [...getCelCallFrames(before)].reverse().find(frame => frame.name)
  if (!call) return
  // Resolve the receiver where the call starts, before its own variable exists.
  const receiver = call.receiver ? resolveCelChain(call.receiver, getCelLocals(before.slice(0, call.start), scope), scope) : undefined
  if (call.receiver && !receiver) return
  const callable = getCelCallables(receiver, scope).find(item => item.name === call.name)
  if (callable) return { callable, argument: call.argument }
}

interface CelEditorContext {
  scope: () => CelScope
  subjects: () => CelSubjects
  formatSubject: (subject: CelSubjectValue) => string
  instance: editor.IStandaloneCodeEditor
}

const contexts = new Map<editor.ITextModel, CelEditorContext>()
let registrations: IDisposable[] = []
let languageRegistered = false

const register = () => {
  if (!languageRegistered) {
    monaco.languages.register({ id: CEL_LANGUAGE_ID })
    languageRegistered = true
  }
  registrations = [
    monaco.editor.registerCommand(SUGGEST_ARGUMENTS_COMMAND, (_accessor, model: editor.ITextModel) => {
      const instance = contexts.get(model)?.instance
      instance?.trigger(CEL_LANGUAGE_ID, 'editor.action.triggerParameterHints', {})
      instance?.trigger(CEL_LANGUAGE_ID, 'editor.action.triggerSuggest', {})
    }),
    monaco.languages.setLanguageConfiguration(CEL_LANGUAGE_ID, {
      comments: { lineComment: '//' },
      brackets: [['(', ')'], ['[', ']'], ['{', '}']],
      autoClosingPairs: [
        { open: '(', close: ')' }, { open: '[', close: ']' }, { open: '{', close: '}' },
        { open: '"', close: '"', notIn: ['string', 'comment'] },
        { open: "'", close: "'", notIn: ['string', 'comment'] },
      ],
    }),
    monaco.languages.setMonarchTokensProvider(CEL_LANGUAGE_ID, {
      tokenizer: {
        root: [
          [/\/\/.*$/, 'comment'],
          [/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/, 'string'],
          [/\b(?:true|false|null|in)\b/, 'keyword'],
          [/\b\d+(?:\.\d+)?\b/, 'number'],
          [/[a-zA-Z_]\w*/, 'identifier'],
          [/[=!<>|&+*/%?:-]+/, 'operator'],
          [/[()[\]{}]/, '@brackets'],
        ],
      },
    }),
    monaco.languages.registerCompletionItemProvider(CEL_LANGUAGE_ID, {
      // `=` and space open record values right after `consumer.id ==` or `consumer.id = `.
      triggerCharacters: ['.', '(', '"', "'", '=', ' '],
      provideCompletionItems(model, position, completionContext) {
        const editorContext = contexts.get(model)
        if (!editorContext) return { suggestions: [] }
        const source = model.getValue()
        const offset = model.getOffsetAt(position)
        const values = getCelSubjectSuggestions(source, offset, editorContext.scope(), editorContext.subjects())
        const valueItems = values.suggestions.map(({ label, detail, insertText, filterText, start, end }, index): monaco.languages.CompletionItem => {
          const from = model.getPositionAt(start)
          const to = model.getPositionAt(end)
          return {
            label, detail, insertText, filterText,
            kind: monaco.languages.CompletionItemKind.Value,
            // Values first, in the list order.
            sortText: `0-0-${String(index).padStart(6, '0')}`,
            range: { startLineNumber: from.lineNumber, startColumn: from.column, endLineNumber: to.lineNumber, endColumn: to.column },
          }
        })
        // Inside a string literal, only record values apply. So after `=` or a space,
        // which would otherwise open the variable list on every space.
        const valuesOnly = completionContext.triggerKind === monaco.languages.CompletionTriggerKind.TriggerCharacter
          && (completionContext.triggerCharacter === '=' || completionContext.triggerCharacter === ' ')
        if (values.inLiteral || valuesOnly) return { suggestions: valueItems, incomplete: true }
        const lineText = model.getLineContent(position.lineNumber)
        const context = getCelCompletionContext(lineText, position.column)
        if (!context) return { suggestions: valueItems }
        const range = {
          startLineNumber: position.lineNumber, endLineNumber: position.lineNumber,
          startColumn: context.startColumn, endColumn: model.getWordAtPosition(position)?.endColumn ?? position.column,
        }
        const hasParentheses = /^\s*\(/.test(lineText.slice(range.endColumn - 1))
        const before = source.slice(0, offset)
        const suggestions = getCelSuggestions(before, editorContext.scope(), editorContext.subjects()).map(({ label, kind, detail, documentation, callable }): monaco.languages.CompletionItem => ({
          label, detail, range,
          documentation: documentation ? { value: documentation } : undefined,
          kind: kind === 'function'
            ? monaco.languages.CompletionItemKind.Function
            : kind === 'field' ? monaco.languages.CompletionItemKind.Field : monaco.languages.CompletionItemKind.Variable,
          // Fields and variables first, then functions.
          sortText: `${kind === 'function' ? 1 : 0}-${label}`,
          insertText: callable && !hasParentheses ? callable.insertText : label,
          insertTextRules: callable ? monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet : undefined,
          command: callable?.name === 'has' && !hasParentheses ? { id: SUGGEST_ARGUMENTS_COMMAND, title: 'has(field)', arguments: [model] } : undefined,
        }))
        return { suggestions: [...valueItems, ...suggestions], incomplete: true }
      },
    }),
    monaco.languages.registerHoverProvider(CEL_LANGUAGE_ID, {
      provideHover(model, position) {
        const editorContext = contexts.get(model)
        if (!editorContext) return
        const source = model.getValue()
        const offset = model.getOffsetAt(position)
        const range = (from: number, to: number) => {
          const start = model.getPositionAt(from)
          const end = model.getPositionAt(to)
          return { startLineNumber: start.lineNumber, startColumn: start.column, endLineNumber: end.lineNumber, endColumn: end.column }
        }
        const info = getCelHover(source, offset, editorContext.scope())
        if (info) {
          return {
            range: range(info.start, info.end),
            contents: [{ value: '```\n' + info.title + '\n```' }, ...(info.description ? [{ value: info.description }] : [])],
          }
        }
        const match = getCelHoveredSubject(source, offset, editorContext.scope(), editorContext.subjects())
        if (!match) return
        const start = model.getPositionAt(match.start)
        const end = model.getPositionAt(match.end)
        return {
          range: { startLineNumber: start.lineNumber, startColumn: start.column, endLineNumber: end.lineNumber, endColumn: end.column },
          // Indent each line so Markdown renders API values as literal text.
          contents: [{ value: editorContext.formatSubject(match.subject).replace(/^/gm, '    ') }],
        }
      },
    }),
    monaco.languages.registerSignatureHelpProvider(CEL_LANGUAGE_ID, {
      signatureHelpTriggerCharacters: ['(', ','],
      signatureHelpRetriggerCharacters: [')'],
      provideSignatureHelp(model, position) {
        const editorContext = contexts.get(model)
        if (!editorContext) return undefined
        const signature = getCelSignature(model.getValue().slice(0, model.getOffsetAt(position)), editorContext.scope())
        if (!signature) return undefined
        const { callable, argument } = signature
        const overloads = callable.alternateParameters ? [callable.parameters, callable.alternateParameters] : [callable.parameters]
        return {
          value: {
            signatures: overloads.map(parameters => ({
              label: `${callable.name}(${parameters.join(', ')})`,
              parameters: parameters.map(label => ({ label })),
            })),
            activeSignature: callable.alternateParameters && argument >= callable.parameters.length ? 1 : 0,
            activeParameter: argument,
          },
          dispose() {},
        }
      },
    }),
  ]
}

/** The returned registration belongs to this editor, never to the whole app. */
export const attachCelLanguage = (instance: editor.IStandaloneCodeEditor, context: Omit<CelEditorContext, 'instance'>): IDisposable => {
  const model = instance.getModel()
  if (!model) return { dispose() {} }
  if (!registrations.length) register()
  contexts.set(model, { ...context, instance })
  monaco.editor.setModelLanguage(model, CEL_LANGUAGE_ID)
  let disposed = false
  const dispose = () => {
    if (disposed) return
    disposed = true
    onDispose.dispose()
    contexts.delete(model)
    if (!contexts.size) {
      registrations.forEach(registration => registration.dispose())
      registrations = []
    }
  }
  const onDispose = model.onWillDispose(dispose)
  return { dispose }
}

const MARKER_OWNER = `${CEL_LANGUAGE_ID}.compile`

/**
 * Underlines the Gateway compiler's error. An error with no location, or one
 * past the end of the text the user has now, marks the whole first line.
 */
export const setCelCompileMarker = (instance: editor.IStandaloneCodeEditor, error?: CelCompileError): void => {
  const model = instance.getModel()
  if (!model) return
  if (!error) {
    monaco.editor.setModelMarkers(model, MARKER_OWNER, [])
    return
  }

  const line = error.line && error.line <= model.getLineCount() ? error.line : 1
  const maxColumn = model.getLineMaxColumn(line)
  const startColumn = Math.min(error.column ?? 1, maxColumn)
  monaco.editor.setModelMarkers(model, MARKER_OWNER, [{
    severity: monaco.MarkerSeverity.Error,
    message: error.message,
    startLineNumber: line,
    endLineNumber: line,
    startColumn,
    // cel-go points at a position, not a range, so underline to the end of the line.
    endColumn: Math.max(startColumn + 1, maxColumn),
  }])
}
