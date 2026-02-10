import { describe, expect, it, vi, type MockInstance } from 'vitest'

import * as contextUtils from '../context'
import { getModelContext, invalidateModelContexts } from './model-contexts'

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

  it('caches contexts across undo/redo without eviction', async () => {
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
    expect(c3).toBe(c1)

    const mockModel2 = createMockModel()

    const c4 = await getModelContext(mockModel2.model)
    expect(contextUtils.parseIntoContext).toHaveBeenCalledTimes(3)
    expect(c4.altVersionId).toBe(1)

    const c5 = await getModelContext(mockModel.model)
    expect(contextUtils.parseIntoContext).toHaveBeenCalledTimes(3)
    expect(c5).toBe(c1)
  })

  it('retains all cached versions until invalidated', async () => {
    const mockModel = createMockModel()

    for (let v = 1; v <= 10; v++) {
      mockModel.setAltVersionId(v)
      await getModelContext(mockModel.model)
    }
    expect(contextUtils.parseIntoContext).toHaveBeenCalledTimes(10)

    for (let v = 1; v <= 10; v++) {
      mockModel.setAltVersionId(v)
      await getModelContext(mockModel.model)
    }
    expect(contextUtils.parseIntoContext).toHaveBeenCalledTimes(10)

    invalidateModelContexts(mockModel.model)

    mockModel.setAltVersionId(1)
    await getModelContext(mockModel.model)
    expect(contextUtils.parseIntoContext).toHaveBeenCalledTimes(11)
  })
})
