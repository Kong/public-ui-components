import { describe, expect, it } from 'vitest'
import { runYAMLValidation } from './validation'

import type { editor } from 'monaco-editor'
import type { ValidateFn } from '../../features/validation'

function createFakeModel(text: string, language = 'yaml'): editor.ITextModel {
  const lines = text.split('\n')

  const model = {
    getLanguageId: () => language,
    getAlternativeVersionId: () => 1,
    getValue: () => text,
    getPositionAt: (offset: number) => {
      const before = text.slice(0, offset).split('\n')
      return { lineNumber: before.length, column: before[before.length - 1].length + 1 }
    },
    getFullModelRange: () => ({
      startLineNumber: 1,
      startColumn: 1,
      endLineNumber: lines.length,
      endColumn: lines[lines.length - 1].length + 1,
    }),
    onWillDispose: () => ({ dispose: () => {} }),
  }

  return model as unknown as editor.ITextModel
}

describe('runYAMLValidation', () => {
  it('returns no issues for a model in a different language', async () => {
    const model = createFakeModel('a: 1', 'json')

    const validate: ValidateFn = () => [{ message: 'should not run', path: [] }]
    expect(await runYAMLValidation(model, validate)).toEqual([])
  })

  it('passes the parsed YAML value to the validator', async () => {
    const model = createFakeModel('config:\n  minute: 100\n')
    let received: unknown

    const validate: ValidateFn = (value) => {
      received = value
      return []
    }

    await runYAMLValidation(model, validate)
    expect(received).toEqual({ config: { minute: 100 } })
  })

  it('returns no issues when validation succeeds', async () => {
    const model = createFakeModel('config:\n  minute: 100\n')
    const validate: ValidateFn = () => []

    expect(await runYAMLValidation(model, validate)).toEqual([])
  })

  it('maps an issue path to the range of its own YAML node', async () => {
    const text = 'config:\n  minute: 100\n  policy: redis\n'
    const model = createFakeModel(text)

    const validate: ValidateFn = () => [{ message: 'bad policy', path: ['config', 'policy'] }]
    const [issue] = await runYAMLValidation(model, validate)

    expect(issue.message).toBe('bad policy')
    // Line 3 is `  policy: redis` - the range should point at the `redis` value.
    expect(issue.range.startLineNumber).toBe(3)
    expect(issue.rangeKind).toBe('exact')
  })

  it('reports the document root itself as exact when the path is empty', async () => {
    const text = 'config:\n  minute: 100\n'
    const model = createFakeModel(text)

    const validate: ValidateFn = () => [{ message: 'root-level issue', path: [] }]
    const [issue] = await runYAMLValidation(model, validate)

    expect(issue.rangeKind).toBe('exact')
  })

  it('falls back to the nearest existing ancestor when the exact path is missing', async () => {
    const text = 'config:\n  minute: 100\n'
    const model = createFakeModel(text)

    // `config.redis.port` doesn't exist at all - falls back to `config`'s own
    // value node, i.e. the nested mapping starting at `minute: 100` (line 2).
    const validate: ValidateFn = () => [{ message: 'redis.port required', path: ['config', 'redis', 'port'] }]
    const [issue] = await runYAMLValidation(model, validate)

    expect(issue.range.startLineNumber).toBe(2)
    expect(issue.rangeKind).toBe('ancestor')
  })

  it('falls back to the document root (an ancestor) when a top-level field is missing', async () => {
    const text = 'config:\n  minute: 100\n'
    const model = createFakeModel(text)

    // There's no `protocols` key at all - the nearest existing ancestor is the document root itself.
    const validate: ValidateFn = () => [{ message: 'top-level missing', path: ['protocols'] }]
    const [issue] = await runYAMLValidation(model, validate)

    expect(issue.rangeKind).toBe('ancestor')
  })

  it('falls back to a compact position at the document start for a genuinely empty document', async () => {
    const model = createFakeModel('')

    const validate: ValidateFn = () => [{ message: 'nothing to point at', path: ['config'] }]
    const [issue] = await runYAMLValidation(model, validate)

    // Not the whole (possibly huge) document - just a small anchor at the start.
    expect(issue.range).toEqual({ startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 2 })
    expect(issue.rangeKind).toBe('document')
  })

  it('ignores path segments that are symbols when locating a range', async () => {
    const text = 'config:\n  minute: 100\n'
    const model = createFakeModel(text)

    const validate: ValidateFn = () => [{ message: 'weird path', path: ['config', Symbol('x')] }]
    const [issue] = await runYAMLValidation(model, validate)

    // Can't look up the symbol segment itself - falls back to `config` (ancestor), not a crash.
    expect(issue.range).toBeDefined()
    expect(issue.rangeKind).toBe('ancestor')
  })

  describe('bails out when the document has YAML-level errors', () => {
    // The `yaml` parser is error-tolerant: `document.toJS()` can still return a
    // (possibly wrong) value even though `document.errors` is non-empty, so
    // these all still need an explicit bail-out rather than relying on `toJS()` to throw.
    it.each([
      ['duplicate keys', 'foo: 1\nfoo: 2\n'],
      ['inconsistent indentation', 'foo:\n  bar: 1\n baz: 2\n'],
      ['tabs used for indentation', 'foo:\n\tbar: 1\n'],
      ['unclosed flow map', 'foo: {a: 1, b: 2\n'],
    ])('%s', async (_name, text) => {
      const model = createFakeModel(text)

      let validateCalled = false
      const validate: ValidateFn = () => {
        validateCalled = true
        return []
      }

      expect(await runYAMLValidation(model, validate)).toEqual([])
      expect(validateCalled).toBe(false)
    })

    it('still runs validation when the document has no errors', async () => {
      const model = createFakeModel('foo: 1\n')

      let validateCalled = false
      const validate: ValidateFn = () => {
        validateCalled = true
        return []
      }

      await runYAMLValidation(model, validate)
      expect(validateCalled).toBe(true)
    })
  })
})
