import { describe, expect, it, vi, type MockInstance } from 'vitest'

import * as contextUtils from '../context'
import { getModelContext, invalidateModelContexts, setModelContextsCapacity } from './model-contexts'

import type { editor, IDisposable } from 'monaco-editor'

import type { ModelContext } from '../types'

interface MockModel {
  model: editor.ITextModel
  setAltVersionId: (version: number) => void
  disposeMock: MockInstance<() => IDisposable>
}

const createMockModel = (): MockModel => {
  let alternativeVersionId = 1
  const disposeMock = vi.fn()

  const model: editor.ITextModel = {
    getAlternativeVersionId: vi.fn(() => alternativeVersionId),
    getLanguageId: () => 'language-only-used-in-tests',
    onWillDispose: () => ({ dispose: () => void 0 }),
    dispose: disposeMock,
  } as Pick<editor.ITextModel, 'getAlternativeVersionId' | 'getLanguageId' | 'onWillDispose' | 'dispose'> as unknown as editor.ITextModel

  return {
    model,
    setAltVersionId: (version: number) => {
      alternativeVersionId = version
    },
    disposeMock,
  }
}

function mockContext(model: editor.ITextModel): Readonly<ModelContext> {
  return {
    isDefault: true,
    language: model.getLanguageId(),
    altVersionId: model.getAlternativeVersionId(),
  }
}

const parseIntoContextMock = vi.hoisted(() => vi.fn((model: editor.ITextModel) => mockContext(model)))

vi.mock('../context', () => {
  return {
    parseIntoContext: parseIntoContextMock,
  }
})

describe('model context helpers', () => {
  beforeEach(() => {
    parseIntoContextMock.mockReset()
  })

  it('reuses cached context for the same altVersionId', async () => {
    const mockModel = createMockModel()

    const c1 = await getModelContext(mockModel.model)
    expect(contextUtils.parseIntoContext).toHaveBeenCalledTimes(1)

    const c2 = await getModelContext(mockModel.model)
    expect(contextUtils.parseIntoContext).toHaveBeenCalledTimes(1)

    expect(c1).toBe(c2)

    invalidateModelContexts(mockModel.model)

    const c3 = await getModelContext(mockModel.model)
    expect(contextUtils.parseIntoContext).toHaveBeenCalledTimes(2)

    expect(c3).not.toBe(c1)
    expect(c3).toEqual(c1)

    mockModel.model.dispose()
    expect(mockModel.disposeMock).toHaveBeenCalledTimes(1)
  })

  it('caches different contexts for different altVersionIds', async () => {
    const mockModel = createMockModel()

    const c1 = await getModelContext(mockModel.model)
    expect(contextUtils.parseIntoContext).toHaveBeenCalledTimes(1)
    expect(c1.altVersionId).toBe(1)

    mockModel.setAltVersionId(2)

    const c2 = await getModelContext(mockModel.model)
    expect(contextUtils.parseIntoContext).toHaveBeenCalledTimes(2)
    expect(c1).not.toBe(c2)
    expect(c2.altVersionId).toBe(2)
  })

  it('should correctly behave in the LRU manner', async () => {
    const mockModel = createMockModel()

    const c1 = await getModelContext(mockModel.model)
    expect(contextUtils.parseIntoContext).toHaveBeenCalledTimes(1)
    expect(c1.altVersionId).toBe(1)

    mockModel.setAltVersionId(2)
    const c2 = await getModelContext(mockModel.model)
    expect(contextUtils.parseIntoContext).toHaveBeenCalledTimes(2)
    expect(c2.altVersionId).toBe(2)

    mockModel.setAltVersionId(1)
    const c3 = await getModelContext(mockModel.model)
    expect(contextUtils.parseIntoContext).toHaveBeenCalledTimes(2)
    expect(c3.altVersionId).toBe(1)

    const mockModel2 = createMockModel()

    const c4 = await getModelContext(mockModel2.model)
    expect(contextUtils.parseIntoContext).toHaveBeenCalledTimes(3)
    expect(c4.altVersionId).toBe(1)

    const c5 = await getModelContext(mockModel.model)
    expect(contextUtils.parseIntoContext).toHaveBeenCalledTimes(3)
    expect(c5.altVersionId).toBe(1)
  })

  it('should correctly behave in the LRU manner (capacity = 4)', async () => {
    const mockModel = createMockModel()

    setModelContextsCapacity(mockModel.model, 4)

    const c1 = await getModelContext(mockModel.model)
    expect(contextUtils.parseIntoContext).toHaveBeenCalledTimes(1)
    expect(c1.altVersionId).toBe(1)

    // Add up to LRU capacity
    for (let v = 2; v <= 4; v++) {
      mockModel.setAltVersionId(v)
      const c = await getModelContext(mockModel.model)
      expect(c.altVersionId).toBe(v)
    }

    expect(contextUtils.parseIntoContext).toHaveBeenCalledTimes(4)

    mockModel.setAltVersionId(1)
    expect(contextUtils.parseIntoContext).toHaveBeenCalledTimes(4) // Cache available

    mockModel.setAltVersionId(5)
    const c5 = await getModelContext(mockModel.model)
    expect(contextUtils.parseIntoContext).toHaveBeenCalledTimes(5) // Re-parsed
    expect(c5.altVersionId).toBe(5)

    mockModel.setAltVersionId(2)
    const c2 = await getModelContext(mockModel.model)
    expect(contextUtils.parseIntoContext).toHaveBeenCalledTimes(5) // Cache available
    expect(c2.altVersionId).toBe(2)

    mockModel.setAltVersionId(1) // Evicted
    const c1Again = await getModelContext(mockModel.model)
    expect(contextUtils.parseIntoContext).toHaveBeenCalledTimes(6) // Re-parsed
    expect(c1Again.altVersionId).toBe(1)
    expect(c1Again).not.toBe(c1)

    mockModel.setAltVersionId(6)
    const c6 = await getModelContext(mockModel.model) // Evicts 3
    expect(contextUtils.parseIntoContext).toHaveBeenCalledTimes(7) // Re-parsed
    expect(c6.altVersionId).toBe(6)

    mockModel.setAltVersionId(3) // Evicted
    const c3Again = await getModelContext(mockModel.model)
    expect(contextUtils.parseIntoContext).toHaveBeenCalledTimes(8) // Re-parsed
    expect(c3Again.altVersionId).toBe(3)
    expect(c3Again).not.toBe(c1)
  })

  it('throws when trying to set an invalid LRU capacity', () => {
    const mockModel = createMockModel()

    expect(() => setModelContextsCapacity(mockModel.model, -1)).toThrow()
    expect(() => setModelContextsCapacity(mockModel.model, 1.5)).toThrow()
    expect(() => setModelContextsCapacity(mockModel.model, Infinity)).toThrow()
    expect(() => setModelContextsCapacity(mockModel.model, NaN)).toThrow()
  })

  it('shrinks cache when reducing LRU capacity', async () => {
    const mockModel = createMockModel()

    setModelContextsCapacity(mockModel.model, 5)
    for (let v = 1; v <= 5; v++) {
      mockModel.setAltVersionId(v)
      await getModelContext(mockModel.model)
    }
    expect(contextUtils.parseIntoContext).toHaveBeenCalledTimes(5)

    setModelContextsCapacity(mockModel.model, 3)

    // altVersionId 1 and 2 should be evicted
    mockModel.setAltVersionId(1)
    await getModelContext(mockModel.model)
    expect(contextUtils.parseIntoContext).toHaveBeenCalledTimes(6)

    mockModel.setAltVersionId(2)
    await getModelContext(mockModel.model)
    expect(contextUtils.parseIntoContext).toHaveBeenCalledTimes(7)
  })

  it('disables caching when setting LRU capacity to 0', async () => {
    const mockModel = createMockModel()

    setModelContextsCapacity(mockModel.model, 0)
    for (let v = 1; v <= 3; v++) {
      mockModel.setAltVersionId(v)
      await getModelContext(mockModel.model)
    }
    expect(contextUtils.parseIntoContext).toHaveBeenCalledTimes(3)

    // Re-fetch all contexts, should re-parse each time
    for (let v = 1; v <= 3; v++) {
      mockModel.setAltVersionId(v)
      await getModelContext(mockModel.model)
    }
    expect(contextUtils.parseIntoContext).toHaveBeenCalledTimes(6)
  })
})
