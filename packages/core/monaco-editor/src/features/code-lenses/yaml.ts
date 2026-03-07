import { isMap, isNode, isPair, isScalar, isSeq } from 'yaml'
import { getModelContext } from '../../singletons/model-contexts'
import {
  createCopyUUIDCodeLens,
  createCopyValueCodeLens,
  createDisposableCodeLensList,
  emptyCodeLensList,
  uuidRe,
} from './utils'

import type { JSONPath } from 'jsonc-parser'
import type { CancellationToken, editor, IRange, languages } from 'monaco-editor'
import type { Document as YAMLDocument, Node as YAMLNode } from 'yaml'

import type { ModelContext } from '../../types'

type ModelContextGetter = (model: editor.ITextModel) => ModelContext | Promise<ModelContext>

type YAMLProvideCodeLensesFn<Value = any> = (
  value: Value,
  range: IRange,
  context: { keyPath: JSONPath, node: YAMLNode },
) => languages.ProviderResult<languages.CodeLensList>

interface YAMLNodeWithKeyPath {
  node: YAMLNode
  keyPath: JSONPath
}

function getYAMLNodeRange(node: YAMLNode, model: editor.ITextModel): IRange | undefined {
  const range = node.range
  if (!range) {
    return undefined
  }

  const startOffset = Math.max(0, range[0])
  const endOffset = Math.max(startOffset, range[2])

  const startPos = model.getPositionAt(startOffset)
  const endPos = model.getPositionAt(endOffset)

  return {
    startLineNumber: startPos.lineNumber,
    startColumn: startPos.column,
    endLineNumber: endPos.lineNumber,
    endColumn: endPos.column,
  }
}

function getYAMLNodeValue<Value = any>(node: YAMLNode): Value {
  if (isScalar(node)) {
    return node.value as Value
  }

  return node.toJSON() as Value
}

function getYAMLKeyPathSegment(keyNode: unknown): string | number | undefined {
  if (!isScalar(keyNode)) {
    return undefined
  }

  const { value } = keyNode
  return typeof value === 'string' || typeof value === 'number'
    ? value
    : undefined
}

function getYAMLMapValueKeyPath(keyPath: JSONPath, keyNode: unknown): JSONPath {
  const keyPathSegment = getYAMLKeyPathSegment(keyNode)
  if (keyPathSegment === undefined) {
    return keyPath
  }

  return [...keyPath, keyPathSegment]
}

function getYAMLNodeChildren(node: YAMLNode): YAMLNode[] {
  const children: YAMLNode[] = []

  if (isMap(node)) {
    for (const pair of node.items) {
      if (isNode(pair.key)) {
        children.push(pair.key)
      }

      if (isNode(pair.value)) {
        children.push(pair.value)
      }
    }

    return children
  }

  if (isSeq(node)) {
    for (const item of node.items) {
      if (isPair(item)) {
        if (isNode(item.key)) {
          children.push(item.key)
        }

        if (isNode(item.value)) {
          children.push(item.value)
        }

        continue
      }

      if (isNode(item)) {
        children.push(item)
      }
    }
  }

  return children
}

function forEachYAMLNodeWithKeyPath(root: YAMLNode, fn: (node: YAMLNode, keyPath: JSONPath) => void): void {
  const stack: YAMLNodeWithKeyPath[] = [{ node: root, keyPath: [] }]

  while (stack.length > 0) {
    const current = stack.pop()
    if (!current) {
      continue
    }

    const { node, keyPath } = current
    fn(node, keyPath)

    if (isMap(node)) {
      for (let i = node.items.length - 1; i >= 0; i--) {
        const pair = node.items[i]

        if (isNode(pair.value)) {
          stack.push({
            node: pair.value,
            keyPath: getYAMLMapValueKeyPath(keyPath, pair.key),
          })
        }

        if (isNode(pair.key)) {
          stack.push({ node: pair.key, keyPath })
        }
      }

      continue
    }

    if (isSeq(node)) {
      for (let i = node.items.length - 1; i >= 0; i--) {
        const item = node.items[i]
        const itemKeyPath = [...keyPath, i]

        if (isPair(item)) {
          if (isNode(item.value)) {
            stack.push({
              node: item.value,
              keyPath: getYAMLMapValueKeyPath(itemKeyPath, item.key),
            })
          }

          if (isNode(item.key)) {
            stack.push({ node: item.key, keyPath: itemKeyPath })
          }

          continue
        }

        if (isNode(item)) {
          stack.push({ node: item, keyPath: itemKeyPath })
        }
      }
    }
  }
}

function getYAMLNodeAtPath(document: YAMLDocument.Parsed, keyPath: JSONPath): YAMLNode | undefined {
  const node = document.getIn(keyPath, true)
  return isNode(node)
    ? node
    : undefined
}

export function createYAMLCodeLensProvider(
  build: (root: YAMLNode, model: editor.ITextModel, token: CancellationToken) => languages.ProviderResult<languages.CodeLensList>,
  contextGetter?: ModelContextGetter,
): languages.CodeLensProvider {
  return {
    provideCodeLenses: async (model, token) => {
      if (model.getLanguageId() !== 'yaml') {
        return emptyCodeLensList()
      }

      const context = await (contextGetter ?? getModelContext)(model)
      if (context.isDefault || context.language !== 'yaml') {
        return emptyCodeLensList()
      }

      const document = context.document
      const root = document?.contents
      if (!document || !root) {
        return emptyCodeLensList()
      }

      return build(root, model, token)
    },
  }
}

export function createYAMLNodeCodeLensProvider(
  build: (node: YAMLNode, stop: () => void, model: editor.ITextModel, token: CancellationToken) => languages.ProviderResult<languages.CodeLensList>,
  contextGetter?: ModelContextGetter,
): languages.CodeLensProvider {
  return createYAMLCodeLensProvider(async (root, model, token) => {
    let isStopped = false
    const lenses: languages.CodeLens[] = []
    const disposeFns: Array<() => void> = []

    const stack: YAMLNode[] = [root]
    while (stack.length > 0 && !isStopped) {
      const node = stack.pop()
      if (!node) {
        continue
      }

      const result = await build(node, () => {
        isStopped = true
      }, model, token)

      if (result) {
        lenses.push(...result.lenses)
        if (result.dispose) {
          disposeFns.push(result.dispose)
        }
      }

      const children = getYAMLNodeChildren(node)
      for (let i = children.length - 1; i >= 0; i--) {
        stack.push(children[i])
      }
    }

    return createDisposableCodeLensList(lenses, disposeFns)
  }, contextGetter)
}

type YAMLCopyUUIDCodeLensOptions =
  | {
    copyCommandId: string
    title?: string | ((uuid: string) => string)
    formatValue?: (uuid: string) => string
  }
  | ((
    targets: Array<{ value: string, range: IRange, context: { keyPath: JSONPath, node: YAMLNode } }>,
  ) => languages.ProviderResult<languages.CodeLensList>)

export function createYAMLCopyUUIDCodeLensProvider(
  options: YAMLCopyUUIDCodeLensOptions,
  contextGetter?: ModelContextGetter,
): languages.CodeLensProvider {
  return createYAMLCodeLensProvider((root, model) => {
    const uuidTargets: Array<{ value: string, range: IRange, context: { keyPath: JSONPath, node: YAMLNode } }> = []

    forEachYAMLNodeWithKeyPath(root, (node, keyPath) => {
      if (!isScalar(node) || typeof node.value !== 'string' || !uuidRe.test(node.value)) {
        return
      }

      const range = getYAMLNodeRange(node, model)
      if (!range) {
        return
      }

      uuidTargets.push({
        value: node.value,
        range,
        context: { keyPath, node },
      })
    })

    if (typeof options === 'function') {
      return options(uuidTargets)
    }

    return {
      lenses: uuidTargets.map(({ value, range }) => {
        return createCopyUUIDCodeLens(value, range, options)
      }),
      dispose: () => {},
    }
  }, contextGetter)
}

export function createYAMLValueCodeLensProvider<Value = any>(
  keyPath: JSONPath,
  provideLenses: YAMLProvideCodeLensesFn<Value>,
  contextGetter?: ModelContextGetter,
): languages.CodeLensProvider {
  return {
    provideCodeLenses: async (model) => {
      if (model.getLanguageId() !== 'yaml') {
        return emptyCodeLensList()
      }

      const context = await (contextGetter ?? getModelContext)(model)
      if (context.isDefault || context.language !== 'yaml') {
        return emptyCodeLensList()
      }

      const document = context.document
      const root = document?.contents
      if (!document || !root) {
        return emptyCodeLensList()
      }

      const node = getYAMLNodeAtPath(document, keyPath)
      if (!node) {
        return emptyCodeLensList()
      }

      const range = getYAMLNodeRange(node, model)
      if (!range) {
        return emptyCodeLensList()
      }

      return provideLenses(getYAMLNodeValue<Value>(node), range, { keyPath, node })
    },
  }
}

export type YAMLCopyValueCodeLensOptions<Value = any> =
  | {
    copyCommandId: string
    title?: string | ((keyPath: JSONPath, value: Value, node: YAMLNode) => string)
    formatValue?: (value: Value) => string
  }
  | YAMLProvideCodeLensesFn<Value>

export function createYAMLCopyValueCodeLensProvider<Value = any>(
  keyPath: JSONPath,
  options: YAMLCopyValueCodeLensOptions<Value>,
  contextGetter?: ModelContextGetter,
): languages.CodeLensProvider {
  return createYAMLValueCodeLensProvider<Value>(keyPath, (value, range, context) => {
    if (typeof options === 'function') {
      return options(value, range, context)
    }

    const { node } = context
    return {
      lenses: [createCopyValueCodeLens(keyPath, value, node, range, options)],
    }
  }, contextGetter)
}
