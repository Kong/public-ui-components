/**
 * Model context helpers for using language-aware context from {@link Editor.ITextModel text models}
 * in Monaco Editor.
 *
 * Features:
 * - Lazy parsing without listeners (e.g., onDidChangeModelContent).
 * - Language-specific context based on the model's language (e.g., JSON AST for models in JSON).
 * - Uses an LRU cache to cache parsed contexts per edit version.
 * - Reuses cache when possible across undo/redos (via alternative version ids).
 * - Automatically cleans up cached contexts when models are disposed.
 */

import { parseIntoContext } from '../context'

import type { editor as Editor, IDisposable } from 'monaco-editor'

import type { ModelContext } from '../types'

const MSG_PREFIX = '[monaco-editor] [model-contexts]'

/**
 * The default value is to balance memory usage with reducing frequent parsing.
 * It typically covers the current edit version plus a couple of nearby undo/redo
 * versions, which are the most frequently revisited states in normal scenarios.
 * For models that need more or fewer cached contexts, the per-model capacity can
 * be adjusted via {@link setModelContextsCapacity}.
 */
export const DEFAULT_MODEL_CONTEXTS_LRU_CAPACITY = 3

const contextCache = new WeakMap<Editor.ITextModel, Map<string, Readonly<ModelContext>>>()
const contextCacheCapacity = new WeakMap<Editor.ITextModel, number>()
const modelDisposables = new WeakMap<Editor.ITextModel, IDisposable>()

function getLRUKey(model: Editor.ITextModel): string {
  return `${model.getLanguageId()}\0${model.getAlternativeVersionId()}`
}

async function getContext(model: Editor.ITextModel): Promise<Readonly<ModelContext>> {
  const capacity = getModelContextsCapacity(model)
  if (capacity === 0) {
    // No caching
    return parseIntoContext(model)
  }

  let lru = contextCache.get(model)
  if (!lru) {
    lru = new Map<string, Readonly<ModelContext>>()
    contextCache.set(model, lru)
  }

  const lruKey = getLRUKey(model)
  let context = lru.get(lruKey)
  if (context) {
    // Reuse the entry without parsing again
    // Touch the LRU entry
    lru.delete(lruKey)
    lru.set(lruKey, context)
  } else {
    // Parse and cache the new context
    context = await parseIntoContext(model)
    lru.set(lruKey, context)
    evictContexts(model)
  }

  return context
}

function evictContexts(model: Editor.ITextModel): void {
  const lru = contextCache.get(model)
  if (!lru) return

  const capacity = getModelContextsCapacity(model)
  if (capacity === 0) {
    // No caching
    contextCache.delete(model)
    return
  }

  while (lru.size > capacity) {
    const oldestKey = lru.keys().next().value
    if (oldestKey === undefined) break
    lru.delete(oldestKey)
  }
}

/**
 * Gets the capacity of cached contexts for a given model.
 *
 * @param model - The text model to get the capacity for
 * @returns The capacity of cached contexts for the model
 */
export function getModelContextsCapacity(model: Editor.ITextModel): number {
  let capacity = contextCacheCapacity.get(model)
  if (capacity === undefined) {
    capacity = DEFAULT_MODEL_CONTEXTS_LRU_CAPACITY
    contextCacheCapacity.set(model, capacity)
  }
  return capacity
}

/**
 * Sets the capacity of cached contexts for a given model.
 *
 * @param model - The text model to set the capacity for
 * @param capacity - The new capacity of cached contexts for the model.
 *                   Must be a non-negative finite integer.
 */
export function setModelContextsCapacity(model: Editor.ITextModel, capacity: number): void {
  if (capacity < 0 || !Number.isInteger(capacity) || !Number.isFinite(capacity) || Number.isNaN(capacity)) {
    throw new Error(`${MSG_PREFIX} Capacity must be a non-negative finite integer`)
  }
  const currentCapacity = getModelContextsCapacity(model)
  if (capacity === currentCapacity) {
    return
  }
  contextCacheCapacity.set(model, capacity)
  evictContexts(model)
}

/**
 * Gets the model context for a text model.
 *
 * - If the context is not in the cache, it will be parsed and cached.
 * - If the context for the current alternative version ID is already cached,
 *   the cached context will be returned.
 * - The cache uses an LRU strategy to evict old contexts when the capacity is
 *   exceeded.
 * - The LRU capacity is not shared across different models. It is recommended to
 *   call {@link invalidateModelContexts} or even dispose the model when the context
 *   or the model is no longer needed to free up memory.
 *
 * The context is automatically cleaned up when the model is disposed.
 *
 * @param model - The text model to get the context for
 * @returns The model context
 */
export async function getModelContext(model: Editor.ITextModel): Promise<Readonly<ModelContext>> {
  if (!modelDisposables.has(model)) {
    // Clean up upon model disposal:
    // It's safe if we don't dispose the IDisposable from onWillDispose.
    modelDisposables.set(model, model.onWillDispose(() => {
      invalidateModelContexts(model)
    }))
  }
  return getContext(model)
}

/**
 * Invalidates cached contexts for a {@link Editor.ITextModel text model}.
 *
 * @param model - The model to invalidate cached contexts for
 */
export function invalidateModelContexts(model: Editor.ITextModel): void {
  contextCache.delete(model)
  contextCacheCapacity.delete(model)
  modelDisposables.delete(model)
}
