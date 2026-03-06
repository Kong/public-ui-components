import { findNodeAtLocation, getNodePath, getNodeValue } from 'jsonc-parser'

import { getModelContext } from '../../singletons/model-contexts'
import {
  createCopyUUIDCodeLens,
  createCopyValueCodeLens,
  createDisposableCodeLensList,
  emptyCodeLensList,
  uuidRe,
} from './utils'

import type { JSONPath, Node } from 'jsonc-parser'
import type { CancellationToken, editor, IRange, languages } from 'monaco-editor'

import type { ModelContext } from '../../types'

type ModelContextGetter = (model: editor.ITextModel) => ModelContext | Promise<ModelContext>

type JSONProvideCodeLensesFn<Value = any> = (
  value: Value,
  range: IRange,
  context: { keyPath: JSONPath, node: Node },
) => languages.ProviderResult<languages.CodeLensList>

export function createJSONCodeLensProvider(
  build: (root: Node, model: editor.ITextModel, token: CancellationToken) => languages.ProviderResult<languages.CodeLensList>,
  contextGetter?: ModelContextGetter,
): languages.CodeLensProvider {
  return {
    provideCodeLenses: async (model, token) => {
      if (model.getLanguageId() !== 'json') {
        return emptyCodeLensList()
      }

      const context = await (contextGetter ?? getModelContext)(model)
      if (context.isDefault || context.language !== 'json') {
        return emptyCodeLensList()
      }

      const root = context.root
      if (!root) {
        return emptyCodeLensList()
      }

      return build(root, model, token)
    },
  }
}

export function createJSONNodeCodeLensProvider(
  build: (node: Node, stop: () => void, model: editor.ITextModel, token: CancellationToken) => languages.ProviderResult<languages.CodeLensList>,
  contextGetter?: ModelContextGetter,
): languages.CodeLensProvider {
  return createJSONCodeLensProvider(async (root, model, token) => {
    let isStopped = false
    const lenses: languages.CodeLens[] = []
    const disposeFns: Array<() => void> = []

    const stack: Node[] = [root]
    while (stack.length > 0 && !isStopped) {
      const node = stack.pop()
      if (!node) continue

      const result = await build(node, () => {
        isStopped = true
      }, model, token)
      if (result) {
        lenses.push(...result.lenses)
        if (result.dispose) {
          disposeFns.push(result.dispose)
        }
      }

      if (Array.isArray(node.children)) {
        // No copy
        for (let i = node.children.length - 1; i >= 0; i--) {
          stack.push(node.children[i])
        }
      }
    }

    return createDisposableCodeLensList(lenses, disposeFns)
  }, contextGetter)
}

type JSONCopyUUIDCodeLensOptions =
  | {
    copyCommandId: string
    title?: string | ((uuid: string) => string)
    formatValue?: (uuid: string) => string
  }
  | ((
    targets: Array<{ value: any, range: IRange, context: { keyPath: JSONPath, node: Node } }>,
  ) => languages.ProviderResult<languages.CodeLensList>)

export function createJSONCopyUUIDCodeLensProvider(
  options: JSONCopyUUIDCodeLensOptions,
  contextGetter?: ModelContextGetter,
): languages.CodeLensProvider {
  return createJSONCodeLensProvider((root, model) => {
    const uuidNodes: Node[] = []

    const stack: Node[] = [root]
    while (stack.length > 0) {
      const node = stack.pop()
      if (!node) continue

      if (node.type === 'string') {
        const value = getNodeValue(node)
        if (typeof value === 'string' && uuidRe.test(value)) {
          uuidNodes.push(node)
        }
      }

      if (Array.isArray(node.children)) {
        // No copy
        for (let i = node.children.length - 1; i >= 0; i--) {
          stack.push(node.children[i])
        }
      }
    }

    if (typeof options === 'function') {
      return options(
        uuidNodes.map((node) => {
          const value = getNodeValue(node)
          const keyPath = getNodePath(node)

          const startPos = model.getPositionAt(node.offset)
          const endPos = model.getPositionAt(node.offset + node.length)

          const range: IRange = {
            startLineNumber: startPos.lineNumber,
            startColumn: startPos.column,
            endLineNumber: endPos.lineNumber,
            endColumn: endPos.column,
          }

          return { value, range, context: { keyPath, node } }
        }),
      )
    }

    return {
      lenses: uuidNodes.map((node) => {
        const value = getNodeValue(node)
        const startPos = model.getPositionAt(node.offset)
        const endPos = model.getPositionAt(node.offset + node.length)

        return createCopyUUIDCodeLens(value, {
          startLineNumber: startPos.lineNumber,
          startColumn: startPos.column,
          endLineNumber: endPos.lineNumber,
          endColumn: endPos.column,
        }, options)
      }),
      dispose: () => {},
    }
  }, contextGetter)
}

export function createJSONValueCodeLensProvider<Value = any>(
  keyPath: JSONPath,
  provideLenses: JSONProvideCodeLensesFn<Value>,
  contextGetter?: ModelContextGetter,
): languages.CodeLensProvider {
  return {
    provideCodeLenses: async (model) => {
      if (model.getLanguageId() !== 'json') {
        return emptyCodeLensList()
      }

      const context = await (contextGetter ?? getModelContext)(model)
      if (context.isDefault || context.language !== 'json') {
        return emptyCodeLensList()
      }

      const root = context.root
      if (!root) {
        return emptyCodeLensList()
      }

      const node = findNodeAtLocation(root, keyPath)
      if (!node) {
        return emptyCodeLensList()
      }

      const startPos = model.getPositionAt(node.offset)
      const endPos = model.getPositionAt(node.offset + node.length)

      const range: IRange = {
        startLineNumber: startPos.lineNumber,
        startColumn: startPos.column,
        endLineNumber: endPos.lineNumber,
        endColumn: endPos.column,
      }

      return provideLenses(getNodeValue(node), range, { keyPath, node })
    },
  }
}

export type JSONCopyValueCodeLensOptions<Value = any> =
  | {
    copyCommandId: string
    title?: string | ((keyPath: JSONPath, value: Value, node: Node) => string)
    formatValue?: (value: Value) => string
  }
  | JSONProvideCodeLensesFn

export function createJSONCopyValueCodeLensProvider<Value = any>(
  keyPath: JSONPath,
  options: JSONCopyValueCodeLensOptions<Value>,
  contextGetter?: ModelContextGetter,
): languages.CodeLensProvider {
  return createJSONValueCodeLensProvider<Value>( keyPath, (value, range, context) => {
    if (typeof options === 'function') {
      return options(value, range, context)
    }

    const { node } = context
    return {
      lenses: [createCopyValueCodeLens(keyPath, value, node, range, options)],
    }
  }, contextGetter)
}
