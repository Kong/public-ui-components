import { formatJSONKeyPath } from '../utils/json'

// Only type imports to these language-specific dependencies are allowed here!
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

/**
 * Aggregates an array of code lenses and their dispose functions into a single
 * {@link languages.CodeLensList}.
 */
export function collectCodeLenses(
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

/**
 * Creates a code lens that copies a UUID value via the given copy command.
 */
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

/**
 * Creates a code lens that copies an arbitrary value at the given key path via
 * the given copy command.
 */
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

/**
 * Merges multiple {@link languages.CodeLensProvider CodeLensProviders} into a single
 * provider.
 */
export function collectCodeLensProviders(providers: languages.CodeLensProvider[]): languages.CodeLensProvider {
  return {
    provideCodeLenses: async (model, token) => {
      const lenses: languages.CodeLens[] = []
      const disposeFns: Array<() => void> = []

      for (const provider of providers) {
        const result = await provider.provideCodeLenses(model, token)
        if (!result) continue

        lenses.push(...result.lenses)
        disposeFns.push(result.dispose ?? (() => {}))
      }

      return collectCodeLenses(lenses, disposeFns)
    },

    resolveCodeLens: async (model, codeLens, token) => {
      for (const provider of providers) {
        const result = await provider.resolveCodeLens?.(model, codeLens, token)
        if (!result) continue

        return result
      }

      return undefined
    },
  }
}
