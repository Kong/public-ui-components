import { getCurrentInstance, inject, provide, reactive } from 'vue'

import type { ComponentInternalInstance, InjectionKey } from 'vue'
import type { KeyAuthContext } from '../../plugins/key-auth/context'
import type { OpenidConnectContext } from '../../plugins/openid-connect/context'

/**
 * Central registry mapping each plugin that needs host-injected context to its context type.
 * Add one entry per plugin here.
 */
export interface PluginContextRegistry {
  'key-auth': KeyAuthContext
  'openid-connect': OpenidConnectContext
}

export type PluginName = keyof PluginContextRegistry

/** Exported for tests that need to provide context via `global.provide` without a wrapper component. */
export const PLUGIN_CONTEXT_KEY = Symbol('free-form-plugin-context') as InjectionKey<Partial<PluginContextRegistry>>

// Tracks the store a given component instance has already provided, so repeated
// `providePluginContext` calls in the same setup() (one per plugin) merge into a
// single store instead of each clobbering the last. This can't be detected via
// `inject()` alone: a component's own `inject()` reads its *parent's* provides,
// never its own, so a naive `inject(KEY, null) ?? reactive({})` would silently
// create a fresh store — and lose earlier registrations — on every call.
const ownStores = new WeakMap<ComponentInternalInstance, Partial<PluginContextRegistry>>()

/**
 * Registers context for a specific plugin, to be read by that plugin's form via
 * `usePluginContext`. Safe to call multiple times — once per plugin — from the
 * same component.
 */
export function providePluginContext<K extends PluginName>(
  pluginName: K,
  context: PluginContextRegistry[K],
): void {
  const instance = getCurrentInstance()
  if (!instance) {
    throw new Error('providePluginContext() must be called inside setup().')
  }

  let store = ownStores.get(instance)
  if (!store) {
    store = reactive({}) as Partial<PluginContextRegistry>
    ownStores.set(instance, store)
    provide(PLUGIN_CONTEXT_KEY, store)
  }

  const record = store as Record<PluginName, unknown>
  record[pluginName] = context
}

/**
 * Reads the context registered for a plugin via `providePluginContext` in an
 * ancestor component. Returns `undefined` (and logs a warning) if nothing was
 * registered for `pluginName` — callers decide for themselves whether a
 * missing context is fatal.
 */
export function usePluginContext<K extends PluginName>(pluginName: K): PluginContextRegistry[K] | undefined {
  const store = inject(PLUGIN_CONTEXT_KEY, null)
  const context = store?.[pluginName]
  // Only warn when some ancestor did establish the store (i.e. adopted this mechanism for at
  // least one plugin) but forgot this one. Stay silent when no store exists at all, so hosts
  // and component tests that don't use this mechanism yet aren't spammed with warnings for
  // context fields that are meant to be optional.
  if (store && context === undefined) {
    console.warn(
      `usePluginContext(): no context registered for plugin "${String(pluginName)}". ` +
      `Call providePluginContext('${String(pluginName)}', ...) in an ancestor component first.`,
    )
  }
  return context as PluginContextRegistry[K] | undefined
}
