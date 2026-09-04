import { getModelContext } from '../../singletons/model-contexts'
import { getYAMLNodeAtPath, getYAMLNodeRange } from './code-lenses'

import type { editor, IRange } from 'monaco-editor'
import type { Document as YAMLDocument } from 'yaml'

import type { ValidateFn, ValidationIssue } from '../../features/validation'
import type { ModelContextGetter } from '../../types'

/**
 * How precisely {@link YAMLValidationIssue.range} points at the issue:
 * - `exact`: the node for the issue's own path (its full path resolved, even
 *   an empty path meaning "the document root itself").
 * - `ancestor`: the path doesn't exist (e.g. a missing required field) - this
 *   is the nearest existing parent instead, which can span many lines. Shown
 *   the same way as `exact` (this is also how VS Code's JSON/YAML schema
 *   validation handles a missing required property - it underlines the
 *   containing object, not just a point).
 * - `document`: nothing in the path resolved at all (e.g. a genuinely empty
 *   document) - there's truly nothing to point at, so this is a compact
 *   range at the very start of the document, not the whole thing.
 */
export type YAMLIssueRangeKind = 'exact' | 'ancestor' | 'document'

export interface YAMLValidationIssue extends ValidationIssue {
  range: IRange
  rangeKind: YAMLIssueRangeKind
}

/** A compact, always-valid range at the very start of the document. */
function documentStartRange(): IRange {
  return { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 2 }
}

/**
 * Finds the source range for an issue's path. A missing required field has no
 * node of its own to point at, so this walks up the path - trying shorter and
 * shorter prefixes - until it lands on a node that actually exists in the
 * document, falling back to a position at the start of the document as a last
 * resort. `rangeKind` tells the caller how precise the result actually is.
 */
function findRangeForPath(document: YAMLDocument.Parsed, model: editor.ITextModel, path: PropertyKey[]): { range: IRange, rangeKind: YAMLIssueRangeKind } {
  for (let length = path.length; length >= 0; length--) {
    const candidate = path.slice(0, length)
    if (candidate.some((segment) => typeof segment !== 'string' && typeof segment !== 'number')) {
      continue // symbol path segments can't be looked up in a YAML document
    }

    const node = getYAMLNodeAtPath(document, candidate as Array<string | number>)
    if (node) {
      const range = getYAMLNodeRange(node, model)
      if (range) {
        return { range, rangeKind: length === path.length ? 'exact' : 'ancestor' }
      }
    }
  }

  return { range: documentStartRange(), rangeKind: 'document' }
}

export interface RunYAMLValidationOptions {
  contextGetter?: ModelContextGetter
}

/**
 * Runs a {@link ValidateFn} (e.g. from {@link createZodValidator}) against a
 * YAML model: parses the model's current content (reusing the
 * cached AST from {@link getModelContext}), validates it, and maps every
 * resulting issue back to a source range in the model.
 *
 * Returns an empty array if the model isn't YAML, has no parseable content,
 * or the value is otherwise not currently checkable - callers deciding when
 * to run this (on keystroke, debounced, etc.) is left entirely up to them.
 */
export async function runYAMLValidation(
  model: editor.ITextModel,
  validate: ValidateFn,
  options?: RunYAMLValidationOptions,
): Promise<YAMLValidationIssue[]> {
  const context = await (options?.contextGetter ?? getModelContext)(model)
  if (context.isDefault || context.language !== 'yaml' || !context.document) {
    return []
  }

  const document = context.document
  if (document.errors.length > 0) {
    // The YAML parser is error-tolerant: it recovers *some* value even when
    // the source has syntax errors, so a successful `toJS()` below can't be
    // trusted on its own. The syntax checker already surfaces these errors;
    // schema validation just backs off rather than validating a value that
    // may not reflect what's actually written in the document.
    return []
  }

  let value: unknown
  try {
    value = document.toJS()
  } catch {
    // Not cleanly resolvable - the syntax checker already surfaces that;
    // schema validation just backs off here.
    return []
  }

  const issues = await validate(value)

  return issues.map((issue) => {
    const { range, rangeKind } = findRangeForPath(document, model, issue.path)
    return { ...issue, range, rangeKind }
  })
}
