/**
 * Model context helpers for using language-aware context from {@link Editor.ITextModel text models}
 * in Monaco Editor.
 *
 * Features:
 * - Lazy parsing without listeners (e.g., onDidChangeModelContent).
 * - Language-specific context based on the model's language (e.g., JSON AST for models in JSON).
 * - Caches parsed contexts keyed by language and alternative version id.
 * - Reuses cache when possible across undo/redos (via alternative version ids).
 * - Automatically cleans up cached contexts when models are disposed.
 */

import { parseIntoContext } from '../context'

import type { editor as Editor, IDisposable } from 'monaco-editor'

import type { ModelContext } from '../types'

const contextCache = new WeakMap<Editor.ITextModel, Map<string, Readonly<ModelContext>>>()
const modelDisposables = new WeakMap<Editor.ITextModel, IDisposable>()

const inFlightPromises = new WeakMap<Editor.ITextModel, Promise<Readonly<ModelContext>>>()

function getCacheKey(model: Editor.ITextModel): string {
  return `${model.getLanguageId()}\0${model.getAlternativeVersionId()}`
}

async function getContext(model: Editor.ITextModel): Promise<Readonly<ModelContext>> {
  let cache = contextCache.get(model)
  if (!cache) {
    cache = new Map<string, Readonly<ModelContext>>()
    contextCache.set(model, cache)
  }

  const key = getCacheKey(model)
  let context = cache.get(key)
  if (!context) {
    context = await parseIntoContext(model)
    cache.set(key, context)
  }

  return context
}

/**
 * Gets the model context for a text model.
 *
 * - If the context is not in the cache, it will be parsed and cached.
 * - If the context for the current alternative version id is already cached,
 *   the cached context will be returned. Only the context of one version is cached
 *   at a time per model.
 * - Cached context will not be invalidated/evicted unless:
 *   - The model's alternative version id changes (e.g., undo/redo).
 *   - The {@link invalidateModelContexts} function is called.
 *   - The model is disposed.
 * - It is recommended to call {@link invalidateModelContexts} or even dispose
 *   the model when the context or the model is no longer needed to free up memory.
 *
 * The context is automatically cleaned up when the model is disposed.
 *
 * @param model - The text model to get the context for
 * @returns The model context
 */
export async function getModelContext(model: Editor.ITextModel): Promise<Readonly<ModelContext>> {
  if (inFlightPromises.has(model)) {
    return inFlightPromises.get(model)!
  }

  const promise = (async () => {
    if (!modelDisposables.has(model)) {
      // Clean up upon model disposal:
      // It's safe if we don't dispose the IDisposable from onWillDispose.
      modelDisposables.set(model, model.onWillDispose(() => {
        invalidateModelContexts(model)
      }))
    }
    return getContext(model)
  })().finally(() => {
    inFlightPromises.delete(model)
  })

  inFlightPromises.set(model, promise)
  return promise
}

/**
 * Invalidates cached contexts for a {@link Editor.ITextModel text model}.
 *
 * @param model - The model to invalidate cached contexts for
 */
export function invalidateModelContexts(model: Editor.ITextModel): void {
  contextCache.delete(model)
  modelDisposables.delete(model)
}
