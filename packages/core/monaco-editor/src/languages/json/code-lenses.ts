import { findNodeAtLocation, getNodePath, getNodeValue } from 'jsonc-parser'

import { getModelContext } from '../../singletons/model-contexts'
import {
  createCopyUUIDCodeLens,
  createCopyValueCodeLens,
  collectCodeLenses,
  emptyCodeLensList,
  uuidRe,
} from '../../features/code-lenses'

import type { JSONPath, Node } from 'jsonc-parser'
import type { CancellationToken, editor, IRange, languages } from 'monaco-editor'

import type { ModelContext } from '../../types'

type ModelContextGetter = (model: editor.ITextModel) => ModelContext | Promise<ModelContext>

type JSONProvideCodeLensesFn<Value = any> = (
  value: Value,
  range: IRange,
  context: { keyPath: JSONPath, node: Node },
) => languages.ProviderResult<languages.CodeLensList>

/**
 * Creates a code lens provider for JSON models. The `build` callback receives the
 * parsed root node.
 */
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

/**
 * Creates a code lens provider that walks every node in the JSON AST depth-first.
 * Call `stop()` in the callback to abort traversal early.
 */
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
      if (token.isCancellationRequested) {
        return emptyCodeLensList()
      }

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

    return collectCodeLenses(lenses, disposeFns)
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

/**
 * Creates a code lens provider that finds all UUID string values in a JSON document
 * and attaches copy-to-clipboard lenses.
 */
export function createJSONCopyUUIDCodeLensProvider(
  options: JSONCopyUUIDCodeLensOptions,
  contextGetter?: ModelContextGetter,
): languages.CodeLensProvider {
  return createJSONCodeLensProvider((root, model, token) => {
    const uuidNodes: Node[] = []

    const stack: Node[] = [root]
    while (stack.length > 0) {
      if (token.isCancellationRequested) {
        return emptyCodeLensList()
      }

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
    }
  }, contextGetter)
}

/**
 * Creates a code lens provider that targets a specific JSON key path and delegates
 * lens creation to the provided callback.
 */
export function createJSONValueCodeLensProvider<Value = any>(
  keyPath: JSONPath,
  provideLenses: JSONProvideCodeLensesFn<Value>,
  contextGetter?: ModelContextGetter,
): languages.CodeLensProvider {
  return {
    provideCodeLenses: async (model, token) => {
      if (model.getLanguageId() !== 'json') {
        return emptyCodeLensList()
      }

      const context = await (contextGetter ?? getModelContext)(model)
      if (context.isDefault || context.language !== 'json' || token.isCancellationRequested) {
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
  | JSONProvideCodeLensesFn<Value>

/**
 * Creates a code lens provider that attaches a copy-to-clipboard lens to the value
 * at a specific JSON key path.
 */
export function createJSONCopyValueCodeLensProvider<Value = any>(
  keyPath: JSONPath,
  options: JSONCopyValueCodeLensOptions<Value>,
  contextGetter?: ModelContextGetter,
): languages.CodeLensProvider {
  return createJSONValueCodeLensProvider<Value>(keyPath, (value, range, context) => {
    if (typeof options === 'function') {
      return options(value, range, context)
    }

    const { node } = context
    return {
      lenses: [createCopyValueCodeLens(keyPath, value, node, range, options)],
    }
  }, contextGetter)
}
