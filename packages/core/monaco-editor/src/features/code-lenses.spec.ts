import { describe, expect, it, vi } from 'vitest'
import { collectCodeLensProviders } from './code-lenses'

import type { CancellationToken, editor, IRange, languages } from 'monaco-editor'

const mockModel = {} as editor.ITextModel
const mockToken = {} as CancellationToken

const range: IRange = { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 10 }

function createLens(id: string): languages.CodeLens {
  return { range, command: { id, title: id } }
}

function createProvider(
  lenses: languages.CodeLens[],
  options?: {
    dispose?: () => void
    resolveCodeLens?: languages.CodeLensProvider['resolveCodeLens']
  },
): languages.CodeLensProvider {
  return {
    provideCodeLenses: vi.fn(async () => ({
      lenses,
      dispose: options?.dispose ?? (() => {}),
    })),
    resolveCodeLens: options?.resolveCodeLens,
  }
}

describe('collectCodeLenses', () => {
  describe('provideCodeLenses', () => {
    it('should return empty lenses for an empty providers array', async () => {
      const collected = collectCodeLensProviders([])
      const result = await collected.provideCodeLenses(mockModel, mockToken)

      expect(result).toBeDefined()
      expect(result!.lenses).toEqual([])
    })

    it('should collect lenses from a single provider', async () => {
      const lens = createLens('a')
      const collected = collectCodeLensProviders([createProvider([lens])])
      const result = await collected.provideCodeLenses(mockModel, mockToken)

      expect(result!.lenses).toEqual([lens])
    })

    it('should merge lenses from multiple providers in order', async () => {
      const lens1 = createLens('a')
      const lens2 = createLens('b')
      const lens3 = createLens('c')

      const collected = collectCodeLensProviders([
        createProvider([lens1]),
        createProvider([lens2, lens3]),
      ])
      const result = await collected.provideCodeLenses(mockModel, mockToken)

      expect(result!.lenses).toEqual([lens1, lens2, lens3])
    })

    it('should skip providers that return null or undefined', async () => {
      const lens = createLens('a')

      const collected = collectCodeLensProviders([
        { provideCodeLenses: vi.fn(async () => null) },
        createProvider([lens]),
        { provideCodeLenses: vi.fn(async () => undefined) },
      ])
      const result = await collected.provideCodeLenses(mockModel, mockToken)

      expect(result!.lenses).toEqual([lens])
    })

    it('should pass model and token to each provider', async () => {
      const provider1 = createProvider([])
      const provider2 = createProvider([])

      const collected = collectCodeLensProviders([provider1, provider2])
      await collected.provideCodeLenses(mockModel, mockToken)

      expect(provider1.provideCodeLenses).toHaveBeenCalledWith(mockModel, mockToken)
      expect(provider2.provideCodeLenses).toHaveBeenCalledWith(mockModel, mockToken)
    })
  })

  describe('dispose', () => {
    it('should call all dispose functions on dispose', async () => {
      const dispose1 = vi.fn()
      const dispose2 = vi.fn()

      const collected = collectCodeLensProviders([
        createProvider([createLens('a')], { dispose: dispose1 }),
        createProvider([createLens('b')], { dispose: dispose2 }),
      ])
      const result = await collected.provideCodeLenses(mockModel, mockToken)
      result!.dispose?.()

      expect(dispose1).toHaveBeenCalledOnce()
      expect(dispose2).toHaveBeenCalledOnce()
    })

    it('should use a no-op when a provider result has no dispose', async () => {
      const collected = collectCodeLensProviders([
        { provideCodeLenses: vi.fn(async () => ({ lenses: [createLens('a')] })) },
      ])
      const result = await collected.provideCodeLenses(mockModel, mockToken)

      // Should not throw
      expect(() => result!.dispose?.()).not.toThrow()
    })

    it('should call all dispose functions even if some throw, then throw AggregateError', async () => {
      const error1 = new Error('dispose1 failed')
      const error2 = new Error('dispose2 failed')
      const dispose1 = vi.fn(() => {
        throw error1
      })
      const dispose2 = vi.fn(() => {
        throw error2
      })
      const dispose3 = vi.fn()

      const collected = collectCodeLensProviders([
        createProvider([createLens('a')], { dispose: dispose1 }),
        createProvider([createLens('b')], { dispose: dispose2 }),
        createProvider([createLens('c')], { dispose: dispose3 }),
      ])
      const result = await collected.provideCodeLenses(mockModel, mockToken)

      expect(() => result!.dispose?.()).toThrow(AggregateError)

      // All dispose functions should still have been called
      expect(dispose1).toHaveBeenCalledOnce()
      expect(dispose2).toHaveBeenCalledOnce()
      expect(dispose3).toHaveBeenCalledOnce()

      try {
        result!.dispose?.()
      } catch (e) {
        expect(e).toBeInstanceOf(AggregateError)
        expect((e as AggregateError).errors).toEqual([error1, error2])
      }
    })
  })

  describe('resolveCodeLens', () => {
    it('should return the first resolved result', async () => {
      const lens = createLens('a')
      const resolved: languages.CodeLens = { ...lens, command: { id: 'resolved', title: 'Resolved' } }

      const collected = collectCodeLensProviders([
        createProvider([], { resolveCodeLens: vi.fn(async () => resolved) }),
        createProvider([], { resolveCodeLens: vi.fn(async () => ({ ...lens, command: { id: 'second', title: 'Second' } })) }),
      ])

      const result = await collected.resolveCodeLens!(mockModel, lens, mockToken)
      expect(result).toBe(resolved)
    })

    it('should skip providers that return null/undefined and try the next', async () => {
      const lens = createLens('a')
      const resolved: languages.CodeLens = { ...lens, command: { id: 'resolved', title: 'Resolved' } }

      const collected = collectCodeLensProviders([
        createProvider([], { resolveCodeLens: vi.fn(async () => undefined) }),
        createProvider([], { resolveCodeLens: vi.fn(async () => null) }),
        createProvider([], { resolveCodeLens: vi.fn(async () => resolved) }),
      ])

      const result = await collected.resolveCodeLens!(mockModel, lens, mockToken)
      expect(result).toBe(resolved)
    })

    it('should return undefined if no provider resolves the lens', async () => {
      const lens = createLens('a')

      const collected = collectCodeLensProviders([
        createProvider([], { resolveCodeLens: vi.fn(async () => undefined) }),
      ])

      const result = await collected.resolveCodeLens!(mockModel, lens, mockToken)
      expect(result).toBeUndefined()
    })

    it('should skip providers without resolveCodeLens', async () => {
      const lens = createLens('a')
      const resolved: languages.CodeLens = { ...lens, command: { id: 'resolved', title: 'Resolved' } }

      const collected = collectCodeLensProviders([
        createProvider([]), // no resolveCodeLens
        createProvider([], { resolveCodeLens: vi.fn(async () => resolved) }),
      ])

      const result = await collected.resolveCodeLens!(mockModel, lens, mockToken)
      expect(result).toBe(resolved)
    })

    it('should return undefined for empty providers array', async () => {
      const lens = createLens('a')
      const collected = collectCodeLensProviders([])

      const result = await collected.resolveCodeLens!(mockModel, lens, mockToken)
      expect(result).toBeUndefined()
    })
  })
})
