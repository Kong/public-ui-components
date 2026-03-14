import { formatJSONKeyPath } from '../../utils/json'

import type { JSONPath } from 'jsonc-parser'
import type { IRange, languages } from 'monaco-editor'

export const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

interface CopyUUIDCodeLensOptions {
  copyCommandId: string
  title?: string | ((uuid: string) => string)
  formatValue?: (uuid: string) => string
}

interface CopyValueCodeLensOptions<Value, TNode> {
  copyCommandId: string
  title?: string | ((keyPath: JSONPath, value: Value, node: TNode) => string)
  formatValue?: (value: Value) => string
}

export function emptyCodeLensList(): languages.CodeLensList {
  return { lenses: [], dispose: () => {} }
}

export function createDisposableCodeLensList(
  lenses: languages.CodeLens[],
  disposeFns: Array<() => void>,
): languages.CodeLensList {
  if (disposeFns.length === 0) {
    return { lenses }
  }

  return {
    lenses,
    dispose: () => {
      const errors: unknown[] = []

      disposeFns.forEach((fn) => {
        try {
          fn()
        } catch (e) {
          errors.push(e)
        }
      })

      if (errors.length > 0) {
        throw new AggregateError(errors)
      }
    },
  }
}

export function createCopyUUIDCodeLens(
  uuid: string,
  range: IRange,
  options: CopyUUIDCodeLensOptions,
): languages.CodeLens {
  return {
    range,
    command: {
      id: options.copyCommandId,
      title: typeof options.title === 'function'
        ? options.title(uuid)
        : options.title ?? `$(copy) Copy UUID ${uuid.substring(0, 8)}...`,
      arguments: [
        options.formatValue
          ? options.formatValue(uuid)
          : uuid,
      ],
    },
  }
}

export function createCopyValueCodeLens<Value, TNode>(
  keyPath: JSONPath,
  value: Value,
  node: TNode,
  range: IRange,
  options: CopyValueCodeLensOptions<Value, TNode>,
): languages.CodeLens {
  return {
    range,
    command: {
      id: options.copyCommandId,
      title: typeof options.title === 'function'
        ? options.title(keyPath, value, node)
        : options.title ?? `$(copy) Copy ${formatJSONKeyPath(keyPath)}`,
      arguments: [
        options.formatValue
          ? options.formatValue(value)
          : JSON.stringify(value),
      ],
    },
  }
}
