import type * as monaco from 'monaco-editor'
import { getCursorContext } from './context'
import { getYamlDoc } from './doc-cache'
import { getSchemaAtPath, getSchemaKind } from './schema'
import { getModelConfig } from './registry'
import { triggerSuggestIfAvailable } from './suggest'

function getIndentUnit(model: monaco.editor.ITextModel): string {
  const options = model.getOptions()
  if (!options.insertSpaces) return '\t'
  return ' '.repeat(options.tabSize)
}

function getKeyColumnIndent(lineText: string): string {
  const length = lineText.length
  let index = 0
  while (index < length) {
    const ch = lineText[index]
    if (ch === ' ' || ch === '\t') {
      index += 1
      continue
    }
    if (ch === '-' && lineText[index + 1] === ' ') {
      return `${lineText.slice(0, index)}  `
    }
    return lineText.slice(0, index)
  }
  return lineText
}

function isKeyValueSeparator(lineText: string, column: number): boolean {
  const colonIndex = column - 1
  if (colonIndex < 0 || colonIndex >= lineText.length) return false

  let inSingle = false
  let inDouble = false
  let escape = false
  let flowDepth = 0
  let firstSeparator = -1

  for (let i = 0; i <= colonIndex; i += 1) {
    const ch = lineText[i]

    if (inSingle) {
      if (ch === "'") {
        if (lineText[i + 1] === "'") {
          i += 1
        } else {
          inSingle = false
        }
      }
      continue
    }

    if (inDouble) {
      if (escape) {
        escape = false
        continue
      }
      if (ch === '\\') {
        escape = true
        continue
      }
      if (ch === '"') {
        inDouble = false
      }
      continue
    }

    if (ch === "'") {
      inSingle = true
      continue
    }
    if (ch === '"') {
      inDouble = true
      continue
    }

    if (ch === '#' && flowDepth === 0) {
      return false
    }

    if (ch === '{' || ch === '[') {
      flowDepth += 1
      continue
    }
    if (ch === '}' || ch === ']') {
      flowDepth = Math.max(0, flowDepth - 1)
      continue
    }

    if (ch === ':' && flowDepth === 0 && firstSeparator === -1) {
      firstSeparator = i
    }
  }

  if (firstSeparator !== colonIndex) {
    return false
  }

  const prefix = lineText.slice(0, colonIndex)
  return /^\s*(?:-\s+)?[A-Za-z0-9_.-]+\s*$/.test(prefix)
}

function replaceLineContent(
  monacoApi: typeof monaco,
  editor: monaco.editor.IStandaloneCodeEditor,
  lineNumber: number,
  text: string,
) {
  const model = editor.getModel()
  if (!model) return
  const lineLength = model.getLineLength(lineNumber)
  editor.executeEdits('yaml-smart-edit', [
    {
      range: new monacoApi.Range(lineNumber, 1, lineNumber, lineLength + 1),
      text,
    },
  ])
  editor.setPosition(new monacoApi.Position(lineNumber, text.length + 1))
}

function handleColon(
  monacoApi: typeof monaco,
  editor: monaco.editor.IStandaloneCodeEditor,
  config: ReturnType<typeof getModelConfig>,
) {
  if (!config || !config.completion.triggerOnColon) return
  const model = editor.getModel()
  const position = editor.getPosition()
  if (!model || !position) return

  const doc = getYamlDoc(model, config.yamlVersion)
  const ctx = getCursorContext(model, position, doc)
  if (!ctx.path) return

  const lineText = model.getLineContent(position.lineNumber)
  if (!isKeyValueSeparator(lineText, position.column)) return

  const schemaKind = getSchemaKind(
    getSchemaAtPath(config.schema, ctx.path, doc.data, { discriminatedUnion: config.completion.discriminatedUnion }),
    config.schema,
  )

  const after = lineText.slice(position.column - 1)

  if (schemaKind === 'scalar') {
    if (after.length === 0) {
      editor.executeEdits('yaml-smart-edit', [
        {
          range: new monacoApi.Range(position.lineNumber, position.column, position.lineNumber, position.column),
          text: ' ',
        },
      ])
      editor.setPosition(new monacoApi.Position(position.lineNumber, position.column + 1))
    }
    triggerSuggestIfAvailable(monacoApi, editor)
    return
  }

  if (after.trim().length === 0 && after.length > 0) {
    editor.executeEdits('yaml-smart-edit', [
      {
        range: new monacoApi.Range(
          position.lineNumber,
          position.column,
          position.lineNumber,
          position.column + after.length,
        ),
        text: '',
      },
    ])
  }
  // For non-scalar values, let Enter/newline handling decide when to suggest.
}

function handleEnter(
  monacoApi: typeof monaco,
  editor: monaco.editor.IStandaloneCodeEditor,
  position: monaco.Position,
  config: ReturnType<typeof getModelConfig>,
): boolean {
  if (!config || !config.completion.triggerOnEnter) return false
  const model = editor.getModel()
  if (!model) return false

  const doc = getYamlDoc(model, config.yamlVersion)
  const ctx = getCursorContext(model, position, doc)
  if (!ctx.isEmptyLine) {
    return false
  }

  const prevLine = position.lineNumber - 1
  if (prevLine < 1) return false

  const prevLineText = model.getLineContent(prevLine)
  const inlineValue = /:\s*[^#\s]/.test(prevLineText)
  if (inlineValue) {
    const keyIndent = getKeyColumnIndent(prevLineText)
    replaceLineContent(monacoApi, editor, position.lineNumber, `${keyIndent}`)
    return true
  }

  if (!/:\s*$/.test(prevLineText)) {
    return false
  }

  const prevCtx = getCursorContext(
    model,
    new monacoApi.Position(prevLine, prevLineText.length + 1),
    doc,
  )
  const targetPath =
    prevCtx.valuePath ??
    (prevCtx.inValue ? prevCtx.path : null) ??
    ctx.valuePath ??
    (ctx.inValue ? ctx.path : null)
  if (!targetPath) {
    return false
  }

  const schemaKind = getSchemaKind(
    getSchemaAtPath(config.schema, targetPath, doc.data, { discriminatedUnion: config.completion.discriminatedUnion }),
    config.schema,
  )

  const indentUnit = getIndentUnit(model)
  const keyIndent = getKeyColumnIndent(prevLineText)
  const childIndent = keyIndent + indentUnit
  const arrayIndent = config.style.arrayItemStyle === 'indentless' ? keyIndent : childIndent

  if (schemaKind === 'array') {
    replaceLineContent(monacoApi, editor, position.lineNumber, `${arrayIndent}- `)
    return true
  }

  if (schemaKind === 'object') {
    replaceLineContent(monacoApi, editor, position.lineNumber, `${childIndent}`)
    return true
  }

  return false
}

export function registerYamlSmartEdits(
  monacoApi: typeof monaco,
  editor: monaco.editor.IStandaloneCodeEditor,
): monaco.IDisposable {
  let isApplying = false
  const model = editor.getModel()
  const disposables: monaco.IDisposable[] = []
  const onDidType = (editor as unknown as {
    onDidType?: (listener: (text: string) => void) => monaco.IDisposable
  }).onDidType
  let pendingEnterIndent = false
  let pendingEnterScheduled = false

  if (onDidType) {
    disposables.push(onDidType((text) => {
      if (isApplying) return
      if (text !== ':') return
      const config = model ? getModelConfig(model) : null
      if (!config) return
      isApplying = true
      try {
        handleColon(monacoApi, editor, config)
      } finally {
        isApplying = false
      }
    }))
  }

  if (model) {
    disposables.push(model.onDidChangeContent((event) => {
      const config = model ? getModelConfig(model) : null
      if (!config || !config.completion.triggerOnEnter) return
      const changes = event.changes.filter((change) => /[\r\n]/.test(change.text))
      if (changes.length === 0) return
      const change = changes[changes.length - 1]
      if (!/^\r?\n[ \t]*$/.test(change.text)) return
      pendingEnterIndent = true
      if (pendingEnterScheduled) return
      pendingEnterScheduled = true
      queueMicrotask(() => {
        pendingEnterScheduled = false
        if (!pendingEnterIndent || isApplying) return
        const position = editor.getPosition()
        if (!position) return
        const config = model ? getModelConfig(model) : null
        if (!config) return
        pendingEnterIndent = false
        isApplying = true
        let didEdit = false
        try {
          didEdit = handleEnter(monacoApi, editor, position, config)
        } finally {
          isApplying = false
        }
        if (didEdit || config.completion.triggerOnEnter) {
          triggerSuggestIfAvailable(monacoApi, editor)
        }
      })
    }))

    disposables.push(model.onDidChangeContent((event) => {
      if (isApplying) return
      const change = event.changes[event.changes.length - 1]
      if (!change) return
      if (/[\r\n]/.test(change.text)) return
      if (!change.text.includes(' ')) return
      const model = editor.getModel()
      if (!model) return
      const endOffset = change.rangeOffset + change.text.length
      const position = model.getPositionAt(endOffset)
      const lineText = model.getLineContent(position.lineNumber)
      const prefix = lineText.slice(0, Math.max(0, position.column - 1))
      const match = prefix.match(/:\s{2,}$/)
      if (!match) return
      const excess = match[0].length - 2
      if (excess <= 0) return
      const startColumn = Math.max(1, position.column - excess)
      isApplying = true
      try {
        editor.executeEdits('yaml-smart-edit', [
          {
            range: new monacoApi.Range(position.lineNumber, startColumn, position.lineNumber, position.column),
            text: '',
          },
        ])
      } finally {
        isApplying = false
      }
    }))

    disposables.push(model.onDidChangeContent((event) => {
      const config = model ? getModelConfig(model) : null
      if (!config || !config.completion.enabled) return
      if (isApplying) return
      const change = event.changes[event.changes.length - 1]
      if (!change) return
      if (/[\r\n]/.test(change.text)) return
      if (change.text === '-') {
        const currentModel = editor.getModel()
        if (!currentModel) return
        const changeEndOffset = change.rangeOffset + change.text.length
        const position = currentModel.getPositionAt(changeEndOffset)
        const lineText = currentModel.getLineContent(position.lineNumber)
        if (!/^\s*-\s*$/.test(lineText)) return
        const doc = getYamlDoc(currentModel, config.yamlVersion)
        const ctx = getCursorContext(currentModel, position, doc)
        const parentPath =
          ctx.valuePath && typeof ctx.valuePath[ctx.valuePath.length - 1] === 'number'
            ? ctx.valuePath.slice(0, -1)
            : null
        if (!parentPath) return
        const parentKind = getSchemaKind(
          getSchemaAtPath(config.schema, parentPath, doc.data, {
            discriminatedUnion: config.completion.discriminatedUnion,
          }),
          config.schema,
        )
        if (parentKind !== 'array') return
        queueMicrotask(() => {
          if (isApplying) return
          const model = editor.getModel()
          if (!model) return
          const currentLine = model.getLineContent(position.lineNumber)
          if (!/^\s*-\s*$/.test(currentLine)) return
          isApplying = true
          try {
            editor.executeEdits('yaml-smart-edit', [
              {
                range: new monacoApi.Range(
                  position.lineNumber,
                  position.column,
                  position.lineNumber,
                  position.column,
                ),
                text: ' ',
              },
            ])
            const nextPos = new monacoApi.Position(position.lineNumber, position.column + 1)
            editor.setPosition(nextPos)
            triggerSuggestIfAvailable(monacoApi, editor, nextPos)
          } finally {
            isApplying = false
          }
        })
        return
      }
      if (!/^[A-Za-z0-9_-]+$/.test(change.text)) return
      if (change.text.length !== 1) return
      const currentModel = editor.getModel()
      if (!currentModel) return
      const changeEndOffset = change.rangeOffset + change.text.length
      queueMicrotask(() => {
        if (isApplying) return
        const config = currentModel ? getModelConfig(currentModel) : null
        if (!config) return
        const position = currentModel.getPositionAt(changeEndOffset)
        if (!position) return
        const doc = getYamlDoc(currentModel, config.yamlVersion)
        const ctx = getCursorContext(currentModel, position, doc)
        if (!ctx.inValue) return
        triggerSuggestIfAvailable(monacoApi, editor, position)
      })
    }))
  }

  return {
    dispose: () => {
      disposables.forEach((disposable) => disposable.dispose())
    },
  }
}
